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
import { Radio, Button, Input, Pagination, Spin } from "antd";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import * as XLSX from "xlsx";
import {
  MaterialSymbolsPersonRounded,
  IcOutlineReceiptLong,
  Fa6RegularBuilding,
} from "@/components/icons";

ChartJS.register(...registerables);
import { useEffect, useRef, useState } from "react";
import { dvat04, user } from "@prisma/client";
import { encryptURLData } from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import TimeLineSummary from "@/action/report/timeline_summary";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

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
  const [allDvatData, setAllDvatData] = useState<Array<ResponseType>>([]); // All data for statistics

  const [user, setUpser] = useState<user | null>(null);

  // Calculate statistics from ALL data, not just paginated data
  const totalDealers = allDvatData.length;
  const totalFiled = allDvatData.reduce((sum, item) => sum + item.filed, 0);
  const totalLate = allDvatData.reduce((sum, item) => sum + item.late, 0);
  const totalPending = allDvatData.reduce((sum, item) => sum + item.pending, 0);
  const totalDue = allDvatData.reduce((sum, item) => sum + item.due, 0);
  const compositionDealers = allDvatData.filter(
    (item) => item.dvat04.compositionScheme
  ).length;
  const regularDealers = totalDealers - compositionDealers;

  // Export to Excel function
  const exportToExcel = () => {
    if (allDvatData.length === 0) return;

    const worksheetData = [
      ["Return Filing Timeline Summary Report"],
      ["Year: " + selectedYear],
      [""],
      [
        "TIN Number",
        "Trade Name",
        "Type",
        "Timely Filed",
        "Late Filing",
        "Pending Filing",
        "Due",
      ],
      ...allDvatData.map((item) => [
        item.dvat04.tinNumber,
        item.dvat04.tradename,
        item.dvat04.compositionScheme ? "COMP" : "REG",
        item.filed,
        item.late,
        item.pending,
        item.due,
      ]),
      [""],
      ["Summary"],
      ["Total Dealers", totalDealers],
      ["Total Filed", totalFiled],
      ["Total Late", totalLate],
      ["Total Pending", totalPending],
      ["Total Due", totalDue],
      ["Regular Dealers", regularDealers],
      ["Composition Dealers", compositionDealers],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timeline Summary");
    XLSX.writeFile(
      workbook,
      `timeline_summary_report_${selectedYear}.xlsx`
    );
  };

  // Chart data - Top 10 dealers by late returns (from all data)
  const top10Dealers = [...allDvatData]
    .sort((a, b) => b.late - a.late)
    .slice(0, 10);

  const barChartData = {
    labels: top10Dealers.map((item) => item.dvat04.tinNumber || "Unknown"),
    datasets: [
      {
        label: "Timely Filed",
        data: top10Dealers.map((item) => item.filed),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
      {
        label: "Late Filing",
        data: top10Dealers.map((item) => item.late),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
      },
      {
        label: "Pending",
        data: top10Dealers.map((item) => item.pending),
        backgroundColor: "rgba(251, 191, 36, 0.8)",
      },
    ],
  };

  // Dealer type distribution
  const doughnutData = {
    labels: ["Regular Dealers", "Composition Dealers"],
    datasets: [
      {
        data: [regularDealers, compositionDealers],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(34, 197, 94, 0.8)"],
      },
    ],
  };

  // Filing status distribution
  const pieChartData = {
    labels: ["Timely Filed", "Late Filing", "Pending"],
    datasets: [
      {
        data: [totalFiled, totalLate, totalPending],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 191, 36, 0.8)",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await TimeLineSummary({
        dept: userrespone.data.selectOffice!,
        take: 10,
        skip: 0,
        year: selectedYear,
      });

      if (payment_data.status && payment_data.data.result) {
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(payment_data.data.result);
        // Set all data for statistics calculation
        if (payment_data.data.allData) {
          setAllDvatData(payment_data.data.allData);
        }
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
        });

        if (payment_data.status && payment_data.data.result) {
          setDvatData(payment_data.data.result);
          setPaginatin({
            skip: payment_data.data.skip,
            take: payment_data.data.take,
            total: payment_data.data.total,
          });
          // Set all data for statistics calculation
          if (payment_data.data.allData) {
            setAllDvatData(payment_data.data.allData);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [userid, selectedYear]);

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
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      // Set all data for statistics calculation
      if (search_response.data.allData) {
        setAllDvatData(search_response.data.allData);
      }
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
    });
    if (search_response.status && search_response.data.result) {
      setDvatData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      // Set all data for statistics calculation
      if (search_response.data.allData) {
        setAllDvatData(search_response.data.allData);
      }
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
            <h1 className="text-2xl font-semibold">
              Return Filing Timeline Summary Report
            </h1>
            <p className="text-sm text-gray-600">
              Analysis of dealer filing patterns for year {selectedYear}
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={exportToExcel}
              disabled={allDvatData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Export to Excel
            </button>
          </div>
        </div>

        {/* Year Filter */}
        <div className="bg-white p-4 shadow rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700">Select Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <Fa6RegularBuilding className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalDealers}</p>
            <p className="text-xs opacity-90">Total Dealers</p>
            <p className="text-xs opacity-75 mt-1">Active in {selectedYear}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalFiled}</p>
            <p className="text-xs opacity-90">Timely Filed</p>
            <p className="text-xs opacity-75 mt-1">On-time Returns</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalLate}</p>
            <p className="text-xs opacity-90">Late Filing</p>
            <p className="text-xs opacity-75 mt-1">Overdue Returns</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalPending}</p>
            <p className="text-xs opacity-90">Pending Filing</p>
            <p className="text-xs opacity-75 mt-1">Not Yet Filed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-lg font-bold">
              {regularDealers}/{compositionDealers}
            </p>
            <p className="text-xs opacity-90">REG / COMP</p>
            <p className="text-xs opacity-75 mt-1">Dealer Types</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Dealers Filing Status
            </h2>
            <div className="h-80">
              {allDvatData.length > 0 ? (
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

        {/* Filing Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Overall Filing Status Distribution
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">TIN Number</TableHead>
                  <TableHead className="text-center">Trade Name</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Timely Filed</TableHead>
                  <TableHead className="text-center">Late Filing</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Due</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dvatData.length > 0 ? (
                  dvatData.map((val: ResponseType, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        {val.dvat04.tinNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        {val.dvat04.tradename}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            val.dvat04.compositionScheme
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {val.dvat04.compositionScheme ? "COMP" : "REG"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                          {val.filed}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                          {val.late}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                          {val.pending}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{val.due}</TableCell>
                      <TableCell className="text-center">
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
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t">
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

export default AfterDeathLinePage;
