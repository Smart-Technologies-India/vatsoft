"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
import CheckStockUpdateSnapshot from "@/action/stock/checkstockupdatesnapshot";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
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
import { commodity_master, dvat04, stock } from "@prisma/client";
import { Button, Pagination, Radio, RadioChangeEvent } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import ServerTime from "@/action/servertime";

type StockRow = stock & { commodity_master: commodity_master };

const formatIndianNumber = (num: number): string => {
  if (!Number.isFinite(num)) return "0";
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;

  const lastThree = numStr.slice(-3);
  const remaining = numStr.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${withCommas},${lastThree}`;
};

const CommodityMaster = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [hasSnapshotData, setHasSnapshotData] = useState<boolean>(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"available" | "all" | "zero">(
    "available",
  );

  const loadAllStocks = async (dvatId: number) => {
    const initialStockResponse = await GetAllStock({
      take: 1,
      skip: 0,
      dvatid: dvatId,
    });

    if (!initialStockResponse.status || !initialStockResponse.data) {
      setStocks([]);
      setPaginatin({
        skip: 0,
        take: 10,
        total: 0,
      });
      return;
    }

    // Check stock update snapshot data
    const snapshotResponse = await CheckStockUpdateSnapshot({ dvatid: dvatId });
    setHasSnapshotData(snapshotResponse.exists);

    const totalStocks = initialStockResponse.data.total ?? 0;

    if (totalStocks <= 1) {
      setStocks(initialStockResponse.data.result ?? []);
      setPaginatin({
        skip: 0,
        take: 10,
        total: totalStocks,
      });
      return;
    }

    const fullStockResponse = await GetAllStock({
      take: totalStocks,
      skip: 0,
      dvatid: dvatId,
    });

    if (fullStockResponse.status && fullStockResponse.data) {
      setStocks(fullStockResponse.data.result ?? []);
      setPaginatin({
        skip: 0,
        take: 10,
        total: fullStockResponse.data.total,
      });
      return;
    }

    setStocks(initialStockResponse.data.result ?? []);
    setPaginatin({
      skip: 0,
      take: 10,
      total: totalStocks,
    });
  };

  const init = async () => {
    // setLoading(true);
    const dvat = await GetUserDvat04();
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);
      await loadAllStocks(dvat.data.id);
    }

    // setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat = await GetUserDvat04();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
        await loadAllStocks(dvat.data.id);
      }

      setLoading(false);
    };
    init();
  }, [userid]);

  const [quantityCount, setQuantityCount] = useState("pcs");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  // 1 crate 2 pcs
  const showCrates = (quantity: number, crate_size: number): string => {
    // return "";

    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const filteredStocks = useMemo(() => {
    if (stockFilter === "all") {
      return stocks;
    }

    if (stockFilter === "zero") {
      return stocks.filter((val) => val.quantity === 0);
    }

    return stocks.filter((val) => val.quantity !== 0);
  }, [stockFilter, stocks]);

  const isRestaurantCommodity = String(dvatdata?.commodity) === "RESTAURANT";

  const columns = useMemo<ColumnDef<StockRow>[]>(
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
        header:
          quantityCount == "pcs"
            ? dvatdata?.commodity == "FUEL"
              ? "Litres"
              : "Quantity"
            : "Crate",
        cell: ({ row }) => {
          if (quantityCount !== "pcs") {
            return showCrates(
              row.original.quantity,
              row.original.commodity_master.crate_size,
            );
          }
          // If snapshot data exists, show in format "X bottle Y mL"
          if (hasSnapshotData) {
            const packSize = Number(row.original.commodity_master.pack_size);
            if (!Number.isFinite(packSize) || packSize <= 0) {
              return formatIndianNumber(row.original.quantity);
            }
            const bottles = Math.floor(row.original.quantity / packSize);
            const remainingMl = row.original.quantity % packSize;
            return `${formatIndianNumber(bottles)} bottle ${formatIndianNumber(remainingMl)} mL`;
          }
          return formatIndianNumber(row.original.quantity);
        },
      },
      ...(isRestaurantCommodity
        ? [
            {
              id: "ml",
              header: "mL",
              accessorFn: (row: StockRow) => {
                // If snapshot data exists, use quantity directly; otherwise multiply by pack_size
                if (hasSnapshotData) {
                  return row.quantity;
                }
                const packSize = Number(row.commodity_master.pack_size);
                if (!Number.isFinite(packSize) || packSize <= 0) {
                  return null;
                }
                return Number(row.quantity) * packSize;
              },
              cell: ({ row }: { row: { original: StockRow } }) => {
                // If snapshot data exists, use quantity directly; otherwise multiply by pack_size
                if (hasSnapshotData) {
                  return formatIndianNumber(row.original.quantity);
                }
                const packSize = Number(
                  row.original.commodity_master.pack_size,
                );
                if (!Number.isFinite(packSize) || packSize <= 0) {
                  return "-";
                }
                return formatIndianNumber(
                  Number(row.original.quantity) * packSize,
                );
              },
            } as ColumnDef<StockRow>,
          ]
        : []),
      {
        id: "description",
        accessorFn: (row) => row.commodity_master.description || "-",
        header: "Description",
        cell: ({ row }) => row.original.commodity_master.description || "-",
      },
    ],
    [
      dvatdata?.commodity,
      isRestaurantCommodity,
      quantityCount,
      hasSnapshotData,
    ],
  );

  const table = useReactTable({
    data: filteredStocks,
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
        row.original.commodity_master.description,
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

  const onChangePageCount = (page: number, pagesize: number) => {
    table.setPageSize(pagesize);
    table.setPageIndex(page - 1);
  };

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, stockFilter, table]);

  // csv section start from here
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [csv, setCsv] = useState<File | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  interface CsvData {
    tin: string;
    invoice_date: string;
    invoice_no: string;
    oidc_code: string;
    quantity: string;
    error: boolean;
    errorname: string | null;
    mrp: string | null;
    crate_size: number | null;
    product_name: string | null;
  }
  const [tabledata, setTableData] = useState<CsvData[]>([]);

  const handleDownloadStockAsXlsx = () => {
    if (!filteredStocks || filteredStocks.length === 0) {
      toast.error("No data to download");
      return;
    }

    // Prepare data for export
    const exportData = filteredStocks.map((stock, index) => {
      const baseData: any = {
        "Sr. No.": index + 1,
        "Item ID": stock.commodity_master.id,
        "Product Name": stock.commodity_master.product_name,
      };

      // Add quantity or crate based on selection
      if (quantityCount === "pcs") {
        baseData[dvatdata?.commodity === "FUEL" ? "Litres" : "Quantity"] =
          stock.quantity;
      } else {
        baseData["Crate"] = showCrates(
          stock.quantity,
          stock.commodity_master.crate_size,
        );
      }

      return baseData;
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 10 }, // Sr. No.
      { wch: 12 }, // Item ID
      { wch: 25 }, // Product Name
      { wch: 15 }, // Quantity/Crate
    ];
    worksheet["!cols"] = columnWidths;

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    // Generate filename with timestamp
    const timestamp = (ServerTime().data as Date).toISOString().split("T")[0];
    const filename = `stock_${quantityCount}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, filename);
    toast.success("Stock data downloaded successfully");
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <main className="p-3 bg-gray-50">
        <div className=" mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Title Section */}
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Stock Management
                </h1>
              </div>

              <div className="grow"></div>

              {/* Controls Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Quantity Toggle for Non-Fuel */}
                {dvatdata?.commodity != "FUEL" && !isRestaurantCommodity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <Radio.Group
                      size="small"
                      onChange={onChange}
                      value={quantityCount}
                      optionType="button"
                    >
                      <Radio.Button value="pcs">Pcs</Radio.Button>
                      <Radio.Button value="crate">Crate</Radio.Button>
                    </Radio.Group>
                  </div>
                )}

                <Button
                  size="small"
                  type="default"
                  onClick={handleDownloadStockAsXlsx}
                >
                  Download Stock
                </Button>

                {dvatdata?.commodity == "FUEL" && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => router.push("/dashboard/refinery_sales")}
                  >
                    Refinery Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stock Table Card */}
          {stocks.length != 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="w-full lg:max-w-sm">
                  <Input
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    placeholder="Search by item ID, product name, or description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Filter:</span>
                  <select
                    value={stockFilter}
                    onChange={(event) =>
                      setStockFilter(
                        event.target.value as "available" | "all" | "zero",
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                  >
                    <option value="available">Available Stock</option>
                    <option value="all">All Stock</option>
                    <option value="zero">Zero Quantity</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 lg:ml-auto">
                  Showing {table.getFilteredRowModel().rows.length} of{" "}
                  {pagination.total} items
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="bg-gray-50 border-b"
                      >
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort();
                          const sortState = header.column.getIsSorted();
                          const alignClass =
                            header.column.id === "productName" ||
                            header.column.id === "description"
                              ? "text-left"
                              : "text-center";

                          return (
                            <th
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
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b hover:bg-gray-50"
                        >
                          {row.getVisibleCells().map((cell) => {
                            const alignClass =
                              cell.column.id === "productName" ||
                              cell.column.id === "description"
                                ? "text-left"
                                : "text-center";

                            return (
                              <td
                                key={cell.id}
                                className={`p-2 text-xs ${alignClass}${
                                  cell.column.id === "description"
                                    ? " text-gray-600"
                                    : ""
                                }`}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="p-4 text-center text-sm text-gray-500"
                        >
                          No matching stock records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
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
          ) : (
            <div className="bg-white rounded shadow-sm border p-3 text-center">
              <p className="text-gray-500 text-sm">No stock available.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
