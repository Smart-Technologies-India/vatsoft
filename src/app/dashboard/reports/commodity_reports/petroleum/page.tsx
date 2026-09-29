"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useMemo } from "react";
import numberWithIndianFormat from "@/utils/methods";
import PetroleumCommodityReport from "@/action/report/petroleumcommodityreport";
import { Alert, Select, Spin } from "antd";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PetroleumCommodityPage = () => {
  const router = useRouter();
  const pageSize = 10;

  interface DvatData {
    id: number;
    name: string;
    total_quantity: number;
    total_amount: number;
    count: number;
    office: string;
    vatamount: number;
  }

  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<user | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isTableLoading, setTableLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize: tablePage }, setPagination] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: pageSize,
    });

  const [dvatData, setDvatData] = useState<Array<DvatData>>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Generate year options
  const generateYearOptions = () => {
    const options: { value: string; label: string }[] = [];
    for (let i = 2020; i <= 2026; i++) {
      options.push({
        value: i.toString(),
        label: i.toString(),
      });
    }
    return options;
  };

  // Generate month options
  const generateMonthOptions = () => {
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
    const options: { value: string; label: string }[] = [];
    for (let i = 1; i <= 12; i++) {
      options.push({
        value: String(i).padStart(2, "0"),
        label: monthNames[i - 1],
      });
    }
    return options;
  };

  // Generate quarter options
  const generateQuarterOptions = () => {
    return [
      { value: "Q1", label: "Q1 (Apr-Jun)" },
      { value: "Q2", label: "Q2 (Jul-Sep)" },
      { value: "Q3", label: "Q3 (Oct-Dec)" },
      { value: "Q4", label: "Q4 (Jan-Mar)" },
    ];
  };

  // Handle year change
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth("");
    setSelectedQuarter("");
    setPagination({ pageIndex: 0, pageSize });
  };

  // Handle quarter change
  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarter(quarter);
    setSelectedMonth("");
    setPagination({ pageIndex: 0, pageSize });
  };

  // Handle month change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedQuarter("");
    setPagination({ pageIndex: 0, pageSize });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedQuarter("");
    setPagination({ pageIndex: 0, pageSize });
  };

  // Column definitions for TanStack table
  const columns = useMemo<ColumnDef<DvatData>[]>(
    () => [
      {
        accessorKey: "office",
        header: "District",
        cell: (info) => (
          <div className="text-center">
            {info.getValue() === "Dadra_Nagar_Haveli"
              ? "Dadra & Nagar Haveli"
              : (info.getValue() as string)}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Commodity Name",
        cell: (info) => <div className="text-center">{info.getValue() as string}</div>,
      },
      {
        accessorKey: "total_quantity",
        header: "Total Volume",
        cell: (info) => <div className="text-center">{info.getValue() as number}</div>,
      },
      {
        accessorKey: "total_amount",
        header: "Total Sales",
        cell: (info) => (
          <div className="text-center">
            {numberWithIndianFormat(info.getValue() as number)}
          </div>
        ),
      },
      {
        accessorKey: "vatamount",
        header: "VAT Amount",
        cell: (info) => (
          <div className="text-center">
            {numberWithIndianFormat(info.getValue() as number)}
          </div>
        ),
      },
      {
        accessorKey: "count",
        header: "No. of Transactions",
        cell: (info) => <div className="text-center">{info.getValue() as number}</div>,
      },
      {
        id: "marketShare",
        header: "Market Share(%)",
        cell: (info) => (
          <div className="text-center">
            {total > 0
              ? (
                  ((info.row.original.total_amount / total) * 100)
                ).toFixed(2)
              : "0.00"}
          </div>
        ),
      },
    ],
    [total]
  );

  // TanStack table instance
  const table = useReactTable({
    data: dvatData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: tablePage },
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: totalRecords,
  });

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const userResponse = await GetUser({ id: authResponse.data });
      if (userResponse.status && userResponse.data) {
        setUser(userResponse.data);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (userid === 0 || !user) return;

    const fetchData = async () => {
      // Only show full page loading on initial load (when userid/user changes)
      // For filter changes, only show table loading
      const isInitialLoad = !dvatData || dvatData.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }

      // Determine filter office based on role
      const filterOffice = [
        "VATOFFICER",
        "DY_COMMISSIONER",
        "JOINT_COMMISSIONER",
      ].includes(user.role)
        ? (user.selectOffice ?? undefined)
        : undefined;

      // Determine which month to use
      let monthToUse: string | undefined = selectedMonth || undefined;
      if (!monthToUse && selectedQuarter) {
        const quarterMonthMap: Record<string, string> = {
          Q1: "04",
          Q2: "07",
          Q3: "10",
          Q4: "01",
        };
        monthToUse = quarterMonthMap[selectedQuarter];
      }

      const skip = pageIndex * pageSize;
      const response = await PetroleumCommodityReport(
        selectedYear,
        monthToUse,
        filterOffice,
        skip,
        pageSize
      );

      if (response.status === true && response.data) {
        setDvatData(response.data.data);
        setTotalRecords(response.data.total);
        setDebugInfo(response.data.debugInfo);
        setTotal(
          response.data.data.reduce((acc, item) => acc + item.total_amount, 0)
        );
      } else {
        setDvatData([]);
        setTotalRecords(0);
        setTotal(0);
        setDebugInfo(null);
      }

      setLoading(false);
      setTableLoading(false);
    };
    fetchData();
  }, [userid, user, selectedYear, selectedMonth, selectedQuarter, pageIndex]);

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
          <div className="bg-blue-500 p-2 text-white">
            <p className="text-lg font-semibold">
              Top Selling Petroleum Commodities
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 border-b flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Year</label>
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                options={generateYearOptions()}
                style={{ width: 120 }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Quarter (Optional)
              </label>
              <Select
                value={selectedQuarter}
                onChange={handleQuarterChange}
                options={generateQuarterOptions()}
                placeholder="Select quarter..."
                allowClear
                style={{ width: 140 }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Month (Optional)
              </label>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                options={generateMonthOptions()}
                placeholder="Select month..."
                allowClear
                style={{ width: 140 }}
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium self-end"
            >
              Clear Filters
            </button>
          </div>
          {debugInfo && (
            <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-xs text-gray-700">
              <strong>Debug Info:</strong> Year={debugInfo.year}, Month={debugInfo.month || "(empty)"}, RawMonth={debugInfo.rawMonthParam || "(empty)"}, Total Records={totalRecords}
            </div>
          )}
          {dvatData.length > 0 ? (
            <Spin spinning={isTableLoading} size="large">
              <div className="mt-2">
                <Table className="border">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-gray-100">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap text-center border p-2"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="border text-center p-2"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* TanStack Pagination */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {pageIndex * pageSize + 1} to{" "}
                    {Math.min((pageIndex + 1) * pageSize, totalRecords)} of{" "}
                    {totalRecords} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: table.getPageCount() },
                        (_, i) => i
                      ).map((page) => {
                        const isCurrentPage = pageIndex === page;
                        const isNearby = Math.abs(pageIndex - page) <= 2;
                        const isStart = page <= 2;
                        const isEnd = page >= table.getPageCount() - 3;
                        const shouldShow = isCurrentPage || isNearby || isStart || isEnd;

                        if (!shouldShow) {
                          // Show ellipsis once for gap
                          if (page === 3 && pageIndex > 5) {
                            return (
                              <span key="ellipsis-start" className="px-2 py-2">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        // Hide duplicate ellipsis
                        if (
                          (page === table.getPageCount() - 4 && pageIndex < table.getPageCount() - 5)
                        ) {
                          return (
                            <span key="ellipsis-end" className="px-2 py-2">
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => table.setPageIndex(page)}
                            className={`px-3 py-2 rounded border ${
                              isCurrentPage
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Spin>
          ) : (
            <div className="mt-2">
              <Alert title="No data available" type="error" showIcon />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PetroleumCommodityPage;
