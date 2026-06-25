"use client";

import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetAllStock from "@/action/stock/getallstock";
import GetAllBreakage from "@/action/stock/getallbreakage";
import CreateBreakage from "@/action/stock/createbreakage";
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
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { breakage, commodity_master, dvat04, stock } from "@prisma/client";
import { Button, Modal, Pagination } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type BreakageRow = breakage & { commodity_master: commodity_master };
type StockRow = stock & { commodity_master: commodity_master };

const CRATE_BASED_COMMODITIES = new Set([
  "OIDC",
  "WHOLESALER",
  "MANUFACTURER",
]);

const BreakagePage = () => {
  const router = useRouter();
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [isLoading, setLoading] = useState(true);

  const [breakages, setBreakages] = useState<BreakageRow[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);

  const [pagination, setPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | null>(
    null,
  );
  const [entryQuantity, setEntryQuantity] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState(false);

  const isCrateBasedCommodity = useMemo(
    () => CRATE_BASED_COMMODITIES.has(String(dvatdata?.commodity ?? "")),
    [dvatdata?.commodity],
  );

  const quantityUnitLabel = isCrateBasedCommodity ? "Crate" : "Pcs";

  const loadAllStocks = async (dvatId: number) => {
    const initialResponse = await GetAllStock({
      dvatid: dvatId,
      take: 1,
      skip: 0,
    });

    if (!initialResponse.status || !initialResponse.data) {
      setStocks([]);
      return;
    }

    const total = initialResponse.data.total ?? 0;
    if (total <= 1) {
      setStocks(initialResponse.data.result ?? []);
      return;
    }

    const fullResponse = await GetAllStock({
      dvatid: dvatId,
      take: total,
      skip: 0,
    });

    if (fullResponse.status && fullResponse.data) {
      setStocks(fullResponse.data.result ?? []);
      return;
    }

    setStocks(initialResponse.data.result ?? []);
  };

  const loadAllBreakage = async (dvatId: number) => {
    const initialResponse = await GetAllBreakage({
      dvatid: dvatId,
      take: 1,
      skip: 0,
    });

    if (!initialResponse.status || !initialResponse.data) {
      setBreakages([]);
      setPagination({
        take: 10,
        skip: 0,
        total: 0,
      });
      return;
    }

    const total = initialResponse.data.total ?? 0;
    if (total <= 1) {
      setBreakages(initialResponse.data.result ?? []);
      setPagination({
        take: 10,
        skip: 0,
        total,
      });
      return;
    }

    const fullResponse = await GetAllBreakage({
      dvatid: dvatId,
      take: total,
      skip: 0,
    });

    if (fullResponse.status && fullResponse.data) {
      setBreakages(fullResponse.data.result ?? []);
      setPagination({
        take: 10,
        skip: 0,
        total: fullResponse.data.total,
      });
      return;
    }

    setBreakages(initialResponse.data.result ?? []);
    setPagination({
      take: 10,
      skip: 0,
      total,
    });
  };

  const init = async () => {
    const dvatResponse = await GetUserDvat04();
    if (!dvatResponse.status || !dvatResponse.data) {
      setDvatData(null);
      setBreakages([]);
      setStocks([]);
      return;
    }

    setDvatData(dvatResponse.data);

    await Promise.all([
      loadAllBreakage(dvatResponse.data.id),
      loadAllStocks(dvatResponse.data.id),
    ]);
  };

  useEffect(() => {
    const boot = async () => {
      setLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }

      await init();
      setLoading(false);
    };

    boot();
  }, [router]);

  const availableStocks = useMemo(
    () => stocks.filter((stockRow) => stockRow.quantity > 0),
    [stocks],
  );

  const renderBreakageQuantity = (
    quantityInPcs: number,
    crateSize: number,
  ): string | number => {
    if (!isCrateBasedCommodity) {
      return quantityInPcs;
    }

    if (!crateSize || crateSize <= 0) {
      return "-";
    }

    return (quantityInPcs / crateSize).toFixed(2);
  };

  const columns = useMemo<ColumnDef<BreakageRow>[]>(
    () => [
      {
        id: "serial",
        header: "Sr. No.",
        enableSorting: false,
        cell: ({ row, table }) =>
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
          row.index +
          1,
      },
      {
        id: "itemId",
        accessorFn: (row) => row.commodity_master.id,
        header: "Item ID",
        cell: ({ row }) => row.original.commodity_master.id,
      },
      {
        id: "productName",
        accessorFn: (row) => row.commodity_master.product_name,
        header: "Product Name",
        cell: ({ row }) => row.original.commodity_master.product_name,
      },
      {
        id: "quantity",
        accessorFn: (row) => row.quantity,
        header: `Breakage (${quantityUnitLabel})`,
        cell: ({ row }) =>
          renderBreakageQuantity(
            row.original.quantity,
            row.original.commodity_master.crate_size,
          ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt,
        header: "Created At",
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          if (Number.isNaN(date.getTime())) {
            return "-";
          }

          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
      },
    ],
    [quantityUnitLabel, isCrateBasedCommodity],
  );

  const table = useReactTable({
    data: breakages,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase().trim();
      if (!searchValue) {
        return true;
      }

      return [
        row.original.commodity_master.id,
        row.original.commodity_master.product_name,
      ]
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

  const onChangePageCount = (page: number, pageSize: number) => {
    table.setPageSize(pageSize);
    table.setPageIndex(page - 1);
  };

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, table]);

  const handleAddBreakage = async () => {
    if (!dvatdata) {
      toast.error("DVAT details not found.");
      return;
    }

    if (!selectedCommodityId) {
      toast.error("Please select a commodity.");
      return;
    }

    const parsedQuantity = Number(entryQuantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error(`Please enter valid ${quantityUnitLabel.toLowerCase()} quantity.`);
      return;
    }

    setSubmitting(true);
    const response = await CreateBreakage({
      dvatid: dvatdata.id,
      commodityid: selectedCommodityId,
      quantity: parsedQuantity,
    });
    setSubmitting(false);

    if (!response.status || !response.data) {
      toast.error(response.message);
      return;
    }

    toast.success("Breakage added successfully.");
    setIsAddModalOpen(false);
    setSelectedCommodityId(null);
    setEntryQuantity("");
    await Promise.all([loadAllBreakage(dvatdata.id), loadAllStocks(dvatdata.id)]);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Modal
        title={<div className="text-xl font-semibold text-gray-800">Add Breakage / Evaporation</div>}
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          setSelectedCommodityId(null);
          setEntryQuantity("");
        }}
        onOk={handleAddBreakage}
        okText={isSubmitting ? "Saving..." : "Add"}
        confirmLoading={isSubmitting}
      >
        <div className="space-y-3 mt-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Commodity</label>
            <select
              value={selectedCommodityId ?? ""}
              onChange={(event) =>
                setSelectedCommodityId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">Select commodity</option>
              {availableStocks.map((stockRow) => (
                <option
                  key={stockRow.commodity_masterId}
                  value={stockRow.commodity_masterId}
                >
                  {stockRow.commodity_master.product_name} (Stock: {renderBreakageQuantity(stockRow.quantity, stockRow.commodity_master.crate_size)} {quantityUnitLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">
              Quantity ({quantityUnitLabel})
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={entryQuantity}
              onChange={(event) => setEntryQuantity(event.target.value)}
              placeholder={`Enter quantity in ${quantityUnitLabel}`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Breakage will reduce stock immediately.
            </p>
          </div>
        </div>
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className="mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Breakage / Evaporation
                </h1>
              </div>

              <div className="grow" />

              <div className="flex flex-wrap gap-2 items-center">
                <Button size="small" type="primary" onClick={() => setIsAddModalOpen(true)}>
                  Add Breakage
                </Button>
                <Button
                  size="small"
                  type="default"
                  onClick={() => router.push("/dashboard/stock")}
                >
                  View Stock
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border p-3">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="w-full lg:max-w-sm">
                <Input
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder="Search by item ID, product name, or description"
                />
              </div>

              <div className="text-xs text-gray-500 lg:ml-auto">
                Showing {table.getFilteredRowModel().rows.length} of {pagination.total} items
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sortState = header.column.getIsSorted();
                        const alignClass =
                          header.column.id === "productName" ||
                          header.column.id === "createdAt"
                            ? "text-left"
                            : "text-center";

                        return (
                          <TableHead
                            key={header.id}
                            className={`p-2 font-medium text-gray-700 text-xs ${alignClass}`}
                          >
                            {header.isPlaceholder ? null : canSort ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className={`inline-flex items-center gap-1 ${alignClass === "text-left" ? "justify-start" : "justify-center"} w-full`}
                              >
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {sortState === "asc"
                                    ? "▲"
                                    : sortState === "desc"
                                      ? "▼"
                                      : "↕"}
                                </span>
                              </button>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-b hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => {
                          const alignClass =
                            cell.column.id === "productName" ||
                            cell.column.id === "createdAt"
                              ? "text-left"
                              : "text-center";

                          return (
                            <TableCell
                              key={cell.id}
                              className={`p-2 text-xs ${alignClass}${
                                cell.column.id === "createdAt"
                                  ? " text-gray-600"
                                  : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="p-4 text-center text-sm text-gray-500"
                      >
                        No breakage records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="px-3 py-2 border-t bg-gray-50">
              <div className="lg:hidden">
                <Pagination
                  align="center"
                  current={table.getState().pagination.pageIndex + 1}
                  pageSize={table.getState().pagination.pageSize}
                  onChange={onChangePageCount}
                  showSizeChanger
                  total={table.getFilteredRowModel().rows.length}
                  showTotal={(total: number) => `Total ${total} items`}
                />
              </div>
              <div className="hidden lg:block">
                <Pagination
                  showQuickJumper
                  align="center"
                  current={table.getState().pagination.pageIndex + 1}
                  pageSize={table.getState().pagination.pageSize}
                  onChange={onChangePageCount}
                  showSizeChanger
                  pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                  total={table.getFilteredRowModel().rows.length}
                  responsive={true}
                  showTotal={(total: number, range: number[]) =>
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default BreakagePage;
