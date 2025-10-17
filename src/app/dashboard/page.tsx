/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import DashboardMonth from "@/action/dashboard/dashboard";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";
import {
  Fa6RegularBuilding,
  Fa6RegularFileLines,
  Fa6RegularHourglassHalf,
  FluentChannelSubtract48Regular,
  FluentEmojiSad20Regular,
  FluentMdl2Home,
  FluentNotePin20Regular,
  FluentWalletCreditCard20Regular,
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import { Separator } from "@/components/ui/separator";

import { Chart as ChartJS, registerables } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { Bar, Pie } from "react-chartjs-2";

import numberWithIndianFormat, {
  due_date_of_month,
  formateDate,
  isNegative,
} from "@/utils/methods";

ChartJS.register(...registerables, ChartDataLabels);

enum FileStatus {
  FILED,
  NOTFILED,
}

import { dvat04, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OfficerDashboard from "@/action/dashboard/officerdashboard";
import Last15Received from "@/action/dashboard/last15received";
import { format, subMonths } from "date-fns";
import { Flex, Radio, RadioChangeEvent } from "antd";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";

const Page = () => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  const [month, setMonth] = useState<any[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  const [dvat, setDvat] = useState<dvat04 | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const userresponse = await GetUser({ id: id });
      if (userresponse.status) setUser(userresponse.data!);

      const dashboard = await DashboardMonth({
        userid: id,
      });

      if (dashboard.status && dashboard.data) {
        setMonth(dashboard.data);
      }

      const profile_response = await GetUserStatus({
        id: id,
      });
      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }

      const dvatdata = await GetUserDvat04Anx({
        userid: 1,
      });
      if (dvatdata.status && dvatdata.data) {
        setDvat(dvatdata.data);
      }
      setLoading(false);
    };

    init();
  }, [id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      {user?.role == "USER" ? (
        <>
          <main className="relative min-h-[calc(100vh-2.5rem)] bg-slate-50">
            <div className="pb-6 relative">
              <div className="mx-auto md:px-4 px-3 max-w-4xl py-4 relative">
                {/* Welcome Header */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold mb-2 text-slate-800">
                        Welcome, {user?.firstName ?? ""} {user?.lastName ?? ""}
                      </h1>
                      <p className="text-slate-600 text-base">VATSMART Portal Dashboard</p>
                      {dvat != null && dvat?.tinNumber && (
                        <div className="mt-3 inline-flex items-center bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">TIN: {dvat.tinNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex items-center">
                      <div className="bg-slate-100 p-3 rounded-xl">
                        <Fa6RegularBuilding className="text-2xl text-slate-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Returns Calendar Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Returns Calendar</h2>
                      <p className="text-slate-600 text-sm mt-1">Track your VAT return submissions</p>
                    </div>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                      {month.length} periods
                    </span>
                  </div>
                  {/* VAT Returns List */}
                  <div className="space-y-3">
                    {month.map((val: any, index: number) => (
                      <RentCard
                        key={index}
                        year={val.year.toString().substring(2)}
                        month={formateDate(
                          new Date(val.date.toString())
                        ).substring(3, 5)}
                        title={
                          val.month.toString().toUpperCase() +
                          "-" +
                          val.year.toString()
                        }
                        date={val.date}
                        status={val.completed ? "Filed" : "Not Filed"}
                        statusdate={val.completed ? "Filed On" : "Due Date"}
                        filestatus={
                          val.completed
                            ? FileStatus.FILED
                            : FileStatus.NOTFILED
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-slate-800">Quick Actions</h2>
                    <p className="text-slate-600 text-sm mt-1">Access key portal features</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ButtonCard
                      title="Return Dashboard"
                      icon={
                        <Fa6RegularFileLines className="text-slate-600 text-xl" />
                      }
                      link="/dashboard/returns/returns-dashboard"
                    />
                    <ButtonCard
                      title="Payment And Refunds"
                      icon={
                        <FluentWalletCreditCard20Regular className="text-slate-600 text-xl" />
                      }
                      link="/dashboard/payments"
                    />
                    <ButtonCard
                      title="Notice(s) and Order(s)"
                      icon={
                        <FluentNotePin20Regular className="text-slate-600 text-xl" />
                      }
                      link="/dashboard/notice-and-order"
                    />
                    <ButtonCard
                      title="Annual Return"
                      icon={
                        <FluentChannelSubtract48Regular className="text-slate-600 text-xl" />
                      }
                      link="/dashboard/returns/user-pending-return"
                    />
                  </div>
                </div>
              </div>

              {!isProfileCompletd && user?.role! == "USER" && (
                <div className="w-full h-full absolute top-0 left-0 bg-black bg-opacity-20 grid place-items-center backdrop-blur-sm">
                  <div className="bg-white w-72 rounded-lg overflow-hidden shadow-xl">
                    <div className="bg-rose-500 grid place-items-center py-6">
                      <FluentEmojiSad20Regular className="text-white text-5xl" />
                    </div>
                    <div className="p-4">
                      <h1 className="text-lg text-center font-medium text-gray-900 mb-2">
                        Profile Incomplete
                      </h1>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        Complete your profile to proceed.
                      </p>
                      <button
                        onClick={() => {
                          router.push("/dashboard/register");
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded font-medium transition-colors"
                      >
                        Complete Registration
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      ) : (
        <>
          <OfficerDashboardPage />
        </>
      )}
    </>
  );
};
export default Page;

interface RentCardProps {
  year: string;
  month: string;
  title: string;
  date: string;
  status: string;
  statusdate: string;
  filestatus: FileStatus;
}

const RentCard = (props: RentCardProps) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const getnextmonth = () => {
    const date: Date = new Date(props.date);
    const res: Date = new Date(
      date.setMonth(date.getMonth() + 1, due_date_of_month)
    );
    return formateDate(res);
  };
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold ${
              props.filestatus == FileStatus.FILED
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-amber-100 text-amber-700 border border-amber-200"
            }`}
          >
            <div className="text-center leading-tight">
              <div>{props.month}</div>
              <div>{props.year}</div>
            </div>
          </div>
          {props.filestatus == FileStatus.FILED && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Return Info */}
        <div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">{props.title}</h3>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${
                props.filestatus == FileStatus.FILED
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {props.status}
            </span>
            <span className="text-sm text-slate-600">
              {props.statusdate}: {" "}
              <span className="font-medium text-slate-800">
                {props.filestatus == FileStatus.FILED
                  ? formateDate(new Date(props.date))
                  : getnextmonth()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/dashboard/returns/returns-dashboard?month=${
          monthNames[parseInt(props.month) - 1]
        }&year=${new Date(props.date).getFullYear()}`}
        className="text-sm px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium"
      >
        Open
      </Link>
    </div>
  );
};

interface ButtonCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
}

const ButtonCard = (props: ButtonCardProps) => {
  return (
    <Link href={props.link} className="group">
      <div className="bg-white hover:bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
            {props.icon}
          </div>
          <svg 
            className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors mb-1">
          {props.title}
        </h3>
        <p className="text-sm text-slate-600">
          Access {props.title.toLowerCase()}
        </p>
      </div>
    </Link>
  );
};

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
          <p className="text-xs font-medium text-gray-600 mb-0.5">{props.name}</p>
          <div>
            {props.isruppy ? (
              <p className="text-base font-semibold text-gray-900">₹{props.count}</p>
            ) : (
              <p className="text-base font-semibold text-gray-900">{props.count}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{props.subtitle}</p>
          </div>
        </div>
        <div className={`rounded p-1.5 ${props.color}`}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

// Pie Chart Data and Options
const pieOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000,
  },
  elements: {
    arc: {
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBorderWidth: 4,
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 11,
          weight: '500',
        },
        padding: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        boxHeight: 8,
        color: '#374151',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12,
      titleFont: {
        size: 13,
        weight: 'bold',
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        label: function (context: any) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ₹${numberWithIndianFormat(value)} (${percentage}%)`;
        },
      },
    },
    datalabels: {
      display: true,
      color: '#374151',
      font: {
        size: 11,
        weight: 'bold',
      },
      formatter: function (value: number, context: any) {
        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        return percentage + '%';
      },
      anchor: 'end',
      align: 'end',
      offset: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 6,
      padding: {
        top: 3,
        bottom: 3,
        left: 6,
        right: 6,
      },
      textShadowColor: 'transparent',
      textShadowBlur: 0,
    },
  },
};

// Sample data for District-wise Revenue
const districtRevenueData = {
  labels: ['Dadra & Nagar Haveli', 'Daman', 'Diu'],
  datasets: [
    {
      data: [4500000, 3200000, 1800000],
      backgroundColor: [
        '#667eea', // Purple Blue
        '#f093fb', // Pink
        '#4facfe'  // Light Blue
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBackgroundColor: [
        '#5a67d8',
        '#e53e3e',
        '#3182ce'
      ],
      hoverBorderWidth: 4,
    },
  ],
};

// Sample data for Category-wise Revenue
const categoryRevenueData = {
  labels: ['Liquor', 'Petroleum'],
  datasets: [
    {
      data: [5800000, 3700000],
      backgroundColor: [
        '#a8edea', // Light Teal
        '#ffecd2'  // Light Peach
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBackgroundColor: [
        '#805ad5',
        '#dd6b20'
      ],
      hoverBorderWidth: 4,
    },
  ],
};

// Sample data for Top Petroleum Commodities  
const petroleumCommoditiesData = {
  labels: ['Petrol', 'Diesel', 'CNG', 'PNG', 'Additives'],
  datasets: [
    {
      data: [1500000, 1200000, 800000, 600000, 300000],
      backgroundColor: [
        '#FF6B6B', // Coral Red
        '#4ECDC4', // Teal
        '#45B7D1', // Sky Blue
        '#96CEB4', // Mint Green
        '#FFEAA7'  // Light Yellow
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBackgroundColor: [
        '#ff5252',
        '#26c6da',
        '#42a5f5',
        '#66bb6a',
        '#ffcc02'
      ],
      hoverBorderWidth: 4,
    },
  ],
};

// Sample data for Top Liquor Commodities
const liquorCommoditiesData = {
  labels: ['Beer', 'Wine', 'Whiskey', 'Rum', 'Vodka'],
  datasets: [
    {
      data: [2200000, 1800000, 1500000, 800000, 500000],
      backgroundColor: [
        '#A8E6CF', // Mint
        '#DDA0DD', // Plum
        '#F4A460', // Sandy Brown
        '#87CEEB', // Sky Blue
        '#FFB6C1'  // Light Pink
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBackgroundColor: [
        '#7ed321',
        '#9013fe',
        '#f5a623',
        '#50e3c2',
        '#ff6b9d'
      ],
      hoverBorderWidth: 4,
    },
  ],
};

// Bar Chart Options for Dealer Charts
const dealerBarOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // Horizontal bars
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#e5e7eb',
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
        callback: function(value: any) {
          return '₹' + numberWithIndianFormat(value);
        },
      },
      grid: {
        color: '#f3f4f6',
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

// Sample data for Top 10 Liquor Dealers (10 dealers from each district)
const liquorDealersData = {
  labels: [
    // Dadra & Nagar Haveli - Top liquor dealers
    'ABC Liquors (DNH)', 'Premium Spirits (DNH)', 'Royal Wine Shop (DNH)', 
    // Daman - Top liquor dealers  
    'Daman Beverages (DD)', 'Ocean View Liquors (DD)', 'Coastal Spirits (DD)',
    // Diu - Top liquor dealers
    'Island Wines (DIU)', 'Sunset Liquors (DIU)', 'Beach Bar Supplies (DIU)',
    'Heritage Spirits (DNH)'
  ],
  datasets: [
    {
      label: 'Revenue',
      data: [2800000, 2650000, 2400000, 2200000, 2100000, 1950000, 1800000, 1750000, 1600000, 1500000],
      backgroundColor: [
        '#8B5CF6', '#A855F7', '#9333EA', // DNH - Purple shades
        '#3B82F6', '#2563EB', '#1D4ED8', // Daman - Blue shades  
        '#10B981', '#059669', '#047857', '#6366F1' // Diu - Green shades + extra
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
      borderRadius: 6,
    },
  ],
};

// Sample data for Top 10 Fuel Dealers (10 dealers from each district)
const fuelDealersData = {
  labels: [
    // Dadra & Nagar Haveli - Top fuel dealers
    'Highway Petrol (DNH)', 'City Fuel Station (DNH)', 'Express Petroleum (DNH)',
    // Daman - Top fuel dealers
    'Coastal Fuels (DD)', 'Port City Petrol (DD)', 'Marine Gas Station (DD)',
    // Diu - Top fuel dealers  
    'Island Petroleum (DIU)', 'Beach Fuel Stop (DIU)', 'Tropical Gas (DIU)',
    'Green Energy (DNH)'
  ],
  datasets: [
    {
      label: 'Revenue',
      data: [3200000, 3050000, 2900000, 2750000, 2600000, 2450000, 2300000, 2150000, 2000000, 1850000],
      backgroundColor: [
        '#F59E0B', '#D97706', '#B45309', // DNH - Amber shades
        '#EF4444', '#DC2626', '#B91C1C', // Daman - Red shades
        '#06B6D4', '#0891B2', '#0E7490', '#F97316' // Diu - Cyan shades + extra
      ],
      borderColor: '#ffffff', 
      borderWidth: 2,
      borderRadius: 6,
    },
  ],
};

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
    "Dadra_Nagar_Haveli"
  );

  useEffect(() => {
    const init = async () => {
      const count_data_response = await OfficerDashboard({
        selectOffice: city,
      });
      if (count_data_response.status && count_data_response.data) {
        setCountData(count_data_response.data);
      }

      const last15days = await Last15Received({
        selectOffice: city,
      });
      if (last15days.status && last15days.data) {
        setLast15Day(last15days.data);
      }
    };
    init();
  }, [city]);

  const dataset: any = {
    labels: last15Day
      .map((val: Last15DayData) => format(val.date, "dd MMM"))
      .reverse(),
    datasets: [
      {
        label: "Receivable",
        data: last15Day.map((val: Last15DayData) => val.amount).reverse(),
        backgroundColor: "#95acbe",
        borderWidth: 0,
        barPercentage: 0.6,
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
    <main className="p-3 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">Officer Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">Monitor and manage VAT operations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Select Region</p>
                <Radio.Group
                  options={citys}
                  size="small"
                  value={city}
                  onChange={onCityChange}
                  defaultValue="DNH"
                  optionType="button"
                  buttonStyle="solid"
                />
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
              : countData.last_month_received
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
            <h2 className="text-sm font-medium text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-500">Daily payment collection trends</p>
          </div>
          <div className="h-64">
            <Bar options={options} data={dataset} />
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded shadow-sm border p-3">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">Payment Summary</h2>
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
                <div className={`w-2 h-2 rounded-full ${
                  countData.last_month_received < countData.this_month_received
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}></div>
              </div>
              <p className={`text-base font-semibold ${
                countData.last_month_received < countData.this_month_received
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}>
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
                <div className={`w-2 h-2 rounded-full ${
                  countData.last_month_received > countData.this_month_received
                    ? "bg-emerald-500"
                    : "bg-gray-400"
                }`}></div>
              </div>
              <p className={`text-base font-semibold ${
                countData.last_month_received > countData.this_month_received
                  ? "text-emerald-600"
                  : "text-gray-600"
              }`}>
                ₹{numberWithIndianFormat(
                  isNegative(countData.last_month_received)
                    ? 0
                    : countData.last_month_received
                )}
              </p>
            </div>

            {/* Difference */}
            <div className="p-2.5 rounded bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-600">Net Change</span>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-base font-semibold text-blue-600">
                ₹{numberWithIndianFormat(
                  countData.this_month_received -
                    (isNegative(countData.last_month_received)
                      ? 0
                      : countData.last_month_received)
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
            <h2 className="text-lg font-semibold text-gray-900">Revenue Analytics</h2>
            <p className="text-sm text-gray-500">Comprehensive revenue breakdown and insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
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
                <p className="text-xs text-gray-500 mt-1">Highest revenue contributing liquor dealers</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <Bar data={liquorDealersData} options={dealerBarOptions} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Dealers</span>
                <span className="font-medium text-gray-700">30 Active Dealers</span>
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
                <p className="text-xs text-gray-500 mt-1">Highest revenue contributing fuel dealers</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <Bar data={fuelDealersData} options={dealerBarOptions} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Dealers</span>
                <span className="font-medium text-gray-700">30 Active Dealers</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Row - District and Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* District-wise Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  District-wise Revenue
                </h3>
                <p className="text-xs text-gray-500 mt-1">Revenue distribution across regions</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full">
                <Pie data={districtRevenueData} options={pieOptions} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Revenue</span>
                <span className="font-medium text-gray-700">₹{numberWithIndianFormat(9500000)}</span>
              </div>
            </div>
          </div>

          {/* Category-wise Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Category-wise Revenue
                </h3>
                <p className="text-xs text-gray-500 mt-1">Liquor vs Petroleum comparison</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full">
                <Pie data={categoryRevenueData} options={pieOptions} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Categories</span>
                <span className="font-medium text-gray-700">₹{numberWithIndianFormat(9500000)}</span>
              </div>
            </div>
          </div>
        </div>

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
                <p className="text-xs text-gray-500 mt-1">Best selling petroleum commodities</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full">
                <Pie data={petroleumCommoditiesData} options={pieOptions} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Products</span>
                <span className="font-medium text-gray-700">₹{numberWithIndianFormat(4400000)}</span>
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
                <p className="text-xs text-gray-500 mt-1">Best selling liquor commodities</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full">
                <Pie data={liquorCommoditiesData} options={pieOptions} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Products</span>
                <span className="font-medium text-gray-700">₹{numberWithIndianFormat(6800000)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
