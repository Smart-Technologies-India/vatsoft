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
import type { Dayjs } from "dayjs";
import { dvat04, user, SelectOffice } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import numberWithIndianFormat from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import DemandPenalty from "@/action/report/demand_penalty";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
// import DemandPenalty from "@/action/report/outstanding";

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
  const totalDealers = dvatData.length;
  const totalInterest = dvatData.reduce((sum, item) => sum + item.interest, 0);
  const totalPenalty = dvatData.reduce((sum, item) => sum + item.penalty, 0);
  const totalOutstanding = totalInterest + totalPenalty;
  const compositionDealers = dvatData.filter(
    (item) => item.dvat04.compositionScheme
  ).length;
  const regularDealers = totalDealers - compositionDealers;

  // Export to Excel function
  const exportToExcel = () => {
    if (dvatData.length === 0) return;

    const worksheetData = [
      ["Demand Penalty & Interest Report"],
      [""],
      [
        "TIN Number",
        "Trade Name",
        "Type",
        "Interest Amount",
        "Interest Count",
        "Penalty Amount",
        "Penalty Count",
        "Total Outstanding",
      ],
      ...dvatData.map((item) => [
        item.dvat04.tinNumber,
        item.dvat04.tradename,
        item.dvat04.compositionScheme ? "COMP" : "REG",
        item.interest,
        item.interest_count,
        item.penalty,
        item.penalty_count,
        item.interest + item.penalty,
      ]),
      [""],
      ["Summary"],
      ["Total Dealers", totalDealers],
      ["Total Interest", totalInterest],
      ["Total Penalty", totalPenalty],
      ["Total Outstanding", totalOutstanding],
      ["Regular Dealers", regularDealers],
      ["Composition Dealers", compositionDealers],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Demand Penalty");
    XLSX.writeFile(workbook, "demand_penalty_report.xlsx");
  };

  // Chart data - Top 10 dealers by outstanding
  const top10Dealers = [...dvatData]
    .sort((a, b) => (b.interest + b.penalty) - (a.interest + a.penalty))
    .slice(0, 10);

  const barChartData = {
    labels: top10Dealers.map(
      (item) => item.dvat04.tinNumber || "Unknown"
    ),
    datasets: [
      {
        label: "Interest",
        data: top10Dealers.map((item) => item.interest),
        backgroundColor: "rgba(255, 159, 64, 0.8)",
      },
      {
        label: "Penalty",
        data: top10Dealers.map((item) => item.penalty),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
      },
    ],
  };

  // Dealer type distribution
  const doughnutData = {
    labels: ["Regular Dealers", "Composition Dealers"],
    datasets: [
      {
        data: [regularDealers, compositionDealers],
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(75, 192, 192, 0.8)",
        ],
      },
    ],
  };

  // Outstanding distribution (Interest vs Penalty)
  const pieChartData = {
    labels: ["Total Interest", "Total Penalty"],
    datasets: [
      {
        data: [totalInterest, totalPenalty],
        backgroundColor: [
          "rgba(255, 159, 64, 0.8)",
          "rgba(255, 99, 132, 0.8)",
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
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ₹${numberWithIndianFormat(context.parsed.y)}`;
          },
        },
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
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ₹${numberWithIndianFormat(context.parsed)}`;
          },
        },
      },
    },
  };

  const init = async () => {
    const userrespone = await GetUser({ id: userid });
    if (userrespone.status && userrespone.data) {
      setUpser(userrespone.data);
      
      // Set office filter based on role
      const filterOffice = ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(userrespone.data.role)
        ? userrespone.data.selectOffice!
        : (selectedOffice === "ALL" ? userrespone.data.selectOffice! : selectedOffice);
      
      const payment_data = await DemandPenalty({
        dept: filterOffice,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        const sortedData = payment_data.data.result;
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
        
        // Set office filter based on role
        const filterOffice = ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(userrespone.data.role)
          ? userrespone.data.selectOffice!
          : userrespone.data.selectOffice!;
        
        const payment_data = await DemandPenalty({
          dept: filterOffice,
          take: 10,
          skip: 0,
        });


        if (payment_data.status && payment_data.data.result) {
          const sortedData = payment_data.data.result;
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
      
      // Set office filter based on role
      const filterOffice = ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role)
        ? user.selectOffice!
        : (selectedOffice === "ALL" ? user.selectOffice! : selectedOffice);
      
      const payment_data = await DemandPenalty({
        dept: filterOffice,
        take: 10,
        skip: 0,
      });

      if (payment_data.status && payment_data.data.result) {
        setDvatData(payment_data.data.result);
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

  const arnsearch = async () => {
    if (
      arnRef.current?.input?.value == undefined ||
      arnRef.current?.input?.value == null ||
      arnRef.current?.input?.value == ""
    ) {
      return toast.error("Enter arn number");
    }
    
    // Set office filter based on role
    const filterOffice = user && ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role)
      ? user.selectOffice!
      : (selectedOffice === "ALL" ? user!.selectOffice! : selectedOffice);
    
    const search_response = await DemandPenalty({
      dept: filterOffice,
      arnnumber: arnRef.current?.input?.value,
      take: 10,
      skip: 0,
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
    
    // Set office filter based on role
    const filterOffice = user && ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role)
      ? user.selectOffice!
      : (selectedOffice === "ALL" ? user!.selectOffice! : selectedOffice);
    
    const search_response = await DemandPenalty({
      dept: filterOffice,
      tradename: nameRef.current?.input?.value,
      take: 10,
      skip: 0,
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
    // Set office filter based on role
    const filterOffice = user && ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role)
      ? user.selectOffice!
      : (selectedOffice === "ALL" ? user!.selectOffice! : selectedOffice);
    
    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await DemandPenalty({
          dept: filterOffice,
          arnnumber: arnRef.current?.input?.value,
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
        const search_response = await DemandPenalty({
          dept: filterOffice,
          tradename: nameRef.current?.input?.value,
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
      const payment_data = await DemandPenalty({
        dept: filterOffice,
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
            <h1 className="text-2xl font-semibold">Demand Penalty & Interest Report</h1>
            <p className="text-sm text-gray-600">
              Dealers with outstanding demand penalty and interest dues
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <Fa6RegularBuilding className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{totalDealers}</p>
            <p className="text-xs opacity-90">Total Dealers</p>
            <p className="text-xs opacity-75 mt-1">With Dues</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">₹{numberWithIndianFormat(totalInterest)}</p>
            <p className="text-xs opacity-90">Total Interest</p>
            <p className="text-xs opacity-75 mt-1">Outstanding</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">₹{numberWithIndianFormat(totalPenalty)}</p>
            <p className="text-xs opacity-90">Total Penalty</p>
            <p className="text-xs opacity-75 mt-1">Outstanding</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">₹{numberWithIndianFormat(totalOutstanding)}</p>
            <p className="text-xs opacity-90">Total Outstanding</p>
            <p className="text-xs opacity-75 mt-1">Interest + Penalty</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">{regularDealers}/{compositionDealers}</p>
            <p className="text-xs opacity-90">REG / COMP</p>
            <p className="text-xs opacity-75 mt-1">Dealer Types</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Dealers by Outstanding Amount
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
            Interest vs Penalty Distribution
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
                    Interest (Count)
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Penalty (Count)
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Total Outstanding
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-orange-600">
                            ₹{numberWithIndianFormat(val.interest)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({val.interest_count})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-red-600">
                            ₹{numberWithIndianFormat(val.penalty)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({val.penalty_count})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span className="font-bold text-purple-600">
                          ₹{numberWithIndianFormat(val.interest + val.penalty)}
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

export default AfterDeathLinePage;
