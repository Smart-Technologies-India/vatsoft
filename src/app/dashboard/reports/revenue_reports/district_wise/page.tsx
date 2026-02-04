"use client";
import { FluentMdl2Home } from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin } from "antd";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import DistrictWiseRevenue from "@/action/report/districtwiserevenue";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

ChartJS.register(...registerables);

const DistrictWiseReport = () => {
  interface DistrictRevenue {
    district: string;
    revenue: number;
    returnCount: number;
    dealerCount: number;
  }

  interface ReportData {
    districts: DistrictRevenue[];
    totalRevenue: number;
    totalReturns: number;
    totalDealers: number;
  }

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commoditydata, setCommoditydata] = useState<
    "FUEL" | "LIQUOR" | undefined
  >(undefined);

  const [filterType, setFilterType] = useState<"MONTH" | "YEAR">("YEAR");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - i,
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const response = await DistrictWiseRevenue({
        selectCommodity: commoditydata,
        filterType: filterType,
        month: filterType === "MONTH" ? selectedMonth : undefined,
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
  }, [commoditydata, filterType, selectedMonth, selectedYear]);

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData = [
      ["District-Wise Revenue Report"],
      [""],
      [
        "District",
        "Revenue (₹)",
        "Returns Filed",
        "Dealers",
        "% of Total Revenue",
        "Avg Revenue per Dealer",
      ],
    ];

    reportData.districts.forEach((district) => {
      const percentOfTotal =
        reportData.totalRevenue > 0
          ? (district.revenue / reportData.totalRevenue) * 100
          : 0;
      const avgPerDealer =
        district.dealerCount > 0 ? district.revenue / district.dealerCount : 0;

      worksheetData.push([
        district.district,
        district.revenue.toString(),
        district.returnCount.toString(),
        district.dealerCount.toString(),
        percentOfTotal.toFixed(2) + "%",
        avgPerDealer.toFixed(2),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Total",
      reportData.totalRevenue.toString(),
      reportData.totalReturns.toString(),
      reportData.totalDealers.toString(),
      "100%",
      "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "District Wise Revenue");
    XLSX.writeFile(
      wb,
      `District_Wise_Revenue_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Report exported successfully!");
  };

  const barChartData: any = {
    labels: reportData?.districts.map((d) => d.district) || [],
    datasets: [
      {
        label: "Revenue (₹)",
        data: reportData?.districts.map((d) => d.revenue) || [],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderWidth: 0,
        barPercentage: 0.6,
      },
    ],
  };

  const pieChartData: any = {
    labels: reportData?.districts.map((d) => d.district) || [],
    datasets: [
      {
        label: "Revenue Distribution",
        data: reportData?.districts.map((d) => d.revenue) || [],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartData: any = {
    labels: reportData?.districts.map((d) => d.district) || [],
    datasets: [
      {
        label: "Dealer Count",
        data: reportData?.districts.map((d) => d.dealerCount) || [],
        backgroundColor: ["#8b5cf6", "#ec4899", "#06b6d4"],
        borderColor: "#fff",
        borderWidth: 2,
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

  const pieOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total =
              reportData?.totalRevenue ||
              context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(2);
            return (
              context.label +
              ": ₹" +
              numberWithIndianFormat(value) +
              ` (${percentage}%)`
            );
          },
        },
      },
    },
  };

  const onCommodityChange = (e: RadioChangeEvent) => {
    setCommoditydata(e.target.value);
  };

  const commodity = [
    { label: "All", value: undefined },
    { label: "FUEL", value: "FUEL" },
    { label: "LIQUOR", value: "LIQUOR" },
  ];

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            District-Wise Revenue Report
          </h1>
          <p className="text-sm text-gray-600">
            Revenue comparison across Dadra & Nagar Haveli, Daman, and Diu
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
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Filter Type
            </label>
            <Radio.Group
              options={[
                { label: "By Year", value: "YEAR" },
                { label: "By Month", value: "MONTH" },
              ]}
              onChange={(e: RadioChangeEvent) => setFilterType(e.target.value)}
              value={filterType}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
          {filterType === "MONTH" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Commodity
            </label>
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
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData.totalRevenue)}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Returns Filed</p>
                  <p className="text-2xl font-bold mt-1">
                    {reportData.totalReturns}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Dealers</p>
                  <p className="text-2xl font-bold mt-1">
                    {reportData.totalDealers}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>

          {/* District Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {reportData.districts.map((district, index) => {
              const colors = [
                { bg: "from-blue-500 to-blue-600", text: "text-blue-100" },
                { bg: "from-green-500 to-green-600", text: "text-green-100" },
                { bg: "from-orange-500 to-orange-600", text: "text-orange-100" },
              ];
              const color = colors[index];
              const percentOfTotal =
                reportData.totalRevenue > 0
                  ? (district.revenue / reportData.totalRevenue) * 100
                  : 0;

              return (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${color.bg} rounded-lg shadow-md p-6 text-white`}
                >
                  <h3 className="text-lg font-semibold mb-3">
                    {district.district}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">Revenue</span>
                      <span className="text-lg font-bold">
                        ₹{numberWithIndianFormat(district.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">% of Total</span>
                      <span className="font-semibold">
                        {percentOfTotal.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">Returns</span>
                      <span className="font-semibold">
                        {district.returnCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">Dealers</span>
                      <span className="font-semibold">
                        {district.dealerCount}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-90">
                          Avg per Dealer
                        </span>
                        <span className="text-sm font-semibold">
                          ₹
                          {numberWithIndianFormat(
                            district.dealerCount > 0
                              ? Math.round(
                                  district.revenue / district.dealerCount
                                )
                              : 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">
                District Revenue Comparison
              </h2>
              <div className="h-80">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Revenue Distribution
              </h2>
              <div className="h-80 flex items-center justify-center">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Additional Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Dealer Distribution
              </h2>
              <div className="h-80 flex items-center justify-center">
                <Doughnut data={doughnutChartData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Returns Filed by District
              </h2>
              <div className="h-80">
                <Bar
                  data={{
                    labels: reportData.districts.map((d) => d.district),
                    datasets: [
                      {
                        label: "Returns Filed",
                        data: reportData.districts.map((d) => d.returnCount),
                        backgroundColor: ["#8b5cf6", "#ec4899", "#06b6d4"],
                        borderWidth: 0,
                        barPercentage: 0.6,
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: function (context: any) {
                            return "Returns: " + context.parsed.y;
                          },
                        },
                      },
                    },
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        ticks: {
                          font: {
                            size: 11,
                          },
                          callback: function (value: any) {
                            return value;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Detailed Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue (₹)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Returns Filed
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dealers
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Avg Revenue/Dealer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.districts.map((district, index) => {
                    const percentOfTotal =
                      reportData.totalRevenue > 0
                        ? (district.revenue / reportData.totalRevenue) * 100
                        : 0;
                    const avgPerDealer =
                      district.dealerCount > 0
                        ? district.revenue / district.dealerCount
                        : 0;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {district.district}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(district.revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {percentOfTotal.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {district.returnCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {district.dealerCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          ₹{numberWithIndianFormat(Math.round(avgPerDealer))}
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
                      ₹{numberWithIndianFormat(reportData.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      100%
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {reportData.totalReturns}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {reportData.totalDealers}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹
                      {numberWithIndianFormat(
                        reportData.totalDealers > 0
                          ? Math.round(
                              reportData.totalRevenue / reportData.totalDealers
                            )
                          : 0
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

export default DistrictWiseReport;
