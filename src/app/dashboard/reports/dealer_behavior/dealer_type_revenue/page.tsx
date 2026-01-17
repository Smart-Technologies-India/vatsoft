"use client";
import { FluentMdl2Home } from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Select, Spin } from "antd";
import { useEffect, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import DealerTypeRevenue from "@/action/report/dealertyperevenue";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

ChartJS.register(...registerables);

const DealerTypeRevenueReport = () => {
  interface MonthlyRevenue {
    month: string;
    fuelRevenue: number;
    liquorRevenue: number;
    fuelDealers: number;
    liquorDealers: number;
  }

  interface ResponseData {
    monthlyData: MonthlyRevenue[];
    totalFuelRevenue: number;
    totalLiquorRevenue: number;
    totalFuelDealers: number;
    totalLiquorDealers: number;
    fuelPercentage: number;
    liquorPercentage: number;
    year: string;
  }

  const [reportData, setReportData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
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
      const response = await DealerTypeRevenue({
        selectOffice: city,
        year: selectedYear,
      });
      if (response.status && response.data) {
        setReportData(response.data);
      } else {
        toast.error(response.message || "Failed to load data");
      }
      setLoading(false);
    };
    init();
  }, [city, selectedYear]);

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData = [
      ["Dealer Type-wise Revenue Report", "", `Year: ${reportData.year}`],
      [""],
      ["Summary"],
      ["Dealer Type", "Total Revenue", "Number of Dealers", "Percentage"],
      [
        "Petroleum Dealers",
        reportData.totalFuelRevenue.toString(),
        reportData.totalFuelDealers.toString(),
        reportData.fuelPercentage.toFixed(2) + "%",
      ],
      [
        "Liquor Dealers",
        reportData.totalLiquorRevenue.toString(),
        reportData.totalLiquorDealers.toString(),
        reportData.liquorPercentage.toFixed(2) + "%",
      ],
      [""],
      ["Monthly Breakdown"],
      ["Month", "Petroleum Revenue", "Liquor Revenue", "Total Revenue"],
    ];

    reportData.monthlyData.forEach((item) => {
      const total = item.fuelRevenue + item.liquorRevenue;
      worksheetData.push([
        monthNames[item.month],
        item.fuelRevenue.toString(),
        item.liquorRevenue.toString(),
        total.toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Total",
      reportData.totalFuelRevenue.toString(),
      reportData.totalLiquorRevenue.toString(),
      (reportData.totalFuelRevenue + reportData.totalLiquorRevenue).toString(),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dealer Type Revenue");
    XLSX.writeFile(wb, `Dealer_Type_Revenue_${reportData.year}.xlsx`);
    toast.success("Report exported successfully!");
  };

  const doughnutData: any = {
    labels: ["Petroleum Dealers", "Liquor Dealers"],
    datasets: [
      {
        data: [
          reportData?.totalFuelRevenue || 0,
          reportData?.totalLiquorRevenue || 0,
        ],
        backgroundColor: ["#3b82f6", "#f59e0b"],
        borderColor: ["#2563eb", "#d97706"],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const percentage = reportData
              ? context.dataIndex === 0
                ? reportData.fuelPercentage
                : reportData.liquorPercentage
              : 0;
            return `${label}: ₹${numberWithIndianFormat(value)} (${percentage.toFixed(
              2
            )}%)`;
          },
        },
      },
    },
  };

  const lineChartData: any = {
    labels: reportData?.monthlyData.map((item) => monthNames[item.month]) || [],
    datasets: [
      {
        label: "Petroleum Dealers",
        data: reportData?.monthlyData.map((item) => item.fuelRevenue) || [],
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: "Liquor Dealers",
        data: reportData?.monthlyData.map((item) => item.liquorRevenue) || [],
        backgroundColor: "#f59e0b",
        borderColor: "#f59e0b",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const lineChartOptions: any = {
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

  const citys = [
    { label: "All", value: undefined },
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Dealer Type-wise Revenue Report
          </h1>
          <p className="text-sm text-gray-600">
            Compare revenue between Petroleum and Liquor dealers
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
            <label className="text-sm font-medium text-gray-700">Year</label>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 120 }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              District
            </label>
            <Radio.Group
              options={citys}
              onChange={onCityChange}
              value={city}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Petroleum Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData.totalFuelRevenue)}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    {reportData.fuelPercentage.toFixed(1)}% of Total
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Liquor Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData.totalLiquorRevenue)}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    {reportData.liquorPercentage.toFixed(1)}% of Total
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Petroleum Dealers</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.totalFuelDealers}
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Liquor Dealers</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.totalLiquorDealers}
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Revenue Distribution
              </h2>
              <div className="h-80">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Monthly Revenue Trend
              </h2>
              <div className="h-80">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
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
                      Petroleum Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Liquor Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.monthlyData.map((item, index) => {
                    const total = item.fuelRevenue + item.liquorRevenue;
                    const fuelPercent =
                      total === 0 ? 0 : (item.fuelRevenue / total) * 100;
                    const liquorPercent =
                      total === 0 ? 0 : (item.liquorRevenue / total) * 100;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {monthNames[item.month]}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                          ₹{numberWithIndianFormat(item.fuelRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {fuelPercent.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-amber-600 font-medium">
                          ₹{numberWithIndianFormat(item.liquorRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {liquorPercent.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                          ₹{numberWithIndianFormat(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600">
                      ₹{numberWithIndianFormat(reportData.totalFuelRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {reportData.fuelPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-amber-600">
                      ₹{numberWithIndianFormat(reportData.totalLiquorRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {reportData.liquorPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹
                      {numberWithIndianFormat(
                        reportData.totalFuelRevenue +
                          reportData.totalLiquorRevenue
                      )}
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

export default DealerTypeRevenueReport;
