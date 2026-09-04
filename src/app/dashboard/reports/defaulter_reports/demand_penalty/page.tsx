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
import { useEffect, useRef, useState, useMemo } from "react";
import type { Dayjs } from "dayjs";
import { dvat04, user, SelectOffice } from "@prisma/client";
import { capitalcase, encryptURLData } from "@/utils/methods";
import numberWithIndianFormat from "@/utils/methods";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import DemandPenalty from "@/action/report/demand_penalty";
import PopulateNotfiledWork from "@/action/report/populate_notfiled_work";
import NotfiledReturnsReport from "@/action/report/notfiled_returns_report";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
// import DemandPenalty from "@/action/report/outstanding";

interface ResponseType {
  dvat04: dvat04;
  pending: number;
  vatamount: string;
  interest: string;
  penalty: string;
  total: string;
}

const AfterDeathLinePage = () => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);
  const [isPopulating, setIsPopulating] = useState<boolean>(false);

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

  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(
    null,
  );
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFilter, setFilter] = useState<boolean>(false);

  const arnRef = useRef<InputRef>(null);
  const nameRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [dvatData, setDvatData] = useState<Array<ResponseType>>([]);
  const [allDvatData, setAllDvatData] = useState<Array<ResponseType>>([]);

  const [user, setUpser] = useState<user | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<SelectOffice | "ALL">(
    "ALL",
  );

  // Get unique commodity and frequency values
  const commodityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allDvatData
            .map((item) => item.dvat04.commodity)
            .filter((c) => c && c.trim() !== ""),
        ),
      ).sort(),
    [allDvatData],
  );

  const frequencyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allDvatData
            .map((item) => item.dvat04.frequencyFilings)
            .filter((f) => f && f.trim() !== ""),
        ),
      ).sort(),
    [allDvatData],
  );

  // Determine which data to use for calculations based on active filters
  const dataForCalculation = useMemo(() => {
    if (selectedType || selectedCommodity || selectedFrequency) {
      // If filters are active, use filtered data for totals
      let filteredData = allDvatData;

      if (selectedType) {
        filteredData = filteredData.filter((item) => {
          if (selectedType === "REGULAR") {
            return !item.dvat04.compositionScheme;
          } else if (selectedType === "COMPOSITION") {
            return item.dvat04.compositionScheme;
          }
          return true;
        });
      }

      if (selectedCommodity) {
        filteredData = filteredData.filter(
          (item) => item.dvat04.commodity === selectedCommodity,
        );
      }

      if (selectedFrequency) {
        filteredData = filteredData.filter(
          (item) => item.dvat04.frequencyFilings === selectedFrequency,
        );
      }

      return filteredData;
    }
    // Otherwise use all data
    return allDvatData;
  }, [allDvatData, selectedType, selectedCommodity, selectedFrequency]);

  // Calculate statistics from data (filtered or all based on active filters)
  const totalDealers = dataForCalculation.length;
  const totalPending = dataForCalculation.reduce((sum, item) => sum + item.pending, 0);
  const totalVatAmount = dataForCalculation.reduce(
    (sum, item) => sum + parseFloat(item.vatamount),
    0,
  );
  const totalInterest = dataForCalculation.reduce(
    (sum, item) => sum + parseFloat(item.interest),
    0,
  );
  const totalPenalty = dataForCalculation.reduce(
    (sum, item) => sum + parseFloat(item.penalty),
    0,
  );
  const totalTax = dataForCalculation.reduce(
    (sum, item) => sum + parseFloat(item.total),
    0,
  );
  const compositionDealers = dataForCalculation.filter(
    (item) => item.dvat04.compositionScheme,
  ).length;
  const regularDealers = totalDealers - compositionDealers;

  // Populate returns_notfiled_work function
  const populateNotfiledWork = async () => {
    try {
      setIsPopulating(true);
      const response = await PopulateNotfiledWork();

      if (response.status) {
        toast.success(
          `${response.message}. Inserted: ${response.data?.inserted || 0}, Updated: ${response.data?.updated || 0}`,
        );
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to populate unfiled returns data");
    } finally {
      setIsPopulating(false);
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (allDvatData.length === 0) return;

    const worksheetData = [
      ["Unfiled Returns Report"],
      [""],
      [
        "TIN Number",
        "Trade Name",
        "Type",
        "Commodity",
        "Frequency",
        "Pending Returns",
        "VAT Amount",
        "Interest",
        "Penalty",
        "Total Tax Amount",
      ],
      ...allDvatData.map((item) => [
        item.dvat04.tinNumber,
        item.dvat04.tradename,
        item.dvat04.compositionScheme ? "COMP" : "REG",
        item.dvat04.commodity || "N/A",
        item.dvat04.frequencyFilings || "N/A",
        item.pending,
        parseFloat(item.vatamount),
        parseFloat(item.interest),
        parseFloat(item.penalty),
        parseFloat(item.total),
      ]),
      [""],
      ["Summary"],
      ["Total Dealers", totalDealers],
      ["Total Pending Returns", totalPending],
      ["Total VAT Amount", totalVatAmount],
      ["Total Interest", totalInterest],
      ["Total Penalty", totalPenalty],
      ["Total Tax Amount", totalTax],
      ["Regular Dealers", regularDealers],
      ["Composition Dealers", compositionDealers],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Demand Penalty");
    XLSX.writeFile(workbook, "demand_penalty_report.xlsx");
  };

  // Chart data - Top 10 dealers by total tax amount (from full data)
  const top10Dealers = [...allDvatData]
    .sort(
      (a, b) =>
        parseFloat(b.total) - parseFloat(a.total) ||
        parseFloat(b.vatamount) - parseFloat(a.vatamount),
    )
    .slice(0, 10);

  const barChartData = {
    labels: top10Dealers.map((item) => item.dvat04.tinNumber || "Unknown"),
    datasets: [
      {
        label: "Total Tax Amount",
        data: top10Dealers.map((item) => parseFloat(item.total)),
        backgroundColor: "rgba(255, 159, 64, 0.8)",
      },
      {
        label: "VAT Amount",
        data: top10Dealers.map((item) => parseFloat(item.vatamount)),
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
        backgroundColor: ["rgba(54, 162, 235, 0.8)", "rgba(75, 192, 192, 0.8)"],
      },
    ],
  };

  // Dealer type distribution (Regular vs Composition)
  const pieChartData = {
    labels: ["Regular Dealers", "Composition Dealers"],
    datasets: [
      {
        data: [regularDealers, compositionDealers],
        backgroundColor: ["rgba(54, 162, 235, 0.8)", "rgba(75, 192, 192, 0.8)"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
        display: false,
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
      const filterOffice = [
        "VATOFFICER",
        "DY_COMMISSIONER",
        "JOINT_COMMISSIONER",
      ].includes(userrespone.data.role)
        ? userrespone.data.selectOffice!
        : selectedOffice === "ALL"
          ? "ALL"
          : selectedOffice;

      // Load paginated data for table
      const payment_data = await NotfiledReturnsReport({
        dept: filterOffice,
        take: 10,
        skip: 0,
      });

      // Load all data for statistics and filters
      const all_data = await NotfiledReturnsReport({
        dept: filterOffice,
        take: 10000,
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

      if (all_data.status && all_data.data.result) {
        setAllDvatData(all_data.data.result);
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
        const filterOffice = [
          "VATOFFICER",
          "DY_COMMISSIONER",
          "JOINT_COMMISSIONER",
        ].includes(userrespone.data.role)
          ? userrespone.data.selectOffice!
          : userrespone.data.selectOffice!;

        // Load paginated data for table
        const payment_data = await NotfiledReturnsReport({
          dept: filterOffice,
          take: 10,
          skip: 0,
        });

        // Load all data for statistics and filters
        const all_data = await NotfiledReturnsReport({
          dept: filterOffice,
          take: 10000,
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

        if (all_data.status && all_data.data.result) {
          setAllDvatData(all_data.data.result);
        }
      }
      setLoading(false);
    };
    init();
  }, [userid, router]);

  // Reload data when office selection changes
  useEffect(() => {
    const loadDataByOffice = async () => {
      if (!user || !selectedOffice) return;

      setLoading(true);

      // Set office filter based on role
      const filterOffice = [
        "VATOFFICER",
        "DY_COMMISSIONER",
        "JOINT_COMMISSIONER",
      ].includes(user.role)
        ? user.selectOffice!
        : selectedOffice === "ALL"
          ? "ALL"
          : selectedOffice;

      // Load paginated data for table
      const payment_data = await NotfiledReturnsReport({
        dept: filterOffice,
        take: 10,
        skip: 0,
      });

      // Load all data for statistics and filters
      const all_data = await NotfiledReturnsReport({
        dept: filterOffice,
        take: 10000,
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

      if (all_data.status && all_data.data.result) {
        setAllDvatData(all_data.data.result);
      }
      setLoading(false);
    };

    if (user && selectedOffice && !isSearch) {
      loadDataByOffice();
    }
  }, [selectedOffice, user, isSearch]);

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
    const filterOffice =
      user &&
      ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
        user.role,
      )
        ? user.selectOffice!
        : selectedOffice === "ALL"
          ? "ALL"
          : selectedOffice;

    const search_response = await NotfiledReturnsReport({
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
    const filterOffice =
      user &&
      ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
        user.role,
      )
        ? user.selectOffice!
        : selectedOffice === "ALL"
          ? "ALL"
          : selectedOffice;

    const search_response = await NotfiledReturnsReport({
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

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedType(null);
    setSelectedCommodity(null);
    setSelectedFrequency(null);
    setDvatData(allDvatData.slice(0, 10));
    setPaginatin({
      skip: 0,
      take: 10,
      total: allDvatData.length,
    });
  };

  // Reset only search inputs and search state (keep filters active)
  const resetSearch = async () => {
    if (arnRef.current?.input) arnRef.current.input.value = "";
    if (nameRef.current?.input) nameRef.current.input.value = "";
    setSearch(false);

    // If there are active filters, keep searching with filters only
    if (selectedType || selectedCommodity || selectedFrequency) {
      await handleFilterChange(
        selectedType,
        selectedCommodity,
        selectedFrequency,
      );
    } else {
      // If no filters, reload all data
      await init();
    }
  };

  // Auto-trigger filter when filters change
  const handleFilterChange = async (
    newType?: string | null,
    newCommodity?: string | null,
    newFrequency?: string | null,
  ) => {
    const filterType = newType !== undefined ? newType : selectedType;
    const filterCommodity =
      newCommodity !== undefined ? newCommodity : selectedCommodity;
    const filterFrequency =
      newFrequency !== undefined ? newFrequency : selectedFrequency;

    // Only trigger filter if at least one filter is selected
    if (!filterType && !filterCommodity && !filterFrequency) {
      return;
    }

    // Filter data client-side
    let filteredData = allDvatData;

    if (filterType) {
      filteredData = filteredData.filter((item) => {
        if (filterType === "REGULAR") {
          return !item.dvat04.compositionScheme;
        } else if (filterType === "COMPOSITION") {
          return item.dvat04.compositionScheme;
        }
        return true;
      });
    }

    if (filterCommodity) {
      filteredData = filteredData.filter(
        (item) => item.dvat04.commodity === filterCommodity,
      );
    }

    if (filterFrequency) {
      filteredData = filteredData.filter(
        (item) => item.dvat04.frequencyFilings === filterFrequency,
      );
    }

    setDvatData(filteredData.slice(0, 10));
    setPaginatin({
      skip: 0,
      take: 10,
      total: filteredData.length,
    });
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    // Handle pagination with active filters
    if (selectedType || selectedCommodity || selectedFrequency) {
      // Reapply filters to get correct page data
      let filteredData = allDvatData;

      if (selectedType) {
        filteredData = filteredData.filter((item) => {
          if (selectedType === "REGULAR") {
            return !item.dvat04.compositionScheme;
          } else if (selectedType === "COMPOSITION") {
            return item.dvat04.compositionScheme;
          }
          return true;
        });
      }

      if (selectedCommodity) {
        filteredData = filteredData.filter(
          (item) => item.dvat04.commodity === selectedCommodity,
        );
      }

      if (selectedFrequency) {
        filteredData = filteredData.filter(
          (item) => item.dvat04.frequencyFilings === selectedFrequency,
        );
      }

      const startIndex = pagesize * (page - 1);
      setDvatData(filteredData.slice(startIndex, startIndex + pagesize));
      setPaginatin({
        skip: startIndex,
        take: pagesize,
        total: filteredData.length,
      });
      return;
    }

    // Set office filter based on role
    const filterOffice =
      user &&
      ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
        user.role,
      )
        ? user.selectOffice!
        : selectedOffice === "ALL"
          ? "ALL"
          : selectedOffice;

    if (isSearch) {
      if (searchOption == SearchOption.TIN) {
        if (
          arnRef.current?.input?.value == undefined ||
          arnRef.current?.input?.value == null ||
          arnRef.current?.input?.value == ""
        ) {
          return toast.error("Enter arn number");
        }
        const search_response = await NotfiledReturnsReport({
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
        const search_response = await NotfiledReturnsReport({
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
      const payment_data = await NotfiledReturnsReport({
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
            <h1 className="text-2xl font-semibold">
              Demand Penalty & Interest Report
            </h1>
            <p className="text-sm text-gray-600">
              Dealers with outstanding demand penalty and interest dues
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <Button
              type="primary"
              danger
              onClick={populateNotfiledWork}
              disabled={isPopulating}
              loading={isPopulating}
            >
              {isPopulating ? "Populating..." : "Update"}
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={dvatData.length === 0}
              className="bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Office Filter */}
        {user &&
          !["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
            user.role,
          ) && (
            <div className="bg-white p-4 shadow rounded-lg mb-6">
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700">
                  Filter by Office:
                </label>
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
                  <Select.Option value={SelectOffice.DAMAN}>
                    DAMAN
                  </Select.Option>
                  <Select.Option value={SelectOffice.DIU}>DIU</Select.Option>
                  <Select.Option value={SelectOffice.Dadra_Nagar_Haveli}>
                    DNH (Dadra & Nagar Haveli)
                  </Select.Option>
                </Select>
                {selectedOffice !== "ALL" && (
                  <span className="text-sm text-gray-600">
                    Showing data for:{" "}
                    <span className="font-semibold">
                      {selectedOffice === SelectOffice.Dadra_Nagar_Haveli
                        ? "DNH"
                        : selectedOffice}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">{totalDealers}</p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">Total Dealers</p>
                <p className="text-xs opacity-75 mt-1">Unfiled</p>
              </div>
              <div className="grow"></div>
              <Fa6RegularBuilding className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>

          <div className="bg-linear-to-br from-purple-400 to-purple-500 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">{totalPending}</p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">Total Pending</p>
                <p className="text-xs opacity-75 mt-1">Returns</p>
              </div>
              <div className="grow"></div>
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>

          <div className="bg-linear-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalVatAmount)}
            </p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">Total VAT Amount</p>
                <p className="text-xs opacity-75 mt-1">In Purchases</p>
              </div>
              <div className="grow"></div>
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>

          <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalInterest)}
            </p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">Total Interest</p>
                <p className="text-xs opacity-75 mt-1">Outstanding</p>
              </div>
              <div className="grow"></div>
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>

          <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">
              ₹{numberWithIndianFormat(totalPenalty)}
            </p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">Total Penalty</p>
                <p className="text-xs opacity-75 mt-1">Outstanding</p>
              </div>
              <div className="grow"></div>
              <IcOutlineReceiptLong className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>

          {/* <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            <p className="text-2xl font-bold">₹{numberWithIndianFormat(totalTax)}</p>
            <p className="text-xs opacity-90">Total Tax Amount</p>
            <p className="text-xs opacity-75 mt-1">Payable</p>
          </div> */}

          <div className="bg-linear-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-2xl font-bold">
              {regularDealers}/{compositionDealers}
            </p>
            <div className="flex mt-2">
              <div>
                <p className="text-xs opacity-90">REG / COMP</p>
                <p className="text-xs opacity-75 mt-1">Dealer Types</p>
              </div>
              <div className="grow"></div>
              <MaterialSymbolsPersonRounded className="w-8 h-8 opacity-70 mb-2" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Dealers by Total Tax Amount
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
        {/* <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Dealer Type Distribution
          </h2>
          <div className="h-80 flex items-center justify-center">
            <Pie data={pieChartData} options={pieOptions} />
          </div>
        </div> */}

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

            {/* Type, Commodity, and Frequency Filters */}
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex flex-col gap-1 min-w-40">
                <label className="text-xs font-medium text-gray-700">
                  Type:
                </label>
                <Select
                  allowClear
                  placeholder="Select Type"
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(value || null);
                    handleFilterChange(
                      value || null,
                      selectedCommodity,
                      selectedFrequency,
                    );
                  }}
                  style={{ width: "100%" }}
                  disabled={isFilter}
                  size="small"
                >
                  <Select.Option value="REGULAR">Regular (REG)</Select.Option>
                  <Select.Option value="COMPOSITION">
                    Composition (COMP)
                  </Select.Option>
                </Select>
              </div>

              <div className="flex flex-col gap-1 min-w-40">
                <label className="text-xs font-medium text-gray-700">
                  Commodity:
                </label>
                <Select
                  allowClear
                  placeholder="Select Commodity"
                  value={selectedCommodity}
                  onChange={(value) => {
                    setSelectedCommodity(value || null);
                    handleFilterChange(
                      selectedType,
                      value || null,
                      selectedFrequency,
                    );
                  }}
                  style={{ width: "100%" }}
                  disabled={isFilter}
                  size="small"
                >
                  {commodityOptions.map((commodity) => (
                    <Select.Option key={commodity} value={commodity}>
                      {commodity}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1 min-w-40">
                <label className="text-xs font-medium text-gray-700">
                  Frequency:
                </label>
                <Select
                  allowClear
                  placeholder="Select Frequency"
                  value={selectedFrequency}
                  onChange={(value) => {
                    setSelectedFrequency(value || null);
                    handleFilterChange(
                      selectedType,
                      selectedCommodity,
                      value || null,
                    );
                  }}
                  style={{ width: "100%" }}
                  disabled={isFilter}
                  size="small"
                >
                  {frequencyOptions.map((frequency) => (
                    <Select.Option key={frequency} value={frequency}>
                      {frequency}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {(selectedCommodity || selectedFrequency || selectedType) && (
                <Button
                  type="default"
                  onClick={clearAllFilters}
                  disabled={isFilter}
                  size="small"
                >
                  Clear Filters
                </Button>
              )}
            </div>
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
                    Commodity
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Frequency
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Pending Returns
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    VAT Amount
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Interest
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Penalty
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-700">
                    Total
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
                      <TableCell className="border text-left p-3 text-sm">
                        {val.dvat04.commodity || "N/A"}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        {val.dvat04.frequencyFilings || "N/A"}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm font-medium">
                        {val.pending}
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span className="font-semibold text-blue-600">
                          ₹{numberWithIndianFormat(parseFloat(val.vatamount))}
                        </span>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span className="font-semibold text-orange-600">
                          ₹{numberWithIndianFormat(parseFloat(val.interest))}
                        </span>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span className="font-semibold text-red-600">
                          ₹{numberWithIndianFormat(parseFloat(val.penalty))}
                        </span>
                      </TableCell>
                      <TableCell className="border text-center p-3 text-sm">
                        <span className="font-semibold text-green-600">
                          ₹{numberWithIndianFormat(parseFloat(val.total))}
                        </span>
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
