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
import { Radio, Button, Input, Pagination, Alert, Drawer } from "antd";
import { useEffect, useRef, useState } from "react";

import type { Dayjs } from "dayjs";

import { dvat04, user } from "@prisma/client";
import DeptPendingReturn from "@/action/dvat/deptpendingreturn";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import Link from "next/link";
import { encryptURLData } from "@/utils/methods";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetAllPendingReturn from "@/action/dvat/getallpendingreturn";
import { MdiDownload } from "@/components/icons";
import * as XLSX from "xlsx";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
  notice: number;
}

const TrackAppliation = () => {
  const [userid, setUserId] = useState<number>(0);
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
    COMPOSITION,
    FREQUENCY_FILINGS,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);
  const [compositionFilter, setCompositionFilter] = useState<string>("");
  const [frequencyFilingsFilter, setFrequencyFilingsFilter] =
    useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user>();

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
          (a: ResponseType, b: ResponseType) => b.pending - a.pending,
        );
        setDvatData(sortedData);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
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

      setUserId(authResponse.data);
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
            (a: ResponseType, b: ResponseType) => b.pending - a.pending,
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

  const arnsearch = async () => {
    if (!user) return toast.error("User not found. Please login again.");
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await DeptPendingReturn({
      arnnumber: arnRef.current?.input?.value,
      dept: user.selectOffice ?? "DIU",
      take: 10,
      skip: 0,
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
  };

  const datesearch = async () => {
    if (!user) return toast.error("User not found. Please login again.");

    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    const search_response = await DeptPendingReturn({
      dept: user.selectOffice ?? "DIU",
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      take: 10,
      skip: 0,
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
  };

  const namesearch = async () => {
    if (!user) return toast.error("User not found. Please login again.");

    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await DeptPendingReturn({
      dept: user?.selectOffice ?? "DIU",
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
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
  };

  const frequencyFilingsearch = async () => {
    if (!user) return toast.error("User not found. Please login again.");

    if (frequencyFilingsFilter === "") {
      return toast.error("Select a Frequency Filings option");
    }
    const search_response = await DeptPendingReturn({
      dept: user?.selectOffice ?? "DIU",
      frequencyFilings: frequencyFilingsFilter,
      take: 10,
      skip: 0,
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
  };

  const compositionsearch = async () => {
    if (!user) return toast.error("User not found. Please login again.");

    if (compositionFilter === "") {
      return toast.error("Select a Composition option");
    }
    const search_response = await DeptPendingReturn({
      dept: user?.selectOffice ?? "DIU",
      compositionScheme: compositionFilter === "true",
      take: 10,
      skip: 0,
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
  };
  const handleDownloadExcel = async () => {
    try {
      toast.loading("Preparing Excel file...");

      // Build search parameters based on current search
      const searchParams: any = {
        dept: user?.selectOffice,
      };

      if (isSearch) {
        if (searchOption === SearchOption.TIN && arnRef.current?.input?.value) {
          searchParams.arnnumber = arnRef.current.input.value;
        } else if (
          searchOption === SearchOption.NAME &&
          nameRef.current?.input?.value
        ) {
          searchParams.tradename = nameRef.current.input.value;
        } else if (
          searchOption === SearchOption.COMPOSITION &&
          compositionFilter
        ) {
          searchParams.compositionScheme = compositionFilter === "true";
        } else if (
          searchOption === SearchOption.FREQUENCY_FILINGS &&
          frequencyFilingsFilter
        ) {
          searchParams.frequencyFilings = frequencyFilingsFilter;
        }
      }

      // Fetch all data
      const response = await GetAllPendingReturn(searchParams);

      if (!response.status || !response.data) {
        toast.dismiss();
        toast.error(response.message || "Failed to fetch data");
        return;
      }

      // Prepare data for Excel
      const excelData = response.data.map((item: ResponseType) => ({
        "TIN Number": item.dvat04.tinNumber,
        "Trade Name": item.dvat04.tradename,
        "Dealer Name": item.dvat04.name,
        Composition: item.dvat04.compositionScheme ? "Yes" : "No",
        "Frequency Filings": item.dvat04.frequencyFilings,
        "Last Filing Period": item.lastfiling,
        "Pending Returns": item.pending,
        Notice: item.notice,
      }));

      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Returns");

      // Set column widths
      const columnWidths = [
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 10 },
      ];
      worksheet["!cols"] = columnWidths;

      // Download file
      XLSX.writeFile(workbook, `Pending_Returns_${new Date().getTime()}.xlsx`);

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

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!user) return toast.error("User not found. Please login again.");

    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await DeptPendingReturn({
          dept: user.selectOffice ?? "DIU",
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
        const search_response = await DeptPendingReturn({
          dept: user.selectOffice ?? "DIU",
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
      } else if (searchOption == SearchOption.COMPOSITION) {
        if (compositionFilter === "") {
          return toast.error("Select a Composition option");
        }
        const search_response = await DeptPendingReturn({
          dept: user.selectOffice ?? "DIU",
          compositionScheme: compositionFilter === "true",
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
      } else if (searchOption == SearchOption.FREQUENCY_FILINGS) {
        if (frequencyFilingsFilter === "") {
          return toast.error("Select a Frequency Filings option");
        }
        const search_response = await DeptPendingReturn({
          dept: user.selectOffice ?? "DIU",
          frequencyFilings: frequencyFilingsFilter,
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
        dept: user.selectOffice ?? "DIU",
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
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Track Pending Return</p>
            <div className="grow"></div>

            <Button type="primary" onClick={() => setDrawerOpen(true)}>
              Info
            </Button>

            <Drawer
              placement="bottom"
              title="Meaning of status"
              onClose={() => setDrawerOpen(false)}
              open={drawerOpen}
            >
              <Table className="border">
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
                      Clarification not filed by the Applicant. Pending with Tax
                      Officer for Rejection.*
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
            </Drawer>
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.TIN}>TIN</Radio>
              <Radio value={SearchOption.NAME}>Trade Name</Radio>
              <Radio value={SearchOption.COMPOSITION}>Composition</Radio>
              <Radio value={SearchOption.FREQUENCY_FILINGS}>
                Frequency Filings
              </Radio>
            </Radio.Group>
            {(() => {
              switch (searchOption) {
                case SearchOption.TIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter TIN"}
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
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={nameRef}
                        placeholder={"Enter Trade Name"}
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

                case SearchOption.COMPOSITION:
                  return (
                    <div className="flex gap-2">
                      <select
                        value={compositionFilter}
                        onChange={(e) => setCompositionFilter(e.target.value)}
                        disabled={isSearch}
                        className="w-60 px-3 py-1 border border-gray-300 rounded"
                      >
                        <option value="">Select Composition Type</option>
                        <option value="true">Composition</option>
                        <option value="false">Regular</option>
                      </select>

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={compositionsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.FREQUENCY_FILINGS:
                  return (
                    <div className="flex gap-2">
                      <select
                        value={frequencyFilingsFilter}
                        onChange={(e) =>
                          setFrequencyFilingsFilter(e.target.value)
                        }
                        disabled={isSearch}
                        className="w-60 px-3 py-1 border border-gray-300 rounded"
                      >
                        <option value="">Select Frequency</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={frequencyFilingsearch} type="primary">
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

          {dvatData.length == 0 ? (
            <>
              <Alert
                style={{
                  marginTop: "10px",
                  padding: "8px",
                }}
                type="error"
                showIcon
                description="There is no Pending Return."
              />
            </>
          ) : (
            <>
              {/* Table Section */}
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      TIN Number
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Trade Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Composition
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Last Filing Period
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Frequency Filings
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Pending Returns
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      Notice
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center border p-2">
                      View
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dvatData.map((val: ResponseType, index: number) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="border text-center p-2">
                          {val.dvat04.tinNumber}
                        </TableCell>
                        <TableCell className="border text-left p-2">
                          {val.dvat04.tradename}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.dvat04.compositionScheme ? "COMP" : "REG"}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.lastfiling}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.dvat04.frequencyFilings}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.pending}
                        </TableCell>
                        <TableCell className="border text-center text-blue-500 p-2">
                          <Link
                            href={`/dashboard/returns/department-pending-return/notice/${encryptURLData(
                              val.dvat04.id.toString(),
                            )}`}
                          >
                            {val.notice}
                          </Link>
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          <Button
                            type="primary"
                            onClick={() => {
                              router.push(
                                `/dashboard/returns/department-pending-return/${encryptURLData(
                                  val.dvat04.id.toString(),
                                )}`,
                              );
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        </div>
      </div>
    </>
  );
};

export default TrackAppliation;
