"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OfficerDashboard from "@/action/dashboard/officerdashboard";
import Last15Received from "@/action/dashboard/last15received";
import GetTopLiquorDealers from "@/action/dashboard/gettopliquordealers";
import GetTopFuelDealers from "@/action/dashboard/gettopfueldealers";
import GetTopCommodities from "@/action/dashboard/gettopcommodities";
import DistrictWiseRevenue from "@/action/report/districtwiserevenue";
import OfficerDashboardReport from "@/action/report/officerdashboardreport";
import { format, subMonths } from "date-fns";
import { Bar, Pie } from "react-chartjs-2";
import { user } from "@prisma/client";
import { Radio, RadioChangeEvent } from "antd";
import Link from "next/link";

interface DashboardCardProps {
  name: string;
  count: string;
  color: string;
  subtitle: string;
  children?: React.ReactNode;
  isruppy?: boolean;
}

const DashboardCard = (props: DashboardCardProps) => {
  return (
    <div className="bg-white rounded shadow-sm border p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-0.5">
            {props.name}
          </p>
          <div>
            {props.isruppy ? (
              <p className="text-base font-semibold text-gray-900">
                ₹{props.count}
              </p>
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {props.count}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{props.subtitle}</p>
          </div>
        </div>
        <div className={`rounded p-1.5 ${props.color}`}>{props.children}</div>
      </div>
    </div>
  );
};

import numberWithIndianFormat, { isNegative } from "@/utils/methods";

import {
  Fa6RegularBuilding,
  Fa6RegularHourglassHalf,
  FluentMdl2Home,
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import { toast } from "react-toastify";
import { Chart as ChartJS, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Pie Chart Data and Options
const pieOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000,
  },
  elements: {
    arc: {
      borderWidth: 3,
      borderColor: "#ffffff",
      hoverBorderWidth: 4,
    },
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: {
          size: 11,
          weight: "500",
        },
        padding: 12,
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        color: "#374151",
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12,
      titleFont: {
        size: 13,
        weight: "bold",
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        label: function (context: any) {
          const label = context.label || "";
          const value = context.parsed;
          const total = context.dataset.data.reduce(
            (a: number, b: number) => a + b,
            0,
          );
          // const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${numberWithIndianFormat(value)}`;
          // return `${label}: ${numberWithIndianFormat(value)} (${percentage}%)`;
        },
      },
    },
    datalabels: {
      display: true,
      color: "#374151",
      font: {
        size: 11,
        weight: "bold",
      },
      formatter: function (value: number, context: any) {
        const total = context.dataset.data.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        const percentage = ((value / total) * 100).toFixed(1);
        return percentage + "%";
      },
      anchor: "end",
      align: "end",
      offset: 8,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      borderRadius: 6,
      padding: {
        top: 3,
        bottom: 3,
        left: 6,
        right: 6,
      },
      textShadowColor: "transparent",
      textShadowBlur: 0,
    },
  },
};

// Bar Chart Options for Dealer Charts
const dealerBarOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y", // Horizontal bars
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        label: function (context: any) {
          return `Revenue: ₹${numberWithIndianFormat(context.parsed.x)}`;
        },
      },
    },
    datalabels: {
      display: false, // Disable data labels for bar charts
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        font: {
          size: 10,
        },
        callback: function (value: any) {
          return "₹" + numberWithIndianFormat(value);
        },
      },
      grid: {
        color: "#f3f4f6",
      },
    },
    y: {
      ticks: {
        font: {
          size: 10,
        },
        maxTicksLimit: 10,
      },
      grid: {
        display: false,
      },
    },
  },
  elements: {
    bar: {
      borderRadius: 4,
    },
  },
};

ChartJS.register(...registerables, ChartDataLabels);
const OfficerDashboardPage = () => {
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

  const router = useRouter();

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
  const [city, setCity] = useState<"Dadra_Nagar_Haveli" | "DAMAN" | "DIU">(
    "Dadra_Nagar_Haveli",
  );

  interface TopDealerData {
    id: number;
    name: string;
    tinNumber: string;
    totalRevenue: number;
    tradename: string;
  }

  const [topLiquorDealers, setTopLiquorDealers] = useState<TopDealerData[]>([]);
  const [topFuelDealers, setTopFuelDealers] = useState<TopDealerData[]>([]);

  interface DistrictRevenue {
    district: string;
    revenue: number;
    returnCount: number;
    dealerCount: number;
  }

  interface DistrictWiseRevenueData {
    districts: DistrictRevenue[];
    totalRevenue: number;
    totalReturns: number;
    totalDealers: number;
  }

  interface CategoryWiseData {
    fuelRevenue: number;
    liquorRevenue: number;
    totalRevenue: number;
  }

  const [districtRevenueData, setDistrictRevenueData] =
    useState<DistrictWiseRevenueData | null>(null);
  const [categoryWiseData, setCategoryWiseData] =
    useState<CategoryWiseData | null>(null);

  interface TopCommodityData {
    commodityName: string;
    totalRevenue: number;
    returnCount: number;
  }

  const [topFuelCommodities, setTopFuelCommodities] = useState<
    TopCommodityData[]
  >([]);
  const [topLiquorCommodities, setTopLiquorCommodities] = useState<
    TopCommodityData[]
  >([]);

  const [user, setUser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      const userrespone = await GetUser({ id: authResponse.data });

      if (userrespone.status && userrespone.data) {
        setUser(userrespone.data);

        // Set city based on user.selectOffice for specific roles
        if (
          userrespone.data.role === "VATOFFICER" ||
          userrespone.data.role === "DY_COMMISSIONER" ||
          userrespone.data.role === "JOINT_COMMISSIONER"
        ) {
          if (userrespone.data.selectOffice) {
            setCity(
              userrespone.data.selectOffice as
                | "Dadra_Nagar_Haveli"
                | "DAMAN"
                | "DIU",
            );
          }
        }
      }

      // Determine which office to use for filtering
      const filterOffice =
        userrespone.status &&
        userrespone.data &&
        ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
          userrespone.data.role,
        ) &&
        userrespone.data.selectOffice
          ? userrespone.data.selectOffice
          : city;

      const count_data_response = await OfficerDashboard({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
      });
      if (count_data_response.status && count_data_response.data) {
        setCountData(count_data_response.data);
      }

      const last15days = await Last15Received({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
      });
      if (last15days.status && last15days.data) {
        setLast15Day(last15days.data);
      }

      const liquorDealersResponse = await GetTopLiquorDealers({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
      });
      if (liquorDealersResponse.status && liquorDealersResponse.data) {
        setTopLiquorDealers(liquorDealersResponse.data);
      }

      const fuelDealersResponse = await GetTopFuelDealers({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
      });
      if (fuelDealersResponse.status && fuelDealersResponse.data) {
        setTopFuelDealers(fuelDealersResponse.data);
      }

      // Fetch category-wise revenue (fuel and liquor)
      const fuelRevenueResponse = await OfficerDashboardReport({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
        selectCommodity: "FUEL",
      });
      const liquorRevenueResponse = await OfficerDashboardReport({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
        selectCommodity: "LIQUOR",
      });

      if (
        fuelRevenueResponse.status &&
        fuelRevenueResponse.data &&
        liquorRevenueResponse.status &&
        liquorRevenueResponse.data
      ) {
        setCategoryWiseData({
          fuelRevenue: fuelRevenueResponse.data.this_month_received,
          liquorRevenue: liquorRevenueResponse.data.this_month_received,
          totalRevenue:
            fuelRevenueResponse.data.this_month_received +
            liquorRevenueResponse.data.this_month_received,
        });
      }

      // Fetch top commodities
      const fuelCommoditiesResponse = await GetTopCommodities({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
        commodityType: "FUEL",
        limit: 10,
      });
      if (fuelCommoditiesResponse.status && fuelCommoditiesResponse.data) {
        setTopFuelCommodities(fuelCommoditiesResponse.data);
      }

      const liquorCommoditiesResponse = await GetTopCommodities({
        selectOffice: filterOffice as "Dadra_Nagar_Haveli" | "DAMAN" | "DIU",
        commodityType: "LIQUOR",
        limit: 10,
      });
      if (liquorCommoditiesResponse.status && liquorCommoditiesResponse.data) {
        setTopLiquorCommodities(liquorCommoditiesResponse.data);
      }
    };
    init();
  }, [city]);

  // Fetch district-wise revenue independently (not affected by region filter)
  useEffect(() => {
    const fetchDistrictRevenue = async () => {
      const districtResponse = await DistrictWiseRevenue({});
      if (districtResponse.status && districtResponse.data) {
        setDistrictRevenueData(districtResponse.data);
      }
    };
    fetchDistrictRevenue();
  }, []);

  const dataset: any = {
    labels: last15Day
      .map((val: Last15DayData) => format(val.date, "dd MMM"))
      .reverse(),
    datasets: [
      {
        label: "Challan Collection",
        data: last15Day.map((val: Last15DayData) => val.amount).reverse(),
        backgroundColor: "#95acbe",
        borderWidth: 0,
        barPercentage: 0.6,
      },
    ],
  };

  // Dynamic liquor dealers data from database
  const liquorDealersData = {
    labels: topLiquorDealers.map(
      (dealer) => `${dealer.tradename} (${dealer.tinNumber})`,
    ),
    datasets: [
      {
        label: "Revenue",
        data: topLiquorDealers.map((dealer) => dealer.totalRevenue),
        backgroundColor: [
          "#8B5CF6",
          "#A855F7",
          "#9333EA",
          "#3B82F6",
          "#2563EB",
          "#1D4ED8",
          "#10B981",
          "#059669",
          "#047857",
          "#6366F1",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // Dynamic fuel dealers data from database
  const fuelDealersData = {
    labels: topFuelDealers.map(
      (dealer) => `${dealer.tradename} (${dealer.tinNumber})`,
    ),
    datasets: [
      {
        label: "Revenue",
        data: topFuelDealers.map((dealer) => dealer.totalRevenue),
        backgroundColor: [
          "#F59E0B",
          "#D97706",
          "#B45309",
          "#EF4444",
          "#DC2626",
          "#B91C1C",
          "#06B6D4",
          "#0891B2",
          "#0E7490",
          "#F97316",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // Dynamic district-wise revenue data from database
  const districtRevenueChartData = {
    labels: districtRevenueData?.districts.map(
      (d: DistrictRevenue) => d.district,
    ) || ["Dadra & Nagar Haveli", "Daman", "Diu"],
    datasets: [
      {
        data: districtRevenueData?.districts.map(
          (d: DistrictRevenue) => d.revenue,
        ) || [4500000, 3200000, 1800000],
        backgroundColor: [
          "#667eea", // Purple Blue
          "#f093fb", // Pink
          "#4facfe", // Light Blue
        ],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBackgroundColor: ["#5a67d8", "#e53e3e", "#3182ce"],
        hoverBorderWidth: 4,
      },
    ],
  };

  // Dynamic category-wise revenue data from database
  const categoryRevenueChartData = {
    labels: ["Liquor", "Petroleum"],
    datasets: [
      {
        data: categoryWiseData
          ? [categoryWiseData.liquorRevenue, categoryWiseData.fuelRevenue]
          : [5800000, 3700000],
        backgroundColor: [
          "#a8edea", // Light Teal
          "#ffecd2", // Light Peach
        ],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBackgroundColor: ["#805ad5", "#dd6b20"],
        hoverBorderWidth: 4,
      },
    ],
  };

  // Dynamic petroleum commodities data from database
  const petroleumCommoditiesChartData = {
    labels: topFuelCommodities.map((c) => c.commodityName),
    datasets: [
      {
        data: topFuelCommodities.map((c) => c.totalRevenue),
        backgroundColor: [
          "#FF6B6B", // Coral Red
          "#4ECDC4", // Teal
          "#45B7D1", // Sky Blue
          "#96CEB4", // Mint Green
          "#FFEAA7", // Light Yellow
        ],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBackgroundColor: [
          "#ff5252",
          "#26c6da",
          "#42a5f5",
          "#66bb6a",
          "#ffcc02",
        ],
        hoverBorderWidth: 4,
      },
    ],
  };

  // Dynamic liquor commodities data from database
  const liquorCommoditiesChartData = {
    labels: topLiquorCommodities.map((c) => c.commodityName),
    datasets: [
      {
        data: topLiquorCommodities.map((c) => c.totalRevenue),
        backgroundColor: [
          "#A8E6CF", // Mint
          "#DDA0DD", // Plum
          "#F4A460", // Sandy Brown
          "#87CEEB", // Sky Blue
          "#FFB6C1", // Light Pink
        ],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBackgroundColor: [
          "#7ed321",
          "#9013fe",
          "#f5a623",
          "#50e3c2",
          "#ff6b9d",
        ],
        hoverBorderWidth: 4,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        barThickness: 10,
        categoryPercentage: 0.8,
        barPercentage: 0.4,
        padding: 25,
        borderWidth: 2,
        ticks: {
          font: {
            size: 12,
          },
          precision: 0,
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
    indexAxis: "x",
    elements: {
      bar: {
        borderWidth: 1,
        categorySpacing: 0,
      },
    },
    plugins: {
      datalabels: {
        anchor: "end",
        align: "end",
        color: "#1e293b",
        font: {
          size: 10,
        },
        formatter: function (value: any) {
          return value;
        },
      },

      labels: {
        color: "white",
      },
      title: {
        display: false,
      },
      legend: {
        labels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };

  const onCityChange = (e: RadioChangeEvent) => {
    setCity(e.target.value);
  };

  const citys = [
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  return (
    <main className="p-3 bg-gray-50">
      {/* Header Section */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Officer Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Monitor and manage VAT operations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {[
                  "VATOFFICER",
                  "DY_COMMISSIONER",
                  "JOINT_COMMISSIONER",
                ].includes(user?.role || "") ? (
                  <>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Assigned Office
                    </p>
                    <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-sm font-medium text-blue-700">
                      {city === "Dadra_Nagar_Haveli"
                        ? "DNH"
                        : city === "DAMAN"
                          ? "DD"
                          : "DIU"}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Select Region
                    </p>
                    <Radio.Group
                      options={citys}
                      size="small"
                      value={city}
                      onChange={onCityChange}
                      defaultValue="DNH"
                      optionType="button"
                      buttonStyle="solid"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Link href={"/dashboard/dealer_compliance"}>
          <DashboardCard
            name="Total Dealer"
            count={countData.totaldealer.toString()}
            color="bg-rose-500"
            subtitle="Total Dealer Count"
          >
            <Fa6RegularBuilding className="text-xl text-white" />
          </DashboardCard>
        </Link>
        <Link href={"/dashboard/dealer_compliance"}>
          <DashboardCard
            name="Fuel/Liquor/Manufacturer Dealer"
            count={`${countData.fueldealer}/${countData.liquoredealer}/${countData.manufacturer}`}
            color="bg-green-500"
            subtitle="Fuel/Liquor/Mfg Count"
          >
            <FluentMdl2Home className="text-xl text-white" />
          </DashboardCard>
        </Link>

        <Link href={"/dashboard/dealer_compliance"}>
          <DashboardCard
            name="Reg/Comp"
            count={`${countData.reg}/${countData.comp}`}
            color="bg-blue-500"
            subtitle="Reg/Comp Count"
          >
            <MaterialSymbolsPersonRounded className="text-xl text-white" />
          </DashboardCard>
        </Link>

        <DashboardCard
          name="Today Received"
          count={numberWithIndianFormat(countData.today_received)}
          color="bg-orange-500"
          subtitle="Today Tax Received"
          isruppy={true}
        >
          <RiAuctionLine className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name="Last Month Received"
          count={numberWithIndianFormat(
            isNegative(countData.last_month_received)
              ? 0
              : countData.last_month_received,
          )}
          color="bg-teal-500"
          subtitle="Total Tax Received"
          isruppy={true}
        >
          <RiMoneyRupeeCircleLine className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name="This Month Received"
          count={numberWithIndianFormat(countData.this_month_received)}
          color="bg-violet-500"
          subtitle="Total Tax Received"
          isruppy={true}
        >
          <RiMoneyRupeeCircleLine className="text-xl text-white" />
        </DashboardCard>
        <Link href={"/dashboard/returns/department-track-return-status"}>
          <DashboardCard
            name="Filed Return"
            count={countData.filed_return.toString()}
            color="bg-pink-500"
            subtitle="Successful Return count"
          >
            <IcOutlineReceiptLong className="text-xl text-white" />
          </DashboardCard>
        </Link>
        <Link href={"/dashboard/returns/department-pending-return"}>
          <DashboardCard
            name="Total Pending Return"
            count={countData.pending_return.toString()}
            color="bg-cyan-500"
            subtitle="Total Pending Return count"
          >
            <Fa6RegularHourglassHalf className="text-xl text-white" />
          </DashboardCard>
        </Link>
      </div>
      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded shadow-sm border p-3">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Revenue Overview
            </h2>
            <p className="text-xs text-gray-500">
              Daily payment collection trends
            </p>
          </div>
          <div className="h-64">
            <Bar options={options} data={dataset} />
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded shadow-sm border p-3">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Payment Summary
            </h2>
            <p className="text-xs text-gray-500">Monthly comparison</p>
          </div>

          <div className="space-y-3">
            {/* This Month */}
            <div
              className={`p-2.5 rounded ${
                countData.last_month_received < countData.this_month_received
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-600">
                  {format(new Date(), "MMMM")}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    countData.last_month_received <
                    countData.this_month_received
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                ></div>
              </div>
              <p
                className={`text-base font-semibold ${
                  countData.last_month_received < countData.this_month_received
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                ₹{numberWithIndianFormat(countData.this_month_received)}
              </p>
            </div>

            {/* Last Month */}
            <div
              className={`p-2.5 rounded ${
                countData.last_month_received > countData.this_month_received
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-600">
                  {format(subMonths(new Date(), 1), "MMMM")}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    countData.last_month_received >
                    countData.this_month_received
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <p
                className={`text-base font-semibold ${
                  countData.last_month_received > countData.this_month_received
                    ? "text-emerald-600"
                    : "text-gray-600"
                }`}
              >
                ₹
                {numberWithIndianFormat(
                  isNegative(countData.last_month_received)
                    ? 0
                    : countData.last_month_received,
                )}
              </p>
            </div>

            {/* Difference */}
            <div className="p-2.5 rounded bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-600">
                  Net Change
                </span>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-base font-semibold text-blue-600">
                ₹
                {numberWithIndianFormat(
                  countData.this_month_received -
                    (isNegative(countData.last_month_received)
                      ? 0
                      : countData.last_month_received),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Revenue Analytics
            </h2>
            <p className="text-sm text-gray-500">
              Comprehensive revenue breakdown and insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-linear-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <span className="text-xs text-gray-500">Live Data</span>
          </div>
        </div>

        {/* Top Dealers Bar Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Top 10 Liquor Dealers Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Top 10 Liquor Dealers by Revenue
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Highest revenue contributing liquor dealers
                </p>
              </div>
              <div className="bg-linear-to-r from-purple-50 to-pink-50 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <Bar data={liquorDealersData} options={dealerBarOptions} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Dealers</span>
                <span className="font-medium text-gray-700">
                  {countData.liquoredealer} Active Dealers
                </span>
              </div>
            </div>
          </div>

          {/* Top 10 Fuel Dealers Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Top 10 Fuel Dealers by Revenue
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Highest revenue contributing fuel dealers
                </p>
              </div>
              <div className="bg-linear-to-r from-orange-50 to-red-50 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <Bar data={fuelDealersData} options={dealerBarOptions} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Dealers</span>
                <span className="font-medium text-gray-700">
                  {countData.fueldealer} Active Dealers
                </span>
              </div>
            </div>
          </div>
        </div>

        {!["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
          user?.role || "",
        ) && (
          <>
            {/* Top Row - District and Category Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* District-wise Revenue Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      District-wise Revenue (Last 30 Days)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Revenue distribution across regions
                    </p>
                  </div>
                  <div className="bg-linear-to-r from-blue-50 to-purple-50 p-2 rounded-lg">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-full h-full">
                    <Pie data={districtRevenueChartData} options={pieOptions} />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total Revenue</span>
                    <span className="font-medium text-gray-700">
                      ₹
                      {numberWithIndianFormat(
                        districtRevenueData?.totalRevenue || 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category-wise Revenue Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Category-wise Revenue (Last 30 Days)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Liquor vs Petroleum comparison
                    </p>
                  </div>
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 p-2 rounded-lg">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-full h-full">
                    <Pie data={categoryRevenueChartData} options={pieOptions} />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total Categories</span>
                    <span className="font-medium text-gray-700">
                      ₹
                      {numberWithIndianFormat(
                        categoryWiseData?.totalRevenue || 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom Row - Commodity Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Petroleum Commodities Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Top Petroleum Products
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Best selling petroleum commodities
                </p>
              </div>
              <div className="bg-linear-to-r from-orange-50 to-red-50 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {topFuelCommodities.length > 0 ? (
                <div className="w-full h-full">
                  <Pie
                    data={petroleumCommoditiesChartData}
                    options={pieOptions}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Products</span>
                <span className="font-medium text-gray-700">
                  {numberWithIndianFormat(
                    topFuelCommodities.reduce(
                      (sum, c) => sum + c.totalRevenue,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Top Liquor Commodities Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Top Liquor Products
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Best selling liquor commodities
                </p>
              </div>
              <div className="bg-linear-to-r from-green-50 to-teal-50 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {topLiquorCommodities.length > 0 ? (
                <div className="w-full h-full">
                  <Pie data={liquorCommoditiesChartData} options={pieOptions} />
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Products</span>
                <span className="font-medium text-gray-700">
                  {numberWithIndianFormat(
                    topLiquorCommodities.reduce(
                      (sum, c) => sum + c.totalRevenue,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OfficerDashboardPage;
