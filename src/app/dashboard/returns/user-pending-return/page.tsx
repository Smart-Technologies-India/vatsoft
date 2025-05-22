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
import { Button } from "antd";
import GetDvat04 from "@/action/register/getdvat04";
import GetPendingReturn from "@/action/dvat/getpendingreturn";
import GetPendingChallan from "@/action/challan/getPendingChallan";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import { getCookie } from "cookies-next";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUser from "@/action/user/getuser";

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
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

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
    <div className="p-3 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ">
        <div className="bg-white rounded-sm shadow-sm pb-4">
          <div className="flex gap-2 p-2 border-b border-gray-300">
            <p className="text-xl  font-semibold">Dealer Details</p>
            <div className="grow"></div>
            {/* <Button
              onClick={() => {
                router.back();
              }}
            >
              Back
            </Button> */}
          </div>

          <div className="px-4 py-2 grid grid-cols-2 gap-4 mt-2">
            <p className="text-xs leading-3">
              TIN Number <br />
              <span className="text-sm text-gray-500 font-medium">
                {dvatData?.tinNumber}
              </span>
            </p>
            <p className="text-xs leading-3">
              Applicant Name <br />
              <span className="text-sm text-gray-500 font-medium">
                {user?.firstName}-{user?.lastName}
              </span>
            </p>
          </div>
          <div className="px-4 py-2 grid grid-cols-2 gap-4">
            <p className="text-xs leading-3">
              Trade Name
              <br />
              <span className="text-sm text-gray-500 font-medium">
                {dvatData?.tradename}
              </span>
            </p>
            <p className="text-xs leading-3">
              Constitution of Business
              <br />
              <span className="text-sm text-gray-500 font-medium">
                {capitalcase(dvatData?.constitutionOfBusiness!)}
              </span>
            </p>
            <p className="text-xs leading-3">
              Liquor/Fuel
              <br />
              <span className="text-sm text-gray-500 font-medium">Liquor</span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm pb-4">
          <div className="border-b border-gray-300 flex items-center pr-2 gap-2">
            <p className="text-xl p-2  font-semibold">Return Details</p>
            <div className="grow"></div>
          </div>
          <div className="px-4 py-2 grid grid-cols-2 gap-4 mt-2">
            <p className="text-xs leading-3">
              VAT Liable Date <br />
              <span className="text-sm text-gray-500 font-medium">
                {formateDate(dvatData?.vatLiableDate!)}
              </span>
            </p>
            <p className="text-xs leading-3">
              Composition/Regular <br />
              <span className="text-sm text-gray-500 font-medium">
                {dvatData?.compositionScheme ? "COMP" : "REG"}
              </span>
            </p>
            <p className="text-xs leading-3">
              Last Filed Return Period <br />
              <span className="text-sm text-gray-500 font-medium">
                {pendingreturn?.lastfiling}
              </span>
            </p>
            <p className="text-xs leading-3">
              Pending Returns <br />
              <span className="text-sm text-gray-500 font-medium">
                {pendingreturn?.pending}
              </span>
            </p>
            <p className="text-xs leading-3">
              Demand Pending <br />
              <span className="text-sm text-gray-500 font-medium">
                {pendingchallan.count}
              </span>
            </p>
            <p className="text-xs leading-3">
              Demand Amount Pending <br />
              <span className="text-sm text-gray-500 font-medium">
                {pendingchallan.pending}
              </span>
            </p>
          </div>
        </div>
      </div>

      {returndetails.map((item, index) => (
        <div key={index} className="w-full bg-white rounded-sm shadow-sm mt-4">
          <div className="bg-white rounded-sm shadow-sm">
            <p className="text-xl p-2  font-semibold border-b border-gray-300">
              Return History - {item.displayyear}
            </p>

            <div className="grow grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 md:grid-cols-4 gap-2 flex-wrap justify-center items-center p-2">
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
      className={`p-1 flex items-center justify-start min-w-28 bg-[#F5F5F5] rounded-md gap-2`}
    >
      <Component />
      <div>
        <p className={`text-xs text-black`}>{props.name}</p>
        <p className={`text-xs text-gray-500`}>{textname()}</p>
      </div>
    </div>
  );
};
