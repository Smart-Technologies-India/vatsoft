"use client";

import {
  CharmChevronLeft,
  CharmChevronRight,
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
  MaterialSymbolsKeyboardDoubleArrowLeft,
  MaterialSymbolsKeyboardDoubleArrowRight,
} from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

import { dvat04, first_stock, user } from "@prisma/client";
import GetUser from "@/action/user/getuser";
import { useRouter } from "next/navigation";
import GetDvatByOffice from "@/action/return/getdvatbyoffice";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { encryptURLData } from "@/utils/methods";
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

type RegistrationRequestRow = dvat04 & { first_stock: first_stock[] };

const RegistrationRequests = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();

  const [data, setData] = useState<RegistrationRequestRow[]>([]);
  const [, setUser] = useState<user>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const userresponse = await GetUser({
        id: authResponse.data,
      });

      if (userresponse.data && userresponse.status) {
        setUser(userresponse.data);

        const response = await GetDvatByOffice({
          selectOffice: userresponse.data.selectOffice!,
        });

        if (response.data && response.status) {
          const approved = response.data.filter(
            (val) => val.status == "APPROVED",
          );

          setData(approved);
        }
      }
    };
    init();
  }, [userid]);

  const columns = useMemo<ColumnDef<RegistrationRequestRow>[]>(
    () => [
      {
        accessorKey: "tinNumber",
        header: "TIN No",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900">
            {row.original.tinNumber}
          </span>
        ),
      },
      {
        accessorKey: "tradename",
        header: "Trade Name",
        cell: ({ row }) => (
          <span className="text-sm text-gray-900">{row.original.tradename}</span>
        ),
      },
      {
        accessorKey: "contact_one",
        header: "Contact",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">{row.original.contact_one}</span>
        ),
      },
      {
        id: "schemeType",
        accessorFn: (row) => (row.compositionScheme ? "Composition" : "Regular"),
        header: "Scheme Type",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.compositionScheme
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {row.original.compositionScheme ? "Composition" : "Regular"}
          </span>
        ),
      },
      {
        accessorKey: "frequencyFilings",
        header: "Filing Frequency",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.frequencyFilings === "QUARTERLY"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {row.original.frequencyFilings === "QUARTERLY"
              ? "Quarterly"
              : "Monthly"}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() =>
              router.push(
                `/dashboard/returns/department-pending-return/${encryptURLData(row.original.id.toString())}`,
              )
            }
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            View
          </button>
        ),
      },
    ],
    [router],
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

      return [row.original.tinNumber, row.original.tradename, row.original.contact_one]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
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

  const schemeFilterValue =
    (table.getColumn("schemeType")?.getFilterValue() as string | undefined) ?? "";
  const frequencyFilterValue =
    (table.getColumn("frequencyFilings")?.getFilterValue() as string | undefined) ?? "";

  const getRowStatusColor = (status: string) => {
    if (status === "APPROVED") return "bg-emerald-50";
    if (status === "PENDINGPROCESSING") return "bg-amber-50";
    return "bg-rose-50";
  };

  return (
    <>
      <main className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Registration Requests
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage dealer registration requests and filing details
                </p>
              </div>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                {data.length} {data.length === 1 ? "Dealer" : "Dealers"}
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
                <p className="text-gray-600 font-medium">No Records Found</p>
                <p className="text-sm text-gray-500 mt-1">
                  There are no dealer registration requests to display at this
                  time.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                      <Input
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        placeholder="Search by TIN, trade name, or contact"
                        className="bg-white"
                      />
                      <select
                        value={schemeFilterValue}
                        onChange={(event) =>
                          table
                            .getColumn("schemeType")
                            ?.setFilterValue(event.target.value || undefined)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Scheme Types</option>
                        <option value="Composition">Composition</option>
                        <option value="Regular">Regular</option>
                      </select>
                      <select
                        value={frequencyFilterValue}
                        onChange={(event) =>
                          table
                            .getColumn("frequencyFilings")
                            ?.setFilterValue(event.target.value || undefined)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Filing Frequencies</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {table.getFilteredRowModel().rows.length} matching records
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="border-0">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="whitespace-nowrap p-3 font-semibold text-gray-700"
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  className={header.column.getCanSort()
                                    ? "flex cursor-pointer select-none items-center gap-1"
                                    : "flex items-center gap-1"}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  {header.column.getCanSort() ? (
                                    {
                                      asc: (
                                        <MaterialSymbolsKeyboardArrowUpRounded className="h-4 w-4" />
                                      ),
                                      desc: (
                                        <MaterialSymbolsKeyboardArrowDownRounded className="h-4 w-4" />
                                      ),
                                    }[header.column.getIsSorted() as string] ?? (
                                      <MaterialSymbolsKeyboardArrowDownRounded className="h-4 w-4 opacity-30" />
                                    )
                                  ) : null}
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
                            className={`${getRowStatusColor(row.original.status)} border-b transition-opacity hover:opacity-80`}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={`p-3 ${cell.column.id === "contact_one" || cell.column.id === "schemeType" || cell.column.id === "frequencyFilings" || cell.column.id === "actions" ? "text-center" : ""}`}
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
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(event) => table.setPageSize(Number(event.target.value))}
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
    </>
  );
};

export default RegistrationRequests;
