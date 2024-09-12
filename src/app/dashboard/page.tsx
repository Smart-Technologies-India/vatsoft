"use client";

import DashboardMonth from "@/action/dashboard/dashboard";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";
import {
  Fa6RegularFileLines,
  FluentChannelSubtract48Regular,
  FluentEmojiSad20Regular,
  FluentNotePin20Regular,
  FluentWalletCreditCard20Regular,
  LucideArrowRight,
} from "@/components/icons";

import { formateDate } from "@/utils/methods";

enum FileStatus {
  FILED,
  NOTFILED,
}

import { user } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const router = useRouter();
  const [user, setUser] = useState<user>();
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
      <main className="relative min-h-[calc(100vh-2.5rem)]">
        <div className="pb-10 relative">
          <div className="mx-auto px-4  w-4/6 py-6 relative">
            <div className="bg-white p-4 rounded-xl">
              <h1 className="text-sm font-semibold font-nunito leading-3">
                Welcome {user?.firstName ?? ""} {user?.lastName ?? ""} To
                VATSOFT Portal
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
                        val.completed ? FileStatus.FILED : FileStatus.NOTFILED
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 mt-2 gap-2">
              <ButtonCard
                title="Return Dashboard"
                icon={<Fa6RegularFileLines className="text-blue-500 text-lg" />}
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
                  Your profile is incomplete, Kindly complete your profile in
                  order to proceed.
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
    const res: Date = new Date(date.setMonth(date.getMonth() + 1, 10));
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
