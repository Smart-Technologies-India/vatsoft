"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AcceptSale from "@/action/stock/acceptsell";
import GroupAcceptSale from "@/action/stock/groupacceptsale";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import GetDvat30AProgress from "@/action/stock/getdvat30aprogress";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetPurchaseDeleteImpact from "@/action/stock/getpurchasedeleteimpact";
import RejectAllPendingPurchase from "@/action/stock/rejectallpendingpurchase";
import RejectPurchase from "@/action/stock/rejectpurchase";
import CheckStockUpdateSnapshot from "@/action/stock/checkstockupdatesnapshot";
import GetUserDailyPurchase, {
  DailyPurchaseSummary,
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";
import GetUserDailyPurchaseFiltered from "@/action/stock/getuserdailypurchasefiltered";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import { AntDesignMenuOutlined } from "@/components/icons";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useMemo } from "react";
import { encryptURLData, formateDate } from "@/utils/methods";
import { dvat04 } from "@prisma/client";
import {
  Alert,
  Button,
  Drawer,
  Input,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
  Select,
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import PurchaseBulk from "./purchasebulk";
import DownloadPurchaseSample from "./downloadpurchasesample";
import { PurchaseBulkDelete } from "./purchasebulkdelete";
import ServerTime from "@/action/servertime";

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

const isTinAcceptable = (tinNumber: string): boolean =>
  tinNumber.startsWith("25") || tinNumber.startsWith("26");

const isAprilOrMay2026 = (inputDate: Date | string): boolean => {
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  const month = date.getMonth();
  return year === 2026 && (month === 3 || month === 4);
};

// Indian number formatting function (e.g., 344234 -> 3,44,234)
const formatIndianNumber = (num: number): string => {
  if (!Number.isFinite(num)) return "0";
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;

  const lastThree = numStr.slice(-3);
  const remaining = numStr.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${withCommas},${lastThree}`;
};

type SortField =
  | "invoice_number"
  | "invoice_date"
  | "trade_name"
  | "tin_number"
  | "invoice_value";
type SortOrder = "asc" | "desc" | null;

const SortIcon = ({
  sortField: currentSortField,
  field,
  sortOrder,
}: {
  sortField: SortField;
  field: SortField;
  sortOrder: SortOrder;
}) => {
  if (currentSortField !== field) {
    return <span className="text-gray-300 text-xs">↕</span>;
  }
  return sortOrder === "asc" ? (
    <span className="text-xs">▲</span>
  ) : sortOrder === "desc" ? (
    <span className="text-xs">▼</span>
  ) : null;
};

const DocumentWiseDetails = () => {
  const router = useRouter();

  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [toolbarActionsOpen, setToolbarActionsOpen] = useState(false);
  const handleOpenChange = (newOpen: boolean, index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: newOpen,
    }));
  };

  const handelClose = (index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const [isLoading, setLoading] = useState<boolean>(true);

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

  const [dailyPurchase, setDailyPurchase] = useState<
    Array<GroupedDailyPurchase>
  >([]);
  const [overallPurchaseSummary, setOverallPurchaseSummary] =
    useState<DailyPurchaseSummary>(DEFAULT_PURCHASE_SUMMARY);
  const [filteredPurchaseSummary, setFilteredPurchaseSummary] =
    useState<DailyPurchaseSummary>(DEFAULT_PURCHASE_SUMMARY);

  const [selectedGroup, setSelectedGroup] =
    useState<GroupedDailyPurchase | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // const [userid, setUserid] = useState<number>(0);

  const [stockSnapshotExists, setStockSnapshotExists] =
    useState<boolean>(false);
  const [isStockSnapshotAcceptLoading, setIsStockSnapshotAcceptLoading] =
    useState<boolean>(false);

  const fetchPurchasePage = useCallback(
    async ({
      dvatid,
      skip,
      take,
      search,
      sortBy,
      order,
      startDate,
      endDate,
      acceptFilter,
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
      acceptFilter: "all" | "pending" | "accepted";
    }) => {
      const response = await GetUserDailyPurchaseFiltered({
        dvatid,
        skip,
        take,
        searchTerm: search,
        sortField: sortBy,
        sortOrder: order,
        startDate,
        endDate,
        acceptStatusFilter: acceptFilter,
      });

      if (response.status && response.data.result) {
        setDailyPurchase(response.data.result);
        setPaginatin({
          skip: response.data.skip,
          take: response.data.take,
          total: response.data.total,
        });

        const summary = response.data.summary as
          | DailyPurchaseFilteredSummary
          | undefined;
        setOverallPurchaseSummary(
          summary?.overallSummary ?? DEFAULT_PURCHASE_SUMMARY,
        );
        setFilteredPurchaseSummary(
          summary?.filteredSummary ?? DEFAULT_PURCHASE_SUMMARY,
        );
      }

      return response;
    },
    [],
  );

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04();

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      await fetchPurchasePage({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 25,
        search: "",
        sortBy: "invoice_date",
        order: "desc",
        startDate: "",
        endDate: "",
        acceptFilter: "all",
      });
    }

    setLoading(false);
  };

  // Phase 1: Load essential data (auth, DVAT, current month purchases)
  useEffect(() => {
    const initEssentialData = async () => {
      setLoading(true);
      try {
        const dvat_response = await GetUserDvat04();

        if (dvat_response.status && dvat_response.data) {
          setDvatData(dvat_response.data);

          // Check if stock_update_snapshot exists for this DVAT
          if (dvat_response.data.commodity === "RESTAURANT") {
            const snapshotResponse = await CheckStockUpdateSnapshot({
              dvatid: dvat_response.data.id,
            });
            setStockSnapshotExists(
              snapshotResponse.exists && snapshotResponse.count > 0,
            );
          }

          // Calculate current month's start and end dates
          const today = ServerTime().data as Date;
          const year = today.getFullYear();
          const monthIndex = today.getMonth();
          const currentMonthStart = new Date(year, monthIndex, 1);
          const currentMonthEnd = today;

          await fetchPurchasePage({
            dvatid: dvat_response.data.id,
            skip: 0,
            take: 25,
            search: "",
            sortBy: "invoice_date",
            order: "desc",
            startDate: formatDateInputValue(currentMonthStart),
            endDate: formatDateInputValue(currentMonthEnd),
            acceptFilter: "all",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    initEssentialData();
  }, [router, fetchPurchasePage]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata?.id) return;

    await fetchPurchasePage({
      dvatid: dvatdata.id,
      take: pagesize,
      skip: pagesize * (page - 1),
      search: searchTerm,
      sortBy: sortField,
      order: sortOrder || "desc",
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptFilter: acceptStatusFilter,
    });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] = useState(false);
  const [isFinalizingPurchase, setIsFinalizingPurchase] =
    useState<boolean>(false);
  const [finalizeProgress, setFinalizeProgress] = useState<{
    total: number;
    processed: number;
    percent: number;
    statusText: string;
  }>({
    total: 0,
    processed: 0,
    percent: 0,
    statusText: "Waiting...",
  });
  const finalizePollingRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const formatEligibilityDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toDateOnly = (date: Date): Date =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const getApplicablePeriodDate = (): Date => {
    const validDates = dailyPurchase
      .map((group) => toDateOnly(new Date(group.invoice_date)))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return validDates[0] ?? toDateOnly(ServerTime().data as Date);
  };

  const getMonthlyDueDate = (periodDate: Date): Date =>
    new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 10);

  const getQuarterlyDueDate = (periodDate: Date): Date => {
    const month = periodDate.getMonth();
    const year = periodDate.getFullYear();

    if (month <= 2) {
      return new Date(year, 3, 10); // Jan-Mar -> 10 Apr
    }
    if (month <= 5) {
      return new Date(year, 6, 10); // Apr-Jun -> 10 Jul
    }
    if (month <= 8) {
      return new Date(year, 9, 10); // Jul-Sep -> 10 Oct
    }

    return new Date(year + 1, 0, 10); // Oct-Dec -> 10 Jan next year
  };

  const canGenerateDvat30A = (): { allowed: boolean; message?: string } => {
    const today = toDateOnly(ServerTime().data as Date);
    const periodDate = getApplicablePeriodDate();
    const filingFrequency = dvatdata?.frequencyFilings?.toUpperCase();
    const dueDate =
      filingFrequency === "QUARTERLY"
        ? getQuarterlyDueDate(periodDate)
        : getMonthlyDueDate(periodDate);

    if (today >= dueDate) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: `Returns for a tax period shall be available for generation only on or after the 10th day of the month succeeding the applicable tax period. Next allowed date is ${formatEligibilityDate(dueDate)}.`,
    };
  };

  const getSelectedPeriodGroupsAcrossAll = async (): Promise<
    GroupedDailyPurchase[]
  > => {
    if (!dvatdata) return [];

    const response = await GetUserDailyPurchaseFiltered({
      dvatid: dvatdata.id,
      skip: 0,
      take: Math.max(pagination.total, 10000),
      searchTerm: "",
      sortField: "invoice_date",
      sortOrder: "desc",
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptStatusFilter: "all",
    });

    if (!response.status || !response.data?.result) {
      toast.error("Unable to load selected period purchase invoices.");
      return [];
    }

    return response.data.result;
  };

  const hasPendingAcceptableForSelectedPeriodAcrossAll =
    async (): Promise<boolean> => {
      const groups = await getSelectedPeriodGroupsAcrossAll();

      return groups.some((group) =>
        group.records.some((record) => canAcceptRecord(record)),
      );
    };

  const Convertto30a = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    if (
      hasPendingAcceptable ||
      (await hasPendingAcceptableForSelectedPeriodAcrossAll())
    ) {
      return toast.error(
        "Please accept all pending purchase invoices before generating DVAT 30/30 A.",
      );
    }

    const eligibility = canGenerateDvat30A();
    if (!eligibility.allowed) {
      return toast.error(eligibility.message);
    }

    const baselineProgressResponse = await GetDvat30AProgress({
      dvatid: dvatdata.id,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
    });

    if (!baselineProgressResponse.status || !baselineProgressResponse.data) {
      return toast.error(
        baselineProgressResponse.message ||
          "Unable to start upload progress tracking.",
      );
    }

    const baselineConverted = baselineProgressResponse.data.convertedInRange;
    const pendingAtStart =
      baselineProgressResponse.data.totalInRange - baselineConverted;

    setFinalizeProgress({
      total: Math.max(0, pendingAtStart),
      processed: 0,
      percent: 0,
      statusText:
        pendingAtStart > 0
          ? "Starting batch upload..."
          : "No pending rows found for selected period.",
    });

    setIsFinalizingPurchase(true);

    try {
      if (pendingAtStart > 0) {
        finalizePollingRef.current = setInterval(async () => {
          const pollResponse = await GetDvat30AProgress({
            dvatid: dvatdata.id,
            startDate: dateFilter.startDate,
            endDate: dateFilter.endDate,
          });

          if (!pollResponse.status || !pollResponse.data) {
            return;
          }

          const processed = Math.max(
            0,
            pollResponse.data.convertedInRange - baselineConverted,
          );
          const boundedProcessed = Math.min(pendingAtStart, processed);
          const percent = Math.min(
            100,
            Math.floor((boundedProcessed / pendingAtStart) * 100),
          );

          setFinalizeProgress({
            total: pendingAtStart,
            processed: boundedProcessed,
            percent,
            statusText: `Processing ${boundedProcessed} of ${pendingAtStart} rows...`,
          });
        }, 1500);
      }

      const response = await ConvertDvat30A({
        dvatid: dvatdata.id,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      });

      if (response.status && response.data) {
        if (pendingAtStart > 0) {
          setFinalizeProgress({
            total: pendingAtStart,
            processed: pendingAtStart,
            percent: 100,
            statusText: "Upload completed successfully.",
          });
        }
        toast.success(response.message);
        setIsModalOpen(false);
        await init();
      } else {
        toast.error(response.message);
      }
    } finally {
      if (finalizePollingRef.current) {
        clearInterval(finalizePollingRef.current);
        finalizePollingRef.current = null;
      }
      setIsFinalizingPurchase(false);
    }
  };

  useEffect(() => {
    return () => {
      if (finalizePollingRef.current) {
        clearInterval(finalizePollingRef.current);
      }
    };
  }, []);

  const [deletebox, setDeleteBox] = useState<boolean>(false);
  const [deleteRecord, setDeleteRecord] = useState<number | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<{
    creditNoteCount: number;
    debitNoteCount: number;
    totalLinkedCount: number;
  }>({
    creditNoteCount: 0,
    debitNoteCount: 0,
    totalLinkedCount: 0,
  });
  const [isDeleteImpactLoading, setIsDeleteImpactLoading] =
    useState<boolean>(false);

  const loadDeleteImpact = async (purchaseId: number) => {
    setIsDeleteImpactLoading(true);
    const impactResponse = await GetPurchaseDeleteImpact({ id: purchaseId });

    if (impactResponse.status && impactResponse.data) {
      setDeleteImpact(impactResponse.data);
    } else {
      setDeleteImpact({
        creditNoteCount: 0,
        debitNoteCount: 0,
        totalLinkedCount: 0,
      });
    }

    setIsDeleteImpactLoading(false);
  };

  const delete_purchase_entry = async (id: number) => {
    const response = await DeletePurchase({
      id: id,
    });
    if (response.data && response.status) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }

    await init();
    setDeleteBox(false);
    setDeleteRecord(null);
    setDeleteImpact({
      creditNoteCount: 0,
      debitNoteCount: 0,
      totalLinkedCount: 0,
    });
  };

  const [quantityCount, setQuantityCount] = useState("pcs");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const [addBox, setAddBox] = useState<boolean>(false);
  const [isAcceptAllLoading, setIsAcceptAllLoading] = useState(false);
  const [isAcceptAllModalOpen, setIsAcceptAllModalOpen] = useState(false);
  const [acceptAllProgress, setAcceptAllProgress] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
    currentInvoice: string;
  }>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    currentInvoice: "",
  });
  const [isGroupAcceptLoading, setIsGroupAcceptLoading] = useState(false);
  // const [isSingleAcceptLoading, setIsSingleAcceptLoading] =
  //   useState<boolean>(false);
  const [isRejectAllLoading, setIsRejectAllLoading] = useState(false);
  const [isGroupRejectLoading, setIsGroupRejectLoading] = useState(false);
  // const [isSingleRejectLoading, setIsSingleRejectLoading] =
  //   useState<boolean>(false);
  // const [isPurchaseReportLoading, setIsPurchaseReportLoading] =
  //   useState<boolean>(false);
  const [isDownloadingDailyPurchase, setIsDownloadingDailyPurchase] =
    useState<boolean>(false);

  // Search, Sort, and Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<
    | "invoice_number"
    | "invoice_date"
    | "trade_name"
    | "tin_number"
    | "invoice_value"
  >("invoice_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    formatMonthInputValue(ServerTime().data as Date),
  );
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [acceptStatusFilter, setAcceptStatusFilter] = useState<
    "all" | "pending" | "accepted"
  >("all");

  const isRestaurantCommodity = useMemo(() => {
    return String(dvatdata?.commodity ?? "") === "RESTAURANT";
  }, [dvatdata?.commodity]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order
      const newOrder =
        sortOrder === "asc" ? "desc" : sortOrder === "desc" ? null : "asc";
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
  // const canAcceptRecord = (record: GroupedDailyPurchase["records"][number]) => {
  //   if (!isTinAcceptable(record.seller_tin_number.tin_number)) {
  //     return false;
  //   }

  //   if (record.is_accept) {
  //     return false;
  //   }

  //   if (!isRestaurantCommodity) {
  //     return true;
  //   }

  //   return isAprilOrMay2026(record.invoice_date);
  // };

  const canAcceptRecord = (record: GroupedDailyPurchase["records"][number]) => {
    if (!isTinAcceptable(record.seller_tin_number.tin_number)) {
      return false;
    }

    if (record.is_accept) {
      return false;
    }

    // if (!isRestaurantCommodity) {
    //   return true;
    // }

    return isAprilOrMay2026(record.invoice_date);
  };

  useEffect(() => {
    if (!dvatdata?.id) return;

    const hasIncompleteRange =
      (dateFilter.startDate && !dateFilter.endDate) ||
      (!dateFilter.startDate && dateFilter.endDate);

    if (hasIncompleteRange) {
      return;
    }

    const timer = setTimeout(() => {
      const loadFilteredPage = async () => {
        await fetchPurchasePage({
          dvatid: dvatdata.id,
          skip: 0,
          take: pagination.take,
          search: searchTerm,
          sortBy: sortField,
          order: sortOrder || "desc",
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          acceptFilter: acceptStatusFilter,
        });
      };

      loadFilteredPage();
    }, 600);

    return () => clearTimeout(timer);
  }, [
    dvatdata?.id,
    pagination.take,
    searchTerm,
    sortField,
    sortOrder,
    dateFilter.startDate,
    dateFilter.endDate,
    acceptStatusFilter,
    fetchPurchasePage,
  ]);

  useEffect(() => {
    if (!selectedPeriod) {
      setDateFilter({ startDate: "", endDate: "" });
      return;
    }

    const [yearString, monthString] = selectedPeriod.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const monthEndDate = new Date(year, monthIndex + 1, 0);
    const today = ServerTime().data as Date;

    // Determine the actual end date to use
    let endDate: Date;
    if (year === today.getFullYear() && monthIndex === today.getMonth()) {
      endDate = today;
    } else {
      endDate = monthEndDate;
    }

    // Format start date as is (beginning of month)
    const startDateStr = formatDateInputValue(startDate);

    // Format end date ensuring we capture the full day by adding 1 day and subtracting 1 second
    // This ensures the date range includes the entire last day of the month
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateStr = formatDateInputValue(nextDay);

    setDateFilter({
      startDate: startDateStr,
      endDate: endDateStr,
    });
  }, [selectedPeriod]);

  useEffect(() => {
    if (!dvatdata) return;

    fetchPurchasePage({
      dvatid: dvatdata.id,
      skip: 0,
      take: pagination.take,
      search: searchTerm,
      sortBy: sortField,
      order: sortOrder || "desc",
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptFilter: acceptStatusFilter,
    });
  }, [sortField, sortOrder]);

  const downloadDailyPurchaseReport = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsDownloadingDailyPurchase(true);
    try {
      const BATCH_SIZE = 1000;
      let skip = 0;
      let total = Number.POSITIVE_INFINITY;
      const reportData: GroupedDailyPurchase[] = [];

      while (skip < total) {
        // Use filtered API when a period is selected, otherwise use all data
        const reportResponse = selectedPeriod
          ? await GetUserDailyPurchaseFiltered({
              dvatid: dvatdata.id,
              skip,
              take: BATCH_SIZE,
              searchTerm: "",
              sortField: "invoice_date",
              sortOrder: "desc",
              startDate: dateFilter.startDate,
              endDate: dateFilter.endDate,
              acceptStatusFilter: "all",
            })
          : await GetUserDailyPurchase({
              dvatid: dvatdata.id,
              skip,
              take: BATCH_SIZE,
            });

        if (!reportResponse.status || !reportResponse.data?.result) {
          toast.error(reportResponse.message || "Unable to load report data.");
          return;
        }

        const batch = reportResponse.data.result;
        reportData.push(...batch);
        total = reportResponse.data.total;
        skip += BATCH_SIZE;

        if (batch.length === 0) {
          break;
        }
      }

      if (reportData.length === 0) {
        toast.info("No purchase records found to export.");
        return;
      }

      const detailRows = reportData.flatMap((group) =>
        group.records.map((record) => ({
          "Invoice No.": group.invoice_number,
          "Invoice Date": formateDate(group.invoice_date),
          "Trade Name": group.seller_tin_number.name_of_dealer,
          "TIN Number": group.seller_tin_number.tin_number,
          "Product Name": record.commodity_master.product_name,
          "Item Code": record.commodity_master.id,
          Quantity: record.quantity,
          "Invoice Value": Number(
            (parseFloat(record.vatamount) + parseFloat(record.amount)).toFixed(
              2,
            ),
          ),
          "Tax Rate": record.tax_percent,
          "VAT Amount": Number(parseFloat(record.vatamount).toFixed(2)),
          "Taxable Value": Number(parseFloat(record.amount).toFixed(2)),
          URN: record.urn_number ?? "",
          "Accept Status": record.is_accept ? "ACCEPTED" : "PENDING",
        })),
      );

      if (detailRows.length === 0) {
        toast.info("No invoice item records found to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(detailRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Details");

      const fileDate = (ServerTime().data as Date).toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `dailyPurchase_report_${fileDate}.xlsx`);
      toast.success(
        `Excel file downloaded successfully! (${detailRows.length} items)`,
      );
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download Excel file.");
    } finally {
      setIsDownloadingDailyPurchase(false);
    }
  };

  // 1 crate 2 pcs
  const showCrates = (quantity: number, crate_size: number): string => {
    // return "";

    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const markRecordAccepted = (purchaseId: number) => {
    const getPendingAcceptable = (
      records: GroupedDailyPurchase["records"],
    ): boolean => {
      return records.some((row) => canAcceptRecord(row));
    };

    setSelectedGroup((prev) => {
      if (!prev) return prev;
      const updatedRecords = prev.records.map((row) =>
        row.id === purchaseId ? { ...row, is_accept: true } : row,
      );
      return {
        ...prev,
        records: updatedRecords,
        hasPendingAcceptable: getPendingAcceptable(updatedRecords),
      };
    });

    setDailyPurchase((prev) =>
      prev.map((group) => {
        if (!group.records.some((row) => row.id === purchaseId)) return group;
        const updatedRecords = group.records.map((row) =>
          row.id === purchaseId ? { ...row, is_accept: true } : row,
        );
        return {
          ...group,
          records: updatedRecords,
          hasPendingAcceptable: getPendingAcceptable(updatedRecords),
        };
      }),
    );
  };

  const handleAcceptAllRecords = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsAcceptAllLoading(true);
    try {
      const groups = await getSelectedPeriodGroupsAcrossAll();

      const pendingRecords = groups
        .flatMap((group) => group.records)
        .filter((record) => canAcceptRecord(record));

      if (pendingRecords.length === 0) {
        setAcceptAllProgress({
          total: 0,
          processed: 0,
          success: 0,
          failed: 0,
          currentInvoice: "",
        });
        toast.info("No pending acceptable purchase records found.");
        return;
      }

      setAcceptAllProgress({
        total: pendingRecords.length,
        processed: 0,
        success: 0,
        failed: 0,
        currentInvoice: "",
      });

      setIsAcceptAllModalOpen(true);
    } finally {
      setIsAcceptAllLoading(false);
    }
  };

  const confirmAcceptAllRecords = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    const groups = await getSelectedPeriodGroupsAcrossAll();

    const pendingRecords = groups
      .flatMap((group) => group.records)
      .filter((record) => canAcceptRecord(record));

    if (pendingRecords.length === 0) {
      setIsAcceptAllModalOpen(false);
      setAcceptAllProgress({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        currentInvoice: "",
      });
      toast.info("No pending acceptable purchase records found.");
      return;
    }

    setIsAcceptAllLoading(true);
    setAcceptAllProgress({
      total: pendingRecords.length,
      processed: 0,
      success: 0,
      failed: 0,
      currentInvoice: "",
    });

    let successCount = 0;
    let failedCount = 0;

    for (const record of pendingRecords) {
      setAcceptAllProgress((prev) => ({
        ...prev,
        currentInvoice: record.invoice_number,
      }));

      // Convert quantity from pieces to ML for restaurant commodity (1 piece = pack_size ML)
      const quantityToUse = isRestaurantCommodity
        ? record.quantity *
          parseInt(record.commodity_master.pack_size ?? "0", 10)
        : record.quantity;

      const response = await AcceptSale({
        commodityid: record.commodity_master.id,
        dvatid: dvatdata.id,
        quantity: quantityToUse,
        puchaseid: record.id,
        urn: record.urn_number ?? "",
      });

      if (response.status && response.data) {
        successCount += 1;
        markRecordAccepted(record.id);
        setAcceptAllProgress((prev) => ({
          ...prev,
          processed: prev.processed + 1,
          success: prev.success + 1,
        }));
      } else {
        failedCount += 1;
        setAcceptAllProgress((prev) => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
        }));
      }
    }

    setIsAcceptAllLoading(false);
    setIsAcceptAllModalOpen(false);

    if (successCount > 0) {
      toast.success(`${successCount} purchase record(s) accepted.`);
      await init();
    }

    if (failedCount > 0) {
      toast.error(`${failedCount} record(s) could not be accepted.`);
    }
  };

  const handleAcceptGroupAll = async () => {
    if (!selectedGroup || !dvatdata) return;

    const pendingRecords = selectedGroup.records.filter((record) =>
      canAcceptRecord(record),
    );

    if (pendingRecords.length === 0) return;

    setIsGroupAcceptLoading(true);

    interface GroupedCommodity {
      commodityid: number;
      totalQuantity: number;
      purchaseIds: number[];
      urnNumbers: string[];
    }

    const groupcommodity = new Map<number, GroupedCommodity>();

    for (const record of pendingRecords) {
      const commodityid = record.commodity_master.id;
      const existingGroup = groupcommodity.get(commodityid);
      if (existingGroup) {
        existingGroup.totalQuantity += record.quantity;
        existingGroup.purchaseIds.push(record.id);
        existingGroup.urnNumbers.push(record.urn_number ?? "");
      } else {
        groupcommodity.set(commodityid, {
          commodityid,
          totalQuantity: record.quantity,
          purchaseIds: [record.id],
          urnNumbers: [record.urn_number ?? ""],
        });
      }
    }

    // Call the GroupAcceptSale action with grouped commodities
    const response = await GroupAcceptSale(
      dvatdata.id,
      Array.from(groupcommodity.values()),
    );

    setIsGroupAcceptLoading(false);

    if (response.status && response.data) {
      const { successCount, failedCount, failedCommodities } = response.data;

      if (successCount > 0) {
        // Mark all accepted records as accepted in UI
        for (const purchaseId of pendingRecords.map((r) => r.id)) {
          markRecordAccepted(purchaseId);
        }
        toast.success(`${successCount} record(s) accepted.`);
        await init();
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} record(s) could not be accepted.\n${failedCommodities.join(
            "\n",
          )}`,
        );
      }
    } else {
      toast.error(response.message || "Failed to accept records.");
    }
  };

  // const handleAcceptSingleRecord = async (
  //   record: GroupedDailyPurchase["records"][number],
  // ) => {
  //   if (!dvatdata) {
  //     toast.error("DVAT not found.");
  //     return;
  //   }

  //   setIsSingleAcceptLoading(true);

  //   const response = await AcceptSale({
  //     commodityid: record.commodity_master.id,
  //     dvatid: dvatdata.id,
  //     quantity: record.quantity,
  //     puchaseid: record.id,
  //     urn: record.urn_number ?? "",
  //   });

  //   setIsSingleAcceptLoading(false);

  //   if (response.status && response.data) {
  //     markRecordAccepted(record.id);
  //     toast.success("Purchase record accepted.");
  //     await init();
  //   } else {
  //     toast.error(response.message);
  //   }
  // };

  // const handleRejectSingleRecord = async (
  //   record: GroupedDailyPurchase["records"][number],
  // ) => {
  //   setIsSingleRejectLoading(true);

  //   const response = await RejectPurchase({ id: record.id });

  //   setIsSingleRejectLoading(false);

  //   if (response.status && response.data) {
  //     toast.success("Purchase record rejected.");
  //     await init();
  //   } else {
  //     toast.error(response.message);
  //   }
  // };

  const handleRejectGroupAll = async () => {
    if (!selectedGroup || !dvatdata) return;

    const pendingRecords = selectedGroup.records.filter(
      (record) =>
        (record.seller_tin_number.tin_number.startsWith("25") ||
          record.seller_tin_number.tin_number.startsWith("26")) &&
        !record.is_accept,
    );

    if (pendingRecords.length === 0) return;

    setIsGroupRejectLoading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const record of pendingRecords) {
      const response = await RejectPurchase({ id: record.id });
      if (response.status && response.data) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    setIsGroupRejectLoading(false);

    if (successCount > 0) {
      toast.success(`${successCount} record(s) rejected.`);
      await init();
      setIsGroupModalOpen(false);
      setSelectedGroup(null);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} record(s) could not be rejected.`);
    }
  };

  const handleRejectAllRecords = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsRejectAllLoading(true);
    const response = await RejectAllPendingPurchase({
      dvatid: dvatdata.id,
    });
    setIsRejectAllLoading(false);

    if (!response.status || !response.data) {
      toast.error(response.message);
      return;
    }

    if (response.data.total === 0) {
      toast.info("No pending acceptable purchase records found.");
      return;
    }

    if (response.data.success > 0) {
      toast.success(`${response.data.success} record(s) rejected.`);
    }
    if (response.data.failed > 0) {
      toast.error(`${response.data.failed} record(s) could not be rejected.`);
    }

    await init();

    if (response.data.success > 0) {
      setIsGroupModalOpen(false);
      setSelectedGroup(null);
    }
  };

  // const handleAcceptSnapshotSingle = async (
  //   record: GroupedDailyPurchase["records"][number],
  // ) => {
  //   if (!dvatdata) {
  //     toast.error("DVAT not found.");
  //     return;
  //   }

  //   setIsSingleAcceptLoading(true);

  //   // Convert quantity from pieces to ML (1 piece = pack_size ML)
  //   const quantityInML =
  //     record.quantity * parseInt(record.commodity_master.pack_size ?? "0", 10);

  //   const response = await AcceptSale({
  //     commodityid: record.commodity_master.id,
  //     dvatid: dvatdata.id,
  //     quantity: quantityInML, // ML quantity
  //     puchaseid: record.id,
  //     urn: record.urn_number ?? "",
  //   });

  //   setIsSingleAcceptLoading(false);

  //   if (response.status && response.data) {
  //     markRecordAccepted(record.id);
  //     toast.success(
  //       `Purchase record accepted. Quantity converted: ${record.quantity} pcs → ${quantityInML} ML`,
  //     );
  //     await init();
  //   } else {
  //     toast.error(response.message);
  //   }
  // };

  const handleAcceptSnapshotAll = async () => {
    if (!dvatdata || !selectedGroup) {
      toast.error("DVAT or group not found.");
      return;
    }

    setIsStockSnapshotAcceptLoading(true);
    let successCount = 0;
    let failedCount = 0;
    let totalMLConverted = 0;

    const acceptableRecords = selectedGroup.records.filter((record) =>
      canAcceptRecord(record),
    );

    for (const record of acceptableRecords) {
      // Convert quantity from pieces to ML (1 piece = pack_size ML)
      const quantityInML =
        record.quantity *
        parseInt(record.commodity_master.pack_size ?? "0", 10);
      totalMLConverted += quantityInML;

      const response = await AcceptSale({
        commodityid: record.commodity_master.id,
        dvatid: dvatdata.id,
        quantity: quantityInML, // ML quantity
        puchaseid: record.id,
        urn: record.urn_number ?? "",
      });

      if (response.status && response.data) {
        successCount += 1;
        markRecordAccepted(record.id);
      } else {
        failedCount += 1;
      }
    }

    setIsStockSnapshotAcceptLoading(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} record(s) accepted. Total converted: ${totalMLConverted} ML`,
      );
      await init();
      setIsGroupModalOpen(false);
      setSelectedGroup(null);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} record(s) could not be accepted.`);
    }
  };

  const hasPendingAcceptable = dailyPurchase.some((group) =>
    group.records.some((record) => canAcceptRecord(record)),
  );

  const isFilterApplied = useMemo(
    () =>
      searchTerm.trim() !== "" ||
      dateFilter.startDate !== "" ||
      dateFilter.endDate !== "" ||
      acceptStatusFilter !== "all",
    [searchTerm, dateFilter.startDate, dateFilter.endDate, acceptStatusFilter],
  );

  const cardSummary = isFilterApplied
    ? filteredPurchaseSummary
    : overallPurchaseSummary;

  const hidePurchaseManagementActions = useMemo(() => {
    const commodity = String(dvatdata?.commodity ?? "");
    return commodity === "RESTAURANT" || commodity === "LIQUOR";
  }, [dvatdata?.commodity]);

  const maxSelectableMonth = useMemo(
    () => formatMonthInputValue(ServerTime().data as Date),
    [],
  );

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
                          : "Quantity"
                        : "Crate"}
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
                    <TableHead className="border text-center text-xs">
                      Actions
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
                        {quantityCount == "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹
                        {formatIndianNumber(
                          parseFloat(record.vatamount) +
                            parseFloat(record.amount),
                        )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{formatIndianNumber(parseFloat(record.vatamount))}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{formatIndianNumber(parseFloat(record.amount))}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.seller_tin_number.tin_number.startsWith("25") ||
                        record.seller_tin_number.tin_number.startsWith("26") ? (
                          record.is_accept ? (
                            <span className="text-xs text-gray-400">
                              Accepted
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500">
                              Pending
                            </span>
                          )
                        ) : record.is_accept ? (
                          <span className="text-xs text-gray-400">
                            Accepted
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              router.push(
                                `/dashboard/stock/edit_purchase/${encryptURLData(
                                  record.id.toString(),
                                )}`,
                              );
                            }}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                          >
                            Edit
                          </button>
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
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="font-semibold">
                    ₹{formatIndianNumber(selectedGroup.totalTaxableValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    ₹{formatIndianNumber(selectedGroup.totalVatAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    ₹{formatIndianNumber(selectedGroup.totalInvoiceValue)}
                  </p>
                </div>
              </div>
            </div>
            {selectedGroup.records.some((r) => canAcceptRecord(r)) && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  disabled={
                    isGroupAcceptLoading || isStockSnapshotAcceptLoading
                  }
                  onClick={
                    stockSnapshotExists && dvatdata?.commodity === "RESTAURANT"
                      ? handleAcceptSnapshotAll
                      : handleAcceptGroupAll
                  }
                  className="text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
                >
                  {isGroupAcceptLoading || isStockSnapshotAcceptLoading
                    ? "Accepting..."
                    : "Accept All"}
                </button>
                <button
                  disabled={isGroupRejectLoading}
                  onClick={() => {
                    Modal.confirm({
                      title: "Confirm Reject All",
                      content:
                        "This will reject all pending records in this invoice group and cannot be undone.",
                      okText: "Reject All",
                      cancelText: "Cancel",
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        await handleRejectGroupAll();
                      },
                    });
                  }}
                  className="text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
                >
                  {isGroupRejectLoading ? "Rejecting..." : "Reject All"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">Add Purchase</h2>
        </div>
        <DailyPurchaseMasterProvider setAddBox={setAddBox} init={init} />
      </Drawer>

      <Modal
        title={
          <div className="text-rose-600 font-semibold text-base">
            ⚠️ IMPORTANT NOTICE – PURCHASE DATA FINALIZATION
          </div>
        }
        open={isModalOpen}
        onOk={Convertto30a}
        onCancel={() => {
          if (isFinalizingPurchase) return;
          setIsModalOpen(false);
          setIsPurchaseConfirmed(false);
        }}
        okText="Finalize Purchase Data"
        cancelText="Cancel"
        okButtonProps={{
          disabled: !isPurchaseConfirmed || isFinalizingPurchase,
          danger: true,
          loading: isFinalizingPurchase,
        }}
        cancelButtonProps={{ disabled: isFinalizingPurchase }}
        maskClosable={!isFinalizingPurchase}
        closable={!isFinalizingPurchase}
        width={600}
      >
        <div className="py-3 space-y-4">
          <p className="text-sm text-gray-700">
            You are about to <strong>finalize all Purchase entries</strong> for
            the selected tax period.
          </p>

          <p className="text-sm text-gray-700">
            Please ensure that all Purchase invoices and transaction details
            have been entered correctly and verified carefully.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              After clicking &quot;Finalize Purchase Data&quot;:
            </p>
            <ul className="text-sm text-amber-900 space-y-1">
              <li>❌ No new Purchase entries can be added.</li>
              <li>❌ Existing Purchase entries cannot be edited.</li>
              <li>❌ Existing Purchase entries cannot be deleted.</li>
              <li>❌ This action cannot be reversed through the system.</li>
            </ul>
          </div>

          <p className="text-sm text-gray-700 font-medium">
            This action should be performed only after completing and verifying
            all Purchase transactions for the tax period.
          </p>

          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-900">
              Large uploads are processed in batches of 100 records to avoid
              timeout issues. For around 10,000 records, this may take
              approximately 2 to 4 minutes. Please wait until processing is
              complete.
            </p>
          </div>

          {isFinalizingPurchase && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-medium text-amber-800">
                Finalization in progress...
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Uploading and updating records in chunks. Do not close or
                refresh this page.
              </p>
              <div className="mt-3 rounded border border-amber-200 bg-white p-2.5 text-xs text-slate-700">
                <p>Status: {finalizeProgress.statusText}</p>
                <p>
                  Uploaded: {finalizeProgress.processed} /{" "}
                  {finalizeProgress.total}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${finalizeProgress.percent}%` }}
                  />
                </div>
                <p className="mt-1">Progress: {finalizeProgress.percent}%</p>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPurchaseConfirmed}
                onChange={(e) => setIsPurchaseConfirmed(e.target.checked)}
                disabled={isFinalizingPurchase}
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm text-gray-800">
                I confirm that all Purchase entries have been reviewed and
                verified. I understand that once finalized, no further
                additions, modifications, or deletions will be permitted.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        title="Accept all pending purchase invoices"
        open={isAcceptAllModalOpen}
        onOk={confirmAcceptAllRecords}
        onCancel={() => {
          if (isAcceptAllLoading) return;
          setIsAcceptAllModalOpen(false);
        }}
        confirmLoading={isAcceptAllLoading}
        okText="Yes, Accept All"
        cancelText="Cancel"
        maskClosable={!isAcceptAllLoading}
        keyboard={!isAcceptAllLoading}
        cancelButtonProps={{ disabled: isAcceptAllLoading }}
      >
        <p className="text-sm text-slate-600 py-2">
          This is an important step. Once accepted, these changes cannot be
          reversed.
        </p>
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p>Total pending: {acceptAllProgress.total}</p>
          <p>
            Processed: {acceptAllProgress.processed} / {acceptAllProgress.total}
          </p>
          <p>Accepted: {acceptAllProgress.success}</p>
          <p>Failed: {acceptAllProgress.failed}</p>
          <p>
            Current invoice: {acceptAllProgress.currentInvoice || "Waiting..."}
          </p>
          {acceptAllProgress.total > 0 && (
            <>
              <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.floor(
                        (acceptAllProgress.processed /
                          acceptAllProgress.total) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1">
                Progress:{" "}
                {Math.min(
                  100,
                  Math.floor(
                    (acceptAllProgress.processed / acceptAllProgress.total) *
                      100,
                  ),
                )}
                %
              </p>
            </>
          )}
        </div>
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className=" mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Title Section */}
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Daily Purchase Records
                </h1>
              </div>

              <div className="grow"></div>
              {(dvatdata?.commodity === "OIDC" ||
                [84, 542, 93].includes(dvatdata?.id ?? 0)) && (
                <Button
                  size="small"
                  // block
                  type="default"
                  onClick={() => {
                    setToolbarActionsOpen(false);
                    router.push("/dashboard/stock/tally_purchase");
                  }}
                >
                  Tally Purchase
                </Button>
              )}

              <Button
                size="small"
                // block
                type="default"
                onClick={() => {
                  setToolbarActionsOpen(false);
                  router.push("/dashboard/stock/view_converted_purchase");
                }}
              >
                View Generated Invoices
              </Button>

              {/* Controls Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {dvatdata!.commodity != "FUEL" && (
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

                <Popover
                  trigger={["hover", "click"]}
                  placement="bottomRight"
                  open={toolbarActionsOpen}
                  onOpenChange={setToolbarActionsOpen}
                  content={
                    <div className="w-48 space-y-3">
                      <div>
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Purchase Actions
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          {dailyPurchase.length > 0 && (
                            <Button
                              size="small"
                              block
                              type="default"
                              onClick={async () => {
                                setToolbarActionsOpen(false);
                                if (
                                  hasPendingAcceptable ||
                                  (await hasPendingAcceptableForSelectedPeriodAcrossAll())
                                ) {
                                  toast.error(
                                    "Please accept all pending purchase invoices before generating DVAT 30/30 A.",
                                  );
                                  return;
                                }
                                setIsModalOpen(true);
                              }}
                            >
                              Generate DVAT 30/30 A
                            </Button>
                          )}

                          {hasPendingAcceptable && (
                            <>
                              <Button
                                size="small"
                                block
                                type="default"
                                danger
                                loading={isAcceptAllLoading}
                                onClick={() => {
                                  setToolbarActionsOpen(false);
                                  handleAcceptAllRecords();
                                }}
                              >
                                Accept All
                              </Button>
                              <Button
                                size="small"
                                block
                                type="default"
                                loading={isRejectAllLoading}
                                onClick={() => {
                                  setToolbarActionsOpen(false);
                                  Modal.confirm({
                                    title: "Confirm Reject All",
                                    content:
                                      "This will reject all pending purchase records and cannot be undone.",
                                    okText: "Reject All",
                                    cancelText: "Cancel",
                                    okButtonProps: { danger: true },
                                    onOk: async () => {
                                      await handleRejectAllRecords();
                                    },
                                  });
                                }}
                              >
                                Reject All
                              </Button>
                            </>
                          )}

                          {/* {stockSnapshotExists &&
                            dvatdata?.commodity === "RESTAURANT" && (
                              <>
                                <div className="border-t pt-2 mt-2">
                                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    Stock Snapshot Actions
                                  </p>
                                </div>
                                <Button
                                  size="small"
                                  block
                                  type="primary"
                                  danger
                                  loading={isStockSnapshotAcceptLoading}
                                  onClick={() => {
                                    setToolbarActionsOpen(false);
                                    handleAcceptSnapshotAll();
                                  }}
                                >
                                  Accept All (ML Conversion)
                                </Button>
                              </>
                            )} */}

                          {!hidePurchaseManagementActions && (
                            <DownloadPurchaseSample
                              commodity={dvatdata?.commodity ?? "OTHER"}
                              setToolbarActionsOpen={setToolbarActionsOpen}
                            />
                          )}

                          {!hidePurchaseManagementActions && (
                            <PurchaseBulk
                              setToolbarActionsOpen={setToolbarActionsOpen}
                              onUploadComplete={init}
                            />
                          )}

                          {!hidePurchaseManagementActions && (
                            <PurchaseBulkDelete
                              dvatid={dvatdata?.id}
                              pagination={pagination}
                              onDeleteComplete={init}
                            />
                          )}

                          {!hidePurchaseManagementActions && (
                            <Button
                              size="small"
                              block
                              type="primary"
                              onClick={() => {
                                setToolbarActionsOpen(false);
                                setAddBox(true);
                              }}
                            >
                              Add Purchase
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <Button
                    size="small"
                    type="default"
                    icon={<AntDesignMenuOutlined />}
                    className="border-gray-300 text-[#172e57] hover:border-blue-500 hover:text-blue-600"
                  >
                    Actions
                  </Button>
                </Popover>
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
              <p className="text-xs text-gray-600 mb-1">Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianNumber(cardSummary.totalInvoiceValue)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianNumber(cardSummary.totalVatAmount)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{formatIndianNumber(cardSummary.totalTaxableValue)}
              </p>
            </div>
          </div>

          {hasPendingAcceptable && (
            <Alert
              title="Kindly accept pending purchase invoices."
              type="warning"
              className="mb-3"
              showIcon
            />
          )}

          <div className="bg-white rounded shadow-sm border p-3">
            {/* Search, Sort, and Filter Controls */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="xl:col-span-2">
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
                    value={sortOrder || "desc"}
                    onChange={(value) => setSortOrder(value as SortOrder)}
                    options={[
                      { label: "Ascending", value: "asc" },
                      { label: "Descending", value: "desc" },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block w-52">
                    Accept Status
                  </label>
                  <Select
                    size="small"
                    className="w-full"
                    value={acceptStatusFilter}
                    onChange={(value) => setAcceptStatusFilter(value as any)}
                    options={[
                      { label: "All", value: "all" },
                      { label: "Pending", value: "pending" },
                      { label: "Accepted", value: "accepted" },
                    ]}
                  />
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
                        setAcceptStatusFilter("all");
                        setSortField("invoice_date");
                        setSortOrder("desc");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  {!selectedPeriod ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => downloadDailyPurchaseReport()}
                      loading={isDownloadingDailyPurchase}
                      disabled={
                        dailyPurchase.length === 0 || isDownloadingDailyPurchase
                      }
                    >
                      📥 Download Excel (All Pages)
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="default"
                      onClick={() => downloadDailyPurchaseReport()}
                      loading={isDownloadingDailyPurchase}
                      disabled={
                        dailyPurchase.length === 0 || isDownloadingDailyPurchase
                      }
                    >
                      📥 Download Excel (Select Month)
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Count
                    </TableHead>
                    <TableHead
                      className="text-center p-2 font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("invoice_number")}
                    >
                      Invoice No.{" "}
                      <SortIcon
                        sortField={sortField}
                        field="invoice_number"
                        sortOrder={sortOrder}
                      />
                    </TableHead>
                    <TableHead
                      className="text-center p-2 font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("invoice_date")}
                    >
                      Invoice Date{" "}
                      <SortIcon
                        sortField={sortField}
                        field="invoice_date"
                        sortOrder={sortOrder}
                      />
                    </TableHead>
                    <TableHead
                      className="text-center p-2 font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("trade_name")}
                    >
                      Trade Name{" "}
                      <SortIcon
                        sortField={sortField}
                        field="trade_name"
                        sortOrder={sortOrder}
                      />
                    </TableHead>
                    <TableHead
                      className="text-center p-2 font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("tin_number")}
                    >
                      TIN Number{" "}
                      <SortIcon
                        sortField={sortField}
                        field="tin_number"
                        sortOrder={sortOrder}
                      />
                    </TableHead>
                    <TableHead
                      className="text-center p-2 font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("invoice_value")}
                    >
                      Invoice Value (₹){" "}
                      <SortIcon
                        sortField={sortField}
                        field="invoice_value"
                        sortOrder={sortOrder}
                      />
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Taxable Value (₹)
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyPurchase.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-gray-500 text-sm">
                          No purchase records match your filters.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyPurchase.map(
                      (group: GroupedDailyPurchase, index: number) => (
                        <TableRow
                          key={index}
                          className={
                            group.hasPendingAcceptable
                              ? "border-b bg-red-50 hover:bg-red-100"
                              : "border-b hover:bg-gray-50"
                          }
                        >
                          <TableCell className="p-2 text-center text-xs">
                            <button
                              onClick={() => {
                                setSelectedGroup(group);
                                setIsGroupModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {group.count} items
                            </button>
                            {/* {group.count > 1 ? () : (<span>{group.count}</span>)} */}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.invoice_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {formateDate(group.invoice_date)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.name_of_dealer}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.tin_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianNumber(group.totalInvoiceValue)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianNumber(group.totalVatAmount)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{formatIndianNumber(group.totalTaxableValue)}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Popover
                              content={
                                <div className="flex flex-col gap-2">
                                  {group.count > 1 && (
                                    <button
                                      onClick={() => {
                                        setSelectedGroup(group);
                                        setIsGroupModalOpen(true);
                                        handelClose(index);
                                      }}
                                      className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-3 rounded"
                                    >
                                      View
                                    </button>
                                  )}
                                  {group.count === 1 &&
                                    !(
                                      group.seller_tin_number.tin_number.startsWith(
                                        "25",
                                      ) ||
                                      group.seller_tin_number.tin_number.startsWith(
                                        "26",
                                      )
                                    ) && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setDeleteRecord(
                                              group.records[0].id,
                                            );
                                            setDeleteBox(true);
                                            loadDeleteImpact(
                                              group.records[0].id,
                                            );
                                            handelClose(index);
                                          }}
                                          className="text-sm bg-white border hover:border-rose-500 hover:text-rose-600 text-gray-700 py-1 px-3 rounded"
                                        >
                                          Delete
                                        </button>
                                        <button
                                          onClick={() => {
                                            router.push(
                                              `/dashboard/stock/edit_purchase/${encryptURLData(
                                                group.records[0].id.toString(),
                                              )}`,
                                            );
                                            handelClose(index);
                                          }}
                                          className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-3 rounded"
                                        >
                                          Update
                                        </button>
                                      </>
                                    )}
                                  {/* {group.count === 1 &&
                                    (group.seller_tin_number.tin_number.startsWith(
                                      "25",
                                    ) ||
                                      group.seller_tin_number.tin_number.startsWith(
                                        "26",
                                      )) &&
                                    canAcceptRecord(group.records[0]) && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            if (
                                              stockSnapshotExists &&
                                              dvatdata?.commodity ===
                                                "RESTAURANT"
                                            ) {
                                              await handleAcceptSnapshotSingle(
                                                group.records[0],
                                              );
                                            } else {
                                              await handleAcceptSingleRecord(
                                                group.records[0],
                                              );
                                            }
                                            handelClose(index);
                                          }}
                                          disabled={isSingleAcceptLoading}
                                          className="text-sm bg-white border hover:border-rose-500 hover:text-rose-600 text-gray-700 py-1 px-3 rounded disabled:opacity-60"
                                        >
                                          {isSingleAcceptLoading
                                            ? "Accepting..."
                                            : "Accept"}
                                        </button>
                                        <button
                                          onClick={async () => {
                                            Modal.confirm({
                                              title: "Confirm Reject",
                                              content:
                                                "This will reject this purchase record and cannot be undone.",
                                              okText: "Reject",
                                              cancelText: "Cancel",
                                              okButtonProps: {
                                                danger: true,
                                              },
                                              onOk: async () => {
                                                await handleRejectSingleRecord(
                                                  group.records[0],
                                                );
                                                handelClose(index);
                                              },
                                            });
                                          }}
                                          disabled={isSingleRejectLoading}
                                          className="text-sm bg-white border hover:border-red-500 hover:text-red-600 text-gray-700 py-1 px-3 rounded disabled:opacity-60"
                                        >
                                          {isSingleRejectLoading
                                            ? "Rejecting..."
                                            : "Reject"}
                                        </button>
                                      </>
                                    )} */}
                                </div>
                              }
                              title="Actions"
                              trigger="click"
                              open={!!openPopovers[index]}
                              onOpenChange={(newOpen) =>
                                handleOpenChange(newOpen, index)
                              }
                            >
                              <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-3 rounded">
                                Actions
                              </button>
                            </Popover>

                            <Modal
                              title="Confirm Deletion"
                              open={deletebox}
                              footer={null}
                            >
                              <p className="mb-4">
                                Are you sure you want to delete this purchase
                                entry?
                              </p>
                              <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                Warning: Linked credit/debit note entries in
                                return entry will also be deleted when
                                description of goods matches this purchase URN.
                                <br />
                                {isDeleteImpactLoading
                                  ? "Checking linked notes..."
                                  : `Credit Notes: ${deleteImpact.creditNoteCount}, Debit Notes: ${deleteImpact.debitNoteCount}, Total linked entries: ${deleteImpact.totalLinkedCount}`}
                              </p>
                              <div className="flex gap-2 justify-end">
                                <button
                                  className="py-1 px-4 border rounded text-sm"
                                  onClick={() => {
                                    setDeleteBox(false);
                                    setDeleteRecord(null);
                                    setDeleteImpact({
                                      creditNoteCount: 0,
                                      debitNoteCount: 0,
                                      totalLinkedCount: 0,
                                    });
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    if (deleteRecord != null) {
                                      delete_purchase_entry(deleteRecord);
                                    }
                                  }}
                                  className="py-1 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </Modal>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
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

export default DocumentWiseDetails;
