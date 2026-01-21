"use client";

import {
  CharmChevronLeft,
  CharmChevronRight,
  MaterialSymbolsKeyboardArrowDownRounded,
  MaterialSymbolsKeyboardArrowUpRounded,
  MaterialSymbolsKeyboardDoubleArrowLeft,
  MaterialSymbolsKeyboardDoubleArrowRight,
  TablerCheckbox,
  TablerRefresh,
} from "@/components/icons";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import Marquee from "react-fast-marquee";
import { default as MulSelect } from "react-select";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
  ColumnFiltersState,
  getFilteredRowModel,
  getSortedRowModel,
  RowData,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const ViewPage = () => {
  const [year, setYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [period, setPeriod] = useState<string>("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  type Person = {
    id: number;
    name: string;
    age: number;
    email: string;
  };

  const DATA: Person[] = [
    {
      id: 1,
      name: "one",
      age: 23,
      email: "one@gamil.com",
    },
    {
      id: 2,
      name: "two",
      age: 42,
      email: "two@gmail.com",
    },
    {
      id: 3,
      name: "three",
      age: 32,
      email: "three@gmail.com",
    },
    {
      id: 4,
      name: "four",
      age: 42,
      email: "four@gamil.com",
    },
    {
      id: 5,
      name: "five",
      age: 32,
      email: "five@gmail.com",
    },
    {
      id: 6,
      name: "six",
      age: 42,
      email: "six@gamil.com",
    },
    {
      id: 7,
      name: "seven",
      age: 32,
      email: "seven@gmail.com",
    },
    {
      id: 8,
      name: "eight",
      age: 42,
      email: "eight@gmail.com",
    },
    {
      id: 9,
      name: "nine",
      age: 32,
      email: "nine@gmail.com",
    },
    {
      id: 10,
      name: "ten",
      age: 42,
      email: "ten@gmail.com",
    },
    {
      id: 11,
      name: "eleven",
      age: 32,
      email: "elleven@gmail.com",
    },
    {
      id: 12,
      name: "twelve",
      age: 42,
      email: "twelve@gmail.com",
    },
    {
      id: 13,
      name: "thirteen",
      age: 32,
      email: "thirteen@gmail.com",
    },
    {
      id: 14,
      name: "fourteen",
      age: 42,
      email: "forteen@gmail.com",
    },
    {
      id: 15,
      name: "fifteen",
      age: 32,
      email: "fifteen@gmail.com",
    },
    {
      id: 16,
      name: "sixteen",
      age: 42,
      email: "sixteen@gmail.com",
    },
    {
      id: 17,
      name: "seventeen",
      age: 32,
      email: "seventeen@gmail.com",
    },
    {
      id: 18,
      name: "eighteen",
      age: 42,
      email: "eighteen@gmail.com",
    },
    {
      id: 19,
      name: "nineteen",
      age: 32,
      email: "nineteen@gmail.com",
    },
    {
      id: 20,
      name: "twenty",
      age: 42,
      email: "twenty@gmail.com",
    },
  ];

  const columnHelper = createColumnHelper<Person>();

  const columns = useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        header: "ID",
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
      },
      {
        accessorFn: (row) => row.name,
        header: "Name",
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
      },
      {
        accessorFn: (row) => row.age,
        header: "Age",
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
      },
      {
        accessorFn: (row) => row.email,
        header: "Email",
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
      },
    ],
    []
  );

  const [data, setData] = useState(DATA);

  const table = useReactTable({
    data,
    columns,
    filterFns: {},
    state: {
      columnFilters,
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
    manualPagination: true,
  });

  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">Data Table Overview</h1>
          </div>
          <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-gray-700">
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <MaterialSymbolsKeyboardArrowUpRounded className="text-2xl mt-1" />
                              ),
                              desc: (
                                <MaterialSymbolsKeyboardArrowDownRounded className="text-2xl mt-1" />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-blue-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
            <button
              className="border border-gray-300 rounded p-2 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <MaterialSymbolsKeyboardDoubleArrowLeft />
            </button>
            <button
              className="border border-gray-300 rounded p-2 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <CharmChevronLeft />
            </button>
            <button
              className="border border-gray-300 rounded p-2 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <CharmChevronRight />
            </button>
            <button
              className="border border-gray-300 rounded p-2 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <MaterialSymbolsKeyboardDoubleArrowRight />
            </button>
            <span className="flex items-center gap-1">
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount().toLocaleString()}
              </strong>
            </span>
            <p>
              {/* {dataQuery.isFetching ? "Loading..." : null} */}| Showing{" "}
              {table.getRowModel().rows.length.toLocaleString()} of 20
              {/* {dataQuery.data?.rowCount.toLocaleString()} Rows */}
            </p>
            <div className="grow"></div>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              Go to page:
              <input
                type="number"
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="border border-gray-300 p-1 rounded w-16 focus:border-blue-400 focus:outline-none"
              />
            </span>
            <select
              className="border border-gray-300 p-2 rounded hover:border-blue-400 focus:border-blue-400 focus:outline-none transition-colors"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <h1 className="text-xl font-bold text-gray-900">File Returns</h1>
          </div>
          <Marquee className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            This is a banner can be used for official updates and notifications.
          </Marquee>

          <div className="flex w-full gap-4 items-end mt-4">
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Financial Year <span className="text-rose-500">*</span>
              </Label>
              <MulSelect
                isMulti={false}
                options={[
                  {
                    value: "2024",
                    label: "2024-25",
                  },
                  {
                    value: "2023",
                    label: "2023-24",
                  },
                  {
                    value: "2022",
                    label: "2022-23",
                  },
                  {
                    value: "2021",
                    label: "2021-22",
                  },
                  {
                    value: "2020",
                    label: "2020-21",
                  },
                  {
                    value: "2019",
                    label: "2019-20",
                  },
                  {
                    value: "2018",
                    label: "2018-19",
                  },
                  {
                    value: "2017",
                    label: "2017-18",
                  },
                ]}
                className="w-full accent-slate-900"
                onChange={(val: any) => {
                  if (!val) return;
                  setYear(val.value.toString());
                }}
              />
            </div>
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Quarter <span className="text-rose-500">*</span>
              </Label>
              <MulSelect
                isMulti={false}
                options={[
                  {
                    value: "Apr - Jun",
                    label: "1",
                  },
                  {
                    value: "Jul Sep",
                    label: "2",
                  },
                  {
                    value: "Oct Dec",
                    label: "3",
                  },
                  {
                    value: "Jan Mar",
                    label: "4",
                  },
                ]}
                className="w-full accent-slate-900"
                onChange={(val: any) => {
                  if (!val) return;
                  setQuarter(val.value.toString());
                }}
              />
            </div>
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Period <span className="text-rose-500">*</span>
              </Label>
              <MulSelect
                isMulti={false}
                options={[
                  {
                    value: "October",
                    label: "1",
                  },
                  {
                    value: "November",
                    label: "2",
                  },
                  {
                    value: "December",
                    label: "3",
                  },
                ]}
                className="w-full accent-slate-900"
                onChange={(val: any) => {
                  if (!val) return;
                  setPeriod(val.value.toString());
                }}
              />
            </div>
            <button className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-8 text-white py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
              Search
            </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-4 gap-4 mt-4">
          <Card />
          <Card />
          <Card />
          <Card />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4">
          <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white flex items-center gap-2">
            <p className="font-semibold">VAT Details of outward supplied of goods or services</p>
            <div className="grow"></div>
            <button className="hover:bg-white/20 p-1 rounded transition-colors">
              <TablerRefresh />
            </button>
          </div>
          <div className="bg-linear-to-r from-gray-50 to-blue-50 p-4 flex text-xs justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-gray-700">VAT NO. - 9O2UI3HR92U3RH98</p>
              <p className="text-gray-600">FY - 2024 - 9O2UI3HR92U3RH98</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-700">Legal Name - F23RF243</p>
              <p className="text-gray-600">Tax Period - May</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-700">Trade Name - Smart Technologies</p>
              <p className="text-gray-600">Status - Filed</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-700">Indicates Mandatory Fields</p>
              <p className="text-gray-600">Due Date - 11/06/2024</p>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-4 gap-4 mt-4">
          <CardTwo title="0% Tax Invoice" />
          <CardTwo title="10% Tax Invoice" />
          <CardTwo title="20% Tax Invoice" />
          <CardTwo title="40% Tax Invoice" />
        </div>
      </main>
    </>
  );
};
export default ViewPage;

const Card = () => {
  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
      <div className="text-white text-sm font-semibold text-center bg-linear-to-r from-blue-600 to-indigo-700 p-3 rounded-lg">
        <p className="text-white text-xs font-semibold mb-1">VAT</p>
        <p>Details of outward supplies of goods or services</p>
      </div>

      <div className="mt-3 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Status: Submitted
        </span>
      </div>
      <div className="flex gap-2 justify-around mt-3">
        <button className="flex-1 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-sm py-2 font-medium transition-all shadow-md hover:shadow-lg">
          View
        </button>
        <button className="flex-1 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-sm py-2 font-medium transition-all shadow-md hover:shadow-lg">
          Download
        </button>
      </div>
    </div>
  );
};

interface CardTwoProps {
  title: string;
}

const CardTwo = (props: CardTwoProps) => {
  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
      <div className="text-white text-sm font-semibold text-center bg-gradient-to-r from-blue-600 to-indigo-700 p-3 rounded-lg">
        <p>{props.title}</p>
      </div>

      <div className="text-center flex mt-3 justify-center items-center gap-2">
        <TablerCheckbox className="text-green-500 text-2xl" /> 
        <span className="text-lg font-semibold text-gray-700">23</span>
      </div>
    </div>
  );
};
