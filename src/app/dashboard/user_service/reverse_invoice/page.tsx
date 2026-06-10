"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetReverseInvoicePurchase, {
  ReverseInvoicePurchaseRow,
} from "@/action/stock/getreverseinvoicepurchase";
import ReversePurchaseAccept from "@/action/stock/reversepurchaseaccept";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import { dvat04 } from "@prisma/client";
import { Button, Input, Modal, Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

interface GroupedPurchaseRow {
  groupKey: string;
  invoice_date: Date;
  invoice_number: string;
  tin_number: string;
  trade_name: string;
  records: ReverseInvoicePurchaseRow[];
  totalQuantity: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
}

const ReverseInvoicePage = () => {
  "use no memo";

  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userid, setUserid] = useState<number>(0);
  const [dvatData, setDvatData] = useState<dvat04>();
  const [rows, setRows] = useState<Array<ReverseInvoicePurchaseRow>>([]);
  const [reversingIds, setReversingIds] = useState<number[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedGroup, setSelectedGroup] = useState<GroupedPurchaseRow | null>(
    null,
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [reversingAll, setReversingAll] = useState(false);

  const loadRows = useCallback(async () => {
    const reversePurchaseResponse = await GetReverseInvoicePurchase();
    if (reversePurchaseResponse.status && reversePurchaseResponse.data) {
      setRows(reversePurchaseResponse.data);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      return;
    }

    setRows([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (reversePurchaseResponse.message) {
      toast.error(reversePurchaseResponse.message);
    }
  }, []);

  const onReverse = useCallback(
    async (row: ReverseInvoicePurchaseRow) => {
      if (reversingIds.includes(row.id)) return;

      setReversingIds((prev) => [...prev, row.id]);
      const response = await ReversePurchaseAccept({
        purchaseId: row.id,
        updatedById: userid,
      });

      if (response.status) {
        toast.success(response.message);
        await loadRows();
      } else {
        toast.error(response.message);
      }

      setReversingIds((prev) => prev.filter((id) => id !== row.id));
    },
    [loadRows, reversingIds, userid],
  );

  const onReverseAll = useCallback(
    async (group: GroupedPurchaseRow) => {
      if (reversingAll) return;

      setReversingAll(true);
      let successCount = 0;
      let failedCount = 0;

      for (const record of group.records) {
        const response = await ReversePurchaseAccept({
          purchaseId: record.id,
          updatedById: userid,
        });

        if (response.status) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} purchase(s) reversed successfully.`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} purchase(s) could not be reversed.`);
      }

      await loadRows();
      setReversingAll(false);
      setIsGroupModalOpen(false);
      setSelectedGroup(null);
    },
    [loadRows, reversingAll, userid],
  );

  const tradeNameOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        rows.map((row) => row.seller_tin_number.name_of_dealer).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return names.map((name) => ({ label: name, value: name }));
  }, [rows]);

  const productOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        rows.map((row) => row.commodity_master.product_name).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return names.map((name) => ({ label: name, value: name }));
  }, [rows]);

  const urnFilterFn: FilterFn<ReverseInvoicePurchaseRow> = (
    row,
    _,
    filterValue,
  ) => {
    if (!filterValue || filterValue === "all") return true;
    if (filterValue === "with_urn") return Boolean(row.original.urn_number);
    if (filterValue === "without_urn") return !row.original.urn_number;
    return true;
  };

  const groupedRows = useMemo(() => {
    const groups: Record<string, GroupedPurchaseRow> = {};

    for (const row of rows) {
      const groupKey = [
        formateDate(row.invoice_date),
        row.invoice_number,
        row.seller_tin_number.tin_number,
      ].join("|");

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          invoice_date: row.invoice_date,
          invoice_number: row.invoice_number,
          tin_number: row.seller_tin_number.tin_number,
          trade_name: row.seller_tin_number.name_of_dealer,
          records: [],
          totalQuantity: 0,
          totalTaxableValue: 0,
          totalVatAmount: 0,
          totalInvoiceValue: 0,
        };
      }

      groups[groupKey].records.push(row);
      groups[groupKey].totalQuantity += row.quantity;
      groups[groupKey].totalTaxableValue += parseFloat(row.amount);
      groups[groupKey].totalVatAmount += parseFloat(row.vatamount);
      groups[groupKey].totalInvoiceValue +=
        parseFloat(row.amount) + parseFloat(row.vatamount);
    }

    return Object.values(groups);
  }, [rows]);

  const groupColumns = useMemo<ColumnDef<GroupedPurchaseRow>[]>(
    () => [
      {
        id: "sr_no",
        header: "Sr. No.",
        cell: ({ row, table }) =>
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
          row.index +
          1,
      },
      {
        accessorKey: "invoice_number",
        header: "Invoice No.",
      },
      {
        id: "invoice_date",
        header: "Invoice Date",
        cell: ({ row }) => formateDate(row.original.invoice_date),
      },
      {
        accessorKey: "trade_name",
        header: "Trade Name",
      },
      {
        accessorKey: "tin_number",
        header: "TIN Number",
      },
      {
        id: "items_count",
        header: "Items",
        cell: ({ row }) => row.original.records.length,
      },
      {
        id: "total_quantity",
        header: "Total Quantity",
        cell: ({ row }) => row.original.totalQuantity,
      },
      {
        id: "total_taxable_value",
        header: "Total Taxable Value",
        cell: ({ row }) => row.original.totalTaxableValue.toFixed(2),
      },
      {
        id: "total_vat_amount",
        header: "Total VAT Amount",
        cell: ({ row }) => row.original.totalVatAmount.toFixed(2),
      },
      {
        id: "total_invoice_value",
        header: "Total Invoice Value",
        cell: ({ row }) => row.original.totalInvoiceValue.toFixed(2),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-center">
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setSelectedGroup(row.original);
                setIsGroupModalOpen(true);
              }}
            >
              View Details
            </Button>
            <Button
              size="small"
              type="primary"
              danger
              loading={reversingAll}
              onClick={() => onReverseAll(row.original)}
            >
              Reverse All
            </Button>
          </div>
        ),
      },
    ],
    [reversingAll, onReverseAll],
  );

  const columns = useMemo<ColumnDef<ReverseInvoicePurchaseRow>[]>(
    () => [
      {
        id: "sr_no",
        header: "Sr. No.",
        cell: ({ row, table }) =>
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
          row.index +
          1,
      },
      {
        accessorKey: "invoice_number",
        header: "Invoice No.",
      },
      {
        id: "invoice_date",
        header: "Invoice Date",
        cell: ({ row }) => formateDate(row.original.invoice_date),
      },
      {
        id: "trade_name",
        accessorFn: (row) => row.seller_tin_number.name_of_dealer,
        header: "Trade Name",
      },
      {
        id: "tin_number",
        accessorFn: (row) => row.seller_tin_number.tin_number,
        header: "TIN Number",
      },
      {
        id: "product",
        accessorFn: (row) => row.commodity_master.product_name,
        header: "Product",
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
      },
      {
        id: "taxable_value",
        header: "Taxable Value",
        cell: ({ row }) => parseFloat(row.original.amount).toFixed(2),
      },
      {
        id: "vat_amount",
        header: "VAT Amount",
        cell: ({ row }) => parseFloat(row.original.vatamount).toFixed(2),
      },
      {
        id: "invoice_value",
        header: "Invoice Value",
        cell: ({ row }) =>
          (
            parseFloat(row.original.amount) + parseFloat(row.original.vatamount)
          ).toFixed(2),
      },
      {
        id: "urn_number",
        accessorFn: (row) => row.urn_number || "-",
        header: "URN",
        filterFn: urnFilterFn,
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Button
            size="small"
            type="primary"
            danger
            loading={reversingIds.includes(row.original.id)}
            onClick={() => onReverse(row.original)}
          >
            Reverse
          </Button>
        ),
      },
    ],
    [onReverse, reversingIds],
  );

  const table = useReactTable({
    data: groupedRows,
    columns: groupColumns,
    state: {
      globalFilter,
      columnFilters,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }
      setUserid(authResponse.data);

      const dvatResponse = await GetUserDvat04();
      if (dvatResponse.status && dvatResponse.data) {
        setDvatData(dvatResponse.data);
      }

      await loadRows();

      setIsLoading(false);
    };

    init();
  }, [loadRows, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
          <h1 className="text-lg font-medium text-gray-900">Reverse Invoice</h1>
          <p className="text-xs text-gray-600 mt-1">
            Showing accepted purchase entries not yet included in DVAT 30A.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Dealer: {dvatData?.tradename ?? dvatData?.name ?? "-"} | TIN:{" "}
            {dvatData?.tinNumber ?? "-"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
          <p className="text-xs text-gray-600">Total Groups</p>
          <p className="text-lg font-medium text-gray-900">
            {table.getFilteredRowModel().rows.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {rows.length} total items in {groupedRows.length} groups
          </p>
        </div>

        <div className="bg-white rounded shadow-sm border p-3">
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              placeholder="Search invoice, TIN, trade name"
            />
            <Select
              allowClear
              placeholder="Filter Trade Name"
              options={tradeNameOptions}
              onChange={(value) => {
                table
                  .getColumn("trade_name")
                  ?.setFilterValue(value || undefined);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-gray-50 border-b"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-center p-2 text-xs"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-6 text-sm text-gray-500"
                    >
                      No accepted purchase rows pending DVAT 30A.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="text-center p-2 text-xs"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-600">
              Showing {table.getRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} filtered rows
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={table.getState().pagination.pageSize}
                options={[
                  { label: "10 / page", value: 10 },
                  { label: "20 / page", value: 20 },
                  { label: "50 / page", value: 50 },
                  { label: "100 / page", value: 100 },
                ]}
                onChange={(value) => table.setPageSize(Number(value))}
                style={{ width: 120 }}
              />
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-700 px-1">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1}
              </span>
              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <Modal
          title="Invoice Details"
          open={isGroupModalOpen}
          onCancel={() => {
            setIsGroupModalOpen(false);
            setSelectedGroup(null);
          }}
          footer={null}
          width={1200}
        >
          {selectedGroup && (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">Invoice Number</p>
                    <p className="font-semibold">
                      {selectedGroup.invoice_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Invoice Date</p>
                    <p className="font-semibold">
                      {formateDate(selectedGroup.invoice_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Seller</p>
                    <p className="font-semibold">{selectedGroup.trade_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-xs text-gray-600">TIN Number</p>
                    <p className="font-semibold">{selectedGroup.tin_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Items</p>
                    <p className="font-semibold">
                      {selectedGroup.records.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="border text-center text-xs">
                        Sr. No.
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        Product Name
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        Quantity
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        Taxable Value
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        VAT Amount
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        Invoice Value
                      </TableHead>
                      <TableHead className="border text-center text-xs">
                        URN
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup.records.map((record, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="p-2 border text-center text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {record.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {record.quantity}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {parseFloat(record.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {parseFloat(record.vatamount).toFixed(2)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {(
                            parseFloat(record.amount) +
                            parseFloat(record.vatamount)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {record.urn_number || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">Total Quantity</p>
                    <p className="font-semibold">
                      {selectedGroup.totalQuantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Taxable Value</p>
                    <p className="font-semibold">
                      {selectedGroup.totalTaxableValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total VAT Amount</p>
                    <p className="font-semibold">
                      {selectedGroup.totalVatAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Invoice Value</p>
                    <p className="font-semibold">
                      {selectedGroup.totalInvoiceValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => setIsGroupModalOpen(false)}>
                  Close
                </Button>
                <Button
                  type="primary"
                  danger
                  loading={reversingAll}
                  onClick={() => onReverseAll(selectedGroup)}
                >
                  Reverse All ({selectedGroup.records.length} items)
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
};

export default ReverseInvoicePage;
