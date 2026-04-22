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
import UpdateDvat04Mobile from "@/action/register/newuser/updatedvat04mobile";
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

type RegistrationStatusRow = dvat04 & { first_stock: first_stock[] };

const RegistrationStatus = () => {
  const [userid, setUserid] = useState<number>(0);

  const router = useRouter();

  const [data, setData] = useState<RegistrationStatusRow[]>([]);
  const [, setUser] = useState<user>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingMobileById, setEditingMobileById] = useState<
    Record<number, string>
  >({});
  const [savingMobileId, setSavingMobileId] = useState<number | null>(null);

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
          // setData(response.data);

          // short data according to this status order
          // 1 - VERIFICATION
          // 2 - PENDINGPROCESSING
          // 3 - APPROVED

          const verification = response.data.filter(
            (val) => val.status == "VERIFICATION"
          );
          const pendingprocessing = response.data.filter(
            (val) => val.status == "PENDINGPROCESSING"
          );
          const approved = response.data.filter(
            (val) => val.status == "APPROVED"
          );

          setData([...verification, ...pendingprocessing, ...approved]);
        }
      }
    };
    init();
  }, [userid]);

  const startMobileEdit = (row: RegistrationStatusRow) => {
    setEditingMobileById((prev) => ({
      ...prev,
      [row.id]: row.contact_one ?? "",
    }));
  };

  const cancelMobileEdit = (id: number) => {
    setEditingMobileById((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const saveMobileEdit = async (row: RegistrationStatusRow) => {
    const editedMobile = (editingMobileById[row.id] ?? "").trim();

    if (!/^\d{10}$/.test(editedMobile)) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }

    setSavingMobileId(row.id);
    const response = await UpdateDvat04Mobile({
      dvat04Id: row.id,
      mobile: editedMobile,
    });

    if (!response.status) {
      toast.error(response.message);
      setSavingMobileId(null);
      return;
    }

    toast.success(response.message);
    setData((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, contact_one: editedMobile } : item
      )
    );
    cancelMobileEdit(row.id);
    setSavingMobileId(null);
  };

  const columns = useMemo<ColumnDef<RegistrationStatusRow>[]>(
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
        cell: ({ row }) =>
          editingMobileById[row.original.id] !== undefined ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                value={editingMobileById[row.original.id]}
                maxLength={10}
                onChange={(event) =>
                  setEditingMobileById((prev) => ({
                    ...prev,
                    [row.original.id]: event.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                className="h-8 w-32"
              />
              <button
                type="button"
                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => saveMobileEdit(row.original)}
                disabled={savingMobileId === row.original.id}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => cancelMobileEdit(row.original.id)}
                disabled={savingMobileId === row.original.id}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-700">{row.original.contact_one}</span>
              <button
                type="button"
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => startMobileEdit(row.original)}
              >
                Edit
              </button>
            </div>
          ),
      },
      {
        id: "dvatStatus",
        accessorFn: (row) =>
          row.status === "PENDINGPROCESSING" || row.status === "APPROVED"
            ? "SUBMITTED"
            : "PENDING",
        header: "DVAT Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : row.original.status === "PENDINGPROCESSING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {row.original.status === "PENDINGPROCESSING" ||
            row.original.status === "APPROVED"
              ? "SUBMITTED"
              : "PENDING"}
          </span>
        ),
      },
      {
        id: "stockStatus",
        accessorFn: (row) =>
          row.first_stock.length > 0 ? "SUBMITTED" : "PENDING",
        header: "Stock Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.first_stock.length > 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {row.original.first_stock.length > 0 ? "SUBMITTED" : "PENDING"}
          </span>
        ),
      },
    ],
    [editingMobileById, savingMobileId],
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

  const dvatStatusFilterValue =
    (table.getColumn("dvatStatus")?.getFilterValue() as string | undefined) ?? "";
  const stockStatusFilterValue =
    (table.getColumn("stockStatus")?.getFilterValue() as string | undefined) ?? "";

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
                  Dealer Registration Status
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track dealer registration and stock submission status
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
                  There are no dealer registrations to display at this time.
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
                        value={dvatStatusFilterValue}
                        onChange={(event) =>
                          table
                            .getColumn("dvatStatus")
                            ?.setFilterValue(event.target.value || undefined)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All DVAT Status</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="PENDING">Pending</option>
                      </select>
                      <select
                        value={stockStatusFilterValue}
                        onChange={(event) =>
                          table
                            .getColumn("stockStatus")
                            ?.setFilterValue(event.target.value || undefined)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Stock Status</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="PENDING">Pending</option>
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
                                className={`p-3 ${cell.column.id === "contact_one" || cell.column.id === "dvatStatus" || cell.column.id === "stockStatus" ? "text-center" : ""}`}
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

export default RegistrationStatus;
