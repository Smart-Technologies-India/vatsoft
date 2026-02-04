"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, Button, Input, Pagination, Spin, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Dayjs } from "dayjs";
import { dvat04, user } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import { useRouter } from "next/navigation";
import { SelectOffice } from "@prisma/client";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import GetInactiveDealers from "@/action/report/inactivedealers";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import * as XLSX from "xlsx";
import {
  MaterialSymbolsPersonRounded,
  IcOutlineReceiptLong,
  Fa6RegularBuilding,
} from "@/components/icons";

ChartJS.register(...registerables);

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
}

const InactiveDealers = () => {
  const [userid, setUserid] = useState<number>(0);

  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

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

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<SelectOffice | "ALL">("ALL");

  // Calculate statistics
  const totalInactiveDealers = pagination.total;
  const totalPendingReturns = dvatData.reduce(
    (sum, item) => sum + item.pending,
    0
  );
  const averagePending =
    dvatData.length > 0 ? totalPendingReturns / dvatData.length : 0;
  const compositionDealers = dvatData.filter(
    (item) => item.dvat04.compositionScheme
  ).length;
  const regularDealers = dvatData.length - compositionDealers;
  const maxPending = dvatData.length > 0 ? Math.max(...dvatData.map((d) => d.pending)) : 0;
  const minPending = dvatData.length > 0 ? Math.min(...dvatData.map((d) => d.pending)) : 0;

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await GetInactiveDealers({
        dept: selectedOffice === "ALL" ? undefined : selectedOffice,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort(
          (a: ResponseType, b: ResponseType) => b.pending - a.pending
        );
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(sortedData);
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
        setSelectedOffice(userrespone.data.selectOffice!);
        const payment_data = await GetInactiveDealers({
          dept: userrespone.data.selectOffice!,
          take: 10,
          skip: 0,
        });

        if (payment_data.status && payment_data.data.result) {
          const sortedData = payment_data.data.result.sort(
            (a: ResponseType, b: ResponseType) => b.pending - a.pending
          );
          setDvatData(sortedData);
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
  }, [userid]);

  // Reload data when office selection changes
  useEffect(() => {
    const loadDataByOffice = async () => {
      if (!user || !selectedOffice) return;
      
      setLoading(true);
      const payment_data = await GetInactiveDealers({
        dept: selectedOffice === "ALL" ? undefined : selectedOffice,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort(
          (a: ResponseType, b: ResponseType) => b.pending - a.pending
        );
        setDvatData(sortedData);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
      }
      setLoading(false);
    };

    if (user && selectedOffice && !isSearch) {
      loadDataByOffice();
    }
  }, [selectedOffice]);

  const get_years = (month: string, year: string): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = monthNames.indexOf(capitalcase(month));
    const yearNum = parseInt(year, 10);

    // If the month is between September (index 8) and March (index 2), return year-year+1
    if (monthIndex >= 8) {
      // September to December
      return `${yearNum}-${yearNum + 1}`;
    } else {
      // January to April
      return `${yearNum - 1}-${yearNum}`;
    }
  };

  // const get_month = (composition: boolean, month: string): string => {
  //   if (composition) {
  //     if (["January", "February", "March"].includes(capitalcase(month))) {
  //       return "Jan-Mar";
  //     } else if (["April", "May", "June"].includes(capitalcase(month))) {
  //       return "Apr-Jun";
  //     } else if (["July", "August", "September"].includes(capitalcase(month))) {
  //       return "Jul-Sep";
  //     } else if (
  //       ["October", "November", "December"].includes(capitalcase(month))
  //     ) {
  //       return "Oct-Dec";
  //     } else {
  //       return "Jan-Mar";
  //     }
  //   } else {
  //     return month;
  //   }
  // };
  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await GetInactiveDealers({
      arnnumber: arnRef.current?.input?.value,
      dept: selectedOffice === "ALL" ? undefined : selectedOffice,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setSearch(true);
    }
  };

  // const datesearch = async () => {
  //   if (searchDate == null || searchDate.length <= 1) {
  //     return toast.error("Select state date and end date");
  //   }

  //   const search_response = await SearchDeptPendingReturn({
  //     fromdate: searchDate[0]?.toDate(),
  //     todate: searchDate[1]?.toDate(),
  //     take: 10,
  //     skip: 0,
  //   });
  //   if (search_response.status && search_response.data.result) {
  //     setDvatData(search_response.data.result);
  //     setSearch(true);
  //   }
  // };

  const namesearch = async () => {
    if (
      nameRef.current?.input?.value == undefined ||
      nameRef.current?.input?.value == null ||
      nameRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN Number");
    }
    const search_response = await GetInactiveDealers({
      tradename: nameRef.current?.input?.value,
      dept: selectedOffice === "ALL" ? undefined : selectedOffice,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
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
        const search_response = await GetInactiveDealers({
          arnnumber: arnRef.current?.input?.value,
          dept: selectedOffice === "ALL" ? undefined : selectedOffice,
          take: pagesize,
          skip: pagesize * (page - 1),
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
        const search_response = await GetInactiveDealers({
          tradename: nameRef.current?.input?.value,
          dept: selectedOffice === "ALL" ? undefined : selectedOffice,
          take: pagesize,
          skip: pagesize * (page - 1),
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
      const payment_data = await GetInactiveDealers({
        dept: selectedOffice === "ALL" ? undefined : selectedOffice,
        take: pagesize,
        skip: pagesize * (page - 1),
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

  const exportToExcel = () => {
    if (dvatData.length === 0) return;

    const worksheetData = [
      ["Inactive Dealers Report"],
      [""],
      [
        "TIN Number",
        "Trade Name",
        "Type",
        "Last Filing Period",
        "Pending Returns",
      ],
    ];

    dvatData.forEach((item) => {
      worksheetData.push([
        item.dvat04.tinNumber || "",
        item.dvat04.tradename || "",
        item.dvat04.compositionScheme ? "COMP" : "REG",
        item.lastfiling || "",
        item.pending.toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Summary",
      "",
      "",
      "Total Dealers:",
      totalInactiveDealers.toString(),
    ]);
    worksheetData.push([
      "",
      "",
      "",
      "Total Pending:",
      totalPendingReturns.toString(),
    ]);
    worksheetData.push([
      "",
      "",
      "",
      "Average Pending:",
      averagePending.toFixed(2),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inactive Dealers");
    XLSX.writeFile(
      wb,
      `Inactive_Dealers_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Report exported successfully!");
  };

  const barChartData: any = {
    labels: dvatData.slice(0, 10).map((item) => item.dvat04.tinNumber || ""),
    datasets: [
      {
        label: "Pending Returns",
        data: dvatData.slice(0, 10).map((item) => item.pending),
        backgroundColor: "#ef4444",
        borderWidth: 0,
      },
    ],
  };

  const doughnutData: any = {
    labels: ["Regular Dealers", "Composition Dealers"],
    datasets: [
      {
        label: "Dealer Count",
        data: [regularDealers, compositionDealers],
        backgroundColor: ["#3b82f6", "#10b981"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  // Group by pending ranges
  const pendingRanges = {
    "1-5": dvatData.filter((d) => d.pending >= 1 && d.pending <= 5).length,
    "6-10": dvatData.filter((d) => d.pending >= 6 && d.pending <= 10).length,
    "11-20": dvatData.filter((d) => d.pending >= 11 && d.pending <= 20).length,
    "20+": dvatData.filter((d) => d.pending > 20).length,
  };

  const pieChartData: any = {
    labels: ["1-5 Returns", "6-10 Returns", "11-20 Returns", "20+ Returns"],
    datasets: [
      {
        label: "Dealers by Pending Range",
        data: [
          pendingRanges["1-5"],
          pendingRanges["6-10"],
          pendingRanges["11-20"],
          pendingRanges["20+"],
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#7c3aed"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 12,
          },
        },
        position: "top",
      },
    },
  };

  const pieOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center">
        <Spin size="large" />
      </div>
    );

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          <div className="grow">
            <h1 className="text-2xl font-semibold">Inactive Dealers Report</h1>
            <p className="text-sm text-gray-600">
              Dealers with pending returns and no recent filing activity
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={exportToExcel}
              disabled={dvatData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Export to Excel
            </button>
          </div>
        </div>

        {/* Office Filter */}
        {user && !["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role) && (
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700">Filter by Office:</label>
              <Select
                value={selectedOffice}
                onChange={(value) => {
                  setSelectedOffice(value);
                  setSearch(false);
                  // Reset pagination when office changes
                  setPaginatin({
                    take: 10,
                    skip: 0,
                    total: 0,
                  });
                }}
                style={{ width: 250 }}
                disabled={isSearch}
              >
                <Select.Option value="ALL">All Offices</Select.Option>
                <Select.Option value={SelectOffice.DAMAN}>DAMAN</Select.Option>
                <Select.Option value={SelectOffice.DIU}>DIU</Select.Option>
                <Select.Option value={SelectOffice.Dadra_Nagar_Haveli}>DNH (Dadra & Nagar Haveli)</Select.Option>
              </Select>
              {selectedOffice !== "ALL" && (
                <span className="text-sm text-gray-600">
                  Showing data for: <span className="font-semibold">{selectedOffice === SelectOffice.Dadra_Nagar_Haveli ? "DNH" : selectedOffice}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <Fa6RegularBuilding className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalInactiveDealers}</p>
            <p className="text-xs opacity-90">Inactive Dealers</p>
            <p className="text-xs opacity-75 mt-1">Total Count</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalPendingReturns}</p>
            <p className="text-xs opacity-90">Total Pending</p>
            <p className="text-xs opacity-75 mt-1">All Returns</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{averagePending.toFixed(1)}</p>
            <p className="text-xs opacity-90">Avg Pending</p>
            <p className="text-xs opacity-75 mt-1">Per Dealer</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{regularDealers}/{compositionDealers}</p>
            <p className="text-xs opacity-90">REG / COMP</p>
            <p className="text-xs opacity-75 mt-1">Dealer Types</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-lg font-bold">{maxPending} / {minPending}</p>
            <p className="text-xs opacity-90">Max / Min Pending</p>
            <p className="text-xs opacity-75 mt-1">Return Range</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Inactive Dealers by Pending Returns
            </h2>
            <div className="h-80">
              {dvatData.length > 0 ? (
                <Bar data={barChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              Dealer Type Distribution
            </h2>
            <div className="h-80 flex items-center justify-center">
              <Doughnut data={doughnutData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Additional Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Dealers by Pending Returns Range
          </h2>
          <div className="h-80 flex items-center justify-center">
            <Pie data={pieChartData} options={pieOptions} />
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-4 shadow rounded-lg mb-4">
          <div className="bg-blue-500 p-3 text-white rounded-t-lg -mt-4 -mx-4 mb-4">
            <p className="font-semibold">Search & Filter Dealers</p>
          </div>
          
          <div className="flex flex-col md:flex-row lg:gap-4 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              disabled={isSearch}
            >
              <Radio value={SearchOption.TIN}>TIN</Radio>
              <Radio value={SearchOption.NAME}>Trade Name</Radio>
            </Radio.Group>
            <div className="h-2"></div>
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
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">Inactive Dealer Details</h2>
          </div>
          <div className="overflow-x-auto">
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    #
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    TIN Number
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Trade Name
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Type
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Last Filing Period
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Pending Returns
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dvatData.map((val: ResponseType, index: number) => {
                  return (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="border text-center p-3 text-sm">
                        {pagination.skip + index + 1}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm font-medium">
                        {val.dvat04.tinNumber}
                      </TableCell>
                      <TableCell className="border text-left p-3 text-sm">
                        {val.dvat04.tradename}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            val.dvat04.compositionScheme
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {val.dvat04.compositionScheme ? "COMP" : "REG"}
                        </span>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        {val.lastfiling || "N/A"}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                            val.pending > 20
                              ? "bg-red-100 text-red-800"
                              : val.pending > 10
                              ? "bg-orange-100 text-orange-800"
                              : val.pending > 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {val.pending}
                        </span>
                      </TableCell>
                      <TableCell className="border text-center p-3">
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            router.push(
                              `/dashboard/returns/department-pending-return/${encryptURLData(
                                val.dvat04.id.toString()
                              )}`
                            );
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t bg-gray-50">
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
                pageSizeOptions={[10, 20, 25, 50, 100]}
                total={pagination.total}
                responsive={true}
                showTotal={(total: number, range: number[]) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InactiveDealers;
