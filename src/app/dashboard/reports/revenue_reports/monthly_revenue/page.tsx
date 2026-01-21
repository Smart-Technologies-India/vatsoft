"use client";
import {
  FluentMdl2Home,
} from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin } from "antd";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import LastYearReceived from "@/action/report/lastyearreceivedreport";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

ChartJS.register(...registerables);

const MonthlyRevenueReport = () => {
  interface LastYearData {
    monthYear: string;
    amount: number;
  }

  const [lastYearData, setLastYearData] = useState<LastYearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<"Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined>(
    undefined
  );

  const [commoditydata, setCommoditydata] = useState<"FUEL" | "LIQUOR" | undefined>(
    undefined
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const last12months = await LastYearReceived({
        selectOffice: city,
        selectCommodity: commoditydata,
      });

      if (last12months.status && last12months.data) {
        setLastYearData(last12months.data);
      } else {
        toast.error(last12months.message || "Failed to load data");
      }
      setLoading(false);
    };
    init();
  }, [city, commoditydata]);

  const totalRevenue = lastYearData.reduce((sum, item) => sum + item.amount, 0);
  const averageRevenue = lastYearData.length > 0 ? totalRevenue / lastYearData.length : 0;
  const maxMonth = lastYearData.reduce((max, item) => item.amount > max.amount ? item : max, lastYearData[0] || { monthYear: "", amount: 0 });
  const minMonth = lastYearData.reduce((min, item) => item.amount < min.amount ? item : min, lastYearData[0] || { monthYear: "", amount: 0 });

  const exportToExcel = () => {
    if (lastYearData.length === 0) return;

    const worksheetData = [
      ["Monthly Revenue Report - Last 12 Months"],
      [""],
      ["Month", "Revenue (₹)"],
    ];

    lastYearData.forEach((item) => {
      worksheetData.push([
        item.monthYear,
        item.amount.toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push(["Total Revenue", totalRevenue.toString()]);
    worksheetData.push(["Average Revenue", averageRevenue.toFixed(2)]);
    worksheetData.push(["Highest Month", `${maxMonth.monthYear} (₹${numberWithIndianFormat(maxMonth.amount)})`]);
    worksheetData.push(["Lowest Month", `${minMonth.monthYear} (₹${numberWithIndianFormat(minMonth.amount)})`]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Revenue");
    XLSX.writeFile(wb, `Monthly_Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Report exported successfully!");
  };

  const barChartData: any = {
    labels: lastYearData.map((val: LastYearData) => val.monthYear),
    datasets: [
      {
        label: "Revenue (₹)",
        data: lastYearData.map((val: LastYearData) => val.amount),
        backgroundColor: "#3b82f6",
        borderWidth: 0,
        barPercentage: 0.6,
      },
    ],
  };

  const lineChartData: any = {
    labels: lastYearData.map((val: LastYearData) => val.monthYear),
    datasets: [
      {
        label: "Revenue Trend",
        data: lastYearData.map((val: LastYearData) => val.amount),
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
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
            return "Revenue: ₹" + numberWithIndianFormat(context.parsed.y);
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
          <h1 className="text-2xl font-semibold">Monthly Revenue Report</h1>
          <p className="text-sm text-gray-600">
            Revenue analysis for the last 12 months
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={exportToExcel}
            disabled={!lastYearData.length}
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
      ) : lastYearData.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(totalRevenue)}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Average Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(Math.round(averageRevenue))}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Highest Month</p>
                  <p className="text-lg font-bold mt-1">{maxMonth?.monthYear}</p>
                  <p className="text-xs opacity-90">₹{numberWithIndianFormat(maxMonth?.amount || 0)}</p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Lowest Month</p>
                  <p className="text-lg font-bold mt-1">{minMonth?.monthYear}</p>
                  <p className="text-xs opacity-90">₹{numberWithIndianFormat(minMonth?.amount || 0)}</p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue Bar Chart</h2>
              <div className="h-80">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue Trend Line</h2>
              <div className="h-80">
                <Line data={lineChartData} options={chartOptions} />
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
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Month-Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue (₹)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lastYearData.map((item, index) => {
                    const percentOfTotal = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                    const isHighest = item.monthYear === maxMonth?.monthYear;
                    const isLowest = item.monthYear === minMonth?.monthYear;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.monthYear}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {percentOfTotal.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {isHighest && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Highest
                            </span>
                          )}
                          {isLowest && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Lowest
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      100%
                    </td>
                    <td></td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>
                      Average
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(Math.round(averageRevenue))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {lastYearData.length > 0 ? (100 / lastYearData.length).toFixed(2) : 0}%
                    </td>
                    <td></td>
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

export default MonthlyRevenueReport;
