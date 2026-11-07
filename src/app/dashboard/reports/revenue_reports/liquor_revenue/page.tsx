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

import type { InputRef } from "antd";
import { Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import GetAllUsersWalletTransaction, {
  type AllUsersWalletHistoryWithDvat,
} from "@/action/wallet/getalluserswallettransaction";
import GetDvatSummary from "@/action/wallet/getdvatsummary";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

interface DvatOption {
  id: number;
  tinNumber: string | null;
  tradename: string | null;
  wallet: string | null;
}

const LiquorRevenueReportPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const searchTinRef = useRef<InputRef>(null);

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

  const init = async (dvatId?: number) => {
    setLoading(true);
    const currentDvatId = dvatId || selectedDvat || undefined;

    const history_response = await GetAllUsersWalletTransaction({
      dvatid: currentDvatId,
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

      // Get summary stats for all transactions (not just current page)
      if (currentDvatId) {
        const summary_response = await GetDvatSummary({
          dvatId: currentDvatId,
        });
        if (summary_response.status && summary_response.data) {
          setSummaryStats({
            totalBalance: summary_response.data.currentBalance,
            totalRecharge: summary_response.data.totalRecharge,
            totalUsed: summary_response.data.totalUsed,
          });
        } else {
          setSummaryStats({
            totalBalance: "0",
            totalRecharge: "0",
            totalUsed: "0",
          });
        }
      }
    }

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
        setAllDvats(history_response.data.allDvats);
      } else {
        toast.error(history_response.message);
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

  const searchByTinOrName = async () => {
    const searchValue = searchTinRef.current?.input?.value?.trim();
    if (!searchValue || searchValue === "") {
      toast.error("Enter TIN number or trade name to search");
      return;
    }

    setLoading(true);
    const search_response = await GetAllUsersWalletTransaction({
      searchTinOrName: searchValue,
      take: 10,
      skip: 0,
    });
    setLoading(false);

    if (
      search_response.status &&
      search_response.data &&
      search_response.data.allDvats.length > 0
    ) {
      setAllDvats(search_response.data.allDvats);
      setSelectedDvat(null);
      setWalletHistoryData([]);
      setSummaryStats({
        totalBalance: "0",
        totalRecharge: "0",
        totalUsed: "0",
      });
      toast.success(
        `Found ${search_response.data.allDvats.length} DVAT(s) with history`,
      );
    } else {
      toast.error("No DVAT found with that TIN or trade name");
      setAllDvats([]);
      setWalletHistoryData([]);
    }
  };

  const clearSearch = () => {
    if (searchTinRef.current?.input) {
      (searchTinRef.current.input as HTMLInputElement).value = "";
    }
    setAllDvats([]);
    setSelectedDvat(null);
    setWalletHistoryData([]);
    setSummaryStats({
      totalBalance: "0",
      totalRecharge: "0",
      totalUsed: "0",
    });
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    setLoading(true);

    const query: any = {
      dvatid: selectedDvat || undefined,
      take: pagesize,
      skip: pagesize * (page - 1),
    };

    const history_response = await GetAllUsersWalletTransaction(query);
    setLoading(false);

    if (history_response.status && history_response.data?.result) {
      setWalletHistoryData(history_response.data.result);
      setPaginatin({
        skip: history_response.data.skip,
        take: history_response.data.take,
        total: history_response.data.total,
      });

      // Get summary stats for all transactions (not just current page)
      if (selectedDvat) {
        const summary_response = await GetDvatSummary({
          dvatId: selectedDvat,
        });
        if (summary_response.status && summary_response.data) {
          setSummaryStats({
            totalBalance: summary_response.data.currentBalance,
            totalRecharge: summary_response.data.totalRecharge,
            totalUsed: summary_response.data.totalUsed,
          });
        }
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Liquor Revenue Report - All Users Wallet Usage History
            </h1>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Search Section */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Search DVAT by TIN or Trade Name:
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={searchTinRef}
                    placeholder="Enter TIN number or trade name"
                    onPressEnter={searchByTinOrName}
                    disabled={isLoading}
                  />
                  <Button
                    type="primary"
                    onClick={searchByTinOrName}
                    loading={isLoading}
                  >
                    Search
                  </Button>
                  {allDvats.length > 0 && (
                    <Button onClick={clearSearch} disabled={isLoading}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Section */}
              {allDvats.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 w-96 mb-3">
                    Select DVAT to View History:
                  </p>
                  <Select
                    placeholder="Select a DVAT"
                    value={selectedDvat}
                    onChange={(value) => {
                      setSelectedDvat(value);
                      if (value) {
                        setLoading(true);
                        init(value).then(() => setLoading(false));
                      } else {
                        setWalletHistoryData([]);
                        setSummaryStats({
                          totalBalance: "0",
                          totalRecharge: "0",
                          totalUsed: "0",
                        });
                      }
                    }}
                    allowClear
                    onClear={() => {
                      setSelectedDvat(null);
                      setWalletHistoryData([]);
                      setSummaryStats({
                        totalBalance: "0",
                        totalRecharge: "0",
                        totalUsed: "0",
                      });
                    }}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={allDvats.map((dvat) => ({
                      label: `${dvat.tinNumber} - ${dvat.tradename}`,
                      value: dvat.id,
                    }))}
                    style={{ width: "24rem" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards - Show only if DVAT selected */}
        {selectedDvat && (
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
        )}

        {/* Data Table - Show only if DVAT selected */}
        {selectedDvat && (
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
                          {record.dvat?.tradename || "N/A"}
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
                            Math.abs(
                              parseFloat(record.new_wallet || "0") -
                                parseFloat(record.old_wallet || "0"),
                            ),
                          )}
                        </TableCell>
                        <TableCell className="text-center p-3 text-sm">
                          ₹{" "}
                          {formatCurrency(parseFloat(record.old_wallet || "0"))}
                        </TableCell>
                        <TableCell className="text-center p-3 text-sm">
                          ₹{" "}
                          {formatCurrency(parseFloat(record.new_wallet || "0"))}
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
        )}
      </div>
    </main>
  );
};

export default LiquorRevenueReportPage;
