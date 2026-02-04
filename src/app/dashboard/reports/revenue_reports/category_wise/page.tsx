"use client";
import {
  Fa6RegularBuilding,
  FluentMdl2Home,
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import numberWithIndianFormat, { isNegative } from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin } from "antd";
import { format, subMonths } from "date-fns";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import Last15ReceivedReport from "@/action/report/last15receivedreport";
import OfficerDashboardReport from "@/action/report/officerdashboardreport";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

ChartJS.register(...registerables);

const CategoryWiseReport = () => {
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  
  interface ResponseData {
    totaldealer: number;
    fueldealer: number;
    liquoredealer: number;
    manufacturer: number;
    oidcdealer: number;
    reg: number;
    comp: number;
    last_month_received: number;
    this_month_received: number;
    filed_return: number;
    pending_return: number;
    today_received: number;
  }

  const [countData, setCountData] = useState<ResponseData>({
    totaldealer: 0,
    fueldealer: 0,
    liquoredealer: 0,
    manufacturer: 0,
    oidcdealer: 0,
    reg: 0,
    comp: 0,
    last_month_received: 0,
    this_month_received: 0,
    filed_return: 0,
    pending_return: 0,
    today_received: 0,
  });

  interface Last15DayData {
    date: Date; // Date object
    amount: number; // Total amount for the day
  }

  const [last15Day, setLast15Day] = useState<Last15DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);

  const [commoditydata, setCommoditydata] = useState<
    "FUEL" | "LIQUOR" | undefined
  >(undefined);

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
        
        const count_data_response = await OfficerDashboardReport({
          selectOffice: filterOffice,
          selectCommodity: commoditydata,
          filterType: "MONTH",
          month: selectedMonth,
          year: selectedYear,
        });
        if (count_data_response.status && count_data_response.data) {
          setCountData(count_data_response.data);
        } else {
          toast.error(
            count_data_response.message || "Failed to load dashboard data",
          );
        }

        const last15days = await Last15ReceivedReport({
          selectOffice: filterOffice,
          selectCommodity: commoditydata,
          filterType: "MONTH",
          month: selectedMonth,
          year: selectedYear,
        });
        if (last15days.status && last15days.data) {
          setLast15Day(last15days.data);
        } else {
          toast.error(last15days.message || "Failed to load daily data");
        }
      }
      setLoading(false);
    };
    init();
  }, [city, commoditydata, selectedMonth, selectedYear]);

  const totalLast15Days = last15Day.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily =
    last15Day.length > 0 ? totalLast15Days / last15Day.length : 0;

  const exportToExcel = () => {
    if (last15Day.length === 0) return;

    const worksheetData = [
      ["Category Wise Report - Monthly Data"],
      [""],
      ["Summary Statistics"],
      ["Total Dealers", countData.totaldealer.toString()],
      ["Fuel Dealers", countData.fueldealer.toString()],
      [
        "Liquor Dealers",
        (countData.liquoredealer + countData.manufacturer).toString(),
      ],
      ["Regular", countData.reg.toString()],
      ["Composition", countData.comp.toString()],
      ["Today Received", countData.today_received.toString()],
      ["This Month Received", countData.this_month_received.toString()],
      ["Last Month Received", countData.last_month_received.toString()],
      ["Filed Returns", countData.filed_return.toString()],
      ["Pending Returns", countData.pending_return.toString()],
      [""],
      ["Selected Month Revenue"],
      ["Date", "Revenue (₹)"],
    ];

    last15Day.forEach((item) => {
      worksheetData.push([
        format(item.date, "dd MMM yyyy"),
        item.amount.toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push(["Total (Selected Month)", totalLast15Days.toString()]);
    worksheetData.push(["Average Daily", averageDaily.toFixed(2)]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Category Report");
    XLSX.writeFile(
      wb,
      `Category_Wise_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Report exported successfully!");
  };

  const dataset: any = {
    labels: last15Day
      .map((val: Last15DayData) => format(val.date, "dd MMM"))
      .reverse(),
    datasets: [
      {
        label: "Revenue (₹)",
        data: last15Day.map((val: Last15DayData) => val.amount).reverse(),
        backgroundColor: "#3b82f6",
        borderWidth: 0,
        barPercentage: 0.6,
      },
    ],
  };

  const doughnutData: any = {
    labels: ["Fuel Dealers", "Liquor Dealers"],
    datasets: [
      {
        label: "Count",
        data: [
          countData.fueldealer,
          countData.liquoredealer + countData.manufacturer,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const options: any = {
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

  const doughnutOptions: any = {
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
            return context.label + ": " + context.parsed;
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

  const monthDifference =
    countData.this_month_received -
    (isNegative(countData.last_month_received)
      ? 0
      : countData.last_month_received);

  // Create date object for the selected month
  const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);
  const previousMonthDate = subMonths(selectedDate, 1);

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">Category Wise Report</h1>
          <p className="text-sm text-gray-600">
            Comprehensive analysis of dealers, returns, and revenue
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={exportToExcel}
            disabled={!last15Day.length}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg shadow-md p-4 text-white">
              <Fa6RegularBuilding className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.totaldealer}</p>
              <p className="text-xs opacity-90">Total Dealers</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
              <FluentMdl2Home className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.fueldealer}</p>
              <p className="text-xs opacity-90">Fuel Dealers</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
              <FluentMdl2Home className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">
                {countData.liquoredealer + countData.manufacturer}
              </p>
              <p className="text-xs opacity-90">Liquor Dealers</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
              <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.reg}</p>
              <p className="text-xs opacity-90">Regular</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md p-4 text-white">
              <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.comp}</p>
              <p className="text-xs opacity-90">Composition</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
              <RiAuctionLine className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-lg font-bold">
                ₹{numberWithIndianFormat(countData.today_received)}
              </p>
              <p className="text-xs opacity-90">Today Received</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-4 text-white">
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.filed_return}</p>
              <p className="text-xs opacity-90">Filed Returns</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md p-4 text-white">
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
              <p className="text-2xl font-bold">{countData.pending_return}</p>
              <p className="text-xs opacity-90">Pending Returns</p>
            </div>
          </div>

          {/* Monthly Revenue Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
              <RiMoneyRupeeCircleLine className="w-10 h-10 opacity-70 mb-2" />
              <p className="text-2xl font-bold">
                ₹
                {numberWithIndianFormat(
                  isNegative(countData.last_month_received)
                    ? 0
                    : countData.last_month_received,
                )}
              </p>
              <p className="text-sm opacity-90">
                {format(previousMonthDate, "MMMM yyyy")} Revenue
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-md p-6 text-white">
              <RiMoneyRupeeCircleLine className="w-10 h-10 opacity-70 mb-2" />
              <p className="text-2xl font-bold">
                ₹{numberWithIndianFormat(countData.this_month_received)}
              </p>
              <p className="text-sm opacity-90">
                {format(selectedDate, "MMMM yyyy")} Revenue
              </p>
            </div>

            <div
              className={`bg-gradient-to-br ${
                monthDifference >= 0
                  ? "from-emerald-500 to-emerald-600"
                  : "from-red-500 to-red-600"
              } rounded-lg shadow-md p-6 text-white`}
            >
              <RiMoneyRupeeCircleLine className="w-10 h-10 opacity-70 mb-2" />
              <p className="text-2xl font-bold">
                {monthDifference >= 0 ? "+" : ""}₹
                {numberWithIndianFormat(Math.abs(monthDifference))}
              </p>
              <p className="text-sm opacity-90">Month over Month Change</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">
                Selected Month Revenue
              </h2>
              <div className="h-80">
                {last15Day.length > 0 ? (
                  <Bar data={dataset} options={options} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Dealer Distribution
              </h2>
              <div className="h-80 flex items-center justify-center">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Daily Revenue Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue (₹)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {last15Day
                    .slice()
                    .reverse()
                    .map((item, index) => {
                      const percentOfTotal =
                        totalLast15Days > 0
                          ? (item.amount / totalLast15Days) * 100
                          : 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {format(item.date, "dd MMM yyyy")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ₹{numberWithIndianFormat(item.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {percentOfTotal.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>
                      Total (15 Days)
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(totalLast15Days)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      100%
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>
                      Average Daily
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{numberWithIndianFormat(Math.round(averageDaily))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {last15Day.length > 0
                        ? (100 / last15Day.length).toFixed(2)
                        : 0}
                      %
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default CategoryWiseReport;
