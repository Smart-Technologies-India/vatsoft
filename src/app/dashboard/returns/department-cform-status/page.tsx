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
import { dvat04, returns_01 } from "@prisma/client";
import { capitalcase, encryptURLData, formateDate } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import SearchReturnPayment from "@/action/return/searchreturnpayment";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const TrackAppliation = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [paymentData, setPaymentData] = useState<returns_01[]>([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04();

    if (dvat_response.data && dvat_response.status) {
      setDvatData(dvat_response.data);
    }

    const payment_data = await GetUserTrackPayment({
      user_id: userid,
      take: 10,
      skip: 0,
    });

    if (payment_data.status && payment_data.data.result) {
      setPaymentData(payment_data.data.result);
      setPaginatin({
        skip: payment_data.data.skip,
        take: payment_data.data.take,
        total: payment_data.data.total,
      });
    }
    setLoading(false);
  };
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04();

      if (dvat_response.data && dvat_response.status) {
        setDvatData(dvat_response.data);
      }
      const payment_data = await GetUserTrackPayment({
        user_id:  authResponse.data,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        setPaymentData(payment_data.data.result);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, [userid]);

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
    const search_response = await SearchReturnPayment({
      userid: userid,
      rr_number: arnRef.current?.input?.value,
      dept: dvatdata?.selectOffice!,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setPaymentData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    const search_response = await SearchReturnPayment({
      userid: userid,
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      dept: dvatdata?.selectOffice!,
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setPaymentData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.ARN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await SearchReturnPayment({
          userid: userid,
          rr_number: arnRef.current?.input?.value,
          dept: dvatdata?.selectOffice!,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setPaymentData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.RETURN) {
        if (searchDate == null || searchDate.length <= 1) {
          return toast.error("Select state date and end date");
        }

        if (searchDate == null || searchDate.length <= 1) {
          return toast.error("Select state date and end date");
        }

        const search_response = await SearchReturnPayment({
          userid: userid,
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          dept: dvatdata?.selectOffice!,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setPaymentData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = await GetUserTrackPayment({
        user_id: userid,
        take: pagesize,
        skip: pagesize * (page - 1),
      });

      if (payment_data.status && payment_data.data.result) {
        setPaymentData(payment_data.data.result);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
      }
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-white rounded-full"></div>
                <h1 className="text-2xl font-bold text-white">Track Return Status</h1>
              </div>
              <Button
                type="primary"
                onClick={() => setDrawerOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Info
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Section */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
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
                      <div className="flex gap-2">
                        <Input
                          className="w-60"
                          ref={arnRef}
                          placeholder={"Enter CPIN"}
                          disabled={isSearch}
                        />

                        {isSearch ? (
                          <Button onClick={init} type="primary">
                            Reset
                          </Button>
                        ) : (
                          <Button onClick={cpinsearch} type="primary">
                            Search
                          </Button>
                        )}
                      </div>
                    );

                  case SearchOption.RETURN:
                    return (
                      <div className="flex gap-2">
                        <RangePicker
                          onChange={onChangeDate}
                          disabled={isSearch}
                        />

                        {isSearch ? (
                          <Button onClick={init} type="primary">
                            Reset
                          </Button>
                        ) : (
                          <Button type="primary" onClick={datesearch}>
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
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
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
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
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

        {/* Antd Drawer for Status Info */}
        <Drawer
          title={
            <div className="text-lg font-semibold text-gray-900">
              Meaning of Status
            </div>
          }
          placement="right"
          width={720}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        >
          <div className="space-y-4">
            <Table className="border border-gray-200 rounded-lg overflow-hidden">
              <TableBody>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Pending for Processing
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application filed successfully. Pending with Tax Officer for
                    Processing.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Pending for Clarification
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Notice for seeking clarification issued by officer. File
                    Clarification within 7 working days of date of notice on
                    portal.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Clarification filed-Pending for Order
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Clarification filed successfully by Applicant. Pending with
                    Tax Officer for Order.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Clarification not filed Pending for Order
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Clarification not filed by the Applicant. Pending with Tax
                    Officer for Rejection.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Approved
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is Approved. Registration ID and password
                    emailed to Applicant.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Rejected
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is Rejected by tax officer.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Withdrawn
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is withdrawn by the Applicant/Tax payer.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Cancelled on Request of Taxpayer
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Registration is cancelled on request to taxpayer.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Drawer>
      </main>
    </>
  );
};

export default TrackAppliation;
