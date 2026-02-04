"use client";
import { FluentMdl2Home } from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Select, Spin, Badge } from "antd";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import TopRevenueDealers from "@/action/report/toprevenuedealers";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

ChartJS.register(...registerables);

const TopRevenueDealersReport = () => {
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  
  interface DealerRevenueData {
    id: number;
    tinNumber: string;
    name: string;
    tradename: string;
    commodity: string;
    selectOffice: string;
    contact_one: string;
    totalRevenue: number;
    returnsFiled: number;
    averageRevenuePerReturn: number;
    rank: number;
  }

  const [reportData, setReportData] = useState<DealerRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);
  const [commoditydata, setCommoditydata] = useState<
    "FUEL" | "LIQUOR" | undefined
  >(undefined);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
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
        
        const response = await TopRevenueDealers({
          selectOffice: filterOffice,
          selectCommodity: commoditydata,
          year: selectedYear,
          limit: 10,
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
  }, [city, commoditydata, selectedYear]);

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;

    const worksheetData = [
      [
        "Top 10 Highest Revenue-Contributing Dealers",
        "",
        `Year: ${selectedYear}`,
      ],
      [""],
      [
        "Rank",
        "TIN Number",
        "Dealer Name",
        "Trade Name",
        "Commodity",
        "District",
        "Contact",
        "Total Revenue",
        "Returns Filed",
        "Average Revenue Per Return",
      ],
    ];

    reportData.forEach((dealer) => {
      worksheetData.push([
        dealer.rank.toString(),
        dealer.tinNumber,
        dealer.name,
        dealer.tradename,
        dealer.commodity,
        dealer.selectOffice,
        dealer.contact_one,
        dealer.totalRevenue.toString(),
        dealer.returnsFiled.toString(),
        dealer.averageRevenuePerReturn.toString(),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Revenue Dealers");
    XLSX.writeFile(wb, `Top_Revenue_Dealers_${selectedYear}.xlsx`);
    toast.success("Report exported successfully!");
  };

  const chartData: any = {
    labels: reportData.map((d) => d.tradename.substring(0, 20)),
    datasets: [
      {
        label: "Total Revenue (₹)",
        data: reportData.map((d) => d.totalRevenue),
        backgroundColor: reportData.map((d, index) => {
          // Gradient colors from gold to blue
          const colors = [
            "#fbbf24", // gold
            "#f59e0b", // amber
            "#f97316", // orange
            "#3b82f6", // blue
            "#2563eb", // darker blue
            "#1e40af",
            "#1e3a8a",
            "#6366f1",
            "#4f46e5",
            "#4338ca",
          ];
          return colors[index] || "#6b7280";
        }),
        borderColor: "#1f2937",
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
            return "Revenue: ₹" + numberWithIndianFormat(context.parsed.x);
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

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  const getCommodityColor = (commodity: string) => {
    switch (commodity) {
      case "FUEL":
        return "blue";
      case "LIQUOR":
        return "orange";
      default:
        return "gray";
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-900";
    if (rank === 3) return "bg-amber-600 text-white";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Top 10 Highest Revenue-Contributing Dealers
          </h1>
          <p className="text-sm text-gray-600">
            View highest revenue contributing dealers per district and category
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
            <label className="text-sm font-medium text-gray-700">Year</label>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 120 }}
            />
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
            <div className="bg-linear-to-br from-yellow-400 to-yellow-500 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Top Dealer Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{numberWithIndianFormat(reportData[0]?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs opacity-90 mt-1 truncate">
                    {reportData[0]?.tradename}
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Top 10 Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹
                    {numberWithIndianFormat(
                      reportData.reduce((sum, d) => sum + d.totalRevenue, 0),
                    )}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Combined contribution
                  </p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Average Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹
                    {numberWithIndianFormat(
                      reportData.reduce((sum, d) => sum + d.totalRevenue, 0) /
                        reportData.length,
                    )}
                  </p>
                  <p className="text-xs opacity-90 mt-1">Per dealer</p>
                </div>
                <FluentMdl2Home className="w-10 h-10 opacity-30" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Revenue Comparison Chart
            </h2>
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      TIN Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dealer Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Trade Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Returns Filed
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Avg Per Return
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((dealer, index) => {
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getRankBadgeColor(
                              dealer.rank,
                            )}`}
                          >
                            {dealer.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {dealer.tinNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {dealer.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dealer.tradename}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Badge
                            color={getCommodityColor(dealer.commodity)}
                            text={dealer.commodity}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {dealer.selectOffice === "Dadra_Nagar_Haveli"
                            ? "DNH"
                            : dealer.selectOffice}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          ₹{numberWithIndianFormat(dealer.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {dealer.returnsFiled}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          ₹
                          {numberWithIndianFormat(
                            Number(dealer.averageRevenuePerReturn.toFixed(0)),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td
                      colSpan={6}
                      className="px-4 py-3 text-sm text-gray-900 text-right"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      ₹
                      {numberWithIndianFormat(
                        reportData.reduce((sum, d) => sum + d.totalRevenue, 0),
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {reportData.reduce((sum, d) => sum + d.returnsFiled, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      ₹
                      {numberWithIndianFormat(
                        reportData.reduce(
                          (sum, d) => sum + d.averageRevenuePerReturn,
                          0,
                        ) / reportData.length,
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
          <div className="text-center">
            <p className="text-gray-500 text-lg">No dealers found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default TopRevenueDealersReport;
