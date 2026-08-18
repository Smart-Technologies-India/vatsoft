/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { MdiDownload } from "@/components/icons";
import { Radio, DatePicker, Select, Pagination, Alert } from "antd";

import { Button, Input, InputRef, RadioChangeEvent } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useRef, useState } from "react";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { FormType, FrequencyFilings, order_notice, user } from "@prisma/client";
import { capitalcase, encryptURLData, formateDate } from "@/utils/methods";
import GetUser from "@/action/user/getuser";
import SearchNoticeOrder from "@/action/notice_order/searchordernotice";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const SupplierDetails = () => {
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
    TYPE,
    DATE,
    TIN,
    TRADENAME,
    ORDER,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TYPE,
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

  // Format period based on frequencyFilings
  const formatPeriod = (
    taxPeriodFrom: Date | null,
    taxPeriodTo: Date | null,
    frequencyFilings: FrequencyFilings,
  ): string => {
    if (!taxPeriodFrom || !taxPeriodTo) return "-";

    const fromDate = new Date(taxPeriodFrom);
    const toDate = new Date(taxPeriodTo);
    const fromMonth = monthNames[fromDate.getMonth()];
    const toMonth = monthNames[toDate.getMonth()];
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();
    if (frequencyFilings === "MONTHLY") {
      // Format: "Apr 2026"
      return `${fromMonth.substring(0, 3)} ${fromYear}`;
    } else if (frequencyFilings === "QUARTERLY") {
      // Format: "Apr-Jun 2026"
      return `${fromMonth.substring(0, 3)}-${toMonth.substring(0, 3)} ${fromYear}`;
    }

    return "-";
  };

  const orderRef = useRef<InputRef>(null);

  const ordersearch = async () => {
    if (
      orderRef.current?.input?.value == undefined ||
      orderRef.current?.input?.value == null ||
      orderRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Notice/Order id number");
    }
    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      order: orderRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const tinRef = useRef<InputRef>(null);

  const tinsearch = async () => {
    if (
      tinRef.current?.input?.value == undefined ||
      tinRef.current?.input?.value == null ||
      tinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN number");
    }
    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      tin: tinRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const tradeRef = useRef<InputRef>(null);

  const tradesearch = async () => {
    if (
      tradeRef.current?.input?.value == undefined ||
      tradeRef.current?.input?.value == null ||
      tradeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter Trade Name");
    }
    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      tradename: tradeRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const typesearch = async () => {
    if (formtype == null) {
      return toast.error("Select Type.");
    }

    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      form_type: formtype,
      take: 10,
      skip: 0,
    });

    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (periodYear == null || periodMonth == null) {
      return toast.error("Select year and month");
    }

    const search_response = await SearchNoticeOrder({
      dept: user?.selectOffice!,
      tax_period_year: periodYear,
      tax_period_month: periodMonth,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setNoticeData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const init = async () => {
    setLoading(true);
    setPeriodYear(null);
    setPeriodMonth(null);

    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);

      const notice_response = await SearchNoticeOrder({
        dept: user?.selectOffice!,
        take: pagination.take,
        skip: pagination.skip,
      });
      if (notice_response.status && notice_response.data.result) {
        setNoticeData(notice_response.data.result);
        setPaginatin({
          skip: pagination.skip,
          take: pagination.take,
          total: notice_response.data.total,
        });
      }
      setLoading(false);
    }
    setSearch(false);
    setLoading(false);
  };

  const [formtype, setFormtype] = useState<FormType | null>(null);

  const onFormType = (value: string) => {
    setFormtype(value as FormType);
  };

  const [noticeData, setNoticeData] = useState<order_notice[]>([]);
  const [user, setUpser] = useState<user | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

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

        const notice_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          take: pagination.take,
          skip: pagination.skip,
        });
        console.log("Notice Response:", notice_response);
        if (notice_response.status && notice_response.data.result) {
          setNoticeData(notice_response.data.result);
          setPaginatin({
            skip: pagination.skip,
            take: pagination.take,
            total: notice_response.data.total,
          });
        }

        setLoading(false);
      }
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TYPE) {
        if (formtype == null) {
          return toast.error("Select Type.");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,

          form_type: formtype,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.DATE) {
        if (periodYear == null || periodMonth == null) {
          return toast.error("Select year and month");
        }

        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          tax_period_year: periodYear,
          tax_period_month: periodMonth,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
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
          return toast.error("Enter TIN number");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          tin: tinRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.TRADENAME) {
        if (
          tradeRef.current?.input?.value == undefined ||
          tradeRef.current?.input?.value == null ||
          tradeRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Trade Name");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          tradename: tradeRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.ORDER) {
        if (
          orderRef.current?.input?.value == undefined ||
          orderRef.current?.input?.value == null ||
          orderRef.current?.input?.value == ""
        ) {
          return toast.error("Enter Notice/Order id number");
        }
        const search_response = await SearchNoticeOrder({
          dept: user?.selectOffice!,
          order: orderRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          setNoticeData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const search_response = await SearchNoticeOrder({
        dept: user?.selectOffice!,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (search_response.status && search_response.data.result) {
        setNoticeData(search_response.data.result);
        setPaginatin({
          skip: search_response.data.skip,
          take: search_response.data.take,
          total: search_response.data.total,
        });
      }
    }
  };
  const getLink = (type: FormType, id: number): string => {
    switch (type) {
      case FormType.DVAT10:
        return `/dashboard/returns/dvat10?id=${encryptURLData(id.toString())}`;
      case FormType.DVAT24:
        return `/dashboard/returns/dvat24?id=${encryptURLData(id.toString())}`;
      case FormType.DVAT24A:
        return `/dashboard/returns/dvat24a?id=${encryptURLData(id.toString())}`;
      default:
        return `/dashboard/returns/dvat10?id=${encryptURLData(id.toString())}`;
    }
  };
  const downloadNoticeOrder = async (type: FormType, id: number) => {
    // Open the notice template in a new window and print to PDF
    const noticeUrl = `/dashboard/returns/notice-template?id=${encryptURLData(id.toString())}&sidebar=no`;
    const window_ref = window.open(noticeUrl, "_blank");

    if (window_ref) {
      // Wait for the page to load, then trigger print dialog
      window_ref.addEventListener("load", () => {
        setTimeout(() => {
          window_ref.print();
        }, 3000);
      });
    }
  };

  const downloadAsExcel = async () => {
    try {
      setIsDownloading(true);
      const { utils, writeFile } = await import("xlsx");

      let allData: any[] = [];
      let currentSkip = 0;
      const pageSize = 100;
      let hasMore = true;

      // Fetch all data based on current search criteria
      while (hasMore) {
        let search_response: any = null;

        if (isSearch) {
          if (searchOption === SearchOption.TYPE) {
            if (formtype == null) {
              toast.error("Select Type.");
              return;
            }
            search_response = await SearchNoticeOrder({
              dept: user?.selectOffice!,
              form_type: formtype,
              take: pageSize,
              skip: currentSkip,
            });
          } else if (searchOption === SearchOption.DATE) {
            if (periodYear == null || periodMonth == null) {
              toast.error("Select year and month");
              return;
            }
            search_response = await SearchNoticeOrder({
              dept: user?.selectOffice!,
              tax_period_year: periodYear,
              tax_period_month: periodMonth,
              take: pageSize,
              skip: currentSkip,
            });
          } else if (searchOption === SearchOption.TIN) {
            if (
              tinRef.current?.input?.value == undefined ||
              tinRef.current?.input?.value == null ||
              tinRef.current?.input?.value == ""
            ) {
              toast.error("Enter TIN number");
              return;
            }
            search_response = await SearchNoticeOrder({
              dept: user?.selectOffice!,
              tin: tinRef.current?.input?.value,
              take: pageSize,
              skip: currentSkip,
            });
          } else if (searchOption === SearchOption.TRADENAME) {
            if (
              tradeRef.current?.input?.value == undefined ||
              tradeRef.current?.input?.value == null ||
              tradeRef.current?.input?.value == ""
            ) {
              toast.error("Enter Trade Name");
              return;
            }
            search_response = await SearchNoticeOrder({
              dept: user?.selectOffice!,
              tradename: tradeRef.current?.input?.value,
              take: pageSize,
              skip: currentSkip,
            });
          } else if (searchOption === SearchOption.ORDER) {
            if (
              orderRef.current?.input?.value == undefined ||
              orderRef.current?.input?.value == null ||
              orderRef.current?.input?.value == ""
            ) {
              toast.error("Enter Notice/Order id number");
              return;
            }
            search_response = await SearchNoticeOrder({
              dept: user?.selectOffice!,
              order: orderRef.current?.input?.value,
              take: pageSize,
              skip: currentSkip,
            });
          }
        } else {
          search_response = await SearchNoticeOrder({
            dept: user?.selectOffice!,
            take: pageSize,
            skip: currentSkip,
          });
        }

        if (
          search_response &&
          search_response.status &&
          search_response.data.result &&
          search_response.data.result.length > 0
        ) {
          allData = allData.concat(search_response.data.result);
          currentSkip += pageSize;

          if (
            search_response.data.result.length < pageSize ||
            currentSkip >= search_response.data.total
          ) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // Format data for Excel
      const excelData = allData.map((val: any) => ({
        "Order Id": val.ref_no.toUpperCase(),
        "Trade Name": val.dvat?.tradename || "-",
        "TIN Number": val.dvat?.tinNumber || "-",
        Period: formatPeriod(
          val.tax_period_from,
          val.tax_period_to,
          val.dvat?.frequencyFilings || null,
        ),
        "Issued By": "System Generated",
        Type: capitalcase(val.notice_order_type),
        Description: val.form_type,
        "Date of Issuance": formateDate(val.issue_date),
        "Due Date": formateDate(val.due_date),
        "Amount of Demand": val.amount || "-",
        Status: capitalcase(val.status),
      }));

      // Create worksheet and workbook
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Notices & Orders");

      // Set column widths
      ws["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
      ];

      // Download the file
      writeFile(wb, `Notices_Orders_${new Date().getTime()}.xlsx`);
      toast.success("Downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
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
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
          }
          .no-print {
            display: none !important;
          }
          .print-hide {
            display: none !important;
          }
          table {
            font-size: 11px;
            line-height: 1.3;
          }
          td, th {
            padding: 4px;
          }
          tr {
            page-break-inside: avoid;
          }
        }
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      `}</style>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex justify-between items-center">
            <span>List of Notices & Orders issued by Authorities</span>
            <button
              onClick={downloadAsExcel}
              disabled={isDownloading || noticeData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            >
              <MdiDownload className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download Excel"}
            </button>
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center no-print">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
              disabled={isSearch}
            >
              <Radio value={SearchOption.TYPE}>Type</Radio>
              <Radio value={SearchOption.DATE}>Tax Period</Radio>
              <Radio value={SearchOption.TIN}>TIN Number</Radio>
              <Radio value={SearchOption.TRADENAME}>Trade Name</Radio>
              <Radio value={SearchOption.ORDER}>Notice/Demand Order Id</Radio>
            </Radio.Group>
            {(() => {
              switch (searchOption) {
                case SearchOption.TYPE:
                  return (
                    <div className="flex gap-2">
                      <Select
                        showSearch
                        placeholder="Select Type"
                        optionFilterProp="label"
                        onChange={onFormType}
                        disabled={isSearch}
                        options={[
                          {
                            value: FormType.DVAT10,
                            label: "DVAT 10",
                          },
                          {
                            value: FormType.DVAT24,
                            label: "DVAT24",
                          },
                          {
                            value: FormType.DVAT24A,
                            label: "DVAT 24A",
                          },
                        ]}
                      />

                      <Button
                        onClick={typesearch}
                        type="primary"
                        disabled={isSearch}
                      >
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.DATE:
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
                      <Button type="primary" onClick={datesearch}>
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
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
                case SearchOption.TRADENAME:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={tradeRef}
                        placeholder={"Enter Trade Name"}
                        disabled={isSearch}
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
                case SearchOption.ORDER:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={orderRef}
                        placeholder={"Enter Notice/Demand Order Id"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={ordersearch} type="primary">
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
          {noticeData.length == 0 ? (
            <>
              <Alert
                style={{
                  marginTop: "10px",
                  padding: "8px",
                }}
                type="error"
                showIcon
                description="There is no Notice and Order."
              />
            </>
          ) : (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="">Notice/Demand Order Id</TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Trade Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Period
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Issued By
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Type
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Notice/ Order Description
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Date of Issuance
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Due Date
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Amount of Demand
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Status
                    </TableHead>
                    <TableHead className="text-center border p-2">
                      Download
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticeData.map((val: order_notice, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center border p-2">
                        {/* <Link
                          href={getLink(val.form_type, val.id)}
                          className="text-blue-500"
                        >
                          {val.ref_no.toUpperCase()}
                        </Link> */}
                        <button
                          title="Download Notice as PDF"
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 cursor-pointer"
                          onClick={async () => {
                            await downloadNoticeOrder(val.form_type, val.id);
                          }}
                        >
                          {val.ref_no.toUpperCase()}
                        </button>
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {(val as any).dvat?.tradename || "-"}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {(val as any).dvat?.tinNumber || "-"}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap  border p-2">
                        {formatPeriod(
                          val.tax_period_from,
                          val.tax_period_to,
                          (val as any).dvat?.frequencyFilings || null,
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap  border p-2">
                        System Generated
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {capitalcase(val.notice_order_type)}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {val.form_type}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap border p-2">
                        {formateDate(val.issue_date)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap border p-2">
                        {formateDate(val.due_date)}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {val.amount}
                      </TableCell>
                      <TableCell className="text-center border p-2">
                        {capitalcase(val.status)}
                      </TableCell>
                      <TableCell className="text-center text-blue-500 border p-2">
                        <button
                          title="Download Notice as PDF"
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 cursor-pointer"
                          onClick={async () => {
                            await downloadNoticeOrder(val.form_type, val.id);
                          }}
                        >
                          <MdiDownload className="w-5 h-5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          <div className="mt-2"></div>
          <div className="lg:hidden no-print">
            <Pagination
              align="center"
              defaultCurrent={1}
              onChange={onChangePageCount}
              showSizeChanger
              total={pagination.total}
              showTotal={(total: number) => `Total ${total} items`}
            />
          </div>
          <div className="hidden lg:block no-print">
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
          {/* <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                router.back();
              }}
              type="default"
            >
              Back
            </Button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default SupplierDetails;
