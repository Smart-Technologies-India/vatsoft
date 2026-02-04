"use client";
import {
  FluentMdl2Home,
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
} from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin, Tabs } from "antd";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import CommoditySalesGrowth from "@/action/report/commoditysalesgrowth";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

ChartJS.register(...registerables);

const CommoditySalesGrowthReport = () => {
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  
  interface CommodityGrowthData {
    commodityId: number;
    commodityName: string;
    currentPeriod: string;
    previousPeriod: string;
    currentAmount: number;
    previousAmount: number;
    currentQuantity: number;
    previousQuantity: number;
    amountGrowth: number;
    quantityGrowth: number;
    amountGrowthPercent: number;
    quantityGrowthPercent: number;
  }

  const [reportData, setReportData] = useState<CommodityGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);
  const [commoditydata, setCommoditydata] = useState<
    "FUEL" | "LIQUOR" | undefined
  >(undefined);
  const [growthType, setGrowthType] = useState<
    "MONTH_ON_MONTH" | "YEAR_ON_YEAR"
  >("MONTH_ON_MONTH");

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
      
      // Fetch authenticated user
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }
      
      const userResponse = await GetUser({ id: authResponse.data });
      if (userResponse.status && userResponse.data) {
        setUser(userResponse.data);
        
        // Set office filter based on role
        const filterOffice = ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(userResponse.data.role)
          ? (userResponse.data.selectOffice ?? undefined)
          : city;
        
        const response = await CommoditySalesGrowth({
          selectOffice: filterOffice,
          selectCommodity: commoditydata,
          growthType: growthType,
          month: growthType === "MONTH_ON_MONTH" ? selectedMonth : undefined,
          year: selectedYear,
        });
        if (response.status && response.data) {
          setReportData(response.data);
        } else {
          toast.error(response.message || "Failed to load data");
          setReportData([]);
        }
      }
      setLoading(false);
    };
    init();
  }, [city, commoditydata, growthType, selectedMonth, selectedYear]);

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;

    const worksheetData = [
      [
        "Commodity Sales Growth Report",
        "",
        growthType === "MONTH_ON_MONTH"
          ? "Month-on-Month"
          : "Year-on-Year",
      ],
      [""],
      [
        "Commodity",
        "Current Period",
        "Current Amount",
        "Current Quantity",
        "Previous Period",
        "Previous Amount",
        "Previous Quantity",
        "Amount Growth",
        "Amount Growth %",
        "Quantity Growth",
        "Quantity Growth %",
      ],
    ];

    reportData.forEach((item) => {
      worksheetData.push([
        item.commodityName,
        item.currentPeriod,
        item.currentAmount.toString(),
        item.currentQuantity.toString(),
        item.previousPeriod,
        item.previousAmount.toString(),
        item.previousQuantity.toString(),
        item.amountGrowth.toString(),
        item.amountGrowthPercent.toFixed(2) + "%",
        item.quantityGrowth.toString(),
        item.quantityGrowthPercent.toFixed(2) + "%",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Growth");
    XLSX.writeFile(
      wb,
      `Commodity_Sales_Growth_${
        growthType === "MONTH_ON_MONTH" ? "MoM" : "YoY"
      }.xlsx`
    );
    toast.success("Report exported successfully!");
  };

  const topGrowthData = reportData.slice(0, 10);
  const bottomGrowthData = reportData.slice(-10).reverse();

  const chartDataTop: any = {
    labels: topGrowthData.map((item) => item.commodityName),
    datasets: [
      {
        label: "Growth %",
        data: topGrowthData.map((item) => item.amountGrowthPercent),
        backgroundColor: topGrowthData.map((item) =>
          item.amountGrowthPercent >= 0 ? "#10b981" : "#ef4444"
        ),
        borderColor: topGrowthData.map((item) =>
          item.amountGrowthPercent >= 0 ? "#059669" : "#dc2626"
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartDataBottom: any = {
    labels: bottomGrowthData.map((item) => item.commodityName),
    datasets: [
      {
        label: "Growth %",
        data: bottomGrowthData.map((item) => item.amountGrowthPercent),
        backgroundColor: bottomGrowthData.map((item) =>
          item.amountGrowthPercent >= 0 ? "#10b981" : "#ef4444"
        ),
        borderColor: bottomGrowthData.map((item) =>
          item.amountGrowthPercent >= 0 ? "#059669" : "#dc2626"
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return "Growth: " + context.parsed.x.toFixed(2) + "%";
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

  const onGrowthTypeChange = (e: RadioChangeEvent) => {
    setGrowthType(e.target.value);
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

  const growthTypes = [
    { label: "Month-on-Month", value: "MONTH_ON_MONTH" },
    { label: "Year-on-Year", value: "YEAR_ON_YEAR" },
  ];

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Commodity Sales Growth Report
          </h1>
          <p className="text-sm text-gray-600">
            Analyze commodity sales growth trends
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={exportToExcel}
            disabled={!reportData || reportData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Growth Type
            </label>
            <Radio.Group
              options={growthTypes}
              onChange={onGrowthTypeChange}
              value={growthType}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
          {growthType === "MONTH_ON_MONTH" && (
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
          {user && !["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role) && (
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
          )}
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
      ) : reportData && reportData.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Commodities</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.length}
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Positive Growth</p>
                  <p className="text-3xl font-bold mt-1">
                    {
                      reportData.filter(
                        (item) => item.amountGrowthPercent > 0
                      ).length
                    }
                  </p>
                </div>
                <MaterialSymbolsKeyboardArrowUpRounded className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Negative Growth</p>
                  <p className="text-3xl font-bold mt-1">
                    {
                      reportData.filter(
                        (item) => item.amountGrowthPercent < 0
                      ).length
                    }
                  </p>
                </div>
                <MaterialSymbolsKeyboardArrowDownRounded className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Top 10 Growth Leaders
              </h2>
              <div className="h-96">
                <Bar data={chartDataTop} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Bottom 10 Growth (Declining)
              </h2>
              <div className="h-96">
                <Bar data={chartDataBottom} options={chartOptions} />
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
                      Commodity
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Current Period
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Current Sales
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Previous Period
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Previous Sales
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount Growth
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Growth %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, index) => {
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.commodityName}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.currentPeriod}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(item.currentAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {numberWithIndianFormat(item.currentQuantity)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.previousPeriod}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ₹{numberWithIndianFormat(item.previousAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {numberWithIndianFormat(item.previousQuantity)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            item.amountGrowth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.amountGrowth >= 0 ? "+" : ""}₹
                          {numberWithIndianFormat(Math.abs(item.amountGrowth))}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-center font-medium ${
                            item.amountGrowthPercent >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {item.amountGrowthPercent >= 0 ? (
                              <MaterialSymbolsKeyboardArrowUpRounded className="w-4 h-4" />
                            ) : (
                              <MaterialSymbolsKeyboardArrowDownRounded className="w-4 h-4" />
                            )}
                            {item.amountGrowthPercent >= 0 ? "+" : ""}
                            {item.amountGrowthPercent.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
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

export default CommoditySalesGrowthReport;
