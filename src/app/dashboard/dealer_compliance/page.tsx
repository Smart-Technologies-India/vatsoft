"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, Button, Input, Pagination, Drawer } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Dayjs } from "dayjs";
import { dvat04, user } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import DeptPendingReturn from "@/action/dvat/deptpendingreturn";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import SearchDeptPendingReturn from "@/action/dvat/searchdeptpendingreturn";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
}

const TrackAppliation = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

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
    TIN,
    NAME,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await DeptPendingReturn({
        dept: userrespone.data.selectOffice!,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort(
          (a: ResponseType, b: ResponseType) => b.pending - a.pending
        );
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(sortedData);
      }
    }

    setSearch(false);
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

      const userrespone = await GetUser({ id: authResponse.data });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const payment_data = await DeptPendingReturn({
          dept: userrespone.data.selectOffice!,
          take: 10,
          skip: 0,
        });

        if (payment_data.status && payment_data.data.result) {
          const sortedData = payment_data.data.result.sort(
            (a: ResponseType, b: ResponseType) => b.pending - a.pending
          );
          setDvatData(sortedData);
          setPaginatin({
            skip: payment_data.data.skip,
            take: payment_data.data.take,
            total: payment_data.data.total,
          });
        }
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
  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await SearchDeptPendingReturn({
      arnnumber: arnRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    const search_response = await SearchDeptPendingReturn({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setSearch(true);
    }
  };

  const namesearch = async () => {
    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await SearchDeptPendingReturn({
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setSearch(true);
    }
  };
  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await SearchDeptPendingReturn({
          arnnumber: arnRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.NAME) {
        if (
          nameRef.current?.input?.value == undefined ||
          nameRef.current?.input?.value == null ||
          nameRef.current?.input?.value == ""
        ) {
          return toast.error("Enter TIN Number");
        }
        const search_response = await SearchDeptPendingReturn({
          tradename: nameRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = await DeptPendingReturn({
        dept: user!.selectOffice!,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (payment_data.status && payment_data.data.result) {
        setDvatData(payment_data.data.result);
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
      <Drawer
        title="Status Information"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={720}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Understanding different status meanings for dealer compliance
          </p>
          <Table className="border">
            <TableBody>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Pending for Processing
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Application filed successfully. Pending with Tax Officer for
                  Processing.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Pending for Clarification
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Notice for seeking clarification issued by officer. File
                  Clarification within 7 working days of date of notice on portal.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Clarification filed-Pending for Order
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Clarification filed successfully by Applicant. Pending with Tax
                  Officer for Order.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Clarification not filed Pending for Order
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Clarification not filed by the Applicant. Pending with Tax
                  Officer for Rejection.*
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Approved
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Application is Approved. Registration ID and password emailed to
                  Applicant.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Rejected
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Application is Rejected by tax officer.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Withdrawn
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Application is withdrawn by the Applicant/Tax payer.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-left w-60 p-3 border font-semibold text-gray-700">
                  Cancelled on Request of Taxpayer
                </TableCell>
                <TableCell className="text-left p-3 border text-sm text-gray-600">
                  Registration is cancelled on request to taxpayer.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Drawer>

      <main className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dealer Compliance
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track dealer pending returns and compliance status
                </p>
              </div>
              <Button
                type="default"
                onClick={() => setDrawerOpen(true)}
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                📋 Status Info
              </Button>
            </div>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <Radio.Group
                onChange={onChange}
                value={searchOption}
                disabled={isSearch}
              >
                <Radio value={SearchOption.TIN}>TIN</Radio>
                <Radio value={SearchOption.NAME}>Trade Name</Radio>
              </Radio.Group>
              {(() => {
                switch (searchOption) {
                  case SearchOption.TIN:
                    return (
                      <div className="flex gap-2 flex-1">
                        <Input
                          className="max-w-xs"
                          ref={arnRef}
                          placeholder="Enter TIN"
                          disabled={isSearch}
                        />
                        {isSearch ? (
                          <Button onClick={init} type="primary">
                            Reset
                          </Button>
                        ) : (
                          <Button onClick={arnsearch} type="primary">
                            Search
                          </Button>
                        )}
                      </div>
                    );

                  case SearchOption.NAME:
                    return (
                      <div className="flex gap-2 flex-1">
                        <Input
                          className="max-w-xs"
                          ref={nameRef}
                          placeholder="Enter Trade Name"
                          disabled={isSearch}
                        />
                        {isSearch ? (
                          <Button onClick={init} type="primary">
                            Reset
                          </Button>
                        ) : (
                          <Button onClick={namesearch} type="primary">
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

          {/* Table Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="border-0">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Trade Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Type
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Last Filing Period
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Pending Returns
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dvatData.map((val: ResponseType, index: number) => {
                    return (
                      <TableRow key={index} className="hover:bg-gray-50 border-b">
                        <TableCell className="text-center p-3 text-sm font-medium text-gray-900">
                          {val.dvat04.tinNumber}
                        </TableCell>
                        <TableCell className="text-center p-3 text-sm text-gray-900">
                          {val.dvat04.tradename}
                        </TableCell>
                        <TableCell className="text-center p-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              val.dvat04.compositionScheme
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {val.dvat04.compositionScheme ? "COMP" : "REG"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center p-3 text-sm text-gray-700">
                          {val.lastfiling}
                        </TableCell>
                        <TableCell className="text-center p-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              val.pending > 5
                                ? "bg-red-100 text-red-700"
                                : val.pending > 2
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {val.pending}
                          </span>
                        </TableCell>
                        <TableCell className="text-center p-3">
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              router.push(
                                `/dashboard/returns/department-pending-return/${encryptURLData(
                                  val.dvat04.id.toString()
                                )}`
                              );
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t bg-gray-50 p-4">
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
                  pageSizeOptions={[10, 20, 25, 50, 100]}
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
      </main>
    </>
  );
};

export default TrackAppliation;
