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
import { useEffect, useRef, useState } from "react";
import type { Dayjs } from "dayjs";
import { dvat04, user, SelectOffice } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import numberWithIndianFormat from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import OutstandingDealers from "@/action/report/outstanding";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import * as XLSX from "xlsx";
import {
  RiMoneyRupeeCircleLine,
  MaterialSymbolsPersonRounded,
  IcOutlineReceiptLong,
} from "@/components/icons";

ChartJS.register(...registerables);

interface ResponseType {
  dvat04: dvat04;
  penalty: number;
  penalty_count: number;
  interest: number;
  interest_count: number;
}

const AfterDeathLinePage = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);
  const [selectedOffice, setSelectedOffice] = useState<
    SelectOffice | undefined
  >(undefined);

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
    SearchOption.TIN,
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
  const [allDvatData, setAllDvatData] = useState<Array<ResponseType>>([]); // All data for statistics

  const [user, setUpser] = useState<user | null>(null);

  // Calculate statistics from ALL data, not just paginated data
  const totalInterest = allDvatData.reduce((sum, item) => sum + item.interest, 0);
  const totalPenalty = allDvatData.reduce((sum, item) => sum + item.penalty, 0);
  const totalInterestCount = allDvatData.reduce(
    (sum, item) => sum + item.interest_count,
    0,
  );
  const totalPenaltyCount = allDvatData.reduce(
    (sum, item) => sum + item.penalty_count,
    0,
  );
  const totalDealers = allDvatData.length;
  const compositionDealers = allDvatData.filter(
    (item) => item.dvat04.compositionScheme,
  ).length;
  const regularDealers = totalDealers - compositionDealers;

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      const payment_data = await OutstandingDealers({
        dept: selectedOffice,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort((a, b) => {
          const totalA = a.interest + a.penalty;
          const totalB = b.interest + b.penalty;
          return totalB - totalA;
        });
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
        setDvatData(sortedData);
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
      const userrespone = await GetUser({ id: userid });
      if (userrespone.status && userrespone.data) {
        setUpser(userrespone.data);
        const payment_data = await OutstandingDealers({
          dept: selectedOffice,
          take: 10,
          skip: 0,
        });

        if (payment_data.status && payment_data.data.result) {
          const sortedData = payment_data.data.result.sort((a, b) => {
            const totalA = a.interest + a.penalty;
            const totalB = b.interest + b.penalty;
            return totalB - totalA;
          });
          setDvatData(sortedData);
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
  }, [userid, selectedOffice]);
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

  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    const search_response = await OutstandingDealers({
      dept: selectedOffice,
      arnnumber: arnRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      const sortedData = search_response.data.result.sort((a, b) => {
        const totalA = a.interest + a.penalty;
        const totalB = b.interest + b.penalty;
        return totalB - totalA;
      });
      setDvatData(sortedData);
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
    const search_response = await OutstandingDealers({
      dept: selectedOffice,
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data.result) {
      const sortedData = search_response.data.result.sort((a, b) => {
        const totalA = a.interest + a.penalty;
        const totalB = b.interest + b.penalty;
        return totalB - totalA;
      });
      setDvatData(sortedData);
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
        const search_response = await OutstandingDealers({
          dept: selectedOffice,
          arnnumber: arnRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          const sortedData = search_response.data.result.sort((a, b) => {
            const totalA = a.interest + a.penalty;
            const totalB = b.interest + b.penalty;
            return totalB - totalA;
          });
          setDvatData(sortedData);
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
        const search_response = await OutstandingDealers({
          dept: selectedOffice,
          tradename: nameRef.current?.input?.value,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data.result) {
          const sortedData = search_response.data.result.sort((a, b) => {
            const totalA = a.interest + a.penalty;
            const totalB = b.interest + b.penalty;
            return totalB - totalA;
          });
          setDvatData(sortedData);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const payment_data = await OutstandingDealers({
        dept: selectedOffice,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result.sort((a, b) => {
          const totalA = a.interest + a.penalty;
          const totalB = b.interest + b.penalty;
          return totalB - totalA;
        });
        setDvatData(sortedData);
        setPaginatin({
          skip: payment_data.data.skip,
          take: payment_data.data.take,
          total: payment_data.data.total,
        });
      }
    }
  };

  const exportToExcel = () => {
    if (allDvatData.length === 0) return;

    const worksheetData = [
      ["Interest & Penalty Collected Report"],
      [""],
      [
        "TIN Number",
        "Trade Name",
        "Type",
        "Interest Amount",
        "Interest Count",
        "Penalty Amount",
        "Penalty Count",
        "Total Collected",
      ],
    ];

    allDvatData.forEach((item) => {
      worksheetData.push([
        item.dvat04.tinNumber || "",
        item.dvat04.tradename || "",
        item.dvat04.compositionScheme ? "COMP" : "REG",
        item.interest.toString(),
        item.interest_count.toString(),
        item.penalty.toString(),
        item.penalty_count.toString(),
        (item.interest + item.penalty).toString(),
      ]);
    });

    worksheetData.push([""]);
    worksheetData.push([
      "Total",
      "",
      "",
      totalInterest.toString(),
      totalInterestCount.toString(),
      totalPenalty.toString(),
      totalPenaltyCount.toString(),
      (totalInterest + totalPenalty).toString(),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penalty Collected Report");
    XLSX.writeFile(
      wb,
      `Interest_Penalty_Collected_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Report exported successfully!");
  };

  const barChartData: any = {
    labels: allDvatData.slice(0, 10).map((item) => item.dvat04.tinNumber || ""),
    datasets: [
      {
        label: "Interest Collected (₹)",
        data: allDvatData.slice(0, 10).map((item) => item.interest),
        backgroundColor: "#3b82f6",
        borderWidth: 0,
      },
      {
        label: "Penalty Collected (₹)",
        data: allDvatData.slice(0, 10).map((item) => item.penalty),
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
          callback: function (value: any) {
            return "₹" + numberWithIndianFormat(value);
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
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return (
              context.dataset.label +
              ": ₹" +
              numberWithIndianFormat(context.parsed.y)
            );
          },
        },
      },
    },
  };

  const doughnutOptions: any = {
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
            <h1 className="text-2xl font-semibold">
              Interest / Late Penalty Collected Report
            </h1>
            <p className="text-sm text-gray-600">
              Track interest and late penalty collected from dealers
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

        {/* Office Filter */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                District/Office
              </label>
              <Radio.Group
                options={[
                  { label: "All", value: undefined },
                  { label: "DNH", value: "Dadra_Nagar_Haveli" as SelectOffice },
                  { label: "DD", value: "DAMAN" as SelectOffice },
                  { label: "DIU", value: "DIU" as SelectOffice },
                ]}
                onChange={(e: RadioChangeEvent) =>
                  setSelectedOffice(e.target.value)
                }
                value={selectedOffice}
                optionType="button"
                buttonStyle="solid"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <RiMoneyRupeeCircleLine className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalInterest)}
            </p>
            <p className="text-xs opacity-90">Total Interest</p>
            <p className="text-xs opacity-75 mt-1">
              {totalInterestCount} instances
            </p>
          </div>

          <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <RiMoneyRupeeCircleLine className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalPenalty)}
            </p>
            <p className="text-xs opacity-90">Total Penalty</p>
            <p className="text-xs opacity-75 mt-1">
              {totalPenaltyCount} instances
            </p>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <RiMoneyRupeeCircleLine className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalInterest + totalPenalty)}
            </p>
            <p className="text-xs opacity-90">Total Collected</p>
            <p className="text-xs opacity-75 mt-1">Interest + Penalty</p>
          </div>

          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalDealers}</p>
            <p className="text-xs opacity-90">Total Dealers</p>
            <p className="text-xs opacity-75 mt-1">Paid Interest/Penalty</p>
          </div>

          <div className="bg-linear-to-br from-teal-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">
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
              Top 10 Dealers by Collected Amount
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
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
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
            <h2 className="text-lg font-semibold">Dealer Details</h2>
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
                    Interest
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Penalty
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Total Collected
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dvatData.map((val: ResponseType, index: number) => {
                  const totalCollected = val.interest + val.penalty;
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
                      <TableCell className="border text-right p-3 text-sm">
                        <div>₹{numberWithIndianFormat(val.interest)}</div>
                        <div className="text-xs text-gray-500">
                          ({val.interest_count} instances)
                        </div>
                      </TableCell>
                      <TableCell className="border text-right p-3 text-sm">
                        <div>₹{numberWithIndianFormat(val.penalty)}</div>
                        <div className="text-xs text-gray-500">
                          ({val.penalty_count} instances)
                        </div>
                      </TableCell>
                      <TableCell className="border text-right p-3 text-sm font-semibold text-green-600">
                        ₹{numberWithIndianFormat(totalCollected)}
                      </TableCell>
                      <TableCell className="border text-center p-3">
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            router.push(
                              `/dashboard/returns/department-pending-return/${encryptURLData(
                                val.dvat04.id.toString(),
                              )}`,
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

export default AfterDeathLinePage;
