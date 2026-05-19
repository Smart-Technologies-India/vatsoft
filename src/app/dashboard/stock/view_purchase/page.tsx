"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUser from "@/action/user/getuser";
import AcceptSale from "@/action/stock/acceptsell";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetPurchaseDeleteImpact from "@/action/stock/getpurchasedeleteimpact";
import GetUserDailyPurchase, {
  DailyPurchaseSummary,
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import CreateMultiDailyPurchase from "@/action/stock/createmultidailypurchase";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import { PurchaseCreditNoteDrawer } from "@/components/forms/purchasecreditnote/purchasecreditnotedrawer";
import { PurchaseDebitNoteDrawer } from "@/components/forms/purchasedebitnote/purchasedebitnotedrawer";
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
  Alert,
  Button,
  Drawer,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
import Lottie from "lottie-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const DocumentWiseDetails = () => {
  const router = useRouter();
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

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [dailyPurchase, setDailyPurchase] = useState<
    Array<GroupedDailyPurchase>
  >([]);
  const [purchaseSummary, setPurchaseSummary] = useState<DailyPurchaseSummary>({
    totalInvoices: 0,
    totalTaxableValue: 0,
    totalVatAmount: 0,
    totalInvoiceValue: 0,
  });

  const [selectedGroup, setSelectedGroup] =
    useState<GroupedDailyPurchase | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

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
      text: "Welcome to Purchase Help. Ask questions about managing your purchase invoices.",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messageIdRef = useRef(1);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const normalizedStatus = (dvatdata?.status ?? "").toUpperCase();

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

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04();

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      const daily_purchase_response = await GetUserDailyPurchase({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (
        daily_purchase_response.status &&
        daily_purchase_response.data.result
      ) {
        setPaginatin({
          skip: daily_purchase_response.data.skip,
          take: daily_purchase_response.data.take,
          total: daily_purchase_response.data.total,
        });
        setDailyPurchase(daily_purchase_response.data.result);
        setPurchaseSummary(
          (daily_purchase_response.data.summary as
            | DailyPurchaseSummary
            | undefined) ?? {
            totalInvoices: 0,
            totalTaxableValue: 0,
            totalVatAmount: 0,
            totalInvoiceValue: 0,
          },
        );
      }
    }

    const commodity_response = await AllCommodityMaster({});
    if (commodity_response.status && commodity_response.data) {
      setCommodityMaster(commodity_response.data);
    }

    const tin_response = await getAllTinNumberMaster();
    if (tin_response.status && tin_response.data) {
      setTindata(tin_response.data);
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
      const userresponse = await GetUser({ id: authResponse.data });
      if (userresponse.status) setUser(userresponse.data!);

      const dvat_response = await GetUserDvat04();

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_purchase_response = await GetUserDailyPurchase({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (
          daily_purchase_response.status &&
          daily_purchase_response.data.result
        ) {
          setPaginatin({
            skip: daily_purchase_response.data.skip,
            take: daily_purchase_response.data.take,
            total: daily_purchase_response.data.total,
          });
          setDailyPurchase(daily_purchase_response.data.result);
          setPurchaseSummary(
            (daily_purchase_response.data.summary as
              | DailyPurchaseSummary
              | undefined) ?? {
              totalInvoices: 0,
              totalTaxableValue: 0,
              totalVatAmount: 0,
              totalInvoiceValue: 0,
            },
          );
        }
      }

      const commodity_response = await AllCommodityMaster({});
      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }

      const tin_response = await getAllTinNumberMaster();
      if (tin_response.status && tin_response.data) {
        setTindata(tin_response.data);
      }

      setLoading(false);
    };
    init();
  }, [userid, router]);

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
    const daily_purchase_response = await GetUserDailyPurchase({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_purchase_response.status && daily_purchase_response.data.result) {
      setDailyPurchase(daily_purchase_response.data.result);
      setPaginatin({
        skip: daily_purchase_response.data.skip,
        take: daily_purchase_response.data.take,
        total: daily_purchase_response.data.total,
      });
      setPurchaseSummary(
        (daily_purchase_response.data.summary as
          | DailyPurchaseSummary
          | undefined) ?? {
          totalInvoices: 0,
          totalTaxableValue: 0,
          totalVatAmount: 0,
          totalInvoiceValue: 0,
        },
      );
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creditNoteBox, setCreditNoteBox] = useState<boolean>(false);
  const [creditNoteGroup, setCreditNoteGroup] =
    useState<GroupedDailyPurchase | null>(null);
  const [debitNoteBox, setDebitNoteBox] = useState<boolean>(false);
  const [debitNoteGroup, setDebitNoteGroup] =
    useState<GroupedDailyPurchase | null>(null);

  const Convertto30a = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }
    const response = await ConvertDvat30A({
      createdById: userid,
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
      deletedById: userid,
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
  const [isGroupAcceptLoading, setIsGroupAcceptLoading] = useState(false);
  const [isSingleAcceptLoading, setIsSingleAcceptLoading] =
    useState<boolean>(false);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    [],
  );
  const [tindata, setTindata] = useState<tin_number_master[]>([]);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [sheetFileName, setSheetFileName] = useState<string>("");
  const sheetRef = useRef<HTMLInputElement>(null);

  interface BulkSheetData {
    tin_number: string;
    invoice_no: string;
    invoice_date: Date;
    invoice_date_display: string;
    item_code: number;
    quantity: number;
    total_invoice_value: number;
    against_cfrom: boolean;
    seller_tin_id: number | null;
    commodity_name: string | null;
    tax_percent: string | null;
    error: boolean;
    errorname: string;
  }

  const [tabledata, setTableData] = useState<BulkSheetData[]>([]);
  const hasBulkUploadErrors = tabledata.some((row) => row.error);

  const readSheetField = (row: Record<string, unknown>, labels: string[]) => {
    for (const label of labels) {
      if (row[label] !== undefined) return row[label];
    }

    const normalizedLabels = labels.map((label) =>
      label.trim().toLowerCase().replace(/\s+/g, " "),
    );

    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, " ");
      if (normalizedLabels.includes(normalizedKey)) {
        return row[key];
      }
    }

    return undefined;
  };

  const normalizeText = (value: unknown): string =>
    value == null ? "" : String(value).trim();

  const parseExcelNumber = (value: unknown): number => {
    if (typeof value === "number") return value;
    const text = normalizeText(value).replace(/,/g, "");
    if (text === "") return NaN;
    return Number(text);
  };

  const parseDateDDMMYYYY = (value: unknown): Date | null => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }

    const raw = normalizeText(value);
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  };

  const formatDateDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseBooleanValue = (value: unknown): boolean | null => {
    if (typeof value === "boolean") return value;

    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }

    const normalized = normalizeText(value).toLowerCase();
    if (["na", "n/a", "nil", ""].includes(normalized)) return null;
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
    return null;
  };

  const downloadBulkTemplate = () => {
    const rows = [
      {
        "Entry Note": "Same invoice with multiple items -> repeat TIN/Invoice No/Invoice Date",
        "TIN Number": "11000000001",
        "Invoice No": "INV1001-A",
        "Invoice Date": "04/05/2026",
        "Item Code": 1,
        Quantity: 24,
        "Total Invoice Value": 12000,
        "Is Against C Form": "false",
      },
      {
        "Entry Note": "Second item of same invoice (keep TIN/Invoice No/Invoice Date same)",
        "TIN Number": "11000000001",
        "Invoice No": "INV1001-A",
        "Invoice Date": "04/05/2026",
        "Item Code": 2,
        Quantity: 12,
        "Total Invoice Value": 8600,
        "Is Against C Form": "false",
      },
      {
        "Entry Note": "Different invoice example",
        "TIN Number": "12000000002",
        "Invoice No": "INV1002-B",
        "Invoice Date": "05/05/2026",
        "Item Code": 3,
        Quantity: 30,
        "Total Invoice Value": 15000,
        "Is Against C Form": "true",
      },
    ];

    const instructionsRows = [
      {
        Field: "TIN Number",
        "What to fill": "Seller TIN (11 digits)",
        Rules:
          "Do not enter your own TIN. Must exist in TIN master. Repeat same TIN for all items of same invoice.",
      },
      {
        Field: "Invoice No",
        "What to fill": "Invoice number",
        Rules:
          "If one invoice has multiple items, keep same Invoice No for all those rows.",
      },
      {
        Field: "Invoice Date",
        "What to fill": "Date in DD/MM/YYYY",
        Rules:
          "If one invoice has multiple items, keep same date for all those rows.",
      },
      {
        Field: "Item Code",
        "What to fill": "Commodity Item Code",
        Rules:
          "Use valid item code from commodity master.",
      },
      {
        Field: "Quantity",
        "What to fill": "Numeric quantity in pieces",
        Rules:
          "Enter pieces only (not crate, not words like twenty four).",
      },
      {
        Field: "Total Invoice Value",
        "What to fill": "Item-wise amount inclusive of VAT",
        Rules:
          "If multiple items in same invoice, enter value separately for each item row. Must be inclusive of VAT.",
      },
      {
        Field: "Is Against C Form",
        "What to fill": "true or false",
        Rules:
          "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Upload");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    XLSX.writeFile(workbook, "vatsoft_purchase_template.xlsx");
  };

  const handleSheetChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files?.length == 0) {
      event.target.value = "";
      return;
    }

    const file = event.target.files![0];
    setSheetFileName(file.name);
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        toast.error("No sheet found in uploaded file.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
          raw: true,
        },
      );

      if (rows.length === 0) {
        toast.error("Uploaded sheet is empty.");
        setTableData([]);
        return;
      }

      const groupedData: { [key: string]: number } = {};

      rows.forEach((row) => {
        const key = [
          normalizeText(
            readSheetField(row, [
              "TIN Number",
              "tin number",
              "tin_number",
              "tin",
            ]),
          ),
          normalizeText(
            readSheetField(row, [
              "Invoice No",
              "invoice no",
              "invoice_no",
              "invoice number",
            ]),
          ),
          normalizeText(
            readSheetField(row, ["Item Code", "item code", "item_code"]),
          ),
          normalizeText(readSheetField(row, ["Quantity", "quantity"])),
          normalizeText(
            readSheetField(row, [
              "Total Invoice Value",
              "total invoice value",
              "total_invoice_value",
            ]),
          ),
        ].join("|");

        groupedData[key] = (groupedData[key] ?? 0) + 1;
      });

      const parsedRows = rows
        .map((row) => {
          const tin_number = normalizeText(
            readSheetField(row, [
              "TIN Number",
              "tin number",
              "tin_number",
              "tin",
            ]),
          );
          const invoice_no = normalizeText(
            readSheetField(row, [
              "Invoice No",
              "invoice no",
              "invoice_no",
              "invoice number",
            ]),
          );
          const invoice_date_raw = readSheetField(row, [
            "Invoice Date",
            "invoice date",
            "invoice_date",
          ]);
          const item_code_raw = readSheetField(row, [
            "Item Code",
            "item code",
            "item_code",
          ]);
          const quantity_raw = readSheetField(row, ["Quantity", "quantity"]);
          const total_invoice_value_raw = readSheetField(row, [
            "Total Invoice Value",
            "total invoice value",
            "total_invoice_value",
          ]);
          const against_cfrom_raw = readSheetField(row, [
            "Is Against C Form",
            "is against c form",
            "is_against_c_form",
            "Is Against C From",
            "is against c from",
            "is_against_c_from",
            "Against C Form",
            "against c form",
          ]);

          const isAllNull =
            tin_number === "" &&
            invoice_no === "" &&
            normalizeText(invoice_date_raw) === "" &&
            normalizeText(item_code_raw) === "" &&
            normalizeText(quantity_raw) === "" &&
            normalizeText(total_invoice_value_raw) === "" &&
            normalizeText(against_cfrom_raw) === "";

          if (isAllNull) return null;

          // const ALLOWED_ITEM_CODES = [1, 2, 3, 4, 748, 749, 1245, 1246, 1798];
          const errors: string[] = [];

          if (!/^\d{11}$/.test(tin_number)) {
            errors.push("* TIN Number must be 11 digits");
          } else if (
            tin_number.startsWith("25") ||
            tin_number.startsWith("26")
          ) {
            errors.push("* Local purchase not allowed");
          } else if (dvatdata?.tinNumber && tin_number === dvatdata.tinNumber) {
            errors.push("* TIN Number cannot be your own TIN");
          }

          const sellerTin = tindata.find(
            (tin) => tin.tin_number === tin_number,
          );
          if (!sellerTin) {
            errors.push("* TIN Number not found in TIN master");
          }

          // if (!/^[A-Za-z0-9]+$/.test(invoice_no)) {
          //   errors.push("* Invoice No must be alphanumeric");
          // }

          const invoice_date = parseDateDDMMYYYY(invoice_date_raw);
          if (!invoice_date) {
            errors.push("* Invoice Date must be DD/MM/YYYY");
          }

          const item_code = Number(item_code_raw);
          if (!Number.isInteger(item_code) || item_code <= 0) {
            errors.push("* Item Code must be a valid number");
          }

          const userCommodityType = dvatdata?.commodity;

          const selectedCommodity = commodityMaster.find(
            (commodity) =>
              commodity.id === item_code &&
              commodity.product_type === userCommodityType,
          );

          if (!selectedCommodity) {
            errors.push(
              `* Item Code not found in ${(
                userCommodityType ?? "selected"
              ).toLowerCase()} commodity master`,
            );
          }

          const quantity = parseExcelNumber(quantity_raw);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push(
              "* Quantity must be a number in pieces and greater than 0",
            );
          } else if (!Number.isInteger(quantity)) {
            errors.push("* Quantity must be a whole number in pieces");
          }

          const total_invoice_value = parseExcelNumber(total_invoice_value_raw);
          if (
            !Number.isFinite(total_invoice_value) ||
            total_invoice_value <= 0
          ) {
            errors.push("* Total Invoice Value must be greater than 0");
          }

          // if (
          //   selectedCommodity &&
          //   Number.isFinite(quantity) &&
          //   quantity > 0 &&
          //   Number.isFinite(total_invoice_value) &&
          //   total_invoice_value > 0
          // ) {
          //   const mrp = parseExcelNumber(selectedCommodity.mrp);
          //   const pricePerUnit = total_invoice_value / quantity;

          //   if (
          //     Number.isFinite(mrp) &&
          //     pricePerUnit < mrp / selectedCommodity.crate_size
          //   ) {
          //     errors.push(`* Given item price must not be less than MRP`);
          //   }
          // }

          const parsedAgainstCFrom = parseBooleanValue(against_cfrom_raw);
          if (parsedAgainstCFrom == null) {
            errors.push(
              "* Is Against C Form must be true/false (yes/no/1/0 also accepted)",
            );
          }

          const duplicateKey = [
            tin_number,
            invoice_no,
            normalizeText(item_code_raw),
            normalizeText(quantity_raw),
            normalizeText(total_invoice_value_raw),
          ].join("|");

          if ((groupedData[duplicateKey] ?? 0) > 1) {
            errors.push("* Duplicate row in sheet");
          }

          const against_cfrom = parsedAgainstCFrom ?? false;

          return {
            tin_number,
            invoice_no,
            invoice_date: invoice_date ?? new Date(),
            invoice_date_display: invoice_date
              ? formatDateDDMMYYYY(invoice_date)
              : "-",
            item_code: Number.isFinite(item_code) ? item_code : 0,
            quantity: Number.isFinite(quantity) ? quantity : 0,
            total_invoice_value: Number.isFinite(total_invoice_value)
              ? total_invoice_value
              : 0,
            against_cfrom,
            seller_tin_id: sellerTin?.id ?? null,
            commodity_name: selectedCommodity?.product_name ?? null,
            tax_percent: selectedCommodity?.taxable_at ?? null,
            error: errors.length > 0,
            errorname: errors.join("\n"),
          } as BulkSheetData;
        })
        .filter((val): val is BulkSheetData => val !== null);

      // Cross-row check: all invoice dates must be in the same month
      const validDates = parsedRows.filter((r) => !r.error || r.invoice_date);
      if (validDates.length > 0) {
        const firstMonth = parsedRows[0].invoice_date.getMonth();
        const firstYear = parsedRows[0].invoice_date.getFullYear();
        const mixedMonths = parsedRows.some(
          (r) =>
            r.invoice_date.getMonth() !== firstMonth ||
            r.invoice_date.getFullYear() !== firstYear,
        );
        if (mixedMonths) {
          parsedRows.forEach((r) => {
            if (
              !r.errorname.includes(
                "* Invoice month of all entries must be the same",
              )
            ) {
              r.error = true;
              r.errorname = r.errorname
                ? r.errorname +
                  "\n* Invoice month of all entries must be the same"
                : "* Invoice month of all entries must be the same";
            }
          });
        }
      }

      if (parsedRows.length === 0) {
        toast.error("No valid rows found in sheet.");
        setTableData([]);
        return;
      }

      setTableData(parsedRows);
      setIsBulkModalOpen(true);
    } catch {
      toast.error("Unable to parse Excel file. Please use the template.");
      setTableData([]);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleBulkUpload = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    if (!tabledata || tabledata.length === 0) {
      toast.error("No data to upload.");
      return;
    }

    if (tabledata.some((row) => row.error)) {
      toast.error("Please fix all errors before uploading.");
      return;
    }

    const entries = tabledata.map((row) => {
      const taxPercent = row.against_cfrom ? "2" : (row.tax_percent ?? "0");
      const totalInvoice = Number(row.total_invoice_value);
      const taxableValue = (totalInvoice / (100 + Number(taxPercent))) * 100;
      const vatValue = totalInvoice - taxableValue;
      const amountUnit = totalInvoice / Number(row.quantity);

      const invoiceDate = new Date(
        new Date(row.invoice_date).toISOString().split("T")[0],
      );
      invoiceDate.setDate(invoiceDate.getDate() + 1);

      return {
        dvatid: dvatdata.id,
        commodityid: row.item_code,
        quantity: Number(row.quantity),
        seller_tin_id: row.seller_tin_id!,
        invoice_number: row.invoice_no,
        invoice_date: invoiceDate,
        tax_percent: taxPercent,
        amount: taxableValue.toFixed(2),
        vatamount: vatValue.toFixed(2),
        amount_unit: amountUnit.toFixed(2),
        createdById: userid,
        against_cfrom: row.against_cfrom,
      };
    });

    const response = await CreateMultiDailyPurchase({ entries });

    if (response.status && response.data) {
      toast.success("Bulk upload successful.");
      setIsBulkModalOpen(false);
      setSheetFileName("");
      setTableData([]);
      await init();
      return;
    }

    toast.error(response.message);
  };

  const downloadDailyPurchaseReport = () => {
    if (dailyPurchase.length === 0) {
      toast.info("No purchase records found to export.");
      return;
    }

    const rows = dailyPurchase.map((group, index) => ({
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

  const handleAcceptAllRecords = () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    const pendingRecords = dailyPurchase
      .flatMap((group) => group.records)
      .filter(
        (record) =>
          (record.seller_tin_number.tin_number.startsWith("25") ||
            record.seller_tin_number.tin_number.startsWith("26")) &&
          !record.is_accept,
      );

    if (pendingRecords.length === 0) {
      toast.info("No pending acceptable purchase records found.");
      return;
    }

    setIsAcceptAllModalOpen(true);
  };

  const confirmAcceptAllRecords = async () => {
    if (!dvatdata) {
      toast.error("DVAT not found.");
      return;
    }

    const pendingRecords = dailyPurchase
      .flatMap((group) => group.records)
      .filter(
        (record) =>
          (record.seller_tin_number.tin_number.startsWith("25") ||
            record.seller_tin_number.tin_number.startsWith("26")) &&
          !record.is_accept,
      );

    if (pendingRecords.length === 0) {
      setIsAcceptAllModalOpen(false);
      toast.info("No pending acceptable purchase records found.");
      return;
    }

    setIsAcceptAllLoading(true);

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
                        {quantityCount == "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{parseFloat(record.amount).toFixed(2)}
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
        <DailyPurchaseMasterProvider
          userid={userid}
          setAddBox={setAddBox}
          init={init}
        />
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
        title="Generate DVAT 30/30 A"
        open={isModalOpen}
        onOk={Convertto30a}
        onCancel={() => {
          setIsModalOpen(false);
        }}
        okText="Generate"
        cancelText="Cancel"
      >
        <p className="text-sm text-gray-600 py-2">
          Are you sure you want to Generate DVAT 30/30 A Return?
        </p>
      </Modal>

      <Modal
        title="Accept all pending purchase invoices"
        open={isAcceptAllModalOpen}
        onOk={confirmAcceptAllRecords}
        onCancel={() => setIsAcceptAllModalOpen(false)}
        confirmLoading={isAcceptAllLoading}
        okText="Yes, Accept All"
        cancelText="Cancel"
      >
        <p className="text-sm text-slate-600 py-2">
          This is an important step. Once accepted, these changes cannot be
          reversed.
        </p>
      </Modal>

      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">Bulk Upload</div>
        }
        open={isBulkModalOpen}
        onOk={handleBulkUpload}
        width={1100}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setSheetFileName("");
          setTableData([]);
        }}
        okText="Upload"
        cancelText="Cancel"
        okButtonProps={{
          className: "bg-blue-600 hover:bg-blue-700",
          style: hasBulkUploadErrors ? { display: "none" } : undefined,
        }}
      >
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <Table className="border border-gray-200 mt-4">
            <TableHeader>
              <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Sr. No.
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  TIN Number
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Trade Name
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Invoice No.
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Invoice Date
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Item Code
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Item Name
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Quantity
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Total Invoice Value
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Is Against C From
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Error
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabledata.map((val: BulkSheetData, index: number) => (
                <TableRow
                  key={index}
                  className={`${
                    val.error
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  } transition-colors`}
                >
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.tin_number}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.seller_tin_id
                      ? (tindata.find((tin) => tin.id == val.seller_tin_id)
                          ?.name_of_dealer ?? "-")
                      : "-"}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.invoice_no}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.invoice_date_display}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.item_code}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.commodity_name ?? "-"}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.quantity}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.total_invoice_value}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-center text-sm">
                    {val.against_cfrom ? "true" : "false"}
                  </TableCell>
                  <TableCell className="p-3 border border-gray-200 text-left text-sm text-red-600 whitespace-pre-line">
                    {val.errorname || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sheetFileName && (
          <p className="mt-3 text-xs text-gray-600">
            Uploaded file: {sheetFileName}
          </p>
        )}
        {hasBulkUploadErrors && (
          <Alert
            title={`${tabledata.filter((val) => val.error).length} row(s) have validation errors.`}
            type="error"
            showIcon
            className="mt-4 rounded-lg"
          />
        )}
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className=" mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="hidden">
              <input
                type="file"
                ref={sheetRef}
                accept=".xlsx,.xls"
                onChange={handleSheetChange}
              />
            </div>

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

                {dvatdata?.commodity === "OIDC" && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      router.push("/dashboard/stock/tally_purchase");
                    }}
                  >
                    Tally Purchase
                  </Button>
                )}

                {dailyPurchase.length > 0 && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    Generate DVAT 30/30 A
                  </Button>
                )}

                {hasPendingAcceptable && (
                  <Button
                    size="small"
                    type="default"
                    danger
                    loading={isAcceptAllLoading}
                    onClick={handleAcceptAllRecords}
                  >
                    Accept All
                  </Button>
                )}
                <Button
                  size="small"
                  type="default"
                  onClick={downloadBulkTemplate}
                >
                  Download Sample
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => sheetRef.current?.click()}
                >
                  Bulk Upload
                </Button>

                <Button
                  size="small"
                  type="default"
                  onClick={downloadDailyPurchaseReport}
                >
                  Purchase Report
                </Button>

                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setAddBox(true);
                  }}
                >
                  Add Purchase
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {purchaseSummary.totalInvoices}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{purchaseSummary.totalInvoiceValue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{purchaseSummary.totalVatAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹{purchaseSummary.totalTaxableValue.toFixed(2)}
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
                    {dailyPurchase.map(
                      (group: GroupedDailyPurchase, index: number) => (
                        <TableRow
                          key={index}
                          className="border-b hover:bg-gray-50"
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
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-3 py-2 border-t bg-gray-50">
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
        <button
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
        </button>

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
