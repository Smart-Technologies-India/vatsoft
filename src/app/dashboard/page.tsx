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
  LucideArrowRight,
  MaterialSymbolsPersonRounded,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import ProgressBar from "@ramonak/react-progress-bar";

import { Chart as ChartJS, registerables } from "chart.js";
import { Bar } from "react-chartjs-2";

import numberWithIndianFormat, { formateDate } from "@/utils/methods";

ChartJS.register(...registerables);

enum FileStatus {
  FILED,
  NOTFILED,
}

import { user } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const Page = () => {
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        barThickness: 10,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
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
        borderWidth: 2,
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

  const dataset: any = {
    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    datasets: [
      {
        label: "Receivable",
        data: [46, 34, 45, 36, 84, 34, 24, 34, 45, 36, 84, 34],
        backgroundColor: "#95acbe",
        borderWidth: 0,
      },
      {
        label: "Received",
        data: [52, 83, 63, 45, 34, 36, 34, 36, 84, 34, 24, 34],
        backgroundColor: "#31363f",
        borderWidth: 0,
      },
    ],
  };
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  const [month, setMonth] = useState<any[]>([]);

  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
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
    };

    init();
  }, [id]);

  return (
    <>
      {user?.role == "USER" ? (
        <>
          <main className="relative min-h-[calc(100vh-2.5rem)]">
            <div className="pb-10 relative">
              <div className="mx-auto px-4  w-4/6 py-6 relative">
                <div className="bg-white p-4 rounded-xl">
                  <h1 className="text-sm font-semibold font-nunito leading-3">
                    Welcome {user?.firstName ?? ""} {user?.lastName ?? ""} To
                    VATSMART Portal
                  </h1>
                  <h1 className="text-xs leading-3 text-gray-500 mt-1">
                    Returns Calender (Last 6 return periods)
                  </h1>
                </div>

                {/* second section start from here */}
                <div className="w-full mt-2">
                  <div className="flex w-full gap-2">
                    <div className="flex-1 rounded-xl">
                      <div className="flex items-center px-4">
                        <div className="text-sm font-semibold font-nunito leading-3 py-1 w-full text-gray-500  rounded-xl">
                          VAT
                        </div>
                        <div className="glow"></div>
                        <LucideArrowRight className="text-xl text-blue-500" />
                      </div>
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
                </div>

                <div className="grid grid-cols-4 mt-2 gap-2">
                  <ButtonCard
                    title="Return Dashboard"
                    icon={
                      <Fa6RegularFileLines className="text-blue-500 text-lg" />
                    }
                    link="/dashboard/returns/returns-dashboard"
                  />
                  <ButtonCard
                    title="Payment And Refunds"
                    icon={
                      <FluentWalletCreditCard20Regular className="text-blue-500 text-lg" />
                    }
                    link="/dashboard/payments"
                  />
                  <ButtonCard
                    title="Notice(s) and Order(s)"
                    icon={
                      <FluentNotePin20Regular className="text-blue-500 text-lg" />
                    }
                    link="/dashboard/notice-and-order"
                  />
                  <ButtonCard
                    title="Annual Return"
                    icon={
                      <FluentChannelSubtract48Regular className="text-blue-500 text-lg" />
                    }
                    link="/dashboard/annual-return"
                  />
                </div>
              </div>
            </div>

            {!isProfileCompletd && user?.role! == "USER" && (
              <div className="w-full h-full absolute top-0 left-0 bg-black  bg-opacity-20 grid place-items-center bg-clip-padding backdrop-filter backdrop-blur-sm">
                <div className=" bg-white w-60">
                  <div className="bg-rose-500 grid place-items-center py-6">
                    <FluentEmojiSad20Regular className="text-white text-7xl" />
                  </div>
                  <div className="p-2">
                    <h1 className="text-lg text-center">Profile Incomplete </h1>
                    <p className="text-xs">
                      Your profile is incomplete, Kindly complete your profile
                      in order to proceed.
                    </p>
                    <button
                      onClick={() => {
                        router.push("/dashboard/register");
                      }}
                      className="w-full bg-blue-500 text-white text-sm py-1 rounded-md mt-2"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      ) : (
        <>
          <main className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <DashboardCard
                name="Total Dealer"
                count={"156"}
                color="bg-rose-500"
                subtitle="Total Dealer Count"
              >
                <Fa6RegularBuilding className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Fuel Dealer"
                count={"72"}
                color="bg-green-500"
                subtitle="Fuel Dealer Count"
              >
                <FluentMdl2Home className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Liquor Dealer"
                count={"84"}
                color="bg-orange-500"
                subtitle="Liquor Dealer Count"
              >
                <RiAuctionLine className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Reg/Comp"
                count={"132/24"}
                color="bg-blue-500"
                subtitle="Reg/Comp Count"
              >
                <MaterialSymbolsPersonRounded className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Last Month Received"
                count={numberWithIndianFormat(274354749)}
                color="bg-teal-500"
                subtitle="Total Tax Received"
                isruppy={true}
              >
                <RiMoneyRupeeCircleLine className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="This Month Received"
                count={numberWithIndianFormat(294393832)}
                color="bg-violet-500"
                subtitle="Total Tax Received"
                isruppy={true}
              >
                <RiMoneyRupeeCircleLine className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Filed Return"
                count={"112"}
                color="bg-pink-500"
                subtitle="Successful Return"
              >
                <IcOutlineReceiptLong className="text-xl text-white" />
              </DashboardCard>
              <DashboardCard
                name="Pending Return"
                count={"44"}
                color="bg-cyan-500"
                subtitle="Pending Return"
              >
                <Fa6RegularHourglassHalf className="text-xl text-white" />
              </DashboardCard>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-2">
              <div className="bg-white h-80 shadow-sm rounded-md p-4 col-span-6 lg:col-span-4">
                <Bar options={options} data={dataset} />
              </div>
              <div className="bg-white h-80 shadow-sm rounded-md p-4 col-span-6 lg:col-span-2 flex flex-col">
                <h1>Current Month Rent Information</h1>
                <Separator className="shrink-0" />
                <div className="grow"></div>
                <h1 className="text-2xl text-gray-500">
                  {numberWithIndianFormat(274354749)}
                </h1>
                <div className="flex gap-2 text-gray-500 text-xs">
                  <p>Tax Received September</p>
                  <div className="grow"></div>
                </div>
                <ProgressBar
                  className="my-2"
                  completed={numberWithIndianFormat(274354749)}
                  bgColor={"#22c55e"}
                  baseBgColor="#eeeeee"
                  borderRadius="4px"
                  labelSize="10px"
                  height="8px"
                  isLabelVisible={false}
                />
                <div className="grow"></div>
                <h1 className="text-2xl text-gray-500">
                  {numberWithIndianFormat(294393832)}
                </h1>
                <div className="flex gap-2 text-gray-500 text-xs">
                  <p>Tax Received August</p>
                  <div className="grow"></div>
                </div>
                <ProgressBar
                  className="my-2"
                  completed={numberWithIndianFormat(294393832)}
                  bgColor={"#f43f5e"}
                  baseBgColor="#eeeeee"
                  borderRadius="4px"
                  labelSize="10px"
                  height="8px"
                  isLabelVisible={false}
                />
                <div className="grow"></div>

                <h1 className="text-2xl text-gray-500">902834</h1>
                <div className="flex gap-2 text-gray-500 text-xs">
                  <p>Total Payment in period</p>
                  <div className="grow"></div>
                  {/* <p>
                    {getpercentage(
                      monthinfo.collect - monthinfo.total,
                      monthinfo.lastmonthcollect - monthinfo.lastmonthtotal
                    )}
                  </p> */}
                </div>
                {/* <ProgressBar
                  className="my-2"
                  completed={20}
                  bgColor="#f43f5e"
                  baseBgColor="#eeeeee"
                  borderRadius="4px"
                  labelSize="10px"
                  height="8px"
                  isLabelVisible={false}
                /> */}
                <div className="grow"></div>
              </div>
            </div>
          </main>
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
  const getnextmonth = () => {
    const date: Date = new Date(props.date);
    const res: Date = new Date(date.setMonth(date.getMonth() + 1, 28));
    return formateDate(res);
  };
  return (
    <div className="flex w-full my-2 px-3 py-1 rounded-md items-center gap-2 bg-white justify-between ">
      <div className="flex gap-2 items-center">
        <div
          className={`h-10 w-1 rounded-sm ${
            props.filestatus == FileStatus.FILED ? "bg-teal-500" : "bg-rose-500"
          }`}
        ></div>

        {props.filestatus == FileStatus.FILED ? (
          <>
            <div className="leading-3 w-8 h-8 rounded-full bg-teal-500 bg-opacity-30 text-teal-500 grid place-items-center text-[0.7rem] font-medium tracking-wider">
              {props.month}
              <br />
              {props.year}
            </div>
          </>
        ) : (
          <>
            <div className="leading-3 w-8 h-8 rounded-full bg-rose-500 bg-opacity-30 text-rose-500 grid place-items-center text-[0.7rem] font-medium tracking-wider">
              {props.month}
              <br />
              {props.year}
            </div>
          </>
        )}
        <h1 className="text-xs font-semibold font-nunito leading-3">
          {props.title}
        </h1>
      </div>

      <p className="text-xs font-normal text-gray-600 font-nunito leading-3 mt-1 w-16 text-center">
        {props.status}
      </p>
      <div className="w-20 ">
        <h1 className="text-xs font-semibold font-nunito leading-3">
          {props.statusdate}
        </h1>
        <p className="text-xs font-normal text-gray-600 font-nunito leading-3 mt-1">
          {props.filestatus == FileStatus.FILED
            ? formateDate(new Date(props.date))
            : getnextmonth()}
        </p>
      </div>
      <Link
        href={"/dashboard/returns/returns-dashboard"}
        className="text-xs rounded px-4 py-1 border border-blue-500 text-blue-500 font-nunito"
      >
        View
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
    <div className="bg-white p-2  rounded-xl">
      <div className="flex  items-center gap-2">
        <div className="shrink-0 h-6 w-6 bg-blue-500 bg-opacity-30 rounded-full grid place-items-center text-white">
          {props.icon}
        </div>
        <h1 className="text-xs leading-3 text-gray-500">{props.title}</h1>
      </div>

      <Link
        href={props.link}
        className="text-xs inline-block text-center text-white bg-blue-500 rounded-md w-full py-1 font-nunito mt-2"
      >
        View
      </Link>
    </div>
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
