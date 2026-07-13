"use client";
import GetConvertedPurchase from "@/action/stock/getconvertedpurchase";
import {
  DailyPurchaseSummary,
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import { dvat04 } from "@prisma/client";
import { Button, Input, Modal, Pagination, Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { SortingState } from "@tanstack/react-table";

type DailyPurchaseFilteredSummary = {
  overallSummary: DailyPurchaseSummary;
  filteredSummary: DailyPurchaseSummary;
};

const DEFAULT_PURCHASE_SUMMARY: DailyPurchaseSummary = {
  totalInvoices: 0,
  totalTaxableValue: 0,
  totalVatAmount: 0,
  totalInvoiceValue: 0,
};

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatAmount = (value: number | string | null | undefined): string => {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "₹0.00";
  
  const formatted = numericValue.toFixed(2);
  const parts = formatted.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part in Indian format (e.g., 1,22,23,340)
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  const indianFormat =
    otherNumbers === ""
      ? lastThree
      : otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  
  return `₹${indianFormat}.${decimalPart}`;
};

const SortIcon = ({ isSorted }: { isSorted: false | "asc" | "desc" }) => {
  if (isSorted === false) {
    return <span className="text-gray-300 text-xs">↕</span>;
  }
  return isSorted === "asc" ? (
    <span className="text-xs">▲</span>
  ) : (
    <span className="text-xs">▼</span>
  );
};

const ViewConvertedPurchase = () => {
  const router = useRouter();

  const [isLoading, setLoading] = useState<boolean>(true);
  const [dvatdata, setDvatData] = useState<dvat04>();

  const [convertedPurchase, setConvertedPurchase] = useState<
    Array<GroupedDailyPurchase>
  >([]);
  const [overallSummary, setOverallSummary] = useState<DailyPurchaseSummary>(
    DEFAULT_PURCHASE_SUMMARY,
  );
  const [filteredSummary, setFilteredSummary] = useState<DailyPurchaseSummary>(
    DEFAULT_PURCHASE_SUMMARY,
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "invoice_date", desc: true },
  ]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] =
    useState<GroupedDailyPurchase | null>(null);

  const initializedRef = useRef(false);

  const fetchConvertedPurchase = useCallback(
    async ({
      dvatid,
      skip,
      take,
      search,
      sortBy,
      order,
      startDate,
      endDate,
    }: {
      dvatid: number;
      skip: number;
      take: number;
      search: string;
      sortBy:
        | "invoice_number"
        | "invoice_date"
        | "trade_name"
        | "tin_number"
        | "invoice_value";
      order: "asc" | "desc";
      startDate: string;
      endDate: string;
    }) => {
      const response = await GetConvertedPurchase({
        dvatid,
        skip,
        take,
        searchTerm: search,
        sortField: sortBy,
        sortOrder: order,
        startDate,
        endDate,
      });

      if (response.status && response.data.result) {
        setConvertedPurchase(response.data.result);
        const summary = response.data.summary as
          | DailyPurchaseFilteredSummary
          | undefined;
        setOverallSummary(summary?.overallSummary ?? DEFAULT_PURCHASE_SUMMARY);
        setFilteredSummary(
          summary?.filteredSummary ?? DEFAULT_PURCHASE_SUMMARY,
        );
      }

      return response;
    },
    [],
  );

  const init = useCallback(
    async (startDate?: string, endDate?: string) => {
      setLoading(true);
      const dvat_response = await GetUserDvat04();

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        await fetchConvertedPurchase({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 25,
          search: "",
          sortBy: "invoice_date",
          order: "desc",
          startDate: startDate || "",
          endDate: endDate || "",
        });
      } else {
        toast.error("Failed to load DVAT information");
      }

      setLoading(false);
    },
    [fetchConvertedPurchase],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [init]);

  const maxSelectableMonth = useMemo(() => {
    const today = new Date();
    return formatMonthInputValue(today);
  }, []);

  const handleSort = (columnId: string) => {
    setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId);
      if (!existing) {
        return [{ id: columnId, desc: false }];
      }
      if (existing.desc === false) {
        return [{ id: columnId, desc: true }];
      }
      return [{ id: "invoice_date", desc: true }];
    });
  };

  useEffect(() => {
    if (!dvatdata || !selectedPeriod) return;

    const [yearString, monthString] = selectedPeriod.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const monthEndDate = new Date(year, monthIndex + 1, 0);
    const today = new Date();

    const endDate =
      year === today.getFullYear() && monthIndex === today.getMonth()
        ? today
        : monthEndDate;

    const newStartDate = formatDateInputValue(startDate);
    const newEndDate = formatDateInputValue(endDate);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConvertedPurchase({
      dvatid: dvatdata.id,
      skip: 0,
      take: pageSize,
      search: searchTerm,
      sortBy: (sorting[0]?.id || "invoice_date") as
        | "invoice_number"
        | "invoice_date"
        | "trade_name"
        | "tin_number"
        | "invoice_value",
      order: sorting[0]?.desc ? "desc" : "asc",
      startDate: newStartDate,
      endDate: newEndDate,
    });
    setPageIndex(0);
  }, [
    selectedPeriod,
    dvatdata,
    fetchConvertedPurchase,
    pageSize,
    searchTerm,
    sorting,
  ]);

  useEffect(() => {
    if (!dvatdata || !selectedPeriod) return;

    const timer = setTimeout(() => {
      fetchConvertedPurchase({
        dvatid: dvatdata.id,
        skip: 0,
        take: pageSize,
        search: searchTerm,
        sortBy: (sorting[0]?.id || "invoice_date") as
          | "invoice_number"
          | "invoice_date"
          | "trade_name"
          | "tin_number"
          | "invoice_value",
        order: sorting[0]?.desc ? "desc" : "asc",
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      });
      setPageIndex(0);
    }, 600);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    dvatdata,
    fetchConvertedPurchase,
    pageSize,
    dateFilter,
    sorting,
    selectedPeriod,
  ]);

  useEffect(() => {
    if (!selectedPeriod) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateFilter({ startDate: "", endDate: "" });
      return;
    }

    const [yearString, monthString] = selectedPeriod.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const monthEndDate = new Date(year, monthIndex + 1, 0);
    const today = new Date();

    const endDate =
      year === today.getFullYear() && monthIndex === today.getMonth()
        ? today
        : monthEndDate;

    const newStartDate = formatDateInputValue(startDate);
    const newEndDate = formatDateInputValue(endDate);
    setDateFilter({ startDate: newStartDate, endDate: newEndDate });
  }, [selectedPeriod]);

  const sortField =
    (sorting[0]?.id as
      | "invoice_number"
      | "invoice_date"
      | "trade_name"
      | "tin_number"
      | "invoice_value") || "invoice_date";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata?.id) return;

    await fetchConvertedPurchase({
      dvatid: dvatdata.id,
      take: pagesize,
      skip: pagesize * (page - 1),
      search: searchTerm,
      sortBy: sortField,
      order: sortOrder as "asc" | "desc",
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Modal
        title="Invoice Details"
        open={isGroupModalOpen}
        onCancel={() => {
          setIsGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        width={1200}
        footer={null}
      >
        {selectedGroup && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold">{selectedGroup.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold">
                    {formateDate(selectedGroup.invoice_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Seller</p>
                  <p className="font-semibold">
                    {selectedGroup.seller_tin_number.name_of_dealer}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="font-semibold">
                    {formatAmount(selectedGroup.totalTaxableValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    {formatAmount(selectedGroup.totalVatAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    {formatAmount(selectedGroup.totalInvoiceValue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center text-xs">
                      Sr. No.
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Product Name
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Item Code
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Quantity
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Invoice Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Tax Rate
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Taxable Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup.records.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="p-2 border text-center text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="p-2 border text-left text-xs">
                        {record.commodity_master.product_name}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.commodity_master.id}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.quantity}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatAmount(
                          parseFloat(record.vatamount) +
                            parseFloat(record.amount)
                        )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatAmount(record.vatamount)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatAmount(record.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Modal>
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Converted Purchase Invoices
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  View all purchase invoices that have been finalized and
                  converted to DVAT 30/30A
                </p>
              </div>
              <div className="grow"></div>
              <Button
                size="small"
                type="default"
                onClick={() => {
                  router.push("/dashboard/stock/view_purchase");
                }}
              >
                Back to Purchases
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {filteredSummary.totalInvoices}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(filteredSummary.totalTaxableValue)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total VAT Amount</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(filteredSummary.totalVatAmount)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(filteredSummary.totalInvoiceValue)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border p-3">
            {/* Search and Filter Controls */}
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Search
                  </label>
                  <Input
                    size="small"
                    placeholder="Invoice, TIN, dealer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Month & Year
                  </label>
                  <Select
                    size="small"
                    placeholder="Select Month & Year"
                    value={selectedPeriod || undefined}
                    onChange={setSelectedPeriod}
                    allowClear
                    style={{ width: "100%" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const startDate = new Date(2026, 3, 1); // April 2026
                      const date = new Date(startDate);
                      date.setMonth(startDate.getMonth() + i);

                      const today = new Date();
                      if (date > today) return null;

                      const value = formatMonthInputValue(date);
                      const label = date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      });
                      return (
                        <Select.Option key={value} value={value}>
                          {label}
                        </Select.Option>
                      );
                    }).filter(Boolean)}
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Records Per Page
                  </label>
                  <Select
                    size="small"
                    value={pageSize}
                    onChange={setPageSize}
                    options={[
                      { label: "10", value: 10 },
                      { label: "25", value: 25 },
                      { label: "50", value: 50 },
                      { label: "100", value: 100 },
                    ]}
                  />
                </div>

                <div className="flex gap-2">
                  {(searchTerm || selectedPeriod) && (
                    <Button
                      size="small"
                      type="default"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedPeriod("");
                        setSorting([{ id: "invoice_date", desc: true }]);
                        setPageIndex(0);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Sr. No.
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("invoice_number")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Invoice No.</span>
                        <SortIcon
                          isSorted={
                            sortField === "invoice_number"
                              ? (sortOrder as any)
                              : false
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("invoice_date")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Invoice Date</span>
                        <SortIcon
                          isSorted={
                            sortField === "invoice_date"
                              ? (sortOrder as any)
                              : false
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("trade_name")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Seller</span>
                        <SortIcon
                          isSorted={
                            sortField === "trade_name"
                              ? (sortOrder as any)
                              : false
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("tin_number")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>TIN</span>
                        <SortIcon
                          isSorted={
                            sortField === "tin_number"
                              ? (sortOrder as any)
                              : false
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Items
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Taxable
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      VAT
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("invoice_value")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Total</span>
                        <SortIcon
                          isSorted={
                            sortField === "invoice_value"
                              ? (sortOrder as any)
                              : false
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {convertedPurchase.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="border text-center py-8 text-sm text-gray-500"
                      >
                        No converted purchase records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    convertedPurchase.map((group, index) => (
                      <TableRow key={index} className="hover:bg-blue-50">
                        <TableCell className="p-2 border text-center text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {group.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {formateDate(group.invoice_date)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {group.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {group.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {group.count}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {formatAmount(group.totalTaxableValue)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {formatAmount(group.totalVatAmount)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          {formatAmount(group.totalInvoiceValue)}
                        </TableCell>
                        <TableCell className="p-2 border text-center text-xs">
                          <button
                            onClick={() => {
                              setSelectedGroup(group);
                              setIsGroupModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 font-medium"
                          >
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {convertedPurchase.length > 0 && (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-gray-600">
                  Showing {pageIndex * pageSize + 1} to{" "}
                  {Math.min(
                    (pageIndex + 1) * pageSize,
                    filteredSummary.totalInvoices,
                  )}{" "}
                  of {filteredSummary.totalInvoices} records
                </div>
                <div className="flex justify-end">
                  <Pagination
                    current={pageIndex + 1}
                    pageSize={pageSize}
                    total={filteredSummary.totalInvoices}
                    onChange={onChangePageCount}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default ViewConvertedPurchase;
