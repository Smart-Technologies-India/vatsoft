"use client";
import { Alert, Button, Input, Pagination } from "antd";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio } from "antd";
import { useEffect, useRef, useState } from "react";

import { cform, dvat04 } from "@prisma/client";
import { encryptURLData } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetRefineryCform from "@/action/refinery_cform/getrefineryform";
import GetCurrentRefinery from "@/action/refinery/getcurrentrefinery";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";

// Indian number formatting function (e.g., 344234 -> 3,44,234)
const formatIndianNumber = (num: number): string => {
  if (!Number.isFinite(num)) return "0";
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;

  const lastThree = numStr.slice(-3);
  const remaining = numStr.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${withCommas},${lastThree}`;
};

const RefineryCformStatus = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
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
    DVAT_TIN,
    DVAT_NAME,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.DVAT_TIN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [cformData, setCformData] = useState<Array<cform & { dvat04: dvat04 }>>(
    [],
  );
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [tin, settin] = useState<string>("");

  const init = async () => {
    setLoading(true);
    const refinery_response = await GetCurrentRefinery();
    if (refinery_response.status && refinery_response.data?.tinNumber) {
      const refinery_tin = refinery_response.data.tinNumber;

      const cform_data = await GetRefineryCform({
        searchType: "NONE",
        tin: refinery_tin,
        take: 10,
        skip: 0,
      });

      if (cform_data.status && cform_data.data?.result) {
        setCformData(cform_data.data.result);
        setPaginatin({
          skip: cform_data.data.skip,
          take: cform_data.data.take,
          total: cform_data.data.total,
        });
        settin(refinery_tin);
      }
    }
    const dvat_response = await GetUserDvat04();
    if (dvat_response.data && dvat_response.status) {
      setDvatData(dvat_response.data);
    }
    setLoading(false);
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
      const userrole = await getCurrentUserRole();
      if (userrole == "USER" || userrole == null || userrole == undefined) {
        return router.back();
      }
      const dvat_response = await GetUserDvat04();
      if (dvat_response.data && dvat_response.status) {
        setDvatData(dvat_response.data);
      }

      // Get current refinery's TIN number
      const refinery_response = await GetCurrentRefinery();
      if (refinery_response.status && refinery_response.data?.tinNumber) {
        const refinery_tin = refinery_response.data.tinNumber;

        // Automatically load C-forms for current refinery's TIN
        const cform_data = await GetRefineryCform({
          searchType: "NONE",
          tin: refinery_tin,
          take: 10,
          skip: 0,
        });

        if (cform_data.status && cform_data.data?.result) {
          setCformData(cform_data.data.result);
          setPaginatin({
            skip: cform_data.data.skip,
            take: cform_data.data.take,
            total: cform_data.data.total,
          });
          // Set search state to show we're filtering by refinery TIN
          settin(refinery_tin);
        }
      }

      setLoading(false);
    };
    init();
  }, [userid]);

  // const tinRef = useRef<InputRef>(null);
  const dvatTinRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const dvatTinSearch = async () => {
    if (
      dvatTinRef.current?.input?.value == undefined ||
      dvatTinRef.current?.input?.value == null ||
      dvatTinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter DVAT TIN number");
    }
    const search_response = await GetRefineryCform({
      searchType: "DVAT_TIN",
      searchValue: dvatTinRef.current?.input?.value,
      tin: tin || "",
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setCformData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    } else {
      toast.error(search_response.message || "No records found");
    }
  };

  const dvatNameSearch = async () => {
    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter DVAT Trade Name");
    }
    const search_response = await GetRefineryCform({
      searchType: "DVAT_NAME",
      searchValue: nameRef.current?.input?.value,
      tin: tin || "",
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setCformData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    } else {
      toast.error(search_response.message || "No records found");
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.DVAT_TIN) {
        if (
          dvatTinRef.current?.input?.value == undefined ||
          dvatTinRef.current?.input?.value == null ||
          dvatTinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter DVAT TIN number");
        }
        const search_response = await GetRefineryCform({
          searchType: "DVAT_TIN",
          searchValue: dvatTinRef.current?.input?.value,
          tin: tin || "",
          take: pagesize,
          skip: pagesize * (page - 1),
        });
        if (search_response.status && search_response.data?.result) {
          setCformData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
        }
      } else if (searchOption == SearchOption.DVAT_NAME) {
        if (
          nameRef.current?.input?.value == undefined ||
          nameRef.current?.input?.value == null ||
          nameRef.current?.input?.value == ""
        ) {
          return toast.error("Enter DVAT Trade Name");
        }
        const search_response = await GetRefineryCform({
          searchType: "DVAT_NAME",
          searchValue: nameRef.current?.input?.value,
          tin: tin || "",
          take: pagesize,
          skip: pagesize * (page - 1),
        });
        if (search_response.status && search_response.data?.result) {
          setCformData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
        }
      }
    } else {
      const cform_data = await GetRefineryCform({
        searchType: "NONE",
        tin: tin || "",
        take: pagesize,
        skip: pagesize * (page - 1),
      });

      if (cform_data.status && cform_data.data?.result) {
        setCformData(cform_data.data.result);
        setPaginatin({
          skip: cform_data.data.skip,
          take: cform_data.data.take,
          total: cform_data.data.total,
        });
      }
    }
  };

  function getMonthRange(date: Date): string {
    // Calculate the last month
    const lastMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    // Calculate the start month (last month - 2 months)
    const startMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() - 2,
      1,
    );

    // Helper function to format month names and last two digits of year
    const formatMonthYear = (date: Date): string => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${month} ${year}`;
    };

    // Format the range
    const start = formatMonthYear(startMonth);
    const end = formatMonthYear(lastMonth);

    return `${start} to ${end}`;
  }

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Refinery C-Form
                </h1>
              </div>
              <div className="grow"></div>
            </div>
          </div>

          {cformData.length == 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Alert
                style={{
                  borderRadius: "0.375rem",
                }}
                type="error"
                showIcon
                description="There is no Refinery C-Form."
              />
            </div>
          )}

          {cformData.length != 0 && (
            <>
              {/* Search and Filter Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
                <div className="mb-3 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        Search by:
                      </span>
                      <Radio.Group
                        onChange={onChange}
                        value={searchOption}
                        className="flex gap-3"
                      >
                        <Radio value={SearchOption.DVAT_TIN}>
                          <span className="text-xs">DVAT TIN</span>
                        </Radio>
                        <Radio value={SearchOption.DVAT_NAME}>
                          <span className="text-xs">Trade Name</span>
                        </Radio>
                      </Radio.Group>
                    </div>

                    {(() => {
                      switch (searchOption) {
                        case SearchOption.DVAT_TIN:
                          return (
                            <div className="flex gap-2">
                              <Input
                                size="small"
                                maxLength={11}
                                className="flex-1 md:flex-none md:w-40"
                                ref={dvatTinRef}
                                placeholder="Enter TIN Number"
                              />

                              {isSearch ? (
                                <Button
                                  size="small"
                                  onClick={init}
                                  type="primary"
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  Reset
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  onClick={dvatTinSearch}
                                  type="primary"
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  Search
                                </Button>
                              )}
                            </div>
                          );

                        case SearchOption.DVAT_NAME:
                          return (
                            <div className="flex gap-2">
                              <Input
                                size="small"
                                className="flex-1 md:flex-none md:w-40"
                                ref={nameRef}
                                placeholder="Enter Trade Name"
                              />

                              {isSearch ? (
                                <Button
                                  size="small"
                                  onClick={init}
                                  type="primary"
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  Reset
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  onClick={dvatNameSearch}
                                  type="primary"
                                  className="bg-blue-500 hover:bg-blue-600"
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
              </div>

              {/* Results Table Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b">
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          SR No
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          C-Form Type
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          Period
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          TIN Number
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          Seller Name
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          Amount
                        </TableHead>
                        <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cformData.map(
                        (val: cform & { dvat04: dvat04 }, index: number) => {
                          return (
                            <TableRow
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <TableCell className="p-2 text-center text-xs">
                                <span className="font-medium text-gray-900">
                                  {val.sr_no}
                                </span>
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs text-gray-700">
                                {val.cform_type}
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs text-gray-700">
                                {getMonthRange(val.to_period)}
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs font-medium text-gray-900">
                                {val.dvat04.tinNumber}
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs text-gray-700">
                                {val.dvat04.tradename}
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs font-medium text-gray-900">
                                ₹{formatIndianNumber(parseFloat(val.amount ?? "0"))}
                              </TableCell>
                              <TableCell className="p-2 text-center text-xs">
                                <Link
                                  href={`/dashboard/refinery/c_form/view/${encryptURLData(
                                    val.id.toString(),
                                  )}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Section */}
                <div className="bg-gray-50 border-t border-gray-200 p-3">
                  <div className="lg:hidden">
                    <Pagination
                      align="center"
                      defaultCurrent={1}
                      onChange={onChangePageCount}
                      showSizeChanger
                      total={pagination.total}
                      showTotal={(total: number) => `Total ${total} items`}
                      size="small"
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
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default RefineryCformStatus;
