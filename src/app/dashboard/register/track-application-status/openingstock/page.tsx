"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import GetFirstStock from "@/action/firststock/getfirststock";
import { CreateFirstStockProvider } from "@/components/forms/createstock/createstockfirst";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, first_stock, stock } from "@prisma/client";
import { Alert, Radio, RadioChangeEvent } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";

type StockItem = first_stock & { commodity_master: commodity_master };

const OpeningStock = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [isLoading, setLoading] = useState<boolean>(true);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [quantityCount, setQuantityCount] = useState("pcs");
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat = await GetUserDvat04FirstStock();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
      }

      const first_stock = await GetFirstStock({});
      if (first_stock.status && first_stock.data) {
        setStock(first_stock.data);
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

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

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<StockItem>[]>(
    () => [
      {
        id: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorFn: (row) => row.commodity_master.product_name,
        id: "productName",
        header: "Product Name",
        cell: ({ row }) => (
          <div className="text-left">{row.original.commodity_master.product_name}</div>
        ),
      },
      {
        id: "quantity",
        header: () => (
          <div className="text-center">
            {quantityCount === "pcs"
              ? dvatdata?.commodity === "FUEL"
                ? "Litres"
                : "Qty"
              : "Crate"}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {quantityCount === "pcs"
              ? row.original.quantity
              : showCrates(
                  row.original.quantity,
                  row.original.commodity_master.crate_size
                )}
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorFn: (row) => row.commodity_master.description,
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-left">{row.original.commodity_master.description}</div>
        ),
      },
    ],
    [quantityCount, dvatdata?.commodity]
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: stock,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <main className="w-full p-4">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2 mb-3">
            <p className="text-lg font-semibold items-center">Stock</p>
            <div className="grow"></div>
            <div className="flex gap-2 items-center">
              <Radio.Group
                size="small"
                onChange={onChange}
                value={quantityCount}
                optionType="button"
              >
                <Radio.Button className="w-20 text-center" value="pcs">
                  Pcs
                </Radio.Button>
                <Radio.Button className="w-20 text-center" value="crate">
                  Crate
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>

          {stock.length !== 0 ? (
            <>
              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search by product name or description..."
                  className="w-full md:w-96 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-gray-100">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap border text-center p-2"
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
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="p-4 text-center text-gray-500"
                        >
                          No results found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="p-2 border">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </span>
                  <span className="text-sm text-gray-700">
                    | Total: {table.getFilteredRowModel().rows.length} rows
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {"<<"}
                  </button>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {"<"}
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {">"}
                  </button>
                  <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {">>"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 10, 20, 30, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>
              </div>
            </>
          ) : (
            <Alert
              style={{
                marginTop: "10px",
                padding: "8px",
              }}
              type="error"
              showIcon
              description="There is no stock."
            />
          )}
        </div>
      </main>
    </>
  );
};

export default OpeningStock;
