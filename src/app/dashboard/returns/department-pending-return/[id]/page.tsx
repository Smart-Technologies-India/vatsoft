/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  capitalcase,
  decryptURLData,
  encryptURLData,
  formateDate,
  get28thDate,
} from "@/utils/methods";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AntDesignCheckOutlined,
  AntDesignMenuOutlined,
  CarbonWarningSquare,
  Fa6RegularCalendarXmark,
  Fa6RegularHourglassHalf,
  FluentMoreVertical20Regular,
  MaterialSymbolsCalendarClockRounded,
  MaterialSymbolsDoNotDisturbOnOutline,
} from "@/components/icons";
import { dvat04, return_filing, user } from "@prisma/client";
import { Button, Popover } from "antd";
import GetDvat04 from "@/action/register/getdvat04";
import GetPendingReturn from "@/action/dvat/getpendingreturn";
import GetPendingChallan from "@/action/challan/getPendingChallan";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import getReturnByDate from "@/action/return/getreturnentrybydate";

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
  userid?: string;
  year?: string;
  returnid?: number;
  month?: string;
  dvatid?: number;
}

interface yearsDetails {
  year: number;
  rentdetails: ItemsType[];
  displayyear: string;
}

const ShopView = () => {
  const { id } = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const dvat04id = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router)
  );

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

  // const [returnMonth, setReturnMonth] = useState<return_filing[]>([]);

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

  const setRentMonthDetails = (
    value: Array<return_filing & { dvat: dvat04 }>
  ) => {
    const years: number[] = value.map((item) => parseInt(item.year));
    const uniqueyears: number[] = years.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const currentdate: Date = get28thDate();

    const monthdetails: yearsDetails[] = uniqueyears.map((year: number) => {
      const ret_filing: ItemsType[] = [];

      for (let i = 0; i < 12; i++) {
        const adjustedMonth = i % 12; // Ensures we wrap from April (3) to March (2)
        const displayYear = adjustedMonth < 3 ? year + 1 : year; // Adjust year for Jan-Mar
        const monthDate = new Date(displayYear, adjustedMonth, 1);

        const getdata: (return_filing & { dvat: dvat04 }) | undefined =
          value.find(
            (item: return_filing & { dvat: dvat04 }) =>
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
            userid: getdata.dvat.createdById.toString(),
            year: year.toString(),
            returnid: getdata.id,
            month: monthNames[adjustedMonth],
            dvatid: getdata.dvat.id,
          });
        } else {
          ret_filing.push({
            name: monthDate.toLocaleString("default", { month: "long" }),
            filing_status: false,
            status: Status.INACTIVE,
          });
        }
      }

      const displayyear = `${year}`;

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
      const dvat_response = await GetDvat04({
        id: dvat04id,
      });
      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        setUser(dvat_response.data.createdBy);
      }

      const pendingreturn_response = await GetPendingReturn({
        dvatid: dvat04id,
      });
      if (pendingreturn_response.status && pendingreturn_response.data) {
        setPendingReturn(pendingreturn_response.data);
      }

      const pendingchallan_response = await GetPendingChallan({
        dvatid: dvat04id,
      });
      if (pendingchallan_response.status && pendingchallan_response.data) {
        setPendingChallan(pendingchallan_response.data);
      }

      const returnmonth_response = await GetReturnMonth({
        dvatid: dvat04id,
      });
      if (returnmonth_response.status && returnmonth_response.data) {
        setRentMonthDetails(returnmonth_response.data);
      }
      setIsLoading(false);
    };
    init();
  }, [dvat04id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-50">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <p className="text-base font-semibold text-gray-900">Dealer Details</p>
            <div className="grow"></div>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                if (!dvatData) return;
                router.push(
                  `/dashboard/returns/user-stock/${encryptURLData(
                    dvatData?.id.toString()
                  )}`
                );
              }}
            >
              Stock
            </Button>
          </div>

          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="text-xs text-gray-500 leading-4">
              TIN Number <br />
              <span className="text-sm text-gray-900 font-medium">
                {dvatData?.tinNumber}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Applicant Name <br />
              <span className="text-sm text-gray-900 font-medium">
                {user?.firstName}-{user?.lastName}
              </span>
            </p>
          </div>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="text-xs text-gray-500 leading-4">
              Trade Name
              <br />
              <span className="text-sm text-gray-900 font-medium">
                {dvatData?.tradename}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Constitution of Business
              <br />
              <span className="text-sm text-gray-900 font-medium">
                {capitalcase(dvatData?.constitutionOfBusiness!)}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Liquor/Fuel
              <br />
              <span className="text-sm text-gray-900 font-medium">Liquor</span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center px-4 py-3 gap-2">
            <p className="text-base font-semibold text-gray-900">Return Details</p>
            <div className="grow"></div>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                if (!dvatData) return;
                router.push(
                  `/dashboard/returns/user-cform/${encryptURLData(
                    dvatData?.id.toString()
                  )}`
                );
              }}
            >
              C-Form
            </Button>
          </div>
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="text-xs text-gray-500 leading-4">
              VAT Liable Date <br />
              <span className="text-sm text-gray-900 font-medium">
                {formateDate(dvatData?.vatLiableDate!)}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Composition/Regular <br />
              <span className="text-sm text-gray-900 font-medium">
                {dvatData?.compositionScheme ? "COMP" : "REG"}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Last Filed Return Period <br />
              <span className="text-sm text-gray-900 font-medium">
                {pendingreturn?.lastfiling}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Pending Returns <br />
              <span className="text-sm text-gray-900 font-medium">
                {pendingreturn?.pending}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Demand Pending <br />
              <span className="text-sm text-gray-900 font-medium">
                {pendingchallan.count}
              </span>
            </p>
            <p className="text-xs text-gray-500 leading-4">
              Demand Amount Pending <br />
              <span className="text-sm text-gray-900 font-medium">
                {pendingchallan.pending}
              </span>
            </p>
          </div>
        </div>
      </div>

      {returndetails.map((item, index) => (
        <div key={index} className="w-full bg-white rounded-lg border border-gray-200 shadow-sm mt-4 overflow-hidden">
          <div className="bg-white">
            <p className="text-base px-4 py-3 font-semibold text-gray-900 border-b border-gray-200 bg-gray-50">
              Return History - {item.displayyear}
            </p>

            <div className="grow grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-3">
              {item.rentdetails.map((item, index: number) => (
                <PropertiesDeatils
                  key={index}
                  name={item.name}
                  status={item.status}
                  tinnumber={dvatData?.tinNumber ?? ""}
                  userid={item.userid}
                  year={item.year}
                  returnid={item.returnid}
                  filing_date={item.filing_date}
                  dvat04id={dvat04id}
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
  userid?: string;
  year?: string;
  tinnumber: string;
  returnid?: number;
  filing_date?: Date | null;
  dvat04id: number;
}

const PropertiesDeatils = (props: PropertiesDeatilsProps) => {
  const router = useRouter();

  const getQuarter = (): string => {
    // Define the mapping of months to quarters
    const quarterMap: {
      [key: string]: "QUARTER1" | "QUARTER2" | "QUARTER3" | "QUARTER4";
    } = {
      April: "QUARTER1",
      May: "QUARTER1",
      June: "QUARTER1",
      July: "QUARTER2",
      August: "QUARTER2",
      September: "QUARTER2",
      October: "QUARTER3",
      November: "QUARTER3",
      December: "QUARTER3",
      January: "QUARTER4",
      February: "QUARTER4",
      March: "QUARTER4",
    };

    // Return the corresponding quarter for the given month
    return quarterMap[props.name] || "QUARTER1";
  };

  const textname = (): string => {
    switch (props.status) {
      case Status.PAID:
        return "On Time Filing";
      case Status.DUE:
        return "Due";
      case Status.LATE:
        return "Late Filing";
      case Status.INACTIVE:
        return "Inactive";
      case Status.PENDING:
        return "Pending Filing";
      default:
        return "Due";
    }
  };

  const Component = (): React.ReactNode => {
    switch (props.status) {
      case Status.INACTIVE:
        return (
          <div className="bg-indigo-100 grid place-items-center border border-indigo-200 rounded-full w-8 h-8">
            <CarbonWarningSquare className="text-indigo-600 text-base" />
          </div>
        );
      case Status.PAID:
        return (
          <div className="bg-green-100 grid place-items-center border border-green-200 rounded-full w-8 h-8">
            <AntDesignCheckOutlined className="text-green-600 text-base" />
          </div>
        );
      case Status.LATE:
        return (
          <div className="bg-yellow-100 grid place-items-center border border-yellow-200 rounded-full w-8 h-8">
            <MaterialSymbolsCalendarClockRounded className="text-yellow-600 text-base" />
          </div>
        );
      case Status.DUE:
        return (
          <div className="bg-orange-100 grid place-items-center border border-orange-200 rounded-full w-8 h-8">
            <Fa6RegularHourglassHalf className="text-orange-600 text-base" />
          </div>
        );
      case Status.PENDING:
        return (
          <div className="bg-rose-100 grid place-items-center border border-rose-200 rounded-full w-8 h-8">
            <Fa6RegularCalendarXmark className="text-rose-600 text-base" />
          </div>
        );
      default:
        return (
          <div className="bg-rose-100 grid place-items-center border border-rose-200 rounded-full w-8 h-8">
            <MaterialSymbolsDoNotDisturbOnOutline className="text-rose-600 text-base" />
          </div>
        );
    }
  };

  if (props.status == Status.PAID || props.status == Status.LATE) {
    return (
      <div
        className="p-2 flex items-center justify-start min-w-40 bg-gray-50 border border-gray-200 rounded-lg gap-2"
      >
        <Component />
        <div>
          <p className="text-xs font-medium text-gray-900">{props.name}</p>
          <p className="text-xs text-gray-500">{textname()}</p>
        </div>
        <div className="grow"></div>
        <div className="text-lg text-gray-500 hover:text-gray-700 transition-colors">
          <Popover
            content={
              <div className="flex gap-2 flex-col">
                <Button
                  type="primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                        props.userid!.toString()
                      )}/${encryptURLData(
                        props.dvat04id!.toString()
                      )}?form=30A&year=${
                        props.year
                      }&quarter=${getQuarter()}&month=${props.name}`
                    )
                  }
                >
                  View
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    const response = await getReturnByDate({
                      month: props.name,
                      year: props.year!,
                      dvatid: props.dvat04id,
                    });
                    if (response.status && response.data) {
                      router.push(
                        `/dashboard/returns/department-dvat24?returnid=${encryptURLData(
                          response.data.id.toString()
                        )}&tin=${encryptURLData(props.tinnumber)}`
                      );
                    }
                  }}
                >
                  DVAT24
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    const response = await getReturnByDate({
                      month: props.name,
                      year: props.year!,
                      dvatid: props.dvat04id,
                    });
                    if (response.status && response.data) {
                      router.push(
                        `/dashboard/returns/department-dvat24a?returnid=${encryptURLData(
                          response.data.id.toString()
                        )}&tin=${encryptURLData(props.tinnumber)}`
                      );
                    }
                  }}
                >
                  DVAT24A
                </Button>
              </div>
            }
            title="Action"
            trigger="hover"
          >
            <FluentMoreVertical20Regular />
          </Popover>
        </div>
      </div>
    );
  } else if (props.status == Status.PENDING) {
    return (
      <div
        className="p-2 flex items-center justify-start min-w-40 bg-gray-50 border border-gray-200 rounded-lg gap-2"
      >
        <Component />
        <div>
          <p className="text-xs font-medium text-gray-900">{props.name}</p>
          <p className="text-xs text-gray-500">{textname()}</p>
        </div>
        <div className="grow"></div>
        <div className="text-lg text-gray-500 hover:text-gray-700 transition-colors">
          <Popover
            content={
              <div className="flex gap-2 flex-col">
                {/* <Button
                  type="primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                        props.userid!.toString()
                      )}?form=30A&year=${
                        props.year
                      }&quarter=${getQuarter()}&month=${props.name}`
                    )
                  }
                >
                  View
                </Button>  */}
                <Button
                  type="primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/returns/department-dvat10?tin=${encryptURLData(
                        props.tinnumber
                      )}`
                    )
                  }
                >
                  DVAT10
                </Button>
              </div>
            }
            title="Action"
            trigger="hover"
          >
            <FluentMoreVertical20Regular />
          </Popover>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="p-2 flex items-center justify-start min-w-40 bg-gray-50 border border-gray-200 rounded-lg gap-2"
      >
        <Component />
        <div>
          <p className="text-xs font-medium text-gray-900">{props.name}</p>
          <p className="text-xs text-gray-500">{textname()}</p>
        </div>
      </div>
    );
  }
};
