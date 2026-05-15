"use client";

import {
  Fa6RegularFileLines,
  Fa6RegularHourglassHalf,
  FluentChannelSubtract48Regular,
  FluentEmojiSad20Regular,
  FluentNotePin20Regular,
  FluentWalletCreditCard20Regular,
  IcOutlineReceiptLong,
} from "@/components/icons";

enum FileStatus {
  FILED,
  NOTFILED,
}

import {
  due_date_of_month,
  formateDate,
  encryptURLData,
} from "@/utils/methods";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DashboardMonth from "@/action/dashboard/dashboard";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import CheckFirstStock from "@/action/firststock/checkfirststock";
import GetPendingAcceptCount from "@/action/stock/getpendingacceptcount";
import GetFromDvat from "@/action/registration/getfromdvat";
import { dvat04, user } from "@prisma/client";
import { useRouter } from "next/navigation";

const UserDashboard = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
  const [month, setMonth] = useState<any[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);
  const [hasFirstStock, setHasFirstStock] = useState<boolean>(false);
  const [pendingAcceptCount, setPendingAcceptCount] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const userresponse = await GetUser({ id: authResponse.data });
      if (userresponse.status) setUser(userresponse.data!);

      const dashboard = await DashboardMonth();

      if (dashboard.status && dashboard.data) {
        setMonth(dashboard.data);
      }

      const profile_response = await GetUserStatus({
        id: authResponse.data,
      });

      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }

      const dvatdata = await GetUserDvat04Anx({});
      if (dvatdata.status && dvatdata.data) {
        setDvat(dvatdata.data);

        // Check if first_stock entries exist for this dvat
        const firstStockResponse = await CheckFirstStock({
          dvatid: dvatdata.data.id,
        });
        if (firstStockResponse.status && firstStockResponse.data !== null) {
          setHasFirstStock(firstStockResponse.data);
        }

        const pendingCountResponse = await GetPendingAcceptCount({
          dvatid: dvatdata.data.id,
        });
        if (pendingCountResponse.status) {
          setPendingAcceptCount(pendingCountResponse.data);
        }
      }
      setLoading(false);
    };

    init();
  }, [userid, router]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main
        className={`relative bg-gray-50 overflow-hidden ${
          !isProfileCompletd ? "h-[calc(100vh-2.5rem)]" : ""
        }`}
      >
        <div className="p-3 relative h-full">
          <div className="mx-auto max-w-4xl lg:max-w-full relative lg:grid lg:grid-cols-12 lg:gap-3">
            {/* Welcome Header */}
            <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3 lg:mb-0 lg:col-span-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    Welcome, {dvat?.tradename}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    VATSMART Portal Dashboard
                  </p>
                  {dvat != null && dvat?.tinNumber && (
                    <div className="mt-1.5 inline-flex items-center bg-gray-100 px-2.5 py-1 rounded">
                      <span className="text-xs font-medium text-gray-700">
                        TIN: {dvat.tinNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Returns Calendar Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 lg:mb-0 lg:col-span-9">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">
                    Returns Calendar
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Track your VAT return submissions
                  </p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                  {month.length} periods
                </span>
              </div>
              {/* VAT Returns List */}
              <div className="grid lg:grid-cols-2 gap-3">
                {month.map((val: any, index: number) => (
                  <RentCard
                    key={index}
                    year={val.year.toString().substring(2)}
                    month={formateDate(new Date(val.date.toString())).substring(
                      3,
                      5,
                    )}
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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 lg:col-span-3">
              <div className="mb-2">
                <h2 className="text-sm font-medium text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <ButtonCard
                  title="Purchase"
                  icon={
                    <IcOutlineReceiptLong className="text-slate-600 text-xl" />
                  }
                  link="/dashboard/stock/view_purchase"
                  badge={
                    pendingAcceptCount > 0 ? pendingAcceptCount : undefined
                  }
                />
                <ButtonCard
                  title="Sale"
                  icon={
                    <IcOutlineReceiptLong className="text-slate-600 text-xl" />
                  }
                  link="/dashboard/stock/view_sale"
                />
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
                  link="/dashboard/user_service/notice_order"
                />
                <ButtonCard
                  title="Notifications"
                  icon={
                    <FluentChannelSubtract48Regular className="text-slate-600 text-xl" />
                  }
                  link="/dashboard/notifications"
                />
                {pendingAcceptCount > 0 && (
                  <div className="col-span-2 bg-red-400/50 rounded-lg border border-red-500 text-red-500 text-center text-sm font-medium px-3 py-2">
                    {pendingAcceptCount} pending purchase(s) need your
                    acceptance. Please review and accept them to ensure accurate
                    records and compliance. You can find these in the Daily
                    Purchase section.
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isProfileCompletd && user?.role! == "USER" && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                {/* Header Section */}
                <div
                  className={`${
                    dvat!.status == "PENDINGPROCESSING"
                      ? "bg-linear-to-r from-amber-500 to-orange-500"
                      : "bg-linear-to-r from-rose-500 to-pink-500"
                  } px-6 py-8 text-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-4 shadow-lg">
                      {dvat!.status == "PENDINGPROCESSING" ? (
                        <Fa6RegularHourglassHalf className="text-white text-4xl animate-pulse" />
                      ) : (
                        <FluentEmojiSad20Regular className="text-white text-4xl" />
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {dvat!.status == "PENDINGPROCESSING"
                        ? "Add Stock"
                        : "Action Required"}
                    </h1>
                    <p className="text-white/90 text-sm font-medium">
                      {dvat!.status == "PENDINGPROCESSING"
                        ? "Registration Processing"
                        : "Complete Your Profile"}
                    </p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div
                    className={`${
                      dvat!.status == "PENDINGPROCESSING"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-rose-50 border-rose-200"
                    } border rounded-xl p-4 mb-6`}
                  >
                    <p className="text-slate-700 text-sm leading-relaxed text-center">
                      {dvat!.status == "PENDINGPROCESSING"
                        ? "Your registration has been submitted. You may add stock now."
                        : "Your profile is incomplete. Please complete your registration to access all portal features and services."}
                    </p>
                  </div>

                  {dvat!.status == "PENDINGPROCESSING" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-green-600 font-semibold">
                            ✓
                          </span>
                        </div>
                        <span>Application Submitted</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div
                          className={`w-8 h-8 ${
                            hasFirstStock ? "bg-green-100" : "bg-amber-100"
                          } rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <span
                            className={`${
                              hasFirstStock
                                ? "text-green-600"
                                : "text-amber-600"
                            } font-semibold`}
                          >
                            {hasFirstStock ? "✓" : "2"}
                          </span>
                        </div>
                        <span>Opening Stock</span>
                        <div className="grow"></div>
                        {!hasFirstStock && (
                          <button
                            className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40"
                            onClick={() => {
                              router.push("/dashboard/register/add-stock");
                            }}
                          >
                            Add Stock
                          </button>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-3 text-sm ${
                          hasFirstStock ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 ${
                            hasFirstStock ? "bg-blue-100" : "bg-slate-100"
                          } rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <span
                            className={`${
                              hasFirstStock ? "text-blue-600" : "text-slate-400"
                            } font-semibold`}
                          >
                            3
                          </span>
                        </div>
                        <span>Approval pending</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        // Get the current dvat first
                        if (dvat) {
                          // Check if dvat status is VERIFICATION
                          if (dvat.status === "VERIFICATION") {
                            // Get the dvat registration
                            const registrationResponse = await GetFromDvat({
                              id: dvat.id,
                            });
                            if (
                              registrationResponse.status &&
                              registrationResponse.data
                            ) {
                              router.push(
                                `/dashboard/new-registration/${encryptURLData(
                                  registrationResponse.data.id.toString(),
                                )}/dvat1`,
                              );
                            } else {
                              toast.error("Unable to get registration data");
                            }
                          } else {
                            // Status is anything except VERIFICATION
                            router.push("/dashboard/register");
                          }
                        } else {
                          // No dvat found, redirect to register
                          router.push("/dashboard/register");
                        }
                      }}
                      className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                    >
                      <span>Complete Registration Now</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default UserDashboard;

interface ButtonCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  badge?: number;
}

const ButtonCard = (props: ButtonCardProps) => {
  return (
    <Link href={props.link} className="group">
      <div
        className={` p-2 rounded border border-gray-200 hover:border-gray-300 transition-all h-full 
        ${props.badge !== undefined ? "bg-red-500/40" : "bg-white"}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center gap-1.5">
          <div className="relative p-1.5 bg-gray-100 rounded group-hover:bg-gray-200 transition-colors">
            <div className="text-sm">{props.icon}</div>
            {/* {props.badge !== undefined && (
              <div className="absolute -top-1 -right-10 shrink-0 px-2 py-1 grid place-items-center bg-rose-500 text-white text-xs font-bold rounded-full">
                {props.badge > 99 ? "99+" : props.badge}
              </div>
            )} */}
          </div>
          <h3 className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-2">
            {props.title}{" "}
            {props.badge !== undefined &&
              `(${props.badge > 99 ? "99+" : props.badge})`}
          </h3>
        </div>
      </div>
    </Link>
  );
};

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
      date.setMonth(date.getMonth() + 1, due_date_of_month),
    );
    return formateDate(res);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all gap-2">
      <div className="flex items-start sm:items-center gap-2 flex-1">
        {/* Status Indicator */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded flex items-center justify-center text-xs font-semibold ${
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
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Return Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 text-sm mb-1">
            {props.title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium inline-block w-fit ${
                props.filestatus == FileStatus.FILED
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {props.status}
            </span>
            <span className="text-xs text-gray-600">
              {props.statusdate}:{" "}
              <span className="font-medium text-gray-800">
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
        className="text-xs px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-center sm:text-left shrink-0 w-full sm:w-auto"
      >
        Open
      </Link>
    </div>
  );
};
