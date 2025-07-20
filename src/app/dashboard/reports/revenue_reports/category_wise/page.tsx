"use client";
import Last15Received from "@/action/dashboard/last15received";
import OfficerDashboard from "@/action/dashboard/officerdashboard";
import {
  Fa6RegularBuilding,
  Fa6RegularHourglassHalf,
  FluentMdl2Home,
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import numberWithIndianFormat, { isNegative } from "@/utils/methods";
import { Radio, RadioChangeEvent } from "antd";
import { format, subMonths } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Separator } from "@/components/ui/separator";
import { Chart as ChartJS, registerables } from "chart.js";
import Last15ReceivedReport from "@/action/report/last15receivedreport";
import OfficerDashboardReport from "@/action/report/officerdashboardreport";

ChartJS.register(...registerables);

const CategoryWiseReport = () => {
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

  const [commoditydata, setCommoditydata] = useState<"FUEL" | "LIQUOR">("FUEL");

  useEffect(() => {
    const init = async () => {
      const count_data_response = await OfficerDashboardReport({
        selectOffice: city,
        selectCommodity: commoditydata,
      });
      if (count_data_response.status && count_data_response.data) {
        setCountData(count_data_response.data);
      }

      const last15days = await Last15ReceivedReport({
        selectOffice: city,
        selectCommodity: commoditydata,
      });
      if (last15days.status && last15days.data) {
        setLast15Day(last15days.data);
      }
    };
    init();
  }, [city, commoditydata]);

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

  const onCommodityChange = (e: RadioChangeEvent) => {
    setCommoditydata(e.target.value);
  };

  const citys = [
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  const commodity = [
    { label: "FUEL", value: "FUEL" },
    { label: "LIQUOR", value: "LIQUOR" },
  ];

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="w-96 my-2 ">
          <Radio.Group
            block
            options={citys}
            size="small"
            value={city}
            onChange={onCityChange}
            defaultValue="DNH"
            optionType="button"
            buttonStyle="solid"
          />
        </div>
        <div className="grow"></div>
        <div className="w-80 my-2">
          <Radio.Group
            block
            options={commodity}
            size="small"
            value={commoditydata}
            onChange={onCommodityChange}
            defaultValue="FUEL"
            optionType="button"
            buttonStyle="solid"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
            name={commoditydata == "FUEL" ? "Fuel Dealer" : "LiquorDealer"}
            count={
              commoditydata == "FUEL"
                ? countData.fueldealer.toString()
                : (countData.liquoredealer + countData.manufacturer).toString()
            }
            // count={`${countData.fueldealer}/${countData.liquoredealer}/${countData.manufacturer}`}
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
      <div className="grid grid-cols-6 gap-2 mt-2">
        <div className="bg-white h-80 shadow-sm rounded-md p-4 col-span-6 lg:col-span-4">
          {last15Day.length > 0 && <Bar options={options} data={dataset} />}
        </div>
        <div className="bg-white h-80 shadow-sm rounded-md p-4 col-span-6 lg:col-span-2 flex flex-col">
          <h1>Current Month Received Information</h1>
          <Separator className="shrink-0" />
          <div className="grow"></div>
          <div
            className={`${
              countData.last_month_received < countData.this_month_received
                ? "bg-emerald-500 text-emerald-500"
                : "bg-rose-500 text-rose-500"
            } p-2 bg-opacity-10 `}
          >
            <h1 className="text-2xl">
              {numberWithIndianFormat(countData.this_month_received)}
            </h1>
            <p className="text-sm">
              Payment Received in {format(new Date(), "MMMM")}
            </p>
          </div>
          <div className="grow"></div>

          <div
            className={`${
              countData.last_month_received > countData.this_month_received
                ? "bg-emerald-500 text-emerald-500"
                : "bg-rose-500 text-rose-500"
            } p-2 bg-opacity-10`}
          >
            <h1 className="text-2xl">
              {numberWithIndianFormat(
                isNegative(countData.last_month_received)
                  ? 0
                  : countData.last_month_received
              )}
            </h1>
            <p className="text-sm">
              Payment Received in {format(subMonths(new Date(), 1), "MMMM")}
            </p>
          </div>
          <div className="grow"></div>
          <div className={`bg-gray-500 p-2 bg-opacity-10 text-gray-500`}>
            <h1 className="text-2xl text-gray-500">
              {numberWithIndianFormat(
                countData.this_month_received -
                  (isNegative(countData.last_month_received)
                    ? 0
                    : countData.last_month_received)
              )}
            </h1>
            <p className="text-sm">Total Payment in period</p>
          </div>

          <div className="grow"></div>
        </div>
      </div>
    </main>
  );
};

export default CategoryWiseReport;

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
    <div className="bg-white shadow-sm rounded-md">
      <h1 className="text-sm text-gray-500 p-1 px-2">{props.name}</h1>
      <div className="w-full h-[1px] bg-gray-200"></div>
      <div className="flex gap-2 items-center px-2">
        <div className="grid place-items-start my-2">
          {props.isruppy ? (
            <p className="text-xl text-gray-600">&#8377;{props.count}</p>
          ) : (
            <p className="text-xl text-gray-600">{props.count}</p>
          )}
          <span className="text-xs text-gray-400">{props.subtitle}</span>
        </div>
        <div className="grow"></div>
        <div>
          <div
            className={`rounded-full p-2 h-10 w-10 grid place-items-center ${props.color}`}
          >
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
};
