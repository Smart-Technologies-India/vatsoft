"use client";
import GetGeneratedInvoices from "@/action/stock/getgeneratedinvoices";
import {
  DailySaleSummary,
  GroupedDailySale,
} from "@/action/stock/getuserdailysale";
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
import {
  Button,
  Input,
  Modal,
  Pagination,
  Radio,
  RadioChangeEvent,
  Select,
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";

type DailySaleFilteredSummary = {
  overallSummary: DailySaleSummary;
  filteredSummary: DailySaleSummary;
};

const DEFAULT_SALE_SUMMARY: DailySaleSummary = {
  totalInvoices: 0,
  totalTaxableValue: 0,
  totalVatAmount: 0,
  totalInvoiceValue: 0,
};

const formatMonthInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type SortField = "invoice_number" | "invoice_date" | "trade_name" | "tin_number" | "invoice_value";
type SortOrder = "asc" | "desc" | null;

const SortIcon = ({
  sortField,
  field,
  sortOrder,
}: {
  sortField: SortField;
  field: SortField;
  sortOrder: SortOrder;
}) => {
  if (sortField !== field) {
    return <span className="text-gray-300 text-xs">↕</span>;
  }
  return sortOrder === "asc" ? (
    <span className="text-xs">▲</span>
  ) : sortOrder === "desc" ? (
    <span className="text-xs">▼</span>
  ) : null;
};

const GeneratedInvoicePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("invoice_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [generatedInvoices, setGeneratedInvoices] = useState<
    Array<GroupedDailySale>
  >([]);
  const [overallSaleSummary, setOverallSaleSummary] =
    useState<DailySaleSummary>(DEFAULT_SALE_SUMMARY);
  const [filteredSaleSummary, setFilteredSaleSummary] =
    useState<DailySaleSummary>(DEFAULT_SALE_SUMMARY);

  const isFilterApplied = useMemo(
    () =>
      searchTerm.trim() !== "" ||
      selectedPeriod !== "",
    [searchTerm, selectedPeriod],
  );

  const cardSummary = isFilterApplied
    ? filteredSaleSummary
    : overallSaleSummary;

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 25,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04>();
  const [userid, setUserid] = useState<number>(0);
  const [selectedGroup, setSelectedGroup] = useState<GroupedDailySale | null>(
    null,
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [quantityCount, setQuantityCount] = useState("pcs");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const maxSelectableMonth = useMemo(
    () => formatMonthInputValue(new Date()),
    [],
  );

  const showCrates = (quantity: number, crate_size: number): string => {
    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order
      const newOrder = sortOrder === "asc" ? "desc" : sortOrder === "desc" ? null : "asc";
      setSortOrder(newOrder);
      if (newOrder === null) {
        setSortField("invoice_date");
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const init = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    async (startDate?: string, endDate?: string) => {
      if (!dvatdata?.id) return;

      const generatedResponse = await GetGeneratedInvoices({
        dvatid: dvatdata.id,
        skip: 0,
        take: pagination.take,
        searchTerm,
        sortField: sortOrder ? sortField : undefined,
        sortOrder: sortOrder || undefined,
        startDate: startDate || dateFilter.startDate,
        endDate: endDate || dateFilter.endDate,
      });

      if (
        generatedResponse.status &&
        generatedResponse.data.result
      ) {
        setGeneratedInvoices(generatedResponse.data.result);
        setPaginatin((prev) => ({
          ...prev,
          skip: 0,
          total: generatedResponse.data.total,
        }));
        const summary = generatedResponse.data.summary as
          | DailySaleFilteredSummary
          | undefined;
        setOverallSaleSummary(
          summary?.overallSummary ?? DEFAULT_SALE_SUMMARY,
        );
        setFilteredSaleSummary(
          summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY,
        );
      }
    },
    [dvatdata?.id, pagination.take, searchTerm, sortField, sortOrder, dateFilter.startDate, dateFilter.endDate],
  );

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const userresponse = await GetUser({ id: authResponse.data });
      if (userresponse.status) {
        // User data retrieved
      }

      const dvat_response = await GetUserDvat04Anx({});

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }

      setIsLoading(false);
    };
    initData();
  }, [router]);

  useEffect(() => {
    if (!dvatdata?.id) return;

    const timer = setTimeout(() => {
      init();
    }, 600);

    return () => clearTimeout(timer);
  }, [
    dvatdata?.id,
    pagination.take,
    searchTerm,
    sortField,
    sortOrder,
    init,
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
    
    setDateFilter({
      startDate: newStartDate,
      endDate: newEndDate,
    });
    
    // Fetch data immediately with new dates
    if (dvatdata?.id) {
      const timer = setTimeout(() => {
        init(newStartDate, newEndDate);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [selectedPeriod, dvatdata?.id, init]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata?.id) return;

    const skip = pagesize * (page - 1);
    const response = await GetGeneratedInvoices({
      dvatid: dvatdata.id,
      take: pagesize,
      skip,
      searchTerm,
      sortField: sortOrder ? sortField : undefined,
      sortOrder: sortOrder || undefined,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
    });

    if (response.status && response.data.result) {
      setGeneratedInvoices(response.data.result);
      setPaginatin({
        skip: response.data.skip,
        take: response.data.take,
        total: response.data.total,
      });
      const summary = response.data.summary as
        | DailySaleFilteredSummary
        | undefined;
      setOverallSaleSummary(summary?.overallSummary ?? DEFAULT_SALE_SUMMARY);
      setFilteredSaleSummary(summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY);
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
      <Modal
        title="Invoice Details"
        open={isGroupModalOpen}
        onCancel={() => {
          setIsGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        footer={null}
        width={1200}
      >
        {selectedGroup && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold">
                    {selectedGroup.invoice_number}
                  </p>
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
                      {quantityCount == "pcs"
                        ? dvatdata?.commodity == "FUEL"
                          ? "Litres"
                          : "Qty"
                        : "Crate"}
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Taxable Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Rate of Tax
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Invoice Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup.records.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="p-2 border text-center text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.commodity_master.product_name}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.commodity_master.id}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {quantityCount == "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatAmount(record.amount)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatAmount(record.vatamount)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.amount
                          ? formatAmount(
                              parseFloat(record.amount) +
                              parseFloat(record.vatamount)
                            )
                          : "₹0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
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
          </div>
        )}
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Generated Invoices
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  View all invoices that have been finalized and converted for DVAT filing
                </p>
              </div>
              <div className="grow"></div>
              <div className="flex flex-wrap gap-2 items-center">
                {dvatdata?.commodity != "FUEL" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <Radio.Group
                      size="small"
                      onChange={onChange}
                      value={quantityCount}
                      optionType="button"
                    >
                      <Radio.Button value="pcs">Pcs</Radio.Button>
                      <Radio.Button value="crate">Crate</Radio.Button>
                    </Radio.Group>
                  </div>
                )}
                <Button
                  size="small"
                  type="default"
                  onClick={() => {
                    router.push("/dashboard/stock/view_sale");
                  }}
                >
                  Back to Sales
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {cardSummary.totalInvoices}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(cardSummary.totalTaxableValue)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(cardSummary.totalVatAmount)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(cardSummary.totalInvoiceValue)}
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
                      // Stop if we exceed current month
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
                    value={pagination.take}
                    onChange={(value) => {
                      setPaginatin((prev) => ({ ...prev, take: value }));
                    }}
                    options={[
                      { label: "10", value: 10 },
                      { label: "25", value: 25 },
                      { label: "50", value: 50 },
                      { label: "100", value: 100 },
                    ]}
                  />
                </div>

                <div className="flex gap-2">
                  {isFilterApplied && (
                    <Button
                      size="small"
                      type="default"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedPeriod("");
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
                        <SortIcon field="invoice_number" sortField={sortField} sortOrder={sortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("invoice_date")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Invoice Date</span>
                        <SortIcon field="invoice_date" sortField={sortField} sortOrder={sortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("trade_name")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Seller</span>
                        <SortIcon field="trade_name" sortField={sortField} sortOrder={sortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("tin_number")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>TIN</span>
                        <SortIcon field="tin_number" sortField={sortField} sortOrder={sortOrder} />
                      </div>
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Item Count
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Total Taxable
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Total VAT
                    </TableHead>
                    <TableHead
                      className="border text-center text-xs font-semibold px-2 py-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort("invoice_value")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Total Invoice Value</span>
                        <SortIcon field="invoice_value" sortField={sortField} sortOrder={sortOrder} />
                      </div>
                    </TableHead>
                    <TableHead className="border text-center text-xs font-semibold px-2 py-2">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="border text-center py-8 text-sm text-gray-500"
                      >
                        No generated invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    generatedInvoices.map((group, groupIdx) => (
                      <TableRow key={groupIdx} className="hover:bg-blue-50">
                        <TableCell className="p-2 border text-center text-xs">
                          {pagination.skip + groupIdx + 1}
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

            {generatedInvoices.length > 0 && (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-gray-600">
                  Showing {pagination.skip + 1} to{" "}
                  {Math.min(pagination.skip + pagination.take, pagination.total)} of{" "}
                  {pagination.total} records
                </div>
                <div className="flex justify-end">
                  <Pagination
                    current={Math.floor(pagination.skip / pagination.take) + 1}
                    pageSize={pagination.take}
                    total={pagination.total}
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

export default GeneratedInvoicePage;
