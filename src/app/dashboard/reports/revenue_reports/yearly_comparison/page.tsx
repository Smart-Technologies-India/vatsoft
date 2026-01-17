"use client";
import {
  FluentMdl2Home,
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
} from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin } from "antd";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import YearlyComparison from "@/action/report/yearlycomparison";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

ChartJS.register(...registerables);

const YearlyComparisonReport = () => {
  interface MonthlyData {
    month: string;
    year: string;
    amount: number;
    count: number;
  }

  interface ResponseData {
    currentYear: MonthlyData[];
    previousYear: MonthlyData[];
    currentYearLabel: string;
    previousYearLabel: string;
    currentYearTotal: number;
    previousYearTotal: number;
    percentageChange: number;
  }

  const [reportData, setReportData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<"Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined>(
    undefined
  );
  const [commoditydata, setCommoditydata] = useState<"FUEL" | "LIQUOR" | undefined>(
    undefined
  );

  const monthNames: { [key: string]: string } = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const response = await YearlyComparison({
        selectOffice: city,
        selectCommodity: commoditydata,
      });
      if (response.status && response.data) {
        setReportData(response.data);
      } else {
        toast.error(response.message || "Failed to load data");
      }
      setLoading(false);
    };
    init();
  }, [city, commoditydata]);

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData = [
      [
        "Yearly Comparison Report",
        "",
        reportData.currentYearLabel,
        "vs",
        reportData.previousYearLabel,
      ],
      [""],
      [
        "Month",
        "Year",
        `${reportData.currentYearLabel} Revenue`,
        `${reportData.currentYearLabel} Returns Filed`,
        `${reportData.previousYearLabel} Revenue`,
        `${reportData.previousYearLabel} Returns Filed`,
        "Revenue Difference",
        "% Change",
      ],
    ];

    reportData.currentYear.forEach((curr, index) => {
      const prev = reportData.previousYear[index];
      const difference = curr.amount - prev.amount;
      const percentChange =
        prev.amount === 0 ? 0 : ((difference / prev.amount) * 100);
      
      worksheetData.push([
        monthNames[curr.month],
        curr.year,
        curr.amount.toString(),
        curr.count.toString(),
        prev.amount.toString(),
        prev.count.toString(),
        difference.toString(),
        percentChange.toFixed(2) + "%",
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Total",
      "",
      reportData.currentYearTotal.toString(),
      "",
      reportData.previousYearTotal.toString(),
      "",
      (reportData.currentYearTotal - reportData.previousYearTotal).toString(),
      reportData.percentageChange.toFixed(2) + "%",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Comparison");
    XLSX.writeFile(
      wb,
      `Yearly_Comparison_${reportData.currentYearLabel}_vs_${reportData.previousYearLabel}.xlsx`
    );
    toast.success("Report exported successfully!");
  };

  const chartData: any = {
    labels: reportData?.currentYear.map((item) => monthNames[item.month]) || [],
    datasets: [
      {
        label: reportData?.currentYearLabel || "Current Year",
        data: reportData?.currentYear.map((item) => item.amount) || [],
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: reportData?.previousYearLabel || "Previous Year",
        data: reportData?.previousYear.map((item) => item.amount) || [],
        backgroundColor: "#10b981",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return "₹" + numberWithIndianFormat(value);
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 12,
          },
        },
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += "₹" + numberWithIndianFormat(context.parsed.y);
            return label;
          },
        },
      },
    },
  };

  const onCityChange = (e: RadioChangeEvent) => {
    setCity(e.target.value);
  };

  const onCommodityChange = (e: RadioChangeEvent) => {
    setCommoditydata(e.target.value);
  };

  const citys = [
    { label: "All", value: undefined },
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  const commodity = [
    { label: "All", value: undefined },
    { label: "FUEL", value: "FUEL" },
    { label: "LIQUOR", value: "LIQUOR" },
  ];

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">Yearly Comparison Report</h1>
          <p className="text-sm text-gray-600">
            Compare revenue between two fiscal years
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">District</label>
            <Radio.Group
              options={citys}
              onChange={onCityChange}
              value={city}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Commodity</label>
            <Radio.Group
              options={commodity}
              onChange={onCommodityChange}
              value={commoditydata}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{reportData.currentYearLabel}</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData.currentYearTotal)}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{reportData.previousYearLabel}</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData.previousYearTotal)}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div
              className={`rounded-lg shadow-md p-6 text-white ${
                reportData.percentageChange >= 0
                  ? "bg-linear-to-br from-emerald-500 to-emerald-600"
                  : "bg-linear-to-br from-red-500 to-red-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Change</p>
                  <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                    {reportData.percentageChange >= 0 ? (
                      <MaterialSymbolsKeyboardArrowUpRounded className="w-8 h-8" />
                    ) : (
                      <MaterialSymbolsKeyboardArrowDownRounded className="w-8 h-8" />
                    )}
                    {Math.abs(reportData.percentageChange).toFixed(2)}%
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    ₹
                    {numberWithIndianFormat(
                      Math.abs(
                        reportData.currentYearTotal - reportData.previousYearTotal
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Comparison</h2>
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {reportData.currentYearLabel}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Returns Filed
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {reportData.previousYearLabel}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Returns Filed
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.currentYear.map((curr, index) => {
                    const prev = reportData.previousYear[index];
                    const difference = curr.amount - prev.amount;
                    const percentChange =
                      prev.amount === 0 ? 0 : (difference / prev.amount) * 100;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {monthNames[curr.month]} {curr.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(curr.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {curr.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(prev.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {prev.count}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            difference >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {difference >= 0 ? "+" : ""}₹
                          {numberWithIndianFormat(Math.abs(difference))}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-center font-medium ${
                            percentChange >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {percentChange >= 0 ? "+" : ""}
                          {percentChange.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(reportData.currentYearTotal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {reportData.currentYear.reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(reportData.previousYearTotal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {reportData.previousYear.reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        reportData.currentYearTotal - reportData.previousYearTotal >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {reportData.currentYearTotal - reportData.previousYearTotal >= 0
                        ? "+"
                        : ""}
                      ₹
                      {numberWithIndianFormat(
                        Math.abs(
                          reportData.currentYearTotal - reportData.previousYearTotal
                        )
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-center ${
                        reportData.percentageChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {reportData.percentageChange >= 0 ? "+" : ""}
                      {reportData.percentageChange.toFixed(2)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow-sm mt-6">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </main>
  );
};

export default YearlyComparisonReport;
