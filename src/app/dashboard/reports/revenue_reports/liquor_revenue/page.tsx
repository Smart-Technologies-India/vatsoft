"use client";

import { Button, Input, Pagination, Select } from "antd";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import GetAllUsersWalletTransaction, {
  type AllUsersWalletHistoryWithDvat,
} from "@/action/wallet/getalluserswallettransaction";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

interface DvatOption {
  id: number;
  tinNumber: string | null;
  name: string | null;
  wallet: string | null;
}

const LiquorRevenueReportPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
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
    INVOICE_NUMBER,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.INVOICE_NUMBER,
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const invoiceNumberRef = useRef<InputRef>(null);
  const tinSearchRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setSearchDate(dates);
  };

  const [walletHistoryData, setWalletHistoryData] = useState<
    AllUsersWalletHistoryWithDvat[]
  >([]);
  const [allDvats, setAllDvats] = useState<DvatOption[]>([]);
  const [selectedDvat, setSelectedDvat] = useState<number | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalBalance: "0",
    totalRecharge: "0",
    totalUsed: "0",
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  const calculateSummary = (transactions: AllUsersWalletHistoryWithDvat[]) => {
    let totalRecharge = 0;
    let totalUsed = 0;
    let totalBalance = 0;

    transactions.forEach((trans) => {
      const amount = parseFloat(trans.difference_amount || "0");
      if (trans.type === "CREDIT") {
        totalRecharge += amount;
      } else if (trans.type === "DEBIT") {
        totalUsed += amount;
      }
    });

    // Calculate total balance from all dvats
    if (allDvats.length > 0) {
      totalBalance = allDvats.reduce((sum, dvat) => {
        return sum + parseFloat(dvat.wallet || "0");
      }, 0);
    }

    return {
      totalBalance: totalBalance.toFixed(2),
      totalRecharge: totalRecharge.toFixed(2),
      totalUsed: totalUsed.toFixed(2),
    };
  };

  const init = async () => {
    setLoading(true);
    setSelectedDvat(null);

    const history_response = await GetAllUsersWalletTransaction({
      take: 10,
      skip: 0,
    });
    if (history_response.status && history_response.data) {
      setWalletHistoryData(history_response.data.result);
      setAllDvats(history_response.data.allDvats);
      setPaginatin({
        skip: history_response.data.skip,
        take: history_response.data.take,
        total: history_response.data.total,
      });
      setSummaryStats(calculateSummary(history_response.data.result));
    }

    setSearch(false);
    setLoading(false);
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

      const history_response = await GetAllUsersWalletTransaction({
        take: 10,
        skip: 0,
      });
      if (history_response.status && history_response.data) {
        setWalletHistoryData(history_response.data.result);
        setAllDvats(history_response.data.allDvats);
        setPaginatin({
          skip: history_response.data.skip,
          take: history_response.data.take,
          total: history_response.data.total,
        });
        setSummaryStats(calculateSummary(history_response.data.result));
      } else {
        toast.error(history_response.message);
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

  const invoiceNumberSearch = async () => {
    if (
      invoiceNumberRef.current?.input?.value == undefined ||
      invoiceNumberRef.current?.input?.value == null ||
      invoiceNumberRef.current?.input?.value == ""
    ) {
      return toast.error("Enter invoice number");
    }
    const search_response = await GetAllUsersWalletTransaction({
      invoice_number: invoiceNumberRef.current?.input?.value,
      dvatid: selectedDvat || undefined,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setWalletHistoryData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSummaryStats(calculateSummary(search_response.data.result));
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select start date and end date");
    }

    const search_response = await GetAllUsersWalletTransaction({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
      dvatid: selectedDvat || undefined,
      take: 10,
      skip: 0,
    });
    if (search_response.status && search_response.data?.result) {
      setWalletHistoryData(search_response.data.result);
      setPaginatin({
        skip: search_response.data.skip,
        take: search_response.data.take,
        total: search_response.data.total,
      });
      setSummaryStats(calculateSummary(search_response.data.result));
      setSearch(true);
    }
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (isSearch) {
      if (searchOption == SearchOption.INVOICE_NUMBER) {
        if (
          invoiceNumberRef.current?.input?.value == undefined ||
          invoiceNumberRef.current?.input?.value == null ||
          invoiceNumberRef.current?.input?.value == ""
        ) {
          return toast.error("Enter invoice number");
        }
        const search_response = await GetAllUsersWalletTransaction({
          invoice_number: invoiceNumberRef.current?.input?.value,
          dvatid: selectedDvat || undefined,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data?.result) {
          setWalletHistoryData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      } else if (searchOption == SearchOption.DATE) {
        if (searchDate == null || searchDate.length <= 1) {
          return toast.error("Select start date and end date");
        }

        const search_response = await GetAllUsersWalletTransaction({
          fromdate: searchDate[0]?.toDate(),
          todate: searchDate[1]?.toDate(),
          dvatid: selectedDvat || undefined,
          take: pagesize,
          skip: pagesize * (page - 1),
        });

        if (search_response.status && search_response.data?.result) {
          setWalletHistoryData(search_response.data.result);
          setPaginatin({
            skip: search_response.data.skip,
            take: search_response.data.take,
            total: search_response.data.total,
          });
          setSearch(true);
        }
      }
    } else {
      const history_response = await GetAllUsersWalletTransaction({
        dvatid: selectedDvat || undefined,
        take: pagesize,
        skip: pagesize * (page - 1),
      });
      if (history_response.status && history_response.data?.result) {
        setWalletHistoryData(history_response.data.result);
        setPaginatin({
          skip: history_response.data.skip,
          take: history_response.data.take,
          total: history_response.data.total,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <main className="p-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto flex min-h-56 items-center justify-center">
          <Spin />
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Liquor Revenue Report - All Users Wallet Usage History
            </h1>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap items-center">
                <p className="text-sm font-medium text-gray-700">
                  Filter by User:
                </p>
                <Select
                  placeholder="Select a user (Optional)"
                  style={{ width: 300 }}
                  value={selectedDvat}
                  onChange={(value) => setSelectedDvat(value)}
                  allowClear
                  onClear={() => setSelectedDvat(null)}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={allDvats.map((dvat) => ({
                    label: `${dvat.tinNumber} - ${dvat.name}`,
                    value: dvat.id,
                  }))}
                />
              </div>

              <div className="flex gap-4 items-center flex-wrap">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Search by:
                </p>
                <Radio.Group value={searchOption} onChange={onChange}>
                  <Radio value={SearchOption.INVOICE_NUMBER}>
                    Invoice Number
                  </Radio>
                  <Radio value={SearchOption.DATE}>Date Range</Radio>
                </Radio.Group>
              </div>

              {searchOption === SearchOption.INVOICE_NUMBER && (
                <div className="flex gap-2">
                  <Input
                    ref={invoiceNumberRef}
                    placeholder="Enter invoice number"
                    className="flex-1 h-8"
                  />
                  <Button type="primary" onClick={invoiceNumberSearch}>
                    Search
                  </Button>
                  {isSearch && <Button onClick={init}>Clear</Button>}
                </div>
              )}

              {searchOption === SearchOption.DATE && (
                <div className="flex gap-2">
                  <RangePicker
                    value={searchDate}
                    onChange={onChangeDate}
                    className="flex-1 h-8"
                  />
                  <Button type="primary" onClick={datesearch}>
                    Search
                  </Button>
                  {isSearch && <Button onClick={init}>Clear</Button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Recharge
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ₹ {formatCurrency(summaryStats.totalRecharge || "0")}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Used
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  ₹ {formatCurrency(summaryStats.totalUsed || "0")}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Balance
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  ₹ {formatCurrency(summaryStats.totalBalance || "0")}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Sr. No.
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    User TIN
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    User Name
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Invoice Number
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Transaction Type
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Amount
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Old Balance
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    New Balance
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Date
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletHistoryData.length > 0 ? (
                  walletHistoryData.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="text-center p-3 text-sm">
                        {pagination.skip + index + 1}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        {record.dvat?.tinNumber || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.dvat?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        {record.invoice_number || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            record.type === "DEBIT"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        ₹{" "}
                        {formatCurrency(
                          Math.abs(parseFloat(record.difference_amount || "0")),
                        )}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        ₹ {formatCurrency(parseFloat(record.old_wallet || "0"))}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        ₹ {formatCurrency(parseFloat(record.new_wallet || "0"))}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {formateDate(record.createdAt)}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {record.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center p-4 text-sm text-gray-500"
                    >
                      No wallet transaction history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {walletHistoryData.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Pagination
                current={Math.floor(pagination.skip / pagination.take) + 1}
                pageSize={pagination.take}
                total={pagination.total}
                onChange={onChangePageCount}
                showSizeChanger
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LiquorRevenueReportPage;
