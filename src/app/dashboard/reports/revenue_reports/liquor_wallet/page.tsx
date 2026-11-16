"use client";

import { Button, Input, Pagination } from "antd";
import { Select } from "antd";
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
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import GetLiquorWalletReport from "@/action/report/getliquorwalletreport";
import type { LiquorWalletGroupRecord } from "@/action/report/getliquorwalletreport";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

interface PaginationState {
  take: number;
  skip: number;
  total: number;
}

const LiquorWalletReportPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [pagination, setPage] = useState<number>(1);

  const searchTinRef = useRef<InputRef>(null);

  const [walletData, setWalletData] = useState<LiquorWalletGroupRecord[]>([]);
  const [searchResults, setSearchResults] = useState<LiquorWalletGroupRecord[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState<string>("");

  // Filter states
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(
    null,
  );
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    null,
  );

  // Unique filter values
  const [commodityOptions, setCommodityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [officeOptions, setOfficeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [frequencyOptions, setFrequencyOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const formatCurrency = (value: string | number | null) => {
    if (value === null || value === undefined) return "0.00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  const extractFilterOptions = (data: LiquorWalletGroupRecord[]) => {
    const commodities = new Set<string>();
    const offices = new Set<string>();
    const frequencies = new Set<string>();

    data.forEach((record) => {
      if (record.commodity) commodities.add(record.commodity);
      if (record.selectOffice) offices.add(record.selectOffice);
      if (record.frequencyFilings) frequencies.add(record.frequencyFilings);
    });

    setCommodityOptions(
      Array.from(commodities)
        .sort()
        .map((val) => ({ label: val, value: val })),
    );
    setOfficeOptions(
      Array.from(offices)
        .sort()
        .map((val) => ({ label: val, value: val })),
    );
    setFrequencyOptions(
      Array.from(frequencies)
        .sort()
        .map((val) => ({ label: val, value: val })),
    );
  };

  const applyFilters = useCallback(
    (data: LiquorWalletGroupRecord[]) => {
      let filtered = data;

      if (selectedCommodity) {
        filtered = filtered.filter((r) => r.commodity === selectedCommodity);
      }
      if (selectedOffice) {
        filtered = filtered.filter((r) => r.selectOffice === selectedOffice);
      }
      if (selectedFrequency) {
        filtered = filtered.filter(
          (r) => r.frequencyFilings === selectedFrequency,
        );
      }

      return filtered;
    },
    [selectedCommodity, selectedOffice, selectedFrequency],
  );

  const init = async () => {
    setLoading(true);

    const response = await GetLiquorWalletReport();

    if (response.status && response.data) {
      setWalletData(response.data);
      extractFilterOptions(response.data);
      setPage(1);
    } else {
      toast.error(response.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (userid > 0) {
      (async () => {
        await init();
      })();
    }
  }, [userid]);

  // Memoized filtered data based on filters and search
  const memoizedFilteredData = useMemo(() => {
    if (walletData.length === 0) return [];

    let filtered = walletData;

    if (searchValue) {
      filtered = filtered.filter(
        (record) =>
          record.tinNumber
            ?.toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          record.tradename?.toLowerCase().includes(searchValue.toLowerCase()),
      );
    }

    return applyFilters(filtered);
  }, [walletData, searchValue, applyFilters]);

  // Derive pagination and filtered data from memoized data (no setState calls)
  const itemsPerPage = 10;
  const paginationState: PaginationState = {
    take: itemsPerPage,
    skip: (pagination - 1) * itemsPerPage,
    total: memoizedFilteredData.length,
  };
  const filteredData = memoizedFilteredData.slice(
    paginationState.skip,
    paginationState.skip + itemsPerPage,
  );

  const searchByTinOrName = async () => {
    const inputValue = searchTinRef.current?.input?.value?.trim();
    if (!inputValue || inputValue === "") {
      toast.error("Enter TIN number or trade name to search");
      return;
    }

    setSearchValue(inputValue);
    setLoading(false);
  };

  const clearSearch = () => {
    if (searchTinRef.current?.input) {
      (searchTinRef.current.input as HTMLInputElement).value = "";
    }
    setSearchValue("");
    setSearchResults([]);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCommodity(null);
    setSelectedOffice(null);
    setSelectedFrequency(null);
    if (searchTinRef.current?.input) {
      (searchTinRef.current.input as HTMLInputElement).value = "";
    }
    setSearchResults([]);
    setSearchValue("");
    setPage(1);
  };

  const onChangePageCount = (page: number) => {
    setPage(page);
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

  const totalCredit = filteredData.reduce(
    (sum, record) => sum + parseFloat(record.totalCredit || "0"),
    0,
  );
  const totalDebit = filteredData.reduce(
    (sum, record) => sum + parseFloat(record.totalDebit || "0"),
    0,
  );
  const totalBalance = filteredData.reduce(
    (sum, record) => sum + parseFloat(record.balance || "0"),
    0,
  );

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Liquor Wallet Report - DVAT Summary
            </h1>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
            {/* Search and Filter Row */}
            <div className="space-y-2 flex gap-2">
              {/* Search Section */}
              <div className="w-96">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Search by TIN or Trade Name:
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={searchTinRef}
                    placeholder="Enter TIN number or trade name"
                    onChange={(e) => setSearchValue(e.target.value)}
                    onPressEnter={searchByTinOrName}
                    disabled={isLoading}
                    size="small"
                  />
                  <Button
                    type="primary"
                    onClick={searchByTinOrName}
                    loading={isLoading}
                    size="small"
                  >
                    Search
                  </Button>
                  {searchResults.length > 0 && (
                    <Button
                      onClick={clearSearch}
                      disabled={isLoading}
                      size="small"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="grow"></div>

              {/* Filters Section */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Filter by:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <Select
                    placeholder="Commodity"
                    allowClear
                    value={selectedCommodity}
                    onChange={(value) => {
                      setSelectedCommodity(value || null);
                      setPage(1);
                    }}
                    options={commodityOptions}
                    disabled={isLoading}
                    size="small"
                  />
                  <Select
                    placeholder="Select Office"
                    allowClear
                    value={selectedOffice}
                    onChange={(value) => {
                      setSelectedOffice(value || null);
                      setPage(1);
                    }}
                    options={officeOptions}
                    disabled={isLoading}
                    size="small"
                  />
                  <Select
                    placeholder="Filing Frequency"
                    allowClear
                    value={selectedFrequency}
                    onChange={(value) => {
                      setSelectedFrequency(value || null);
                      setPage(1);
                    }}
                    options={frequencyOptions}
                    disabled={isLoading}
                    size="small"
                  />
                  {(selectedCommodity ||
                    selectedOffice ||
                    selectedFrequency) && (
                    <Button
                      onClick={clearFilters}
                      disabled={isLoading}
                      size="small"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        {/* {filteredData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total DVATs
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {filteredData.length}
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
                      d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Credit
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    ₹ {formatCurrency(totalCredit)}
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
                    Total Debit
                  </p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    ₹ {formatCurrency(totalDebit)}
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
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    ₹ {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
        )} */}

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Sr. No.
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    TIN Number
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Trade Name
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Commodity
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Select Office
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Filing Frequency
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Total Credit (₹)
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Total Debit (₹)
                  </TableHead>
                  <TableHead className="text-center p-3 text-xs font-semibold text-gray-700">
                    Balance (₹)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((record, index) => (
                    <TableRow
                      key={record.dvatId}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="text-center p-3 text-sm">
                        {paginationState.skip + index + 1}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium">
                        {record.tinNumber || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.tradename || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.commodity || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.selectOffice || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm">
                        {record.frequencyFilings || "N/A"}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium text-green-600">
                        {formatCurrency(record.totalCredit)}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium text-red-600">
                        {formatCurrency(record.totalDebit)}
                      </TableCell>
                      <TableCell className="text-center p-3 text-sm font-medium text-purple-600">
                        {formatCurrency(record.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center p-4 text-sm text-gray-500"
                    >
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredData.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Pagination
                current={pagination}
                pageSize={itemsPerPage}
                total={paginationState.total}
                onChange={onChangePageCount}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LiquorWalletReportPage;
