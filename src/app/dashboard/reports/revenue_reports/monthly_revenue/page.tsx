"use client";
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
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import Last15ReceivedReport from "@/action/report/last15receivedreport";
import OfficerDashboardReport from "@/action/report/officerdashboardreport";
import LastYearReceived from "@/action/report/lastyearreceivedreport";

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

  interface LastYearData {
    monthYear: string;
    amount: number;
  }

  const [lastYearData, setLastYearData] = useState<LastYearData[]>([]);
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

      const last15days = await LastYearReceived({
        selectOffice: city,
        selectCommodity: commoditydata,
      });

      if (last15days.status && last15days.data) {
        setLastYearData(last15days.data);
      }
    };
    init();
  }, [city, commoditydata]);

  const dataset: any = {
    labels: lastYearData
      .map((val: LastYearData) => format(new Date(val.monthYear), "MMM-yyyy"))
      ,
    datasets: [
      {
        label: "Received",
        data: lastYearData.map((val: LastYearData) => val.amount),
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

  const color = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-gray-500",
    "bg-indigo-500",
    "bg-lime-500",
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        {lastYearData.map((month, index) => (
          <DashboardCard
            key={index}
            name={month.monthYear}
            count={month.amount.toString()}
            color={color[index % color.length]}
          >
            <FluentMdl2Home className="text-xl text-white" />
          </DashboardCard>
        ))}
        {/* <DashboardCard
          name="Total Dealer"
          count={countData.totaldealer.toString()}
          color="bg-rose-500"
        >
          <Fa6RegularBuilding className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name={commoditydata == "FUEL" ? "Fuel Dealer" : "LiquorDealer"}
          count={
            commoditydata == "FUEL"
              ? countData.fueldealer.toString()
              : (countData.liquoredealer + countData.manufacturer).toString()
          }
          // count={`${countData.fueldealer}/${countData.liquoredealer}/${countData.manufacturer}`}
          color="bg-green-500"
        >
          <FluentMdl2Home className="text-xl text-white" />
        </DashboardCard>

        <DashboardCard
          name="Reg/Comp"
          count={`${countData.reg}/${countData.comp}`}
          color="bg-blue-500"
        >
          <MaterialSymbolsPersonRounded className="text-xl text-white" />
        </DashboardCard>

        <DashboardCard
          name="Today Received"
          count={numberWithIndianFormat(countData.today_received)}
          color="bg-orange-500"
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
          isruppy={true}
        >
          <RiMoneyRupeeCircleLine className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name="This Month Received"
          count={numberWithIndianFormat(countData.this_month_received)}
          color="bg-violet-500"
          isruppy={true}
        >
          <RiMoneyRupeeCircleLine className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name="Filed Return"
          count={countData.filed_return.toString()}
          color="bg-pink-500"
        >
          <IcOutlineReceiptLong className="text-xl text-white" />
        </DashboardCard>
        <DashboardCard
          name="Total Pending Return"
          count={countData.pending_return.toString()}
          color="bg-cyan-500"
        >
          <Fa6RegularHourglassHalf className="text-xl text-white" />
        </DashboardCard> */}
      </div>
      <div className="grid grid-cols-6 gap-2 mt-2">
        <div className="bg-white h-80 shadow-sm rounded-md p-4 col-span-6">
          {lastYearData.length > 0 && <Bar options={options} data={dataset} />}
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
  // subtitle: string;
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
          {/* <span className="text-xs text-gray-400">{props.subtitle}</span> */}
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
