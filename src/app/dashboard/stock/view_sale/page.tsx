"use client";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import AcceptSaleWithoutDvat from "@/action/stock/acceptsalewithoutdvat";
import AcceptSaleForPendingProcess from "@/action/stock/acceptsaleforpendingprocess";
import DeleteSale from "@/action/stock/deletesale";
import GetSaleDeleteImpact from "@/action/stock/getsaledeleteimpact";
import GetUserDailySale, {
  DailySaleSummary,
  GroupedDailySale,
} from "@/action/stock/getuserdailysale";
import GetUserDailySaleFiltered from "@/action/stock/getuserdailysalefiltered";
import { DailySaleProvider } from "@/components/forms/dailysale/dailysale";
import { CreditNoteDrawer } from "@/components/forms/creditnote/creditnotedrawer";
import { DebitNoteDrawer } from "@/components/forms/debitnote/debitnotedrawer";
import { AntDesignMenuOutlined } from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encryptURLData, formateDate } from "@/utils/methods";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import {
  Button,
  Drawer,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import GetAllDvat04 from "@/action/dvat/getalldvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import GetAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import DownloadSaleSample from "./downloadsalesample";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import SaleBulkUpload from "./salebulk";

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

const DocumentWiseDetails = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toolbarActionsOpen, setToolbarActionsOpen] = useState(false);

  // Search, Sort, and Filter states for daily sale table
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<
    | "invoice_number"
    | "invoice_date"
    | "trade_name"
    | "tin_number"
    | "invoice_value"
  >("invoice_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [acceptStatusFilter, setAcceptStatusFilter] = useState<
    "all" | "pending" | "accepted"
  >("all");

  const [dailySale, setDailySale] = useState<Array<GroupedDailySale>>([]);
  const [overallSaleSummary, setOverallSaleSummary] =
    useState<DailySaleSummary>(DEFAULT_SALE_SUMMARY);
  const [filteredSaleSummary, setFilteredSaleSummary] =
    useState<DailySaleSummary>(DEFAULT_SALE_SUMMARY);

  const isFilterApplied = useMemo(
    () =>
      searchTerm.trim() !== "" ||
      dateFilter.startDate !== "" ||
      dateFilter.endDate !== "" ||
      acceptStatusFilter !== "all",
    [searchTerm, dateFilter.startDate, dateFilter.endDate, acceptStatusFilter],
  );

  const cardSummary = isFilterApplied
    ? filteredSaleSummary
    : overallSaleSummary;

  const maxSelectableMonth = useMemo(
    () => formatMonthInputValue(new Date()),
    [],
  );

  const route = useRouter();
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {},
  );
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
  const [allDvatTinNumbers, setAllDvatTinNumbers] = useState<Set<string>>(
    new Set(),
  );
  const [allTinMasterTinNumbers, setAllTinMasterTinNumbers] = useState<
    Set<string>
  >(new Set());

  const [selectedGroup, setSelectedGroup] = useState<GroupedDailySale | null>(
    null,
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSingleAcceptLoading, setIsSingleAcceptLoading] =
    useState<boolean>(false);
  const [filedReturnPeriods, setFiledReturnPeriods] = useState<Set<string>>(
    new Set(),
  );

  //   const [name, setName] = useState<string>("");

  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [chatAnimationData, setChatAnimationData] = useState<any>(null);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; role: "bot" | "user"; text: string }>
  >([
    {
      id: 1,
      role: "bot",
      text: "Welcome to Sales Help. Ask questions about managing your sales data.",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messageIdRef = useRef(1);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const normalizedStatus = (dvatdata?.status ?? "").toUpperCase();
  const normalizeTin = (tinNumber: string): string => tinNumber.trim();

  const salesChatOptions = [
    {
      question: "How do I add a new sales invoice?",
      answer:
        "Click the Add button at the top of this page. Fill in invoice details including date, TIN, product, and quantity. Then save to add it to your sales records.",
    },
    {
      question: "What does Generate DVAT 31/31 A do?",
      answer:
        "This converts your sales data into DVAT 31 or 31 A return format, preparing it for filing with the department.",
    },
    // {
    //   question: "How can I download my sales data?",
    //   answer:
    //     "Use the Download Sheet link at the top right. It exports your current sales records as CSV file for backup or import into other tools.",
    // },
    // {
    //   question: "How do I delete or correct a sales entry?",
    //   answer:
    //     "Click the Actions menu next to the sales record. You can delete the entry, and then re-add it with correct details.",
    // },
  ];

  const init = async () => {
    // setLoading(true);

    const dvat_response = await GetUserDvat04Anx({
      userid: userid,
    });

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      await loadFiledReturnPeriods(dvat_response.data.id);
      const daily_sale_response = await GetUserDailySaleFiltered({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 25,
        searchTerm,
        sortField,
        sortOrder,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        acceptStatusFilter,
      });

      if (daily_sale_response.status && daily_sale_response.data.result) {
        setPaginatin({
          skip: daily_sale_response.data.skip,
          take: daily_sale_response.data.take,
          total: daily_sale_response.data.total,
        });
        setDailySale(daily_sale_response.data.result);
        const summary = daily_sale_response.data.summary as
          | DailySaleFilteredSummary
          | undefined;
        setOverallSaleSummary(summary?.overallSummary ?? DEFAULT_SALE_SUMMARY);
        setFilteredSaleSummary(
          summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY,
        );
      }
    }
    // setLoading(false);
  };
  const getPeriodKey = (year: string | number, month: string) =>
    `${year}-${month}`;

  const loadFiledReturnPeriods = useCallback(async (dvatid: number) => {
    const returnMonthResponse = await GetReturnMonth({ dvatid });
    if (returnMonthResponse.status && returnMonthResponse.data) {
      const periods = new Set<string>();
      returnMonthResponse.data.forEach((entry) => {
        if (entry.filing_status) {
          periods.add(getPeriodKey(entry.year, entry.month));
        }
      });
      setFiledReturnPeriods(periods);
      return;
    }

    setFiledReturnPeriods(new Set());
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const userresponse = await GetUser({ id: authResponse.data });
      if (userresponse.status) setUser(userresponse.data!);

      const dvat_response = await GetUserDvat04Anx({});

      const [allDvatResponse, allTinMasterResponse] = await Promise.all([
        GetAllDvat04({}),
        GetAllTinNumberMaster(),
      ]);

      if (allDvatResponse.status && allDvatResponse.data) {
        setAllDvatTinNumbers(
          new Set(
            allDvatResponse.data
              .map((row) => row.tinNumber)
              .filter((tin): tin is string => Boolean(tin))
              .map(normalizeTin),
          ),
        );
      } else {
        setAllDvatTinNumbers(new Set());
      }

      if (allTinMasterResponse.status && allTinMasterResponse.data) {
        setAllTinMasterTinNumbers(
          new Set(
            allTinMasterResponse.data
              .map((row) => row.tin_number)
              .filter((tin): tin is string => Boolean(tin))
              .map(normalizeTin),
          ),
        );
      } else {
        setAllTinMasterTinNumbers(new Set());
      }

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        await loadFiledReturnPeriods(dvat_response.data.id);
        const daily_sale_response = await GetUserDailySaleFiltered({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 25,
          searchTerm: "",
          sortField: "invoice_date",
          sortOrder: "desc",
          startDate: "",
          endDate: "",
          acceptStatusFilter: "all",
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setPaginatin({
            skip: daily_sale_response.data.skip,
            take: daily_sale_response.data.take,
            total: daily_sale_response.data.total,
          });
          setDailySale(daily_sale_response.data.result);
          const summary = daily_sale_response.data.summary as
            | DailySaleFilteredSummary
            | undefined;
          setOverallSaleSummary(
            summary?.overallSummary ?? DEFAULT_SALE_SUMMARY,
          );
          setFilteredSaleSummary(
            summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY,
          );
        }
      }

      setIsLoading(false);
    };
    init();
  }, [router, loadFiledReturnPeriods]);

  const canManualAcceptSale = useCallback(
    (tinNumber: string): boolean => {
      if (!tinNumber) return false;
      const normalizedTin = normalizeTin(tinNumber);
      const existsInDvat = allDvatTinNumbers.has(normalizedTin);
      const existsInTinMaster = allTinMasterTinNumbers.has(normalizedTin);

      // Manual accept is allowed only when TIN exists in tin_number_master
      // and does not exist in dvat04.
      return existsInTinMaster && !existsInDvat;
    },
    [allDvatTinNumbers, allTinMasterTinNumbers],
  );

  const handleAcceptSingleRecord = async (
    record: GroupedDailySale["records"][number],
  ) => {
    setIsSingleAcceptLoading(true);

    let response = await AcceptSaleForPendingProcess({
      saleId: record.id,
    });

    if (!response.status && response.message === "Seller DVAT status is not pendingprocess.") {
      response = await AcceptSaleWithoutDvat({
        saleId: record.id,
      });
    }

    setIsSingleAcceptLoading(false);

    if (response.status && response.data) {
      toast.success("Sale record accepted.");
      await init();
      return;
    }

    toast.error(response.message);
  };

  const handleAcceptGroupRecords = async (group: GroupedDailySale) => {
    const pendingRecords = group.records.filter((record) => !record.is_accept);

    if (pendingRecords.length === 0) {
      toast.info("No pending sale records found for this invoice.");
      return;
    }

    setIsSingleAcceptLoading(true);

    try {
      for (const record of pendingRecords) {
        let response = await AcceptSaleForPendingProcess({
          saleId: record.id,
        });

        if (
          !response.status &&
          response.message === "Seller DVAT status is not pendingprocess."
        ) {
          response = await AcceptSaleWithoutDvat({ saleId: record.id });
        }

        if (!response.status || !response.data) {
          toast.error(response.message);
          return;
        }
      }

      toast.success(`${pendingRecords.length} sale record(s) accepted.`);
      await init();
    } finally {
      setIsSingleAcceptLoading(false);
    }
  };

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
        text: "Your registration is pending. Ask me about managing sales entries while awaiting approval.",
      },
    ]);
    messageIdRef.current = 1;
    setIsBotTyping(false);
    setShouldAutoScroll(true);
  }, []);

  useEffect(() => {
    if (!dvatdata?.id) return;

    // If only one of startDate/endDate is set, wait for the user to finish
    // selecting the range before firing the request. This prevents the page
    // from refreshing as soon as the first date is picked and gives the user
    // enough time to choose the second date.
    const hasIncompleteRange =
      (dateFilter.startDate && !dateFilter.endDate) ||
      (!dateFilter.startDate && dateFilter.endDate);

    if (hasIncompleteRange) {
      return;
    }

    const timer = setTimeout(() => {
      const loadFilteredPage = async () => {
        const daily_sale_response = await GetUserDailySaleFiltered({
          dvatid: dvatdata.id,
          skip: 0,
          take: pagination.take,
          searchTerm,
          sortField,
          sortOrder,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          acceptStatusFilter,
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setDailySale(daily_sale_response.data.result);
          setPaginatin((prev) => ({
            ...prev,
            skip: 0,
            total: daily_sale_response.data.total,
          }));
          const summary = daily_sale_response.data.summary as
            | DailySaleFilteredSummary
            | undefined;
          setOverallSaleSummary(
            summary?.overallSummary ?? DEFAULT_SALE_SUMMARY,
          );
          setFilteredSaleSummary(
            summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY,
          );
        }
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
    const today = new Date();

    const endDate =
      year === today.getFullYear() && monthIndex === today.getMonth()
        ? today
        : monthEndDate;

    setDateFilter({
      startDate: formatDateInputValue(startDate),
      endDate: formatDateInputValue(endDate),
    });
  }, [selectedPeriod]);

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

    const skip = pagesize * (page - 1);
    const daily_sale_response = await GetUserDailySaleFiltered({
      dvatid: dvatdata.id,
      take: pagesize,
      skip,
      searchTerm,
      sortField,
      sortOrder,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptStatusFilter,
    });

    if (daily_sale_response.status && daily_sale_response.data.result) {
      setDailySale(daily_sale_response.data.result);
      setPaginatin({
        skip: daily_sale_response.data.skip,
        take: daily_sale_response.data.take,
        total: daily_sale_response.data.total,
      });
      const summary = daily_sale_response.data.summary as
        | DailySaleFilteredSummary
        | undefined;
      setOverallSaleSummary(summary?.overallSummary ?? DEFAULT_SALE_SUMMARY);
      setFilteredSaleSummary(summary?.filteredSummary ?? DEFAULT_SALE_SUMMARY);
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalesConfirmed, setIsSalesConfirmed] = useState(false);

  const formatEligibilityDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toDateOnly = (date: Date): Date =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const getApplicablePeriodDate = (): Date | null => {
    if (dailySale.length === 0) {
      return null;
    }

    return dailySale.reduce(
      (minDate, group) =>
        group.invoice_date < minDate ? group.invoice_date : minDate,
      dailySale[0].invoice_date,
    );
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
    return new Date(year + 1, 0, 10); // Oct-Dec -> 10 Jan (next year)
  };

  const canGenerateDvat31 = (): { allowed: boolean; message?: string } => {
    const today = toDateOnly(new Date());
    const periodDate = getApplicablePeriodDate();
    const filingFrequency = dvatdata?.frequencyFilings?.toUpperCase();

    if (!periodDate) {
      return {
        allowed: false,
        message: "No eligible sale records found for generation.",
      };
    }

    const dueDate =
      filingFrequency === "QUARTERLY"
        ? getQuarterlyDueDate(periodDate)
        : getMonthlyDueDate(periodDate);

    if (today >= dueDate) {
      return { allowed: true };
    }

    if (filingFrequency === "QUARTERLY") {
      return {
        allowed: false,
        message: `Returns for a tax period shall be available for generation only on or after the 10th day of the month succeeding the applicable tax period. Next allowed date is ${formatEligibilityDate(dueDate)}.`,
      };
    }

    return {
      allowed: false,
      message: `Returns for a tax period shall be available for generation only on or after the 10th day of the month succeeding the applicable tax period. Next allowed date is ${formatEligibilityDate(dueDate)}.`,
    };
  };

  const hasPendingAcceptableForSelectedDateRange = async (): Promise<boolean> => {
    if (!dvatdata) return false;

    const pendingResponse = await GetUserDailySaleFiltered({
      dvatid: dvatdata.id,
      skip: 0,
      take: 1,
      searchTerm: "",
      sortField: "invoice_date",
      sortOrder: "desc",
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      acceptStatusFilter: "pending",
    });

    if (!pendingResponse.status || !pendingResponse.data) {
      toast.error(
        pendingResponse.message ||
          "Unable to validate pending sales invoices for generation.",
      );
      return true;
    }

    return pendingResponse.data.total > 0;
  };

  const Convertto31 = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    const eligibility = canGenerateDvat31();
    if (!eligibility.allowed) {
      return toast.error(eligibility.message);
    }

    const response = await ConvertDvat31({
      createdById: userid,
      dvatid: dvatdata.id,
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
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
  const [deleteRecords, setDeleteRecords] = useState<number[]>([]);
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
  const [selectedBulkDeleteIds, setSelectedBulkDeleteIds] = useState<number[]>(
    [],
  );
  const groupedBulkDeleteRows = useMemo(() => {
    const groups: Record<
      string,
      {
        groupKey: string;
        groupLabel: string;
        rows: typeof bulkDeleteRows;
      }
    > = {};

    for (const row of bulkDeleteRows) {
      const groupKey = [
        row.tin_number,
        formateDate(row.invoice_date),
        row.invoice_number,
      ].join("|");

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          groupLabel: `TIN: ${row.tin_number} | Date: ${formateDate(
            row.invoice_date,
          )} | Invoice: ${row.invoice_number}`,
          rows: [],
        };
      }

      groups[groupKey].rows.push(row);
    }

    return Object.values(groups);
  }, [bulkDeleteRows]);
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
  const [creditNoteBox, setCreditNoteBox] = useState<boolean>(false);
  const [creditNoteGroup, setCreditNoteGroup] =
    useState<GroupedDailySale | null>(null);
  const [debitNoteBox, setDebitNoteBox] = useState<boolean>(false);
  const [debitNoteGroup, setDebitNoteGroup] = useState<GroupedDailySale | null>(
    null,
  );

  const delete_sale_entry = async (ids: number[]) => {
    if (ids.length === 0) {
      toast.error("No sale record selected to delete.");
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    let error = "";

    for (const id of ids) {
      const response = await DeleteSale({
        id,
        deletedById: userid,
      });
      if (response.data && response.status) {
        successCount += 1;
      } else {
        failedCount += 1;
        error = response.message || "Unknown error";
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} sale record(s) deleted successfully.`);
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} sale record(s) could not be deleted. Error: ${error}`,
      );
    }

    await init();
    setDeleteBox(false);
    setDeleteRecords([]);
    setDeleteImpact({
      creditNoteCount: 0,
      debitNoteCount: 0,
      totalLinkedCount: 0,
    });
  };

  const loadDeleteImpact = async (saleIds: number[]) => {
    if (saleIds.length === 0) {
      setDeleteImpact({
        creditNoteCount: 0,
        debitNoteCount: 0,
        totalLinkedCount: 0,
      });
      return;
    }

    setIsDeleteImpactLoading(true);

    let creditNoteCount = 0;
    let debitNoteCount = 0;

    for (const id of saleIds) {
      const impactResponse = await GetSaleDeleteImpact({ id });
      if (impactResponse.status && impactResponse.data) {
        creditNoteCount += impactResponse.data.creditNoteCount;
        debitNoteCount += impactResponse.data.debitNoteCount;
      }
    }

    setDeleteImpact({
      creditNoteCount,
      debitNoteCount,
      totalLinkedCount: creditNoteCount + debitNoteCount,
    });

    setIsDeleteImpactLoading(false);
  };

  const openBulkDeleteModal = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    setIsBulkDeleteLoading(true);
    setSelectedBulkDeleteIds([]);
    try {
      const dailySaleResponse = await GetUserDailySale({
        dvatid: dvatdata.id,
        skip: 0,
        take: Math.max(pagination.total, 10000),
      });

      if (!dailySaleResponse.status || !dailySaleResponse.data.result) {
        toast.error("Unable to load sale entries for bulk delete.");
        return;
      }

      const rows = dailySaleResponse.data.result.flatMap((group) =>
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
        toast.info("No non-accepted sale items found.");
      }
    } catch {
      toast.error("Unable to load sale entries for bulk delete.");
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
      toast.error("Select at least one sale item to delete.");
      return;
    }

    setIsBulkDeleting(true);
    await delete_sale_entry(selectedBulkDeleteIds);
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

  // 1 crate 2 pcs
  const showCrates = (quantity: number, crate_size: number): string => {
    // return "";

    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const formatAmount = (value: number | string | null | undefined): string => {
    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
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
                  <p className="text-xs text-gray-600">Purchaser</p>
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
                        ₹
                        {(
                          
                          parseFloat(record.amount)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {parseFloat(record.vatamount).toFixed(2)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.amount
                          ? (
                              parseFloat(record.amount) +
                              parseFloat(record.vatamount)
                            ).toFixed(2)
                          : "0.00"}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {canManualAcceptSale(
                          record.seller_tin_number.tin_number,
                        ) ? (
                          record.is_accept ? (
                            <span className="text-xs text-gray-400">
                              Accepted
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                handleAcceptSingleRecord(record);
                              }}
                              disabled={isSingleAcceptLoading}
                              className="text-xs bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-1 px-3 rounded"
                            >
                              {isSingleAcceptLoading ? "Accepting..." : "Accept"}
                            </button>
                          )
                        ) : record.is_accept ? (
                          "NA"
                        ) : (
                          <button
                            onClick={() => {
                              route.push(
                                `/dashboard/stock/edit_sale/${encryptURLData(
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
                    {formatAmount(selectedGroup.totalTaxableValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    {selectedGroup.totalVatAmount.toFixed(2)}
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

      <Modal
        title={
          <div className="text-rose-600 font-semibold text-base">
            ⚠️ IMPORTANT NOTICE – SALES DATA FINALIZATION
          </div>
        }
        open={isModalOpen}
        onOk={Convertto31}
        onCancel={() => {
          setIsModalOpen(false);
          setIsSalesConfirmed(false);
        }}
        okText="Finalize Sales Data"
        cancelText="Cancel"
        okButtonProps={{ disabled: !isSalesConfirmed, danger: true }}
        width={600}
      >
        <div className="py-3 space-y-4">
          <p className="text-sm text-gray-700">
            You are about to <strong>finalize all Sales entries</strong> for the
            selected tax period.
          </p>

          <p className="text-sm text-gray-700">
            Please ensure that all Sales invoices and transaction details have
            been entered correctly and verified carefully.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              After clicking &quot;Finalize Sales Data&quot;:
            </p>
            <ul className="text-sm text-amber-900 space-y-1">
              <li>❌ No new Sales entries can be added.</li>
              <li>❌ Existing Sales entries cannot be edited.</li>
              <li>❌ Existing Sales entries cannot be deleted.</li>
              <li>❌ This action cannot be reversed through the system.</li>
            </ul>
          </div>

          <p className="text-sm text-gray-700 font-medium">
            This action should be performed only after completing and verifying
            all Sales transactions for the tax period.
          </p>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSalesConfirmed}
                onChange={(e) => setIsSalesConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm text-gray-800">
                I confirm that all Sales entries have been reviewed and
                verified. I understand that once finalized, no further
                additions, modifications, or deletions will be permitted.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        title="Bulk Delete Sale Items"
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
              {bulkDeleteRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm py-4">
                    No non-accepted sale items available.
                  </TableCell>
                </TableRow>
              ) : (
                groupedBulkDeleteRows.flatMap((group) => {
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
                          onChange={(event) => {
                            const checked = event.target.checked;
                            if (checked) {
                              setSelectedBulkDeleteIds((prev) => [
                                ...prev,
                                ...group.rows
                                  .map((row) => row.id)
                                  .filter((id) => !prev.includes(id)),
                              ]);
                            } else {
                              setSelectedBulkDeleteIds((prev) =>
                                prev.filter(
                                  (id) =>
                                    !group.rows.some((row) => row.id === id),
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
                })
              )}
            </TableBody>
          </Table>
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
          You are about to delete {selectedBulkDeleteIds.length} sale item(s).
        </p>
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Warning: This action cannot be reversed. Deleted items cannot be
          restored.
        </p>
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
          <h2 className="text-sm font-medium text-gray-900">Sale Invoice</h2>
        </div>
        <DailySaleProvider userid={userid} setAddBox={setAddBox} init={init} />
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
            Sale Credit Note
          </h2>
        </div>
        {creditNoteGroup && dvatdata && (
          <CreditNoteDrawer
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
          <h2 className="text-sm font-medium text-gray-900">Sale Debit Note</h2>
        </div>
        {debitNoteGroup && dvatdata && (
          <DebitNoteDrawer
            group={debitNoteGroup}
            dvat04Id={dvatdata.id}
            userid={userid}
            setOpen={setDebitNoteBox}
            init={init}
          />
        )}
      </Drawer>
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Daily Sale
                </h1>
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
                <Popover
                  trigger={["hover", "click"]}
                  placement="bottomRight"
                  open={toolbarActionsOpen}
                  onOpenChange={setToolbarActionsOpen}
                  content={
                    <div className="w-48 space-y-3">
                      <div>
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Sale Actions
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          {dvatdata?.commodity === "OIDC" && (
                            <Button
                              size="small"
                              block
                              type="default"
                              onClick={() => {
                                setToolbarActionsOpen(false);
                                router.push("/dashboard/stock/tally_sale");
                              }}
                            >
                              Tally Sale
                            </Button>
                          )}

                          {dailySale.length > 0 && (
                            <Button
                              size="small"
                              block
                              type="default"
                              onClick={async () => {
                                setToolbarActionsOpen(false);

                                const hasPendingInSelectedRange =
                                  await hasPendingAcceptableForSelectedDateRange();

                                if (hasPendingInSelectedRange) {
                                  toast.error(
                                    "All sale invoices should be accepted by buyer for the selected date range before generating DVAT 31/31 A.",
                                  );
                                  return;
                                }

                                setIsModalOpen(true);
                              }}
                            >
                              Generate DVAT 31/31 A
                            </Button>
                          )}

                          <DownloadSaleSample
                            commodity={dvatdata?.commodity ?? "OTHER"}
                            setToolbarActionsOpen={setToolbarActionsOpen}
                          />
                          <SaleBulkUpload
                            setToolbarActionsOpen={setToolbarActionsOpen}
                            filedReturnPeriods={filedReturnPeriods}
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
                            type="primary"
                            onClick={() => {
                              setToolbarActionsOpen(false);
                              setAddBox(true);
                            }}
                          >
                            Add
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
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(cardSummary.totalTaxableValue)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {cardSummary.totalVatAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(cardSummary.totalInvoiceValue)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border p-3">
              {/* Search, Sort, and Filter Controls */}
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
                  <div className="xl:col-span-2">
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

                  <div>
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

                  <div>
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

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <input
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      min="2026-04"
                      max={maxSelectableMonth}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
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

                  <div>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedPeriod("");
                        setDateFilter({ startDate: "", endDate: "" });
                        setAcceptStatusFilter("all");
                        setSortField("invoice_date");
                        setSortOrder("desc");
                      }}
                      className="w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  Month filter allowed from April 2026 to current month.
                </p>

                {/* Results Count */}
                <div className="text-xs text-gray-600">
                  Showing {dailySale.length} of {pagination.total} filtered record(s)
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
                        Invoice no.
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
                        Taxable Value
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        VAT Amount
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySale.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-gray-500 text-sm">
                            No sale records match your filters.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailySale.map(
                        (group: GroupedDailySale, index: number) => (
                          <TableRow
                            key={index}
                            className={
                              group.records.some((record) => !record.is_accept)
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
                              {/* {group.count > 1 ? <></> : <span>{group.count}</span>} */}
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
                              {group.totalTaxableValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              {group.totalVatAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              {group.totalInvoiceValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              <Popover
                                content={
                                  <div className="flex flex-col gap-2">
                                    {canManualAcceptSale(
                                      group.seller_tin_number.tin_number,
                                    ) &&
                                      group.records.some(
                                        (record) => !record.is_accept,
                                      ) && (
                                        <button
                                          onClick={async () => {
                                            await handleAcceptGroupRecords(group);
                                            handelClose(index);
                                          }}
                                          disabled={isSingleAcceptLoading}
                                          className="text-sm bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-1 px-3 rounded"
                                        >
                                          {isSingleAcceptLoading
                                            ? "Accepting..."
                                            : "Accept"}
                                        </button>
                                      )}
                                    {!group.records[0].is_accept && (
                                      <button
                                        onClick={() => {
                                          if (group.count === 1) {
                                            route.push(
                                              `/dashboard/stock/edit_sale/${encryptURLData(
                                                group.records[0].id.toString(),
                                              )}`,
                                            );
                                          } else {
                                            toast.info(
                                              "Please select a specific record from Show More",
                                            );
                                          }
                                          handelClose(index);
                                        }}
                                        className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-3 rounded"
                                      >
                                        Update
                                      </button>
                                    )}
                                    {!group.records[0].is_accept && (
                                      <button
                                        onClick={() => {
                                          const idsToDelete = group.records.map(
                                            (record) => record.id,
                                          );
                                          setDeleteRecords(idsToDelete);
                                          setDeleteBox(true);
                                          loadDeleteImpact(idsToDelete);
                                          handelClose(index);
                                        }}
                                        className="text-sm bg-white border hover:border-rose-500 hover:text-rose-600 text-gray-700 py-1 px-3 rounded"
                                      >
                                        Delete
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
                                <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                                  Actions
                                </button>
                              </Popover>

                              <Modal
                                title="Confirmation"
                                open={deletebox}
                                footer={null}
                                closeIcon={false}
                              >
                                <div>
                                  <p>
                                    Are you sure you want to delete this Sale
                                    entry
                                  </p>
                                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                    Warning: Linked credit/debit note entries in
                                    return entry will also be deleted.
                                    <br />
                                    {isDeleteImpactLoading
                                      ? "Checking linked notes..."
                                      : `Credit Notes: ${deleteImpact.creditNoteCount}, Debit Notes: ${deleteImpact.debitNoteCount}, Total linked entries: ${deleteImpact.totalLinkedCount}`}
                                  </p>
                                </div>
                                <div className="flex  gap-2 mt-2">
                                  <div className="grow"></div>
                                  <button
                                    className="py-1 rounded-md border px-4 text-sm text-gray-600"
                                    onClick={() => {
                                      setDeleteBox(false);
                                      setDeleteRecords([]);
                                      setDeleteImpact({
                                        creditNoteCount: 0,
                                        debitNoteCount: 0,
                                        totalLinkedCount: 0,
                                      });
                                    }}
                                  >
                                    Close
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (deleteRecords.length > 0) {
                                        delete_sale_entry(deleteRecords);
                                      }
                                    }}
                                    className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
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
            <span className="text-slate-800 font-semibold">Sales Help</span>
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
                {salesChatOptions.map((option) => (
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
