"use client";
import { Alert, Button, Input, Pagination, Drawer } from "antd";

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
import { cform, dvat04 } from "@prisma/client";
import {
  capitalcase,
  decryptURLData,
  encryptURLData,
} from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUserCform from "@/action/cform/getusercform";
import { useParams, useRouter } from "next/navigation";

const TrackAppliation = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const userid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router)
  );

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
    SearchOption.TIN
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

  const [cformData, setCformData] = useState<Array<cform>>([]);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04({
      userid: userid,
    });

    if (dvat_response.data && dvat_response.status) {
      setDvatData(dvat_response.data);
      const cform_data = await GetUserCform({
        dvatid: dvat_response.data.id,
        take: 10,
        skip: 0,
      });

      if (cform_data.status && cform_data.data.result) {
        setCformData(cform_data.data.result);
        setPaginatin({
          skip: cform_data.data.skip,
          take: cform_data.data.take,
          total: cform_data.data.total,
        });
      }
    }

    setLoading(false);
  };
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const dvat_response = await GetUserDvat04({
        userid: userid,
      });

      if (dvat_response.data && dvat_response.status) {
        setDvatData(dvat_response.data);
        const cform_data = await GetUserCform({
          dvatid: dvat_response.data.id,
          take: 10,
          skip: 0,
        });

        if (cform_data.status && cform_data.data.result) {
          setCformData(cform_data.data.result);
          setPaginatin({
            skip: cform_data.data.skip,
            take: cform_data.data.take,
            total: cform_data.data.total,
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

  const tinRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const tinsearch = async () => {
    if (!dvatdata) return;
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Purchaser TIN number");
    }
    const search_response = await GetUserCform({
      dvatid: dvatdata.id,
      tin: tinRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
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
    if (!dvatdata) return;

    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Purchaser Name");
    }
    const search_response = await GetUserCform({
      name: nameRef.current?.input?.value,
      dvatid: dvatdata.id,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setCformData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata) return;
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Purchaser TIN number");
        }
        const search_response = await GetUserCform({
          dvatid: dvatdata.id,
          tin: tinRef.current?.input?.value,
          take: 10,
          skip: 0,
        });
        if (search_response.status && search_response.data.result) {
          setCformData(search_response.data.result);
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
          return toast.error("Enter Purchaser Name");
        }
        const search_response = await GetUserCform({
          name: nameRef.current?.input?.value,
          dvatid: dvatdata.id,
          take: 10,
          skip: 0,
        });
        if (search_response.status && search_response.data.result) {
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
      const cform_data = await GetUserCform({
        dvatid: dvatdata.id,
        take: pagesize,
        skip: pagesize * (page - 1),
      });

      if (cform_data.status && cform_data.data.result) {
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
      1
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
      const year = date.getFullYear().toString().slice(-2); // Get last two digits of year
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-white rounded-full"></div>
              <h1 className="text-2xl font-bold text-white">Track C-Form</h1>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {cformData.length == 0 && (
            <div className="p-6">
              <Alert
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                }}
                type="error"
                showIcon
                description="There is no C-Form."
              />
            </div>
          )}

          {cformData.length != 0 && (
            <>
              {/* Search Section */}
              <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                <Radio.Group
                  onChange={onChange}
                  value={searchOption}
                  disabled={isSearch}
                >
                  <Radio value={SearchOption.TIN}>TIN Number</Radio>
                  <Radio value={SearchOption.NAME}>Purchaser Name</Radio>
                </Radio.Group>
                {(() => {
                  switch (searchOption) {
                    case SearchOption.TIN:
                      return (
                        <div className="flex gap-3">
                          <Input
                            className="w-60 border-gray-300 focus:border-blue-500"
                            ref={tinRef}
                            placeholder={"Enter Purchaser TIN Number"}
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
                              onClick={tinsearch} 
                              type="primary"
                              className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
                            >
                              Search
                            </Button>
                          )}
                        </div>
                      );

                    case SearchOption.NAME:
                      return (
                        <div className="flex gap-3">
                          <Input
                            className="w-60 border-gray-300 focus:border-blue-500"
                            ref={nameRef}
                            placeholder={"Enter Purchaser Name"}
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
                              onClick={namesearch} 
                              type="primary"
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
                        C-Form Type
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        Form Period
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        TIN Number
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        Purchaser Name
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cformData.map((val: cform, index: number) => {
                      return (
                        <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="border text-center p-3">
                            <Link
                              href={`/dashboard/cform/${encryptURLData(
                                val.id.toString()
                              )}`}
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                              {val.sr_no}
                            </Link>
                          </TableCell>
                          <TableCell className="border text-center p-3 text-gray-900">
                            {val.cform_type}
                          </TableCell>
                          <TableCell className="border text-center p-3 text-gray-900">
                            {getMonthRange(val.to_period)}
                          </TableCell>
                          <TableCell className="border text-center p-3 text-gray-900">
                            {val.seller_tin_no}
                          </TableCell>
                          <TableCell className="border text-center p-3 text-gray-900">
                            {val.seller_name}
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
