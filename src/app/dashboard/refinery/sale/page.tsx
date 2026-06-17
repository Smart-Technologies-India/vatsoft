"use client";

import GetUserRefinerySale from "@/action/refinery_sale/getuserrefinerysale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  commodity_master,
  refinery_sale,
  tin_number_master,
} from "@prisma/client";
import { Button, Spin } from "antd";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { formatDate } from "date-fns";

type RefinerySaleWithRelations = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatCurrency = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const getStatusColor = (status: string) => {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    SALE: { bg: "bg-red-100", text: "text-red-800" },
    PAID: { bg: "bg-green-100", text: "text-green-800" },
    VATPAID: { bg: "bg-blue-100", text: "text-blue-800" },
    DISPATCH: { bg: "bg-amber-100", text: "text-amber-800" },
  };

  return statusColorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

const RefinerySalePage = () => {
  const router = useRouter();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [saleEntries, setSaleEntries] = useState<RefinerySaleWithRelations[]>(
    [],
  );
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const totalTaxableValue = useMemo(() => {
    return saleEntries.reduce(
      (sum, entry) => sum + Number.parseFloat(entry.amount || "0"),
      0,
    );
  }, [saleEntries]);

  const totalVatAmount = useMemo(() => {
    return saleEntries.reduce(
      (sum, entry) => sum + Number.parseFloat(entry.vatamount || "0"),
      0,
    );
  }, [saleEntries]);

  const tableTotalInvoiceValue = useMemo(() => {
    return totalTaxableValue + totalVatAmount;
  }, [totalTaxableValue, totalVatAmount]);

  const columns = useMemo<ColumnDef<RefinerySaleWithRelations>[]>(
    () => [
      {
        id: "count",
        header: "Count",
        enableSorting: false,
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <span className="text-xs">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "invoice_number",
        header: "Invoice No.",
      },
      {
        id: "invoice_date",
        header: "Invoice Date",
        accessorFn: (row) => row.invoice_date,
        sortingFn: "datetime",
        cell: ({ row }) => formatDate(new Date(row.original.invoice_date), "dd/MM/yyyy"),
      },
      {
        id: "purchaser_tin",
        header: "Purchaser TIN",
        accessorFn: (row) => row.seller_tin_number.tin_number,
      },
      {
        id: "item_details",
        header: "Item Details",
        accessorFn: (row) => row.commodity_master.product_name,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.refinery_status || "SALE",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const status = row.original.refinery_status || "SALE";
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                getStatusColor(status).bg
              } ${getStatusColor(status).text}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="small"
            onClick={() =>
              router.push(`/dashboard/refinery/sale/dispatch/${row.original.id}`)
            }
          >
            View
          </Button>
        ),
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: saleEntries,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchText,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = String(filterValue ?? "").trim().toLowerCase();
      if (!needle) return true;

      const haystack = [
        row.original.invoice_number,
        row.original.seller_tin_number.tin_number,
        row.original.commodity_master.product_name,
        row.original.refinery_status || "SALE",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    },
  });

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value);
  };

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const salesResponse = await GetUserRefinerySale();

      if (salesResponse.status && salesResponse.data) {
        setSaleEntries(salesResponse.data);
      } else {
        setSaleEntries([]);
      }
    } catch (error) {
      toast.error("Unable to load refinery sale data.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Refinery Sale
              </h1>
            </div>
            <div className="grow"></div>
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder="Search invoice, TIN, item, status"
                className="h-9 w-full sm:w-72 rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-9 rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="SALE">SALE</option>
                <option value="PAID">PAID</option>
                <option value="VATPAID">VATPAID</option>
                <option value="DISPATCH">DISPATCH</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
            <p className="text-lg font-medium text-gray-900">
              {saleEntries.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totalTaxableValue)}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total VAT</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totalVatAmount)}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(tableTotalInvoiceValue)}
            </p>
          </div>
        </div> */}

        

        {isPageLoading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Spin />
          </div>
        ) : table.getFilteredRowModel().rows.length > 0 ? (
          <div className="bg-white rounded shadow-sm border p-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="text-center p-2 font-medium text-gray-700 text-xs"
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={`inline-flex items-center gap-1 ${
                                header.column.getCanSort() ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.column.getCanSort() && (
                                <span>
                                  {header.column.getIsSorted() === "asc"
                                    ? "↑"
                                    : header.column.getIsSorted() === "desc"
                                      ? "↓"
                                      : "↕"}
                                </span>
                              )}
                            </button>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-b hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-2 text-center text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="px-3 py-2 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-xs text-gray-600">
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} filtered rows ({saleEntries.length} total)
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="h-8 rounded border border-gray-300 px-2 text-xs"
                >
                  {[10, 20, 30, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize} / page
                    </option>
                  ))}
                </select>
                <Button
                  size="small"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </span>
                <Button
                  size="small"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm border p-12 text-center">
            <p className="text-gray-500">No refinery sale entries found.</p>
          </div>
        )}
      </div>
    </main>
  );
};
export default RefinerySalePage;
