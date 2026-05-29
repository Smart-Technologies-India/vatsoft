"use client";
import { Button, Input, Pagination, Drawer } from "antd";

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
import GetUserTrackPayment from "@/action/return/getusertrackpayment";
import { returns_01 } from "@prisma/client";
import { capitalcase, encryptURLData, formateDate } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const TrackAppliation = () => {
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  enum SearchOption {
    ARN,
    RETURN,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    _dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [paymentData, setPaymentData] = useState<returns_01[]>([]);

  const updatePaymentList = (paymentData: {
    status: boolean;
    message: string;
    data: {
      result: returns_01[] | null;
      skip: number;
      take: number;
      total: number;
    };
  }) => {
    if (paymentData.status && paymentData.data.result) {
      setPaymentData(paymentData.data.result);
      setPaginatin({
        skip: paymentData.data.skip,
        take: paymentData.data.take,
        total: paymentData.data.total,
      });
      return;
    }

    toast.error(paymentData.message);
  };

  const fetchPaymentData = async (skip: number, take: number) => {
    if (!isSearch) {
      const paymentDataResponse = await GetUserTrackPayment({
        take,
        skip,
      });
      updatePaymentList(paymentDataResponse);
      return;
    }

    if (searchOption === SearchOption.ARN) {
      const rrNumber = arnRef.current?.input?.value;
      if (!rrNumber) {
        toast.error("Enter arn number");
        return;
      }

      const paymentDataResponse = await GetUserTrackPayment({
        rr_number: rrNumber,
        take,
        skip,
      });
      updatePaymentList(paymentDataResponse);
      return;
    }

    if (!searchDate || searchDate.length <= 1) {
      toast.error("Select state date and end date");
      return;
    }

    const paymentDataResponse = await GetUserTrackPayment({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take,
      skip,
    });
    updatePaymentList(paymentDataResponse);
  };

  const init = async () => {
    setLoading(true);
    const authResponse = await getAuthenticatedUserId();
    if (!authResponse.status || !authResponse.data) {
      toast.error(authResponse.message);
      return router.push("/");
    }

    await fetchPaymentData(0, 10);
    setLoading(false);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }

      const paymentDataResponse = await GetUserTrackPayment({
        take: 10,
        skip: 0,
      });

      if (paymentDataResponse.status && paymentDataResponse.data.result) {
        setPaymentData(paymentDataResponse.data.result);
        setPaginatin({
          skip: paymentDataResponse.data.skip,
          take: paymentDataResponse.data.take,
          total: paymentDataResponse.data.total,
        });
      } else {
        toast.error(paymentDataResponse.message);
      }

      setLoading(false);
    };

    fetchInitialData();
  }, [router]);

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
    if (composition) {
      if (["January", "February", "March"].includes(capitalcase(month))) {
        return "March";
      } else if (["April", "May", "June"].includes(capitalcase(month))) {
        return "June";
      } else if (["July", "August", "September"].includes(capitalcase(month))) {
        return "September";
      } else if (
        ["October", "November", "December"].includes(capitalcase(month))
      ) {
        return "December";
      } else {
        return "March";
      }
    } else {
      return month;
    }
  };

  const arnRef = useRef<InputRef>(null);

  const cpinsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    setSearch(true);
    await fetchPaymentData(0, 10);
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    setSearch(true);
    await fetchPaymentData(0, 10);
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    await fetchPaymentData(pagesize * (page - 1), pagesize);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-white rounded-full"></div>
                <h1 className="text-2xl font-bold text-white">Track Return Status</h1>
              </div>
              <Button 
                onClick={() => setDrawerOpen(true)}
                className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-medium bg-transparent border-white"
              >
                Info
              </Button>
            </div>
          </div>
        </div>

        <Drawer
          title={<span className="text-xl font-bold text-gray-900">Meaning of Status</span>}
          placement="right"
          size={720}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        >
          <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <TableBody>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Pending for Processing
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Application filed successfully. Pending with Tax Officer
                  for Processing.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Pending for Clarification
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Notice for seeking clarification issued by officer. File
                  Clarification within 7 working days of date of notice on
                  portal.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Clarification filed-Pending for Order
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Clarification filed successfully by Applicant. Pending
                  with Tax Officer for Order.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Clarification not filed Pending for Order
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Clarification not filed by the Applicant. Pending with
                  Tax Officer for Rejection.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Approved
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Application is Approved. Registration ID and possward
                  emailed to Applicant.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Rejected
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Application is Rejected by tax officer.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Withdrawn
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Application is withdrawn by the Applicant/Tax payer.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-blue-50 transition-colors">
                <TableCell className="text-left w-60 p-3 font-semibold text-gray-900">
                  Cancelled on Request of Taxpayer
                </TableCell>
                <TableCell className="text-left p-3 text-gray-700">
                  Registration is cancelled on request to taxpayer.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Drawer>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Section */}
          <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.RETURN}>Return Filing Period</Radio>
            </Radio.Group>
            {(() => {
              switch (searchOption) {
                case SearchOption.ARN:
                  return (
                    <div className="flex gap-3">
                      <Input
                        className="w-60 border-gray-300 focus:border-blue-500"
                        ref={arnRef}
                        placeholder={"Enter CPIN"}
                        disabled={isSearch}
                      />
                      {isSearch ? (
                        <Button 
                          onClick={init} 
                          type="primary"
                          className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                        >
                          Reset
                        </Button>
                      ) : (
                        <Button 
                          onClick={cpinsearch} 
                          type="primary"
                          className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                        >
                          Search
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.RETURN:
                  return (
                    <div className="flex gap-3">
                      <RangePicker
                        onChange={onChangeDate}
                        disabled={isSearch}
                        className="border-gray-300 focus:border-blue-500"
                      />
                      {isSearch ? (
                        <Button 
                          onClick={init} 
                          type="primary"
                          className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                        >
                          Reset
                        </Button>
                      ) : (
                        <Button 
                          type="primary" 
                          onClick={datesearch}
                          className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                        >
                          Search
                        </Button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
            </div>
          </div>

          {/* Table Section */}
          <div className="p-6">
            <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <TableHeader>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    ARN
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Return Type
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Financial Year
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Tax Period
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Date of filing
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Status
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Mode of filing
                  </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentData.map((val: returns_01, index: number) => {
                return (
                  <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                    <TableCell className="border text-center p-3">
                      <Link
                        href={`/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                          val.createdById.toString()
                        )}?form=30A&year=${val.year}&quarter=${
                          val.quarter
                        }&month=${val.month}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                      >
                        {val.rr_number}
                      </Link>
                    </TableCell>
                    <TableCell className="border text-center p-3 text-gray-900">
                      {val.return_type}
                    </TableCell>
                    <TableCell className="border text-center p-3 text-gray-900">
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
                    <TableCell className="border text-center p-3 text-gray-900">
                      {val.month}
                    </TableCell>
                    <TableCell className="border text-center p-3 text-gray-900">
                      {formateDate(new Date(val.transaction_date!))}
                    </TableCell>
                    <TableCell className="border text-center p-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Filed
                      </span>
                    </TableCell>
                    <TableCell className="border text-center p-3 text-gray-900">
                      {val.paymentmode}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>

          {/* Pagination Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="lg:hidden">
              <Pagination
                align="center"
                defaultCurrent={1}
                onChange={onChangePageCount}
                showSizeChanger
                total={pagination.total}
                showTotal={(total: number) => `Total ${total} items`}
              />
            </div>
            <div className="hidden lg:block">
              <Pagination
                showQuickJumper
                align="center"
                defaultCurrent={1}
                onChange={onChangePageCount}
                showSizeChanger
                pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                total={pagination.total}
                responsive={true}
                showTotal={(total: number, range: number[]) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
