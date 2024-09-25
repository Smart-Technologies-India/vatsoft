"use client";

import { Button as ShButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker } from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { getCookie } from "cookies-next";
import { returns_01 } from "@prisma/client";
import { capitalcase, formateDate } from "@/utils/methods";
import GetTrackPayment from "@/action/return/gettrackpayment";
import Link from "next/link";
import SearchReturn from "@/action/return/searchreturn";
import SearchReturnPayment from "@/action/return/searchreturnpayment";

const TrackAppliation = () => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  enum SearchOption {
    ARN,
    RETURN,
    STATUS,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const srnRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [paymentData, setPaymentData] = useState<returns_01[]>([]);

  useEffect(() => {
    const init = async () => {
      const payment_data = await SearchReturnPayment({});

      if (payment_data.status && payment_data.data) {
        setPaymentData(payment_data.data);
      }
    };
    init();
  }, []);
  const get_years = (month: string, year: string): string => {
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
    const monthIndex = monthNames.indexOf(capitalcase(month));
    const yearNum = parseInt(year, 10);

    // If the month is between September (index 8) and March (index 2), return year-year+1
    if (monthIndex >= 8) {
      // September to December
      return `${yearNum}-${yearNum + 1}`;
    } else {
      // January to April
      return `${yearNum - 1}-${yearNum}`;
    }
  };

  const get_month = (composition: boolean, month: string): string => {
    console.log(composition);
    console.log(month);
    if (composition) {
      if (["January", "February", "March"].includes(capitalcase(month))) {
        return "Jan-Mar";
      } else if (["April", "May", "June"].includes(capitalcase(month))) {
        return "Apr-Jun";
      } else if (["July", "August", "September"].includes(capitalcase(month))) {
        return "Jul-Sep";
      } else if (
        ["October", "November", "December"].includes(capitalcase(month))
      ) {
        return "Oct-Dec";
      } else {
        return "Jan-Mar";
      }
    } else {
      return month;
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Track Return Status</p>
            <div className="grow"></div>

            <Drawer>
              <DrawerTrigger>Info</DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="px-0 py-2">
                  <DrawerTitle>
                    <p className="w-5/6 mx-auto">Meaning of status</p>
                  </DrawerTitle>
                </DrawerHeader>
                <Table className="border mt-2 w-5/6 mx-auto">
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Pending for Processing
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application filed successfully. Pending with Tax Officer
                        for Processing.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Pending for Clarification
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Notice for seeking clarification issued by officer. File
                        Clarification within 7 working days of date of notice on
                        portal.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Clarification filed-Pending for Order
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Clarification filed successfully by Applicant. Pending
                        with Tax Officer for Order.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Clarification not filed Pending for Order
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Clarification not filed by the Applicant. Pending with
                        Tax Officer for Rejection.*
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Approved
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is Approved. Registration ID and possward
                        emailed to Applicant.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Rejected
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is Rejected by tax officer.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Withdrawn
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Application is withdrawn by the Applicant/Tax payer.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left w-60 p-2">
                        Cancelled on Request of Taxpayer
                      </TableCell>
                      <TableCell className="text-left p-2">
                        Registration is cancelled on request to taxpayer.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <DrawerFooter>
                  <DrawerClose>
                    <ShButton variant="outline">Close</ShButton>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="p-2 bg-gray-50 mt-2">
            <Radio.Group onChange={onChange} value={searchOption}>
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.RETURN}>Return Filing Period</Radio>
              <Radio value={SearchOption.STATUS}>Status</Radio>
            </Radio.Group>
          </div>

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center border p-2">
                  ARN
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Return Type
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Financial Year
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Tax Period
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Date of filing
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Filing Type
                </TableHead>
                <TableHead className="whitespace-nowrap text-center border p-2">
                  Mode of filing
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentData.map((val: returns_01, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="border text-center p-2">
                      <Link
                        href={`/dashboard/returns/returns-dashboard/preview/${val.createdById}?form=30A&year=${val.year}&quarter=${val.quarter}&month=${val.month}&sidebar=no`}
                        className="text-blue-500"
                      >
                        {val.rr_number}
                      </Link>
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.return_type}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {get_years(
                        new Date(val.transaction_date!).toLocaleString(
                          "en-US",
                          {
                            month: "long",
                          }
                        ),
                        val.year
                      )}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {get_month(
                        val.compositionScheme ?? false,
                        new Date(val.transaction_date!).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                          }
                        )
                      )}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {formateDate(new Date(val.transaction_date!))}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.compositionScheme ? "COMP" : "REG"}
                    </TableCell>
                    <TableCell className="border text-center p-2">
                      {val.paymentmode}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
