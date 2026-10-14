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
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import ServerTime from "@/action/servertime";

ChartJS.register(...registerables);

const DealerTypeRevenueReport = () => {
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);

  interface MonthlyRevenue {
    month: string;
    fuelRevenue: number;
    liquorRevenue: number;
    oidcRevenue: number;
    manufacturerRevenue: number;
    wholesalerRevenue: number;
    restaurantRevenue: number;
    fuelDealers: number;
    liquorDealers: number;
    oidcDealers: number;
    manufacturerDealers: number;
    wholesalerDealers: number;
    restaurantDealers: number;
  }

  interface ResponseData {
    monthlyData: MonthlyRevenue[];
    totalFuelRevenue: number;
    totalLiquorRevenue: number;
    totalOidcRevenue: number;
    totalManufacturerRevenue: number;
    totalWholesalerRevenue: number;
    totalRestaurantRevenue: number;
    totalFuelDealers: number;
    totalLiquorDealers: number;
    totalOidcDealers: number;
    totalManufacturerDealers: number;
    totalWholesalerDealers: number;
    totalRestaurantDealers: number;
    fuelPercentage: number;
    liquorPercentage: number;
    oidcPercentage: number;
    manufacturerPercentage: number;
    wholesalerPercentage: number;
    restaurantPercentage: number;
    year: string;
  }

  const [reportData, setReportData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);
  const [selectedYear, setSelectedYear] = useState<string>(
    (ServerTime().data as Date).getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(
    undefined,
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string | undefined>(
    undefined,
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
        const filterOffice = [
          "VATOFFICER",
          "DY_COMMISSIONER",
          "JOINT_COMMISSIONER",
        ].includes(userResponse.data.role)
          ? (userResponse.data.selectOffice ?? undefined)
          : city;

        const response = await DealerTypeRevenue({
          selectOffice: filterOffice,
          year: selectedYear,
          month: selectedMonth,
          quarter: selectedQuarter,
        });
        if (response.status && response.data) {
          setReportData(response.data);
        } else {
          toast.error(response.message || "Failed to load data");
        }
      }
      setLoading(false);
    };
    init();
  }, [city, selectedYear, selectedMonth, selectedQuarter, router]);

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
      [
        "OIDC Dealers",
        reportData.totalOidcRevenue.toString(),
        reportData.totalOidcDealers.toString(),
        reportData.oidcPercentage.toFixed(2) + "%",
      ],
      [
        "Manufacturer Dealers",
        reportData.totalManufacturerRevenue.toString(),
        reportData.totalManufacturerDealers.toString(),
        reportData.manufacturerPercentage.toFixed(2) + "%",
      ],
      [
        "Wholesaler Dealers",
        reportData.totalWholesalerRevenue.toString(),
        reportData.totalWholesalerDealers.toString(),
        reportData.wholesalerPercentage.toFixed(2) + "%",
      ],
      [
        "Restaurant Dealers",
        reportData.totalRestaurantRevenue.toString(),
        reportData.totalRestaurantDealers.toString(),
        reportData.restaurantPercentage.toFixed(2) + "%",
      ],
      [""],
      ["Monthly Breakdown"],
      ["Month", "Petroleum Revenue", "Liquor Revenue", "OIDC Revenue", "Manufacturer Revenue", "Wholesaler Revenue", "Restaurant Revenue", "Total Revenue"],
    ];

    reportData.monthlyData.forEach((item) => {
      const total =
        item.fuelRevenue +
        item.liquorRevenue +
        item.oidcRevenue +
        item.manufacturerRevenue +
        item.wholesalerRevenue +
        item.restaurantRevenue;
      worksheetData.push([
        monthNames[item.month],
        item.fuelRevenue.toString(),
        item.liquorRevenue.toString(),
        item.oidcRevenue.toString(),
        item.manufacturerRevenue.toString(),
        item.wholesalerRevenue.toString(),
        item.restaurantRevenue.toString(),
        total.toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Total",
      reportData.totalFuelRevenue.toString(),
      reportData.totalLiquorRevenue.toString(),
      reportData.totalOidcRevenue.toString(),
      reportData.totalManufacturerRevenue.toString(),
      reportData.totalWholesalerRevenue.toString(),
      reportData.totalRestaurantRevenue.toString(),
      (
        reportData.totalFuelRevenue +
        reportData.totalLiquorRevenue +
        reportData.totalOidcRevenue +
        reportData.totalManufacturerRevenue +
        reportData.totalWholesalerRevenue +
        reportData.totalRestaurantRevenue
      ).toString(),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dealer Type Revenue");
    XLSX.writeFile(wb, `Dealer_Type_Revenue_${reportData.year}.xlsx`);
    toast.success("Report exported successfully!");
  };

  const doughnutData: any = {
    labels: ["Petroleum Dealers", "Liquor Dealers", "OIDC Dealers", "Manufacturer Dealers", "Wholesaler Dealers", "Restaurant Dealers"],
    datasets: [
      {
        data: [
          reportData?.totalFuelRevenue || 0,
          reportData?.totalLiquorRevenue || 0,
          reportData?.totalOidcRevenue || 0,
          reportData?.totalManufacturerRevenue || 0,
          reportData?.totalWholesalerRevenue || 0,
          reportData?.totalRestaurantRevenue || 0,
        ],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316"],
        borderColor: ["#2563eb", "#d97706", "#059669", "#7c3aed", "#be185d", "#d97706"],
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
            const percentages = [
              reportData?.fuelPercentage || 0,
              reportData?.liquorPercentage || 0,
              reportData?.oidcPercentage || 0,
              reportData?.manufacturerPercentage || 0,
              reportData?.wholesalerPercentage || 0,
              reportData?.restaurantPercentage || 0,
            ];
            const percentage = percentages[context.dataIndex] || 0;
            return `${label}: ₹${numberWithIndianFormat(value.toFixed(2))} (${percentage.toFixed(
              2,
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
      {
        label: "OIDC Dealers",
        data: reportData?.monthlyData.map((item) => item.oidcRevenue) || [],
        backgroundColor: "#10b981",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: "Manufacturer Dealers",
        data: reportData?.monthlyData.map((item) => item.manufacturerRevenue) || [],
        backgroundColor: "#8b5cf6",
        borderColor: "#8b5cf6",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: "Wholesaler Dealers",
        data: reportData?.monthlyData.map((item) => item.wholesalerRevenue) || [],
        backgroundColor: "#ec4899",
        borderColor: "#ec4899",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: "Restaurant Dealers",
        data: reportData?.monthlyData.map((item) => item.restaurantRevenue) || [],
        backgroundColor: "#f97316",
        borderColor: "#f97316",
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
            return "₹" + numberWithIndianFormat(value.toFixed(2));
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
            label += "₹" + numberWithIndianFormat(context.parsed.y.toFixed(2));
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
  const currentYear = (ServerTime().data as Date).getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  // Month options
  const monthOptions = [
    { value: undefined, label: "All Months" },
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ];

  // Quarter options
  const quarterOptions = [
    { value: undefined, label: "All Quarters" },
    { value: "Q1", label: "Q1 (Apr - Jun)" },
    { value: "Q2", label: "Q2 (Jul - Sep)" },
    { value: "Q3", label: "Q3 (Oct - Dec)" },
    { value: "Q4", label: "Q4 (Jan - Mar)" },
  ];

  const handleMonthChange = (value: string | undefined) => {
    setSelectedMonth(value);
    if (value !== undefined) {
      setSelectedQuarter(undefined);
    }
  };

  const handleQuarterChange = (value: string | undefined) => {
    setSelectedQuarter(value);
    if (value !== undefined) {
      setSelectedMonth(undefined);
    }
  };

  const handleClearFilters = () => {
    setSelectedYear((ServerTime().data as Date).getFullYear().toString());
    setSelectedMonth(undefined);
    setSelectedQuarter(undefined);
    setCity(undefined);
  };

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Dealer Type-wise Revenue Report
          </h1>
          <p className="text-sm text-gray-600">
            Compare revenue across all dealer types: Petroleum, Liquor, OIDC, Manufacturer, Wholesaler, and Restaurant
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
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
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
            <label className="text-sm font-medium text-gray-700">Month</label>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              options={monthOptions}
              style={{ width: 140 }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quarter</label>
            <Select
              value={selectedQuarter}
              onChange={handleQuarterChange}
              options={quarterOptions}
              style={{ width: 140 }}
            />
          </div>
          {user &&
            !["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
              user.role,
            ) && (
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
          <div className="pt-6">
            <button
              onClick={handleClearFilters}
              className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Clear Filters
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">Petroleum</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalFuelRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.fuelPercentage.toFixed(1)}% • {reportData.totalFuelDealers} Dealers
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">Liquor</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalLiquorRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.liquorPercentage.toFixed(1)}% • {reportData.totalLiquorDealers} Dealers
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">OIDC</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalOidcRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.oidcPercentage.toFixed(1)}% • {reportData.totalOidcDealers} Dealers
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">Manufacturer</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalManufacturerRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.manufacturerPercentage.toFixed(1)}% • {reportData.totalManufacturerDealers} Dealers
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">Wholesaler</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalWholesalerRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.wholesalerPercentage.toFixed(1)}% • {reportData.totalWholesalerDealers} Dealers
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div>
                <p className="text-xs font-semibold opacity-90">Restaurant</p>
                <p className="text-lg font-bold mt-1">
                  ₹{numberWithIndianFormat(reportData.totalRestaurantRevenue)}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {reportData.restaurantPercentage.toFixed(1)}% • {reportData.totalRestaurantDealers} Dealers
                </p>
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
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Petroleum</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Liquor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">OIDC</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Manufacturer</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Wholesaler</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Restaurant</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.monthlyData.map((item, index) => {
                    const total =
                      item.fuelRevenue +
                      item.liquorRevenue +
                      item.oidcRevenue +
                      item.manufacturerRevenue +
                      item.wholesalerRevenue +
                      item.restaurantRevenue;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {monthNames[item.month]}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">
                          ₹{numberWithIndianFormat(item.fuelRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-amber-600">
                          ₹{numberWithIndianFormat(item.liquorRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          ₹{numberWithIndianFormat(item.oidcRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-purple-600">
                          ₹{numberWithIndianFormat(item.manufacturerRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-pink-600">
                          ₹{numberWithIndianFormat(item.wholesalerRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                          ₹{numberWithIndianFormat(item.restaurantRevenue)}
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
                    <td className="px-4 py-3 text-sm text-right text-amber-600">
                      ₹{numberWithIndianFormat(reportData.totalLiquorRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      ₹{numberWithIndianFormat(reportData.totalOidcRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-purple-600">
                      ₹{numberWithIndianFormat(reportData.totalManufacturerRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-pink-600">
                      ₹{numberWithIndianFormat(reportData.totalWholesalerRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      ₹{numberWithIndianFormat(reportData.totalRestaurantRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹
                      {numberWithIndianFormat(
                        reportData.totalFuelRevenue +
                          reportData.totalLiquorRevenue +
                          reportData.totalOidcRevenue +
                          reportData.totalManufacturerRevenue +
                          reportData.totalWholesalerRevenue +
                          reportData.totalRestaurantRevenue,
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
