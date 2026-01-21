/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { capitalcase, formateDate } from "@/utils/methods";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AntDesignCheckOutlined,
  CarbonWarningSquare,
  Fa6RegularCalendarXmark,
  Fa6RegularHourglassHalf,
  MaterialSymbolsCalendarClockRounded,
  MaterialSymbolsDoNotDisturbOnOutline,
} from "@/components/icons";
import { dvat04, return_filing, user } from "@prisma/client";
import GetPendingReturn from "@/action/dvat/getpendingreturn";
import GetPendingChallan from "@/action/challan/getPendingChallan";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

enum Status {
  INACTIVE,
  PENDING,
  PAID,
  DUE,
  LATE,
}

interface ItemsType {
  name: string;
  duedate?: Date | null;
  filing_date?: Date | null;
  filing_status: boolean;
  status: Status;
}

interface yearsDetails {
  year: number;
  rentdetails: ItemsType[];
  displayyear: string;
}

const ShopView = () => {
  const router = useRouter();
  const [current_user_id, setCurrentUserId] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<user | null>();
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);

  interface ResponseType {
    dvat04: dvat04;
    lastfiling: string;
    pending: number;
  }

  const [pendingreturn, setPendingReturn] = useState<ResponseType | null>(null);
  const [pendingchallan, setPendingChallan] = useState<{
    pending: number;
    count: number;
  }>({
    count: 0,
    pending: 0,
  });

  const [returndetails, setRetuirnsDetails] = useState<yearsDetails[]>([]);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }

      setCurrentUserId(authResponse.data);
    };
    init();
  }, []);

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

  const setRentMonthDetails = (value: return_filing[]) => {
    const years: number[] = value.map((item) => parseInt(item.year));
    const uniqueyears: number[] = years.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const currentdate = new Date();

    const monthdetails: yearsDetails[] = uniqueyears.map((year: number) => {
      const ret_filing: ItemsType[] = [];

      for (let i = 0; i < 12; i++) {
        const adjustedMonth = i % 12; // Ensures we wrap from April (3) to March (2)
        const displayYear = adjustedMonth < 3 ? year + 1 : year; // Adjust year for Jan-Mar
        const monthDate = new Date(displayYear, adjustedMonth, 1);

        const getdata: return_filing | undefined = value.find(
          (item: return_filing) =>
            item.year == year.toString() &&
            item.month == monthNames[adjustedMonth]
        );
        if (getdata) {
          ret_filing.push({
            name: monthDate.toLocaleString("default", { month: "long" }),
            duedate: getdata.due_date,
            filing_date: getdata.filing_date,
            filing_status: getdata.filing_status,
            status: getdata.filing_status
              ? getdata.due_date! > getdata.filing_date!
                ? Status.PAID
                : Status.LATE
              : getdata.due_date! < currentdate
              ? Status.PENDING
              : Status.DUE,
          });
        } else {
          ret_filing.push({
            name: monthDate.toLocaleString("default", { month: "long" }),
            filing_status: false,
            status: Status.INACTIVE,
          });
        }
      }

      const displayyear = `${year}-${(year + 1).toString().slice(-2)}`;

      return {
        year: year,
        rentdetails: ret_filing,
        displayyear: displayyear,
      };
    });

    setRetuirnsDetails(monthdetails);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvat_response = await GetUserDvat04({
        userid: current_user_id,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);

        const user_response = await GetUser({
          id: current_user_id,
        });
        if (user_response.status && user_response.data) {
          setUser(user_response.data);
        }

        const pendingreturn_response = await GetPendingReturn({
          dvatid: dvat_response.data.id,
        });
        if (pendingreturn_response.status && pendingreturn_response.data) {
          setPendingReturn(pendingreturn_response.data);
        }

        const pendingchallan_response = await GetPendingChallan({
          dvatid: dvat_response.data.id,
        });
        if (pendingchallan_response.status && pendingchallan_response.data) {
          setPendingChallan(pendingchallan_response.data);
        }

        const returnmonth_response = await GetReturnMonth({
          dvatid: dvat_response.data.id,
        });
        if (returnmonth_response.status && returnmonth_response.data) {
          setRentMonthDetails(returnmonth_response.data);
        }
      }

      setIsLoading(false);
    };
    init();
  }, [current_user_id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-white rounded-full"></div>
            <h1 className="text-2xl font-bold text-white">Pending Returns Overview</h1>
          </div>
        </div>
      </div>

      {/* Details Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Dealer Details</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">TIN Number</p>
                <p className="text-sm font-semibold text-gray-900">
                  {dvatData?.tinNumber}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName}-{user?.lastName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trade Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {dvatData?.tradename}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Constitution of Business</p>
                <p className="text-sm font-semibold text-gray-900">
                  {capitalcase(dvatData?.constitutionOfBusiness!)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Liquor/Fuel</p>
                <p className="text-sm font-semibold text-gray-900">Liquor</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Return Details</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">VAT Liable Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formateDate(dvatData?.vatLiableDate!)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Composition/Regular</p>
                <p className="text-sm font-semibold text-gray-900">
                  {dvatData?.compositionScheme ? "COMP" : "REG"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Filed Return Period</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingreturn?.lastfiling}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Returns</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingreturn?.pending}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Demand Pending</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingchallan.count}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Demand Amount Pending</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingchallan.pending}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return History Section */}
      {returndetails.map((item, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Return History - {item.displayyear}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 md:grid-cols-4 gap-3">
              {item.rentdetails.map((item, index: number) => (
                <PropertiesDeatils
                  key={index}
                  name={item.name}
                  status={item.status}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopView;

interface PropertiesDeatilsProps {
  name: string;
  status: Status;
}

const PropertiesDeatils = (props: PropertiesDeatilsProps) => {
  const textname = (): string => {
    switch (props.status) {
      case Status.PAID:
        return "Paid";
      case Status.DUE:
        return "Due";
      case Status.LATE:
        return "Late";
      case Status.INACTIVE:
        return "Inactive";
      case Status.PENDING:
        return "Pending";
      default:
        return "Due";
    }
  };

  const Component = (): React.ReactNode => {
    switch (props.status) {
      case Status.INACTIVE:
        return (
          <div className="bg-indigo-200 grid place-items-center border border-gray-200 rounded-full w-8 h-8">
            <CarbonWarningSquare className="text-indigo-500 text-lg" />
          </div>
        );
      case Status.PAID:
        return (
          <div className="bg-green-200 grid place-items-center border border-gray-200 rounded-full w-8 h-8">
            <AntDesignCheckOutlined className="text-green-500 text-lg" />
          </div>
        );
      case Status.LATE:
        return (
          <div className="bg-yellow-200 grid place-items-center border border-gray-200 rounded-full w-8 h-8">
            <MaterialSymbolsCalendarClockRounded className="text-yellow-500 text-lg" />
          </div>
        );
      case Status.DUE:
        return (
          <div className="bg-orange-200 grid place-items-center border border-orange-400 rounded-full w-8 h-8">
            <Fa6RegularHourglassHalf className="text-orange-500 text-lg" />
          </div>
        );
      case Status.PENDING:
        return (
          <div className="bg-rose-200 grid place-items-center border border-gray-200 rounded-full w-8 h-8">
            <Fa6RegularCalendarXmark className="text-rose-500 text-lg" />
          </div>
        );
      default:
        return (
          <div className="bg-rose-200 grid place-items-center border border-gray-200 rounded-full w-8 h-8">
            <MaterialSymbolsDoNotDisturbOnOutline className="text-rose-500 text-lg" />
          </div>
        );
    }
  };

  return (
    <div
      className={`p-3 flex items-center justify-start min-w-28 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg gap-2 border border-gray-200 hover:shadow-md transition-shadow`}
    >
      <Component />
      <div>
        <p className={`text-xs text-black`}>{props.name}</p>
        <p className={`text-xs text-gray-500`}>{textname()}</p>
      </div>
    </div>
  );
};
