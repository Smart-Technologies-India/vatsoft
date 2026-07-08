"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
  MaterialSymbolsKeyboardDoubleArrowLeft,
  MaterialSymbolsKeyboardDoubleArrowRight,
  CharmChevronLeft,
  CharmChevronRight,
} from "@/components/icons";
import GetReturnsData, { type ReturnsData } from "@/action/return/getreturnsdata";
import GetDvatById from "@/action/user/register/getdvatbyid";
import { decryptURLData } from "@/utils/methods";

interface DvatInfo {
  id: number;
  tinNumber: string | null;
  tradename: string | null;
}

export default function ViewReturns() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ReturnsData[]>([]);
  const [dvatInfo, setDvatInfo] = useState<DvatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const encryptedDvatId = params.dvatId as string;
        const dvatId = parseInt(decryptURLData(encryptedDvatId, router), 10);

        if (isNaN(dvatId)) {
          toast.error("Invalid DVAT ID");
          router.push("/dashboard/registration_status");
          return;
        }

        // Fetch DVAT info
        const dvatResponse = await GetDvatById({ id: dvatId });
        if (dvatResponse.status && dvatResponse.data) {
          setDvatInfo({
            id: dvatResponse.data.id,
            tinNumber: dvatResponse.data.tinNumber,
            tradename: dvatResponse.data.tradename,
          });
        }

        // Fetch returns data
        const response = await GetReturnsData({ dvatId });

        if (!response.status) {
          toast.error(response.message || "Failed to fetch returns data");
          return;
        }

        setData(response.data || []);
      } catch (error) {
        toast.error("An error occurred while fetching returns data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [params.dvatId, router]);

  const columns = useMemo<ColumnDef<ReturnsData>[]>(
    () => [
      {
        accessorKey: "returnPeriod",
        header: "Return Period",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900">
            {row.original.returnPeriod}
          </span>
        ),
      },
      {
        accessorKey: "outputTax",
        header: "Output Tax (R4.8)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.outputTax.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "inputCredit",
        header: "Input Credit (R5.4)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.inputCredit.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "netTax",
        header: "Net Tax (R6.1)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.netTax.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "interest",
        header: "Interest (R6.2a)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.interest.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "penalty",
        header: "Penalty (R6.2b)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.penalty.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "challanPaid",
        header: "Challan Paid",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.challanPaid.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "cashCarryForward",
        header: "Cash Carry Forward",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.cashCarryForward.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "itcCarryForward",
        header: "ITC Carry Forward (R9.3)",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 text-center font-medium">
            ₹ {row.original.itcCarryForward.toFixed(2)}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      return String(row.original.returnPeriod)
        .toLowerCase()
        .includes(searchValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          ← Back
        </button>

        {/* DVAT Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Dealer ID
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {dvatInfo?.id || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                TIN Number
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {dvatInfo?.tinNumber || "—"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Trade Name
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {dvatInfo?.tradename || "—"}
              </p>
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
              {data.length} {data.length === 1 ? "Return" : "Returns"}
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {data.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No Returns Found</p>
              <p className="text-sm text-gray-500 mt-1">
                There are no returns data to display for this dealer.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-200 bg-gray-50/70 p-4">
                <Input
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder="Search by return period"
                  className="bg-white"
                />
              </div>

              <div className="overflow-x-auto">
                <Table className="border-0">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="bg-gray-50 border-b"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap p-3 font-semibold text-gray-700"
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={
                                  header.column.getCanSort()
                                    ? "flex cursor-pointer select-none items-center gap-1"
                                    : "flex items-center gap-1"
                                }
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {header.column.getCanSort()
                                  ? ({
                                      asc: (
                                        <MaterialSymbolsKeyboardArrowUpRounded className="h-4 w-4" />
                                      ),
                                      desc: (
                                        <MaterialSymbolsKeyboardArrowDownRounded className="h-4 w-4" />
                                      ),
                                    }[
                                      header.column.getIsSorted() as string
                                    ] ?? (
                                      <MaterialSymbolsKeyboardArrowDownRounded className="h-4 w-4 opacity-30" />
                                    ))
                                  : null}
                              </div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="border-b transition-opacity hover:opacity-80"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={`p-3 ${
                                cell.column.id !== "returnPeriod"
                                  ? "text-center"
                                  : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-sm text-gray-500"
                        >
                          No matching records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount() || 1}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(event) =>
                      table.setPageSize(Number(event.target.value))
                    }
                    className="flex h-9 rounded-md border border-input bg-white px-2 text-sm"
                  >
                    {[10, 20, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize} / page
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <MaterialSymbolsKeyboardDoubleArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <CharmChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <CharmChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <MaterialSymbolsKeyboardDoubleArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
