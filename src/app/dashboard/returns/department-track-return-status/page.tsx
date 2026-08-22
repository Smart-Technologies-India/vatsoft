"use client";

import { Alert, Button, Input, Pagination, Drawer, Select } from "antd";
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
import { dvat04, returns_01, user } from "@prisma/client";
import { capitalcase, encryptURLData, formateDate } from "@/utils/methods";
import Link from "next/link";
import SearchReturnPayment from "@/action/return/searchreturnpayment";
import GetAllReturnPayment from "@/action/return/getallreturnpayment";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import { MdiDownload } from "@/components/icons";
import * as XLSX from "xlsx";

const TrackAppliation = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
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
    TIN,
    TRADE,
    PERIOD,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [periodYear, setPeriodYear] = useState<string | null>(null);
  const [periodMonth, setPeriodMonth] = useState<string | null>(null);

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

  // Generate available years and months from April 2026 to current date
  const getAvailableYearsAndMonths = () => {
    const startDate = new Date(2026, 3, 1); // April 2026 (month is 0-indexed)
    const currentDate = new Date();
    const years: string[] = [];
    const months: string[] = [];

    // Generate years
    for (let year = startDate.getFullYear(); year <= currentDate.getFullYear(); year++) {
      years.push(year.toString());
    }

    // Generate months for current year
    for (let month = 0; month < monthNames.length; month++) {
      // Include months from April onwards if current year, otherwise all months
      if (currentDate.getFullYear() > startDate.getFullYear()) {
        months.push(monthNames[month]);
      } else if (month >= 3) {
        // April is at index 3
        if (
          month < currentDate.getMonth() ||
          (month === currentDate.getMonth())
        ) {
          months.push(monthNames[month]);
        }
      }
    }

    return { years, months };
  };

  const { years: availableYears, months: availableMonths } =
    getAvailableYearsAndMonths();

  const [paymentData, setPaymentData] = useState<
    Array<returns_01 & { dvat04: dvat04 }>
  >([]);

  const [user, setUpser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const userrespone = await GetUser({ id: authResponse.data });
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

    if (monthIndex >= 0 && monthIndex <= 2) {
      // January to March
      return `${yearNum - 1}-${yearNum.toString().slice(-2)}`;
    } else {
      // April to December
      return `${yearNum}-${(yearNum + 1).toString().slice(-2)}`;
    }
  };

  const getQuarterMonths = (quarter: number | null | undefined): string => {
    if (!quarter) return "";
    switch (quarter) {
      case 1:
        return "Jan-Mar";
      case 2:
        return "Apr-Jun";
      case 3:
        return "Jul-Sep";
      case 4:
        return "Oct-Dec";
      default:
        return "";
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

  // Filter payment data to show only one quarterly return per DVAT when frequencyFilings is QUARTERLY
  const filteredPaymentData = paymentData.reduce(
    (
      acc: Array<returns_01 & { dvat04: dvat04 }>,
      current: returns_01 & { dvat04: dvat04 },
    ) => {
      // If frequencyFilings is not QUARTERLY, include the record
      if (current.dvat04.frequencyFilings !== "QUARTERLY") {
        acc.push(current);
      } else {
        // For QUARTERLY, check if we already have this DVAT
        const dvat04IdExists = acc.some(
          (item) => item.dvat04Id === current.dvat04Id,
        );
        // If not, add it (this will be the first/latest quarterly return for this DVAT)
        if (!dvat04IdExists) {
          acc.push(current);
        }
      }
      return acc;
    },
    [],
  );

  const [isSearch, setSearch] = useState<boolean>(false);
  const arnRef = useRef<InputRef>(null);
  const tinRef = useRef<InputRef>(null);
  const tradeRef = useRef<InputRef>(null);

  const init = async () => {
    setPeriodYear(null);
    setPeriodMonth(null);
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

  const periodsearch = async () => {
    if (periodYear == null || periodMonth == null) {
      return toast.error("Select year and month");
    }

    const search_response = await SearchReturnPayment({
      dept: user?.selectOffice!,
      month: periodMonth,
      year: periodYear,
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
          tradeRef.current?.input?.value == undefined ||
          tradeRef.current?.input?.value == null ||
          tradeRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Trade number");
        }
        const search_response = await SearchReturnPayment({
          trade: tradeRef.current?.input?.value,
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

  const currentPage =
    pagination.take > 0 ? Math.floor(pagination.skip / pagination.take) + 1 : 1;

  const handleDownloadExcel = async () => {
    try {
      toast.loading("Preparing Excel file...");

      // Build search parameters based on current search
      const searchParams: any = {
        dept: user?.selectOffice,
      };

      if (isSearch) {
        if (searchOption === SearchOption.ARN && arnRef.current?.input?.value) {
          searchParams.rr_number = arnRef.current.input.value;
        } else if (searchOption === SearchOption.RETURN && searchDate) {
          searchParams.fromdate = searchDate[0]?.toDate();
          searchParams.todate = searchDate[1]?.toDate();
        } else if (
          searchOption === SearchOption.TIN &&
          tinRef.current?.input?.value
        ) {
          searchParams.tin = tinRef.current.input.value;
        } else if (
          searchOption === SearchOption.TRADE &&
          tradeRef.current?.input?.value
        ) {
          searchParams.trade = tradeRef.current.input.value;
        } else if (searchOption === SearchOption.PERIOD && periodYear && periodMonth) {
          searchParams.month = periodMonth;
          searchParams.year = periodYear;
        }
      }

      // Fetch all data
      const response = await GetAllReturnPayment(searchParams);

      if (!response.status || !response.data) {
        toast.dismiss();
        toast.error(response.message || "Failed to fetch data");
        return;
      }

      // Apply same filtering logic for quarterly returns
      const filteredForExport = response.data.reduce(
        (acc: any[], current: any) => {
          if (current.dvat04.frequencyFilings !== "QUARTERLY") {
            acc.push(current);
          } else {
            const dvat04IdExists = acc.some(
              (item) => item.dvat04Id === current.dvat04Id,
            );
            if (!dvat04IdExists) {
              acc.push(current);
            }
          }
          return acc;
        },
        [],
      );

      // Prepare data for Excel
      const excelData = filteredForExport.map((item: any) => {
        const isQuarterly = item.dvat04.frequencyFilings === "QUARTERLY";
        const taxPeriodDisplay = isQuarterly
          ? getQuarterMonths(item.quarter)
          : item.month;

        return {
          ARN: item.rr_number,
          "Return Type": item.return_type,
          "Financial Year": get_years(
            new Date(item.transaction_date).toLocaleString("en-US", {
              month: "long",
            }),
            item.year,
          ),
          "Tax Period": taxPeriodDisplay,
          "Date of Filing": formateDate(new Date(item.transaction_date)),
          "Filing Type": item.compositionScheme ? "COMP" : "REG",
          "TIN Number": item.dvat04.tinNumber,
          "Trade Name": item.dvat04.tradename,
          "Dealer Name": item.dvat04.name,
        };
      });

      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Return Status");

      // Set column widths
      const columnWidths = [
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
      ];
      worksheet["!cols"] = columnWidths;

      // Download file
      XLSX.writeFile(workbook, `Return_Status_${new Date().getTime()}.xlsx`);

      toast.dismiss();
      toast.success(
        `Successfully exported ${excelData.length} records to Excel`,
      );
    } catch (error) {
      toast.dismiss();
      toast.error("Error downloading file");
      console.error("Download error:", error);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-gray-300 rounded-full"></div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Track Filed Return
                </h1>
              </div>
              <Button
                type="default"
                onClick={() => setDrawerOpen(true)}
                className="border-gray-300 text-gray-700 hover:text-gray-900"
              >
                Info
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Search Section */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <Radio.Group
                onChange={onChange}
                value={searchOption}
                disabled={isSearch}
              >
                <Radio value={SearchOption.ARN}>ARN</Radio>
                <Radio value={SearchOption.RETURN}>Tax Period</Radio>
                <Radio value={SearchOption.TIN}>TIN Number</Radio>
                <Radio value={SearchOption.TRADE}>Trade Name</Radio>
                <Radio value={SearchOption.PERIOD}>Period</Radio>
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
                  case SearchOption.PERIOD:
                    return (
                      <div className="flex gap-2 items-center">
                        <Select
                          placeholder="Select Year"
                          value={periodYear}
                          onChange={(value) => setPeriodYear(value)}
                          disabled={isSearch}
                          style={{ width: 150 }}
                          options={availableYears.map((year) => ({
                            label: year,
                            value: year,
                          }))}
                        />
                        <Select
                          placeholder="Select Month"
                          value={periodMonth}
                          onChange={(value) => setPeriodMonth(value)}
                          disabled={isSearch}
                          style={{ width: 150 }}
                          options={availableMonths.map((month) => ({
                            label: month,
                            value: month,
                          }))}
                        />
                        {isSearch ? (
                          <Button onClick={init} type="primary">
                            Reset
                          </Button>
                        ) : (
                          <Button onClick={periodsearch} type="primary">
                            Search
                          </Button>
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              })()}
              <Button
                type="primary"
                icon={<MdiDownload className="w-4 h-4" />}
                onClick={handleDownloadExcel}
                className="flex items-center gap-2"
              >
                Download as Excel
              </Button>
            </div>
          </div>

          {filteredPaymentData.length == 0 ? (
            <div className="p-6">
              <Alert
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                }}
                type="error"
                showIcon
                description="There is no Filed Return."
              />
            </div>
          ) : (
            <>
              {/* Download Button */}

              {/* Table Section */}
              <div className="p-6">
                <Table className="border border-gray-200 rounded-lg overflow-hidden">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                        Filing Type
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        TIN Number
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        Trade Name
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                        Dealer Name
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentData.map(
                      (val: returns_01 & { dvat04: dvat04 }, index: number) => {
                        const isQuarterly =
                          val.dvat04.frequencyFilings === "QUARTERLY";
                        const taxPeriodDisplay = isQuarterly
                          ? val.quarter
                          : val.month;

                        return (
                          <TableRow
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="border text-center p-3">
                              <Link
                                href={`/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                                  val.createdById.toString(),
                                )}/${encryptURLData(
                                  val.dvat04Id.toString(),
                                )}?form=30A&year=${val.year}&quarter=${
                                  val.quarter
                                }&month=${val.month}`}
                                className="text-gray-700 hover:text-gray-900 font-medium hover:underline"
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
                                  },
                                ),
                                val.year,
                              )}
                            </TableCell>
                            <TableCell className="border text-center p-3 text-gray-900">
                              {taxPeriodDisplay}
                            </TableCell>
                            <TableCell className="border text-center p-3 text-gray-900">
                              {formateDate(new Date(val.transaction_date!))}
                            </TableCell>
                            <TableCell className="border text-center p-3">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                  val.compositionScheme
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {val.compositionScheme ? "COMP" : "REG"}
                              </span>
                            </TableCell>
                            <TableCell className="border text-center p-3 font-medium text-gray-900">
                              {val.dvat04.tinNumber}
                            </TableCell>
                            <TableCell className="border text-center p-3 text-gray-900">
                              {val.dvat04.tradename}
                            </TableCell>
                            <TableCell className="border text-center p-3 text-gray-900">
                              {val.dvat04.name}
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Section */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="lg:hidden">
                  <Pagination
                    align="center"
                    current={currentPage}
                    pageSize={pagination.take}
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
                    current={currentPage}
                    pageSize={pagination.take}
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
