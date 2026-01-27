"use client";

import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, Button, Input, Pagination } from "antd";
import { useEffect, useRef, useState, useMemo } from "react";
import { dvat04, user } from "@prisma/client";
import { encryptURLData } from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import TimeLineSummary from "@/action/report/timeline_summary";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface ResponseType {
  dvat04: dvat04;
  late: number;
  filed: number;
  pending: number;
  due: number;
}

const AfterDeathLinePage = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  const years = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - i,
  );

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  enum SearchOption {
    TIN,
    NAME,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TIN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user | null>(null);

  const [sortField, setSortField] = useState<"filed" | "late" | "pending" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "filed" | "late" | "pending") => {
    if (sortField === field) {
      // Toggle order or clear
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<ResponseType>[]>(
    () => [
      {
        accessorKey: "dvat04.tinNumber",
        header: "TIN Number",
        cell: (info) => info.row.original.dvat04.tinNumber,
      },
      {
        accessorKey: "dvat04.tradename",
        header: "Trade Name",
        cell: (info) => info.row.original.dvat04.tradename,
      },
      {
        accessorKey: "filed",
        header: () => (
          <div
            className="cursor-pointer select-none flex items-center justify-center gap-1"
            onClick={() => handleSort("filed")}
          >
            Timely Filed
            {sortField === "filed" && sortOrder === "asc" ? " ↑" : sortField === "filed" && sortOrder === "desc" ? " ↓" : " ↕"}
          </div>
        ),
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "late",
        header: () => (
          <div
            className="cursor-pointer select-none flex items-center justify-center gap-1"
            onClick={() => handleSort("late")}
          >
            Late Filing
            {sortField === "late" && sortOrder === "asc" ? " ↑" : sortField === "late" && sortOrder === "desc" ? " ↓" : " ↕"}
          </div>
        ),
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "pending",
        header: () => (
          <div
            className="cursor-pointer select-none flex items-center justify-center gap-1"
            onClick={() => handleSort("pending")}
          >
            Pending Filing
            {sortField === "pending" && sortOrder === "asc" ? " ↑" : sortField === "pending" && sortOrder === "desc" ? " ↓" : " ↕"}
          </div>
        ),
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "due",
        header: "Due",
        cell: (info) => info.getValue(),
      },
      {
        id: "actions",
        header: "View",
        cell: (info) => (
          <Button
            type="primary"
            onClick={() => {
              router.push(
                `/dashboard/returns/department-pending-return/${encryptURLData(
                  info.row.original.dvat04.id.toString()
                )}`
              );
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [router, sortField, sortOrder]
  );

  const table = useReactTable({
    data: dvatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await TimeLineSummary({
        dept: userrespone.data.selectOffice!,
        take: 10,
        skip: 0,
        year: selectedYear,
        sortField: sortField || undefined,
        sortOrder: sortField ? sortOrder : undefined,
      });

      if (payment_data.status && payment_data.data.result) {
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(payment_data.data.result);
      }
    }

    setSearch(false);
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

      const userrespone = await GetUser({ id: authResponse.data });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const payment_data = await TimeLineSummary({
          dept: userrespone.data.selectOffice!,
          take: 10,
          skip: 0,
          year: selectedYear,
          sortField: sortField || undefined,
          sortOrder: sortField ? sortOrder : undefined,
        });

        if (payment_data.status && payment_data.data.result) {
          setDvatData(payment_data.data.result);
          setPaginatin({
            skip: payment_data.data.skip,
            take: payment_data.data.take,
            total: payment_data.data.total,
          });
        }
      }
      setLoading(false);
    };
    init();
  }, [userid, selectedYear, sortField, sortOrder]);

  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await TimeLineSummary({
      dept: user!.selectOffice!,
      arnnumber: arnRef.current?.input?.value,
      take: 10,
      skip: 0,
      year: selectedYear,
      sortField: sortField || undefined,
      sortOrder: sortField ? sortOrder : undefined,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };

  const namesearch = async () => {
    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await TimeLineSummary({
      dept: user!.selectOffice!,
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
      year: selectedYear,
      sortField: sortField || undefined,
      sortOrder: sortField ? sortOrder : undefined,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSearch(true);
    }
  };
  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await TimeLineSummary({
          dept: user!.selectOffice!,
          arnnumber: arnRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
          year: selectedYear,
          sortField: sortField || undefined,
          sortOrder: sortField ? sortOrder : undefined,
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.NAME) {
        if (
          nameRef.current?.input?.value == undefined ||
          nameRef.current?.input?.value == null ||
          nameRef.current?.input?.value == ""
        ) {
          return toast.error("Enter TIN Number");
        }
        const search_response = await TimeLineSummary({
          dept: user!.selectOffice!,
          tradename: nameRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
          year: selectedYear,
          sortField: sortField || undefined,
          sortOrder: sortField ? sortOrder : undefined,
        });

        if (search_response.status && search_response.data.result) {
          setDvatData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = await TimeLineSummary({
        dept: user!.selectOffice!,
        take: pagesize,
        skip: pagesize * (page - 1),
        year: selectedYear,
        sortField: sortField || undefined,
        sortOrder: sortField ? sortOrder : undefined,
      });
      if (payment_data.status && payment_data.data.result) {
        setDvatData(payment_data.data.result);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
      }
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-3 py-2">
        {/* Header */}
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            <p className="text-lg font-semibold">
              Return Filing Timeline Summary Report
            </p>
          </div>
          
          {/* Filters Section - All in One Line */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 border-b">
            <label className="text-sm font-medium text-gray-700">
              Filter by:
            </label>
            
            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Type */}
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.TIN}>TIN</Radio>
              <Radio value={SearchOption.NAME}>Trade Name</Radio>
            </Radio.Group>

            {/* Search Input */}
            {(() => {
              switch (searchOption) {
                case SearchOption.TIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter TIN"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={arnsearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.NAME:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={nameRef}
                        placeholder={"Enter Trade Name"}
                        disabled={isSearch}
                      />

                      {isSearch ? (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      ) : (
                        <Button onClick={namesearch} type="primary">
                          Search
                        </Button>
                      )}
                    </div>
                  );

                default:
                  return null;
              }
            })()}
          </div>

          {/* Data Table */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-100">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="whitespace-nowrap text-center border p-2 font-semibold text-gray-700"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="border text-center p-2 text-gray-600"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2"></div>
          <div className="lg:hidden">
            <Pagination
              align="center"
              defaultCurrent={1}
              onChange={onChangePageCount}
              showSizeChanger
              total={pagination.total}
              showTotal={(total: number) => `Total ${total} items`}
            />
          </div>
          <div className="hidden lg:block">
            <Pagination
              showQuickJumper
              align="center"
              defaultCurrent={1}
              onChange={onChangePageCount}
              showSizeChanger
              pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
              total={pagination.total}
              responsive={true}
              showTotal={(total: number, range: number[]) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AfterDeathLinePage;
