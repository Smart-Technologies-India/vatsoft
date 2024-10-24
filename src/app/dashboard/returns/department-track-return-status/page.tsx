"use client";

import { Button, Input, Pagination } from "antd";

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
import { dvat04, returns_01, user } from "@prisma/client";
import { capitalcase, formateDate } from "@/utils/methods";
import Link from "next/link";
import SearchReturnPayment from "@/action/return/searchreturnpayment";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import { useRouter } from "next/navigation";

const TrackAppliation = () => {
  const userid: number = parseFloat(getCookie("id") ?? "0");
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
    TIN,
    TRADE,
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

  const [paymentData, setPaymentData] = useState<
    Array<returns_01 & { dvat04: dvat04 }>
  >([]);

  const [user, setUpser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const userrespone = await GetUser({ id: userid });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const payment_data = await SearchReturnPayment({
          dept: userrespone.data.selectOffice!,
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
      }
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
  const [isSearch, setSearch] = useState<boolean>(false);
  const arnRef = useRef<InputRef>(null);
  const tinRef = useRef<InputRef>(null);
  const tradeRef = useRef<InputRef>(null);

  const init = async () => {
    const payment_data = await SearchReturnPayment({
      dept: user?.selectOffice!,
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
    setSearch(false);
  };

  const cpinsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await SearchReturnPayment({
      rr_number: arnRef.current?.input?.value,
      dept: user?.selectOffice!,
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
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      dept: user?.selectOffice!,
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

  const tinsearch = async () => {
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await SearchReturnPayment({
      tin: tinRef.current?.input?.value,
      dept: user?.selectOffice!,
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
  const tradesearch = async () => {
    if (
      tradeRef.current?.input?.value == undefined ||
      tradeRef.current?.input?.value == null ||
      tradeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Trade number");
    }
    const search_response = await SearchReturnPayment({
      trade: tradeRef.current?.input?.value,
      dept: user?.selectOffice!,
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
          rr_number: arnRef.current?.input?.value,
          dept: user?.selectOffice!,
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

        const search_response = await SearchReturnPayment({
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          dept: user?.selectOffice!,
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
      } else if (searchOption == SearchOption.TIN) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter TIN Number");
        }
        const search_response = await SearchReturnPayment({
          tin: tinRef.current?.input?.value,
          dept: user?.selectOffice!,
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
      } else if (searchOption == SearchOption.TRADE) {
        if (
          tinRef.current?.input?.value == undefined ||
          tinRef.current?.input?.value == null ||
          tinRef.current?.input?.value == ""
        ) {
          return toast.error("Enter TIN Number");
        }
        const search_response = await SearchReturnPayment({
          tin: tinRef.current?.input?.value,
          dept: user?.selectOffice!,
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
      const payment_data = await SearchReturnPayment({
        dept: user?.selectOffice!,
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

  return (
    <>
      <div className="p-6">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Track Filed Return</p>
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
          <div className="p-2 bg-gray-50 mt-2 flex gap-2 items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.RETURN}>Tax Period</Radio>
              <Radio value={SearchOption.TIN}>Tin Number</Radio>
              <Radio value={SearchOption.TRADE}>Trade Name</Radio>
            </Radio.Group>
            {(() => {
              switch (searchOption) {
                case SearchOption.ARN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter ARN"}
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
                case SearchOption.TIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tinRef}
                        placeholder={"Enter TIN Number"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={tinsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );
                case SearchOption.TRADE:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tradeRef}
                        disabled={isSearch}
                        placeholder={"Enter Trade Name"}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={tradesearch} type="primary">
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

          {paymentData.length == 0 ? (
            <>
              <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
                <p className="flex-1">There is no Payment Challan.</p>
              </div>
            </>
          ) : (
            <>
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
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Trade Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Dealer Name
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentData.map(
                    (val: returns_01 & { dvat04: dvat04 }, index: number) => {
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
                            {val.dvat04.tinNumber}
                          </TableCell>
                          <TableCell className="border text-center p-2">
                            {val.dvat04.tradename}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
              <div className="mt-2"></div>
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
            </>
          )}
          {/* <div className="mt-2"></div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }}
          >
            Back
          </Button> */}
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
