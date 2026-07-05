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
    NAME,
    TIN,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [cformData, setCformData] = useState<Array<cform>>([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const init = async () => {
    setLoading(true);
    const refinery_response = await GetCurrentRefinery();
    if (refinery_response.status && refinery_response.data?.tinNumber) {
      const refinery_tin = refinery_response.data.tinNumber;

      const cform_data = await GetRefineryCform({
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
        if (tinRef.current?.input) {
          tinRef.current.input.value = refinery_tin;
        }
        setSearch(true);
      }
    }
    const dvat_response = await GetUserDvat04();
    if (dvat_response.data && dvat_response.status) {
      setDvatData(dvat_response.data);
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

      // Get current refinery's TIN number
      const refinery_response = await GetCurrentRefinery();
      if (refinery_response.status && refinery_response.data?.tinNumber) {
        const refinery_tin = refinery_response.data.tinNumber;

        // Automatically load C-forms for current refinery's TIN
        const cform_data = await GetRefineryCform({
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
          if (tinRef.current?.input) {
            tinRef.current.input.value = refinery_tin;
          }
          setSearch(true);
        }
      }

      setLoading(false);
    };
    init();
  }, [userid]);

  const tinRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const tinsearch = async () => {
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Seller TIN number");
    }
    const search_response = await GetRefineryCform({
      tin: tinRef.current?.input?.value,
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
    }
  };

  const namesearch = async () => {
    toast.info("Search by seller name is only available when filtering by TIN");
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Seller TIN number");
        }
        const search_response = await GetRefineryCform({
          tin: tinRef.current?.input?.value,
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
          setSearch(true);
        }
      }
    } else {
      const cform_data = await GetRefineryCform({
        tin: tinRef.current?.input?.value || "",
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
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                Refinery C-Form
              </h1>
              <p className="text-sm text-gray-500 mt-2 ml-4">
                View and manage your Refinery C-Form declarations
              </p>
            </div>
          </div>
        </div>

        {cformData.length == 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <Alert
              style={{
                borderRadius: "0.5rem",
              }}
              type="error"
              showIcon
              description="There is no Refinery C-Form."
            />
          </div>
        )}

        {cformData.length != 0 && (
          <>
            {/* Search Section Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Search by:
                  </span>
                  <Radio.Group
                    onChange={onChange}
                    value={searchOption}
                    disabled={isSearch}
                    className="flex gap-2"
                  >
                    <Radio value={SearchOption.TIN}>
                      <span className="text-sm">TIN Number</span>
                    </Radio>
                    <Radio value={SearchOption.NAME}>
                      <span className="text-sm">Seller Name</span>
                    </Radio>
                  </Radio.Group>
                </div>

                {(() => {
                  switch (searchOption) {
                    case SearchOption.TIN:
                      return (
                        <div className="flex gap-2 flex-1">
                          <Input
                            maxLength={11}
                            className="max-w-xs"
                            ref={tinRef}
                            placeholder="Enter Seller TIN Number"
                            disabled={isSearch}
                          />

                          {isSearch ? (
                            <Button
                              onClick={init}
                              type="primary"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              Reset
                            </Button>
                          ) : (
                            <Button
                              onClick={tinsearch}
                              type="primary"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
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
                            placeholder="Enter Seller Name"
                            disabled={isSearch}
                          />

                          {isSearch ? (
                            <Button
                              onClick={init}
                              type="primary"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              Reset
                            </Button>
                          ) : (
                            <Button
                              onClick={namesearch}
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

            {/* Results Table Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="border-0">
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        SR No
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        C-Form Type
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        Period
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        TIN Number
                      </TableHead>

                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        Seller Name
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        Amount
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border border-gray-200 p-3 font-semibold text-gray-700">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cformData.map((val: cform, index: number) => {
                      return (
                        <TableRow
                          key={index}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <TableCell className="border border-gray-200 text-center p-3">
                            <span className="font-medium text-gray-900">
                              {val.sr_no}
                            </span>
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-gray-700">
                            {val.cform_type}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-gray-700">
                            {getMonthRange(val.to_period)}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 font-medium text-gray-900">
                            {val.seller_tin_no}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 text-gray-700">
                            {val.seller_name}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3 font-medium text-gray-900">
                            ₹{parseFloat(val.amount ?? "0").toFixed(2)}
                          </TableCell>
                          <TableCell className="border border-gray-200 text-center p-3">
                            <Link
                              href={`/dashboard/refinery/c_form/view/${encryptURLData(
                                val.id.toString(),
                              )}`}
                              className="text-blue-500 hover:text-blue-700 font-medium hover:underline"
                            >
                              View
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Section */}
              <div className="bg-gray-50 border-t border-gray-200 p-4">
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
          </>
        )}
      </div>
    </>
  );
};

export default RefineryCformStatus;
