"use client";
import GetTransportPermitFiltered, {
  type TransportPermitSortField,
  type TransportPermitSortOrder,
  type TransportPermitRecord,
} from "@/action/stock/gettransportpermitfiltered";
import GetTransportPermitDetails, {
  type GroupedPurchaseItem,
} from "@/action/stock/gettransportpermitdetails";
import UpdateTpReleased from "@/action/stock/updatetpreleased";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import { Button, Input, Modal, Pagination, Select } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import ServerTime from "@/action/servertime";

const DEFAULT_SUMMARY = {
  totalRecords: 0,
  totalItems: 0,
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

const formatIndianNumber = (num: number): string => {
  if (!Number.isFinite(num)) return "0";
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;
  const lastThree = numStr.slice(-3);
  const remaining = numStr.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${withCommas},${lastThree}`;
};

const TransportPermit = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] =
    useState<TransportPermitSortField>("invoiceDate");
  const [sortOrder, setSortOrder] = useState<TransportPermitSortOrder>("desc");
  const [selectedPeriod, setSelectedPeriod] = useState(
    formatMonthInputValue(ServerTime().data as Date),
  );
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [pagination, setPagination] = useState({
    take: 25,
    skip: 0,
    total: 0,
  });
  const [transportPermitData, setTransportPermitData] = useState<
    TransportPermitRecord[]
  >([]);
  const [selectedPermit, setSelectedPermit] =
    useState<TransportPermitRecord | null>(null);
  const [selectedDetails, setSelectedDetails] =
    useState<GroupedPurchaseItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedReleasePermit, setSelectedReleasePermit] =
    useState<TransportPermitRecord | null>(null);
  const [isReleasingTp, setIsReleasingTp] = useState(false);
  const [userid, setUserid] = useState(0);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (!selectedPeriod) {
      setDateFilter({ startDate: "", endDate: "" });
      return;
    }
    const [yearString, monthString] = selectedPeriod.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const today = ServerTime().data as Date;
    const endDate =
      year === today.getFullYear() && monthIndex === today.getMonth()
        ? today
        : new Date(year, monthIndex + 1, 0);
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setDateFilter({
      startDate: formatDateInputValue(startDate),
      endDate: formatDateInputValue(nextDay),
    });
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      const response = await GetTransportPermitFiltered({
        skip: 0,
        take: pagination.take,
        searchTerm,
        sortField: sortField as TransportPermitSortField,
        sortOrder,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      });
      if (response.status && response.data?.result) {
        setTransportPermitData(response.data.result);
        setPagination({
          skip: response.data.skip,
          take: response.data.take,
          total: response.data.total,
        });
        const summaryData = response.data.summary as any;
        setSummary(summaryData?.filteredSummary ?? DEFAULT_SUMMARY);
      }
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const initData = async () => {
    setIsLoading(true);
    try {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const today = ServerTime().data as Date;
      // Start from October 2026 (after September 2026)
      const octStartDate = new Date(2026, 9, 1); // October 1, 2026
      const endDate = today;

      const tpResponse = await GetTransportPermitFiltered({
        skip: 0,
        take: 25,
        searchTerm: "",
        sortField: "invoiceDate",
        sortOrder: "desc",
        startDate: formatDateInputValue(octStartDate),
        endDate: formatDateInputValue(endDate),
      });

      if (tpResponse.status && tpResponse.data?.result) {
        setTransportPermitData(tpResponse.data.result);
        setPagination({
          skip: tpResponse.data.skip,
          take: tpResponse.data.take,
          total: tpResponse.data.total,
        });
        const summaryData = tpResponse.data.summary as any;
        setSummary(summaryData?.filteredSummary ?? DEFAULT_SUMMARY);
      } else {
        toast.error("No transport permit data found");
      }
    } catch (error) {
      toast.error("Failed to initialize");
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    pagination.take,
    searchTerm,
    sortField,
    sortOrder,
    dateFilter.startDate,
    dateFilter.endDate,
  ]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const skip = pagesize * (page - 1);
    const response = await GetTransportPermitFiltered({
      take: pagesize,
      skip,
      searchTerm,
      sortField: sortField as TransportPermitSortField,
      sortOrder,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
    });
    if (response.status && response.data?.result) {
      setTransportPermitData(response.data.result);
      setPagination({
        skip: response.data.skip,
        take: response.data.take,
        total: response.data.total,
      });
      const summaryData = response.data.summary as any;
      setSummary(summaryData?.filteredSummary ?? DEFAULT_SUMMARY);
    }
  };

  const loadPermitDetails = async (permit: TransportPermitRecord) => {
    try {
      const response = await GetTransportPermitDetails({
        invoiceNumber: permit.invoiceNumber,
        invoiceDate: formatDateInputValue(new Date(permit.invoiceDate)),
        sellerTinNumber: permit.sellerDvatTinNumber,
      });
      if (response.status && response.data?.result) {
        setSelectedDetails(response.data.result);
        setSelectedPermit(permit);
        setIsDetailsModalOpen(true);
      } else {
        toast.error(response.message || "Failed to load details");
      }
    } catch (error) {
      toast.error("Failed to load permit details");
    }
  };

  const handleReleaseTp = async () => {
    if (!selectedReleasePermit) return;
    setIsReleasingTp(true);
    try {
      const response = await UpdateTpReleased({
        transportPermitId: selectedReleasePermit.id,
      });
      if (response.status) {
        toast.success("Transport Permit released successfully!");
        setIsReleaseModalOpen(false);
        setSelectedReleasePermit(null);
        // Refresh the data
        loadData();
      } else {
        toast.error(response.message || "Failed to release TP");
      }
    } catch (error) {
      toast.error("Error releasing TP");
    } finally {
      setIsReleasingTp(false);
    }
  };

  const downloadReport = async () => {
    setIsDownloadingReport(true);
    try {
      const BATCH_SIZE = 1000;
      let skip = 0;
      let total = Number.POSITIVE_INFINITY;
      const reportData: TransportPermitRecord[] = [];
      let reportStartDate = "";
      let reportEndDate = "";
      if (dateFilter.startDate && dateFilter.endDate) {
        reportStartDate = dateFilter.startDate;
        reportEndDate = dateFilter.endDate;
      } else if (selectedPeriod) {
        const [year, month] = selectedPeriod.split("-");
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0);
        reportStartDate = formatDateInputValue(monthStart);
        reportEndDate = formatDateInputValue(monthEnd);
      }
      while (skip < total) {
        const reportResponse = await GetTransportPermitFiltered({
          skip,
          take: BATCH_SIZE,
          searchTerm: "",
          sortField: "invoiceDate",
          sortOrder: "desc",
          startDate: reportStartDate,
          endDate: reportEndDate,
        });
        if (!reportResponse.status || !reportResponse.data?.result) {
          toast.error(reportResponse.message || "Unable to load report data.");
          return;
        }
        const batch = reportResponse.data.result;
        reportData.push(...batch);
        total = reportResponse.data.total;
        skip += BATCH_SIZE;
        if (batch.length === 0) break;
      }
      if (reportData.length === 0) {
        toast.info("No transport permit records found to export.");
        return;
      }
      const detailRows = reportData.map((record) => ({
        "Invoice No.": record.invoiceNumber,
        "Invoice Date": formateDate(record.invoiceDate),
        "Seller Name": record.sellerDvatTradeName,
        "Seller TIN": record.sellerDvatTinNumber,
        "Purchaser Name": record.purchaserDvatTradeName,
        "Purchaser TIN": record.purchaserDvatTinNumber,
        "Items": record.items,
        "Status": record.status,
        "TP Released": record.tp_released ? "Yes" : "No",
        "Is Paid": record.is_paid ? "Yes" : "No",
      }));
      if (detailRows.length === 0) {
        toast.info("No transport permit records found to export.");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(detailRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transport Permit");
      const fileDate = (ServerTime().data as Date).toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `transport_permit_${fileDate}.xlsx`);
      toast.success(
        `Excel file downloaded successfully! (${detailRows.length} records)`,
      );
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download Excel file.");
    } finally {
      setIsDownloadingReport(false);
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
        title="Transport Permit Details"
        open={isDetailsModalOpen}
        onCancel={() => {
          setIsDetailsModalOpen(false);
          setSelectedDetails(null);
          setSelectedPermit(null);
        }}
        footer={null}
        width={1200}
      >
        {selectedDetails && selectedPermit && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold">
                    {selectedPermit.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold">
                    {formateDate(selectedPermit.invoiceDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Purchaser Name</p>
                  <p className="font-semibold">
                    {selectedPermit.purchaserDvatTradeName}
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Seller Name</p>
                  <p className="font-semibold">
                    {selectedPermit.sellerDvatTradeName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Items</p>
                  <p className="font-semibold">
                    {selectedDetails.count}
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
                      Qty
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
                  {selectedDetails.records.map((record, idx) => (
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
                        {record.quantity}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatIndianNumber(parseFloat(record.amount))}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatIndianNumber(parseFloat(record.vatamount))}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {formatIndianNumber(
                          parseFloat(record.amount) +
                            parseFloat(record.vatamount),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Total Items</p>
                  <p className="font-semibold">
                    {selectedDetails.count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="font-semibold">
                    {formatIndianNumber(selectedDetails.totalTaxableValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    {formatIndianNumber(
                      selectedDetails.totalTaxableValue +
                        selectedDetails.totalVatAmount,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Release Transport Permit"
        open={isReleaseModalOpen}
        onCancel={() => {
          setIsReleaseModalOpen(false);
          setSelectedReleasePermit(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsReleaseModalOpen(false);
              setSelectedReleasePermit(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isReleasingTp}
            onClick={handleReleaseTp}
          >
            Accept
          </Button>,
        ]}
        width={600}
      >
        {selectedReleasePermit && (
          <div>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> You are about to release this Transport
                Permit. This action cannot be undone.
              </p>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold text-sm">
                    {selectedReleasePermit.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold text-sm">
                    {formateDate(selectedReleasePermit.invoiceDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Seller Name</p>
                  <p className="font-semibold text-sm">
                    {selectedReleasePermit.sellerDvatTradeName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Purchaser Name</p>
                  <p className="font-semibold text-sm">
                    {selectedReleasePermit.purchaserDvatTradeName}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Status:</strong> This Transport Permit will be marked as
                released and payment is confirmed as paid.
              </p>
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
                  Transport Permit
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Permits</p>
              <p className="text-lg font-medium text-gray-900">
                {summary.totalRecords}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Items</p>
              <p className="text-lg font-medium text-gray-900">
                {summary.totalItems}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Page Records</p>
              <p className="text-lg font-medium text-gray-900">
                {transportPermitData.length}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Pages</p>
              <p className="text-lg font-medium text-gray-900">
                {Math.ceil(pagination.total / pagination.take)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border p-3">
            <div className="mb-4 space-y-3">
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-64">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Search
                  </label>
                  <Input
                    size="small"
                    placeholder="Invoice, Seller, Purchaser, TIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Sort By
                  </label>
                  <Select
                    size="small"
                    value={sortField}
                    onChange={(value) => setSortField(value as any)}
                    options={[
                      { label: "Invoice Date", value: "invoice_date" },
                      { label: "Invoice Number", value: "invoice_number" },
                      { label: "Trade Name", value: "trade_name" },
                      { label: "TIN Number", value: "tin_number" },
                      { label: "Invoice Value", value: "invoice_value" },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Order
                  </label>
                  <Select
                    size="small"
                    value={sortOrder}
                    onChange={(value) => setSortOrder(value as "asc" | "desc")}
                    options={[
                      { label: "Ascending", value: "asc" },
                      { label: "Descending", value: "desc" },
                    ]}
                  />
                </div>

                <div className="w-48">
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
                      const startDate = new Date(2026, 9, 1); // October 2026
                      const date = new Date(startDate);
                      date.setMonth(startDate.getMonth() + i);
                      const today = ServerTime().data as Date;
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

                <div className="grow"></div>

                <div className="flex gap-2">
                  {(searchTerm || selectedPeriod) && (
                    <Button
                      size="small"
                      type="default"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedPeriod("");
                        setDateFilter({ startDate: "", endDate: "" });
                        setSortField("invoiceDate");
                        setSortOrder("desc");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => downloadReport()}
                    loading={isDownloadingReport}
                    disabled={transportPermitData.length === 0 || isDownloadingReport}
                  >
                    📥 Download Excel
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Items
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice No.
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice Date
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Seller Name
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Purchaser Name
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Payment Status
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportPermitData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-gray-500 text-sm">
                          No transport permit records match your filters.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transportPermitData.map((permit, index) => (
                      <TableRow
                        key={index}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="p-2 text-center text-xs">
                          <button
                            onClick={async () => {
                              await loadPermitDetails(permit);
                            }}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {permit.items} items
                          </button>
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {permit.invoiceNumber}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formateDate(permit.invoiceDate)}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {permit.sellerDvatTradeName || "-"}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {permit.purchaserDvatTradeName}
                        </TableCell>

                        <TableCell className="p-2 text-center text-xs">
                          <div className="flex items-center justify-center gap-2">
                            {permit.is_paid ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Unpaid
                              </span>
                            )}
                            {permit.is_paid && !permit.tp_released && (
                              <Button
                                size="small"
                                type="primary"
                                danger={false}
                                onClick={() => {
                                  setSelectedReleasePermit(permit);
                                  setIsReleaseModalOpen(true);
                                }}
                              >
                                TP Release
                              </Button>
                            )}
                            {permit.tp_released && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                Released
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          <button
                            onClick={async () => {
                              await loadPermitDetails(permit);
                            }}
                            className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-4 rounded"
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

            <div className="px-3 py-2 border-t bg-gray-50">
              <div className="lg:hidden">
                <Pagination
                  align="center"
                  current={Math.floor(pagination.skip / pagination.take) + 1}
                  pageSize={pagination.take}
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
                  current={Math.floor(pagination.skip / pagination.take) + 1}
                  pageSize={pagination.take}
                  onChange={onChangePageCount}
                  showSizeChanger
                  pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
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
      </main>
    </>
  );
};

export default TransportPermit;
