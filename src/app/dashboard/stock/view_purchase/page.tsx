"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AcceptSale from "@/action/stock/acceptsell";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetPurchaseDeleteImpact from "@/action/stock/getpurchasedeleteimpact";
import GetUserDailyPurchase, {
  DailyPurchaseSummary,
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";
import GetUserDailyPurchaseFiltered from "@/action/stock/getuserdailypurchasefiltered";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import { PurchaseCreditNoteDrawer } from "@/components/forms/purchasecreditnote/purchasecreditnotedrawer";
import { PurchaseDebitNoteDrawer } from "@/components/forms/purchasedebitnote/purchasedebitnotedrawer";
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
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import {
  Alert,
  Button,
  Drawer,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import PurchaseBulk from "./purchasebulk";
import DownloadPurchaseSample from "./downloadpurchasesample";

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

  //   const [name, setName] = useState<string>("");

  const [userid, setUserid] = useState<number>(0);
  const [chatAnimationData, setChatAnimationData] = useState<any>(null);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; role: "bot" | "user"; text: string }>
  >([
    {
      id: 1,
      role: "bot",
      text: "Welcome to Purchase Help. Ask questions about managing your purchase invoices.",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messageIdRef = useRef(1);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const purchaseChatOptions = [
    {
      question: "How do I add a purchase invoice?",
      answer:
        "Click the Add Purchase button. Enter seller TIN, invoice details, and commodity/quantity information. Save to add it to your purchase records.",
    },
    {
      question: "What does Generate DVAT 30 A do?",
      answer:
        "This converts your purchase data into DVAT 30 A return format, preparing it for filing with the department.",
    },
    {
      question: "How do I accept or mark purchase records?",
      answer:
        "If the seller TIN starts with 25 or 26, you'll see an Accept button. Click it to mark the record as accepted for processing.",
    },
    // {
    //   question: "How do I delete a purchase entry?",
    //   answer:
    //     "Click the Actions menu next to the purchase record. Select Delete and confirm. You can then re-add with corrected details.",
    // },
  ];

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
      sortBy: "invoice_number" | "invoice_date" | "trade_name" | "tin_number" | "invoice_value";
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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

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
    init();
  }, [userid, router, fetchPurchasePage]);

  useEffect(() => {
    let mounted = true;

    const loadChatAnimation = async () => {
      try {
        const response = await fetch("/cs.json");
        if (!response.ok) return;

        const data = await response.json();
        if (mounted) {
          setChatAnimationData(data);
        }
      } catch {
        // Keep fallback text if animation cannot be loaded.
      }
    };

    loadChatAnimation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatListRef.current) return;
    if (!shouldAutoScroll) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatMessages, isBotTyping, shouldAutoScroll]);

  useEffect(() => {
    setChatMessages([
      {
        id: 1,
        role: "bot",
        text: "Your registration is pending. Ask me about managing purchase records while awaiting approval.",
      },
    ]);
    messageIdRef.current = 1;
    setIsBotTyping(false);
    setShouldAutoScroll(true);
  }, []);

  const handleChatScroll = () => {
    if (!chatListRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 48;

    setShouldAutoScroll(isNearBottom);
  };

  const appendTypedBotMessage = (answer: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    setIsBotTyping(true);
    const botMessageId = messageIdRef.current + 1;
    messageIdRef.current = botMessageId;

    setChatMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: "bot",
        text: "",
      },
    ]);

    const thinkingDelay = 900 + Math.floor(Math.random() * 600);
    thinkingTimerRef.current = setTimeout(() => {
      let index = 0;
      typingTimerRef.current = setInterval(() => {
        index += 1;
        const nextText = answer.slice(0, index);

        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === botMessageId
              ? {
                  ...message,
                  text: nextText,
                }
              : message,
          ),
        );

        if (index >= answer.length) {
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          setIsBotTyping(false);
        }
      }, 16);
    }, thinkingDelay);
  };

  const onSelectChatOption = (question: string, answer: string) => {
    if (isBotTyping) return;

    const userMessageId = messageIdRef.current + 1;
    messageIdRef.current = userMessageId;

    setChatMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
    ]);

    setShouldAutoScroll(true);
    appendTypedBotMessage(answer);
  };

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata?.id) return;

    await fetchPurchasePage({
      dvatid: dvatdata.id,
      take: pagesize,
      skip: pagesize * (page - 1),
      search: searchTerm,
      sortBy: sortField,
      order: sortOrder,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptFilter: acceptStatusFilter,
    });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] = useState(false);
  const [creditNoteBox, setCreditNoteBox] = useState<boolean>(false);
  const [creditNoteGroup, setCreditNoteGroup] =
    useState<GroupedDailyPurchase | null>(null);
  const [debitNoteBox, setDebitNoteBox] = useState<boolean>(false);
  const [debitNoteGroup, setDebitNoteGroup] =
    useState<GroupedDailyPurchase | null>(null);

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

    return validDates[0] ?? toDateOnly(new Date());
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
    const today = toDateOnly(new Date());
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

  const hasPendingAcceptableForApplicablePeriodAcrossAll =
    async (): Promise<boolean> => {
    if (!dvatdata) return false;

    const allPurchaseResponse = await GetUserDailyPurchase({
      dvatid: dvatdata.id,
      skip: 0,
      take: pagination.total > 0 ? pagination.total : 10000,
    });

    if (!allPurchaseResponse.status || !allPurchaseResponse.data?.result) {
      toast.error(
        "Unable to validate pending purchase invoices. Please try again.",
      );
      return true;
    }

    const groups = allPurchaseResponse.data.result;
    if (groups.length === 0) {
      return false;
    }

    const april2026 = new Date(2026, 3, 1);
    const startOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), 1);
    const addMonths = (date: Date, months: number) =>
      new Date(date.getFullYear(), date.getMonth() + months, 1);

    const lowestInvoiceDate = groups.reduce(
      (minDate, group) => {
        const groupDate = new Date(group.invoice_date);
        return groupDate < minDate ? groupDate : minDate;
      },
      new Date(groups[0].invoice_date),
    );

    const targetStartDate =
      startOfMonth(lowestInvoiceDate).getTime() < april2026.getTime()
        ? april2026
        : startOfMonth(lowestInvoiceDate);
    const targetEndDate = addMonths(targetStartDate, 1);

    const isInTargetPeriod = (invoiceDate: Date): boolean => {
      if (targetStartDate.getTime() === april2026.getTime()) {
        return invoiceDate < targetEndDate;
      }

      return invoiceDate >= targetStartDate && invoiceDate < targetEndDate;
    };

    return groups
      .filter((group) => isInTargetPeriod(new Date(group.invoice_date)))
      .some((group) =>
        group.records.some(
          (record) =>
            (record.seller_tin_number.tin_number.startsWith("25") ||
              record.seller_tin_number.tin_number.startsWith("26")) &&
            !record.is_accept,
        ),
      );
  };

  const Convertto30a = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    if (
      hasPendingAcceptable ||
      (await hasPendingAcceptableForApplicablePeriodAcrossAll())
    ) {
      return toast.error(
        "Please accept all pending purchase invoices before generating DVAT 30/30 A.",
      );
    }

    const eligibility = canGenerateDvat30A();
    if (!eligibility.allowed) {
      return toast.error(eligibility.message);
    }

    const response = await ConvertDvat30A({
      dvatid: dvatdata.id,
    });

    if (response.status && response.data) {
      toast.success(response.message);
      setIsModalOpen(false);
      await init();
    } else {
      toast.error(response.message);
    }
  };

  const [deletebox, setDeleteBox] = useState<boolean>(false);
  const [deleteRecord, setDeleteRecord] = useState<number | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] =
    useState<boolean>(false);
  const [isBulkDeleteLoading, setIsBulkDeleteLoading] =
    useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [bulkDeleteRows, setBulkDeleteRows] = useState<
    Array<{
      id: number;
      invoice_number: string;
      invoice_date: Date;
      trade_name: string;
      tin_number: string;
      product_name: string;
      quantity: number;
      invoice_value: number;
    }>
  >([]);

  // Grouped data for TanStack Table
  const groupedBulkDeleteRows = useMemo(() => {
    // Group by tin_number, invoice_date, invoice_number
    const groups: Record<
      string,
      { groupKey: string; groupLabel: string; rows: typeof bulkDeleteRows }
    > = {};
    for (const row of bulkDeleteRows) {
      const groupKey = [
        row.tin_number,
        row.invoice_date.toString(),
        row.invoice_number,
      ].join("|");
      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          groupLabel: `TIN: ${row.tin_number} | Date: ${formateDate(row.invoice_date)} | Invoice: ${row.invoice_number}`,
          rows: [],
        };
      }
      groups[groupKey].rows.push(row);
    }
    return Object.values(groups);
  }, [bulkDeleteRows]);
  const [selectedBulkDeleteIds, setSelectedBulkDeleteIds] = useState<number[]>(
    [],
  );
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

  const delete_purchase_entries = async (ids: number[]) => {
    if (ids.length === 0) {
      toast.error("No purchase record selected to delete.");
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    let error = "";

    for (const id of ids) {
      const response = await DeletePurchase({
        id,
      });

      if (response.data && response.status) {
        successCount += 1;
      } else {
        failedCount += 1;
        error = response.message || "Unknown error";
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} purchase record(s) deleted successfully.`);
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} purchase record(s) could not be deleted. Error: ${error}`,
      );
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

  const openBulkDeleteModal = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsBulkDeleteLoading(true);
    setSelectedBulkDeleteIds([]);

    try {
      const purchaseResponse = await GetUserDailyPurchase({
        dvatid: dvatdata.id,
        skip: 0,
        take: Math.max(pagination.total, 10000),
      });

      if (!purchaseResponse.status || !purchaseResponse.data.result) {
        toast.error("Unable to load purchase entries for bulk delete.");
        return;
      }

      const rows = purchaseResponse.data.result.flatMap((group) =>
        group.records
          .filter((record) => !record.is_accept)
          .map((record) => ({
            id: record.id,
            invoice_number: group.invoice_number,
            invoice_date: group.invoice_date,
            trade_name: group.seller_tin_number.name_of_dealer,
            tin_number: group.seller_tin_number.tin_number,
            product_name: record.commodity_master.product_name,
            quantity: record.quantity,
            invoice_value:
              parseFloat(record.amount) + parseFloat(record.vatamount),
          })),
      );

      setBulkDeleteRows(rows);
      setIsBulkDeleteModalOpen(true);

      if (rows.length === 0) {
        toast.info("No non-accepted purchase items found.");
      }
    } catch {
      toast.error("Unable to load purchase entries for bulk delete.");
    } finally {
      setIsBulkDeleteLoading(false);
    }
  };

  const toggleBulkDeleteSelection = (id: number, checked: boolean) => {
    setSelectedBulkDeleteIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }

      return prev.filter((val) => val !== id);
    });
  };

  const toggleBulkDeleteSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBulkDeleteIds(bulkDeleteRows.map((row) => row.id));
      return;
    }

    setSelectedBulkDeleteIds([]);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedBulkDeleteIds.length === 0) {
      toast.error("Select at least one purchase item to delete.");
      return;
    }
    setIsBulkDeleting(true);
    await delete_purchase_entries(selectedBulkDeleteIds);
    setIsBulkDeleting(false);
    setIsBulkDeleteConfirmOpen(false);
    setIsBulkDeleteModalOpen(false);
    setSelectedBulkDeleteIds([]);
    setBulkDeleteRows([]);
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
  const [isSingleAcceptLoading, setIsSingleAcceptLoading] =
    useState<boolean>(false);
  const [isPurchaseReportLoading, setIsPurchaseReportLoading] =
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [acceptStatusFilter, setAcceptStatusFilter] = useState<
    "all" | "pending" | "accepted"
  >("all");

  useEffect(() => {
    const loadFilteredPage = async () => {
      if (!dvatdata?.id) return;

      await fetchPurchasePage({
        dvatid: dvatdata.id,
        skip: 0,
        take: pagination.take,
        search: searchTerm,
        sortBy: sortField,
        order: sortOrder,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        acceptFilter: acceptStatusFilter,
      });
    };

    loadFilteredPage();
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

  const downloadDailyPurchaseReport = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsPurchaseReportLoading(true);
    try {
      const reportResponse = await GetUserDailyPurchase({
        dvatid: dvatdata.id,
        skip: 0,
        take: pagination.total > 0 ? pagination.total : 10000,
      });

      const reportData = reportResponse.status
        ? (reportResponse.data.result ?? [])
        : [];

      if (reportData.length === 0) {
        toast.info("No purchase records found to export.");
        return;
      }

      const rows = reportData.map((group, index) => ({
        "S. No.": index + 1,
        Count: group.count,
        "Invoice No.": group.invoice_number,
        "Invoice Date": formateDate(group.invoice_date),
        "Trade Name": group.seller_tin_number.name_of_dealer,
        "TIN Number": group.seller_tin_number.tin_number,
        "Invoice Value": Number(group.totalInvoiceValue.toFixed(2)),
        "VAT Amount": Number(group.totalVatAmount.toFixed(2)),
        "Taxable Value": Number(group.totalTaxableValue.toFixed(2)),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Purchase");

      const fileDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `dailyPurchase_report_${fileDate}.xlsx`);
    } finally {
      setIsPurchaseReportLoading(false);
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
      return records.some(
        (row) =>
          (row.seller_tin_number.tin_number.startsWith("25") ||
            row.seller_tin_number.tin_number.startsWith("26")) &&
          !row.is_accept,
      );
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
      const allPurchaseResponse = await GetUserDailyPurchase({
        dvatid: dvatdata.id,
        skip: 0,
        take: pagination.total > 0 ? pagination.total : 10000,
      });

      if (!allPurchaseResponse.status) {
        toast.error(allPurchaseResponse.message);
        return;
      }

      const pendingRecords = (allPurchaseResponse.data?.result ?? [])
        .flatMap((group) => group.records)
        .filter(
          (record) =>
            (record.seller_tin_number.tin_number.startsWith("25") ||
              record.seller_tin_number.tin_number.startsWith("26")) &&
            !record.is_accept,
        );

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

    const allPurchaseResponse = await GetUserDailyPurchase({
      dvatid: dvatdata.id,
      skip: 0,
      take: pagination.total > 0 ? pagination.total : 10000,
    });

    if (!allPurchaseResponse.status) {
      setIsAcceptAllModalOpen(false);
      toast.error(allPurchaseResponse.message);
      return;
    }

    const pendingRecords = (allPurchaseResponse.data?.result ?? [])
      .flatMap((group) => group.records)
      .filter(
        (record) =>
          (record.seller_tin_number.tin_number.startsWith("25") ||
            record.seller_tin_number.tin_number.startsWith("26")) &&
          !record.is_accept,
      );

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

      const response = await AcceptSale({
        commodityid: record.commodity_master.id,
        createdById: userid,
        dvatid: dvatdata.id,
        quantity: record.quantity,
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

    const pendingRecords = selectedGroup.records.filter(
      (record) =>
        (record.seller_tin_number.tin_number.startsWith("25") ||
          record.seller_tin_number.tin_number.startsWith("26")) &&
        !record.is_accept,
    );

    if (pendingRecords.length === 0) return;

    setIsGroupAcceptLoading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const record of pendingRecords) {
      const response = await AcceptSale({
        commodityid: record.commodity_master.id,
        createdById: userid,
        dvatid: dvatdata.id,
        quantity: record.quantity,
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

    setIsGroupAcceptLoading(false);

    if (successCount > 0) {
      toast.success(`${successCount} record(s) accepted.`);
      await init();
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} record(s) could not be accepted.`);
    }
  };

  const handleAcceptSingleRecord = async (
    record: GroupedDailyPurchase["records"][number],
  ) => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsSingleAcceptLoading(true);

    const response = await AcceptSale({
      commodityid: record.commodity_master.id,
      createdById: userid,
      dvatid: dvatdata.id,
      quantity: record.quantity,
      puchaseid: record.id,
      urn: record.urn_number ?? "",
    });

    setIsSingleAcceptLoading(false);

    if (response.status && response.data) {
      markRecordAccepted(record.id);
      toast.success("Purchase record accepted.");
      await init();
    } else {
      toast.error(response.message);
    }
  };

  const hasPendingAcceptable = dailyPurchase.some(
    (group) => group.hasPendingAcceptable,
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
                        ₹{(parseFloat(record.vatamount) + parseFloat(record.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{record.vatamount}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{record.amount}
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
                    ₹{selectedGroup.totalTaxableValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    ₹{selectedGroup.totalVatAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    ₹{selectedGroup.totalInvoiceValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            {selectedGroup.records.some(
              (r) =>
                (r.seller_tin_number.tin_number.startsWith("25") ||
                  r.seller_tin_number.tin_number.startsWith("26")) &&
                !r.is_accept,
            ) && (
              <div className="mt-4 flex justify-end">
                <button
                  disabled={isGroupAcceptLoading}
                  onClick={handleAcceptGroupAll}
                  className="text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
                >
                  {isGroupAcceptLoading ? "Accepting..." : "Accept All"}
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
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setCreditNoteBox(false);
          setCreditNoteGroup(null);
        }}
        open={creditNoteBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">
            Purchase Credit Note
          </h2>
        </div>
        {creditNoteGroup && dvatdata && (
          <PurchaseCreditNoteDrawer
            group={creditNoteGroup}
            dvat04Id={dvatdata.id}
            userid={userid}
            setOpen={setCreditNoteBox}
            init={init}
          />
        )}
      </Drawer>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setDebitNoteBox(false);
          setDebitNoteGroup(null);
        }}
        open={debitNoteBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">
            Purchase Debit Note
          </h2>
        </div>
        {debitNoteGroup && dvatdata && (
          <PurchaseDebitNoteDrawer
            group={debitNoteGroup}
            dvat04Id={dvatdata.id}
            userid={userid}
            setOpen={setDebitNoteBox}
            init={init}
          />
        )}
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
          setIsModalOpen(false);
          setIsPurchaseConfirmed(false);
        }}
        okText="Finalize Purchase Data"
        cancelText="Cancel"
        okButtonProps={{ disabled: !isPurchaseConfirmed, danger: true }}
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

          <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPurchaseConfirmed}
                onChange={(e) => setIsPurchaseConfirmed(e.target.checked)}
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

      <Modal
        title="Bulk Delete Purchase Items"
        open={isBulkDeleteModalOpen}
        width={1200}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
          setSelectedBulkDeleteIds([]);
          setBulkDeleteRows([]);
        }}
        footer={null}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={
                bulkDeleteRows.length > 0 &&
                selectedBulkDeleteIds.length === bulkDeleteRows.length
              }
              onChange={(event) =>
                toggleBulkDeleteSelectAll(event.target.checked)
              }
              disabled={bulkDeleteRows.length === 0}
            />
            Select All
          </label>
          <span className="text-xs text-gray-600">
            Selected: {selectedBulkDeleteIds.length} / {bulkDeleteRows.length}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-auto border rounded">
          {/* TanStack Table for grouped selection */}
          {groupedBulkDeleteRows.length === 0 ? (
            <div className="text-center text-sm py-4">
              No non-accepted purchase items available.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="border text-center text-xs">
                    Pick
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice No.
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice Date
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Trade Name
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    TIN Number
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Product
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Quantity
                  </TableHead>
                  <TableHead className="border text-center text-xs">
                    Invoice Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedBulkDeleteRows.map((group) => {
                  const allSelected = group.rows.every((row) =>
                    selectedBulkDeleteIds.includes(row.id),
                  );
                  const someSelected = group.rows.some((row) =>
                    selectedBulkDeleteIds.includes(row.id),
                  );
                  return [
                    <TableRow
                      key={`group-${group.groupKey}`}
                      className="bg-blue-50"
                    >
                      <TableCell className="border text-center text-xs">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = !allSelected && someSelected;
                          }}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              // Add all group row ids
                              setSelectedBulkDeleteIds((prev) => [
                                ...prev,
                                ...group.rows
                                  .map((r) => r.id)
                                  .filter((id) => !prev.includes(id)),
                              ]);
                            } else {
                              // Remove all group row ids
                              setSelectedBulkDeleteIds((prev) =>
                                prev.filter(
                                  (id) => !group.rows.some((r) => r.id === id),
                                ),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        className="border text-xs font-semibold"
                      >
                        {group.groupLabel}
                      </TableCell>
                    </TableRow>,
                    ...group.rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        <TableCell className="border text-center text-xs text-gray-400">
                          —
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.invoice_number}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {formateDate(row.invoice_date)}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.trade_name}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.tin_number}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.product_name}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.quantity}
                        </TableCell>
                        <TableCell className="border text-center text-xs">
                          {row.invoice_value.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )),
                  ];
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="grow"></div>
          <Button
            onClick={() => {
              setIsBulkDeleteModalOpen(false);
              setSelectedBulkDeleteIds([]);
              setBulkDeleteRows([]);
            }}
          >
            Close
          </Button>
          <Button
            danger
            type="primary"
            disabled={selectedBulkDeleteIds.length === 0}
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </Modal>

      <Modal
        title="Confirm Bulk Delete"
        open={isBulkDeleteConfirmOpen}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
        onOk={handleConfirmBulkDelete}
        okText="Delete Permanently"
        okButtonProps={{ danger: true, loading: isBulkDeleting }}
      >
        <p className="text-sm text-gray-700">
          You are about to delete {selectedBulkDeleteIds.length} purchase
          item(s).
        </p>
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Warning: This action cannot be reversed. Deleted items cannot be
          restored.
        </p>
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
                          {dvatdata?.commodity === "OIDC" && (
                            <Button
                              size="small"
                              block
                              type="default"
                              onClick={() => {
                                setToolbarActionsOpen(false);
                                router.push("/dashboard/stock/tally_purchase");
                              }}
                            >
                              Tally Purchase
                            </Button>
                          )}

                          {dailyPurchase.length > 0 && (
                            <Button
                              size="small"
                              block
                              type="default"
                              onClick={async () => {
                                setToolbarActionsOpen(false);
                                if (
                                  hasPendingAcceptable ||
                                  (await hasPendingAcceptableForApplicablePeriodAcrossAll())
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
                          )}

                          <DownloadPurchaseSample
                            commodity={dvatdata?.commodity ?? "OTHER"}
                            setToolbarActionsOpen={setToolbarActionsOpen}
                          />

                          <PurchaseBulk
                            setToolbarActionsOpen={setToolbarActionsOpen}
                            onUploadComplete={init}
                          />

                          <Button
                            size="small"
                            block
                            type="default"
                            loading={isBulkDeleteLoading}
                            onClick={() => {
                              setToolbarActionsOpen(false);
                              openBulkDeleteModal();
                            }}
                          >
                            Bulk Delete
                          </Button>

                          <Button
                            size="small"
                            block
                            type="default"
                            loading={isPurchaseReportLoading}
                            onClick={() => {
                              setToolbarActionsOpen(false);
                              downloadDailyPurchaseReport();
                            }}
                          >
                            Purchase Report
                          </Button>

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
                ₹{cardSummary.totalInvoiceValue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{cardSummary.totalVatAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{cardSummary.totalTaxableValue.toFixed(2)}
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

          {dailyPurchase.length > 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              {/* Search, Sort, and Filter Controls */}
              <div className="mb-4 space-y-3">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search by invoice number, trade name, or TIN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sort Controls */}
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="invoice_date">Invoice Date</option>
                      <option value="invoice_number">Invoice Number</option>
                      <option value="trade_name">Trade Name</option>
                      <option value="tin_number">TIN Number</option>
                      <option value="invoice_value">Invoice Value</option>
                    </select>
                  </div>

                  <div className="w-full md:w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Date Range Filter */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start Date"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Accept Status Filter */}
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Accept Status
                    </label>
                    <select
                      value={acceptStatusFilter}
                      onChange={(e) =>
                        setAcceptStatusFilter(e.target.value as any)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="w-full md:w-auto flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setDateFilter({ startDate: "", endDate: "" });
                        setAcceptStatusFilter("all");
                        setSortField("invoice_date");
                        setSortOrder("desc");
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-xs text-gray-600">
                  Showing {dailyPurchase.length} of {pagination.total} filtered record(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Count
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice No.
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Date
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Trade Name
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        TIN Number
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Value (₹)
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
                              ₹{group.totalInvoiceValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              ₹{group.totalVatAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              ₹{group.totalTaxableValue.toFixed(2)}
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
                                    {group.count === 1 &&
                                      (group.seller_tin_number.tin_number.startsWith(
                                        "25",
                                      ) ||
                                        group.seller_tin_number.tin_number.startsWith(
                                          "26",
                                        )) &&
                                      !group.records[0].is_accept && (
                                        <button
                                          onClick={async () => {
                                            await handleAcceptSingleRecord(
                                              group.records[0],
                                            );
                                            handelClose(index);
                                          }}
                                          disabled={isSingleAcceptLoading}
                                          className="text-sm bg-white border hover:border-rose-500 hover:text-rose-600 text-gray-700 py-1 px-3 rounded disabled:opacity-60"
                                        >
                                          {isSingleAcceptLoading
                                            ? "Accepting..."
                                            : "Accept"}
                                        </button>
                                      )}
                                    <button
                                      onClick={() => {
                                        setCreditNoteGroup(group);
                                        setCreditNoteBox(true);
                                        handelClose(index);
                                      }}
                                      className="text-sm bg-white border hover:border-green-500 hover:text-green-600 text-gray-700 py-1 px-3 rounded"
                                    >
                                      Credit Note
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDebitNoteGroup(group);
                                        setDebitNoteBox(true);
                                        handelClose(index);
                                      }}
                                      className="text-sm bg-white border hover:border-amber-500 hover:text-amber-600 text-gray-700 py-1 px-3 rounded"
                                    >
                                      Debit Note
                                    </button>
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
                                  description of goods matches this purchase
                                  URN.
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
          ) : (
            <div className="bg-white rounded shadow-sm border p-3 text-center">
              <p className="text-gray-500 text-sm">
                No purchase records found.
              </p>
            </div>
          )}
        </div>
      </main>

      <>
        {/* <button
          type="button"
          aria-label="Open help chat"
          onClick={() => setIsHelpDrawerOpen(true)}
          className="fixed right-5 bottom-5 z-60 flex flex-col items-center hover:scale-105 transition-transform"
        >
          <span className="h-32 w-32 overflow-hidden">
            {chatAnimationData ? (
              <Lottie
                animationData={chatAnimationData}
                loop
                autoplay
                className="h-full w-full"
              />
            ) : (
              <span className="h-full w-full grid place-items-center text-[#0f2f67] text-xs font-semibold">
                Help
              </span>
            )}
          </span>
          <span className="-translate-y-4 text-lg font-semibold text-[#0f2f67] bg-white/90 px-2 rounded-full border-blue-800 border-2">
            Need Help
          </span>
        </button> */}

        <Drawer
          title={
            <span className="text-slate-800 font-semibold">Purchase Help</span>
          }
          placement="right"
          size={380}
          open={isHelpDrawerOpen}
          onClose={() => setIsHelpDrawerOpen(false)}
        >
          <div className="h-full flex flex-col gap-3">
            <div
              ref={chatListRef}
              onScroll={handleChatScroll}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 h-[62vh] overflow-y-auto flex flex-col gap-2"
            >
              <div className="grow" />
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "bot" && (
                    <span className="h-8 w-8 rounded-full bg-slate-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      H
                    </span>
                  )}

                  <div
                    className={`w-fit max-w-[82%] px-2.5 py-1.5 text-sm ${
                      message.role === "bot"
                        ? "bg-white border border-slate-200 text-slate-700 rounded-br-lg rounded-tl-lg rounded-tr-lg"
                        : "bg-slate-700 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg"
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold mb-1 ${
                        message.role === "bot"
                          ? "text-slate-700"
                          : "text-slate-200"
                      }`}
                    >
                      {message.role === "bot" ? "Maya" : "You"}
                    </p>

                    {message.text || (
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <span className="text-xs text-slate-500 mr-1">
                          Thinking
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:240ms]"></span>
                      </span>
                    )}
                  </div>

                  {message.role === "user" && (
                    <span className="h-8 w-8 rounded-full bg-amber-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      U
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!isBotTyping && (
              <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-wrap gap-2">
                {purchaseChatOptions.map((option) => (
                  <button
                    key={option.question}
                    type="button"
                    onClick={() =>
                      onSelectChatOption(option.question, option.answer)
                    }
                    className="text-left text-sm px-3 py-1.5 border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors"
                  >
                    {option.question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      </>
    </>
  );
};

export default DocumentWiseDetails;
