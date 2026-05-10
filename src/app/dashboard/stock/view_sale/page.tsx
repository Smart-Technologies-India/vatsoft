"use client";
// import GetUserDvat04 from "@/action/dvat/getuserdvat";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import DeleteSale from "@/action/stock/deletesale";
import GetSaleDeleteImpact from "@/action/stock/getsaledeleteimpact";
import GetUserDailySale, {
  GroupedDailySale,
} from "@/action/stock/getuserdailysale";
import { DailySaleProvider } from "@/components/forms/dailysale/dailysale";
import { CreditNoteDrawer } from "@/components/forms/creditnote/creditnotedrawer";
import { DebitNoteDrawer } from "@/components/forms/debitnote/debitnotedrawer";
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
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import GetAllStock from "@/action/stock/getallstock";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import GetAllDvat04 from "@/action/dvat/getalldvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import * as XLSX from "xlsx";

const DocumentWiseDetails = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sheetRef = useRef<HTMLInputElement>(null);
  const [sheetFileName, setSheetFileName] = useState<string>("");

  interface BulkSheetData {
    tin_number: string;
    invoice_date: Date;
    invoice_date_display: string;
    invoice_no: string;
    item_code: number;
    quantity: number;
    total_invoice_value: number;
    seller_tin_id: number | null;
    commodity_name: string | null;
    tax_percent: string | null;
    mrp: string | null;
    crate_size: number | null;
    error: boolean;
    errorname: string;
  }
  const [tabledata, setTableData] = useState<BulkSheetData[]>([]);

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

  const getExpectedProductType = () => {
    if (
      dvatdata?.commodity === "OIDC" ||
      dvatdata?.commodity === "MANUFACTURER"
    ) {
      return "LIQUOR";
    }

    return dvatdata?.commodity;
  };

  const downloadBulkTemplate = () => {
    const rows = [
      {
        "TIN Number": "11000000001",
        "Invoice No": "INV1001",
        "Invoice Date": "05/05/2026",
        "Item Code": 1,
        Quantity: 100,
        "Total Invoice Value": 12000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Upload");
    XLSX.writeFile(workbook, "vatsoft_sale_template.xlsx");
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
    setIsLoading(true);

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

      const expectedProductType = getExpectedProductType();

      // Build tinNumber → commodity map from all dvat04 records
      const tinCommodityMap: { [tinNumber: string]: string | null } = {};
      const allDvatResponse = await GetAllDvat04({});
      if (allDvatResponse.status && allDvatResponse.data) {
        for (const d of allDvatResponse.data) {
          if (d.tinNumber) {
            tinCommodityMap[d.tinNumber] = d.commodity ?? null;
          }
        }
      }

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

          const isAllNull =
            tin_number === "" &&
            invoice_no === "" &&
            normalizeText(invoice_date_raw) === "" &&
            normalizeText(item_code_raw) === "" &&
            normalizeText(quantity_raw) === "" &&
            normalizeText(total_invoice_value_raw) === "";

          if (isAllNull) return null;

          const errors: string[] = [];

          if (!/^\d{11}$/.test(tin_number)) {
            errors.push("* TIN Number must be 11 digits");
          } else if (dvatdata?.tinNumber && tin_number === dvatdata.tinNumber) {
            errors.push("* TIN Number cannot be your own TIN");
          } else if (
            dvatdata?.commodity &&
            tinCommodityMap[tin_number] !== undefined &&
            tinCommodityMap[tin_number] !== dvatdata.commodity
          ) {
            errors.push(
              `* Buyer TIN commodity (${tinCommodityMap[tin_number]?.toLowerCase()}) does not match your commodity (${dvatdata.commodity.toLowerCase()})`,
            );
          }

          const sellerTin = tindata.find(
            (tin) => tin.tin_number === tin_number,
          );
          if (!sellerTin) {
            errors.push("* TIN Number not found in TIN master");
          }

          if (!/^[A-Za-z0-9]+$/.test(invoice_no)) {
            errors.push("* Invoice No must be alphanumeric");
          }

          const invoice_date = parseDateDDMMYYYY(invoice_date_raw);
          if (!invoice_date) {
            errors.push("* Invoice Date must be DD/MM/YYYY");
          }

          const item_code = parseExcelNumber(item_code_raw);
          if (!Number.isInteger(item_code) || item_code <= 0) {
            errors.push("* Item Code must be a valid number");
          }

          const selectedCommodity = commodityMaster.find(
            (commodity) =>
              commodity.id === item_code &&
              commodity.product_type === expectedProductType,
          );

          if (!selectedCommodity) {
            errors.push(
              `* Item Code not found in ${(
                expectedProductType ?? "selected"
              ).toLowerCase()} commodity master`,
            );
          }

          const quantity = parseExcelNumber(quantity_raw);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push("* Quantity must be greater than 0");
          }

          const total_invoice_value = parseExcelNumber(total_invoice_value_raw);
          if (
            !Number.isFinite(total_invoice_value) ||
            total_invoice_value <= 0
          ) {
            errors.push("* Total Invoice Value must be greater than 0");
          }

          if (
            selectedCommodity &&
            Number.isFinite(quantity) &&
            quantity > 0 &&
            Number.isFinite(total_invoice_value) &&
            total_invoice_value > 0
          ) {
            const mrp = parseExcelNumber(selectedCommodity.mrp);
            const crateSize =
              selectedCommodity.crate_size > 0
                ? selectedCommodity.crate_size
                : 1;
            const minUnitPrice = mrp / crateSize;
            const pricePerUnit = total_invoice_value / quantity;

            if (
              Number.isFinite(mrp) &&
              Number.isFinite(minUnitPrice) &&
              pricePerUnit < minUnitPrice
            ) {
              errors.push("* Given item price must not be less than MRP");
            }
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

          return {
            tin_number,
            invoice_date: invoice_date ?? new Date(),
            invoice_date_display: invoice_date
              ? formatDateDDMMYYYY(invoice_date)
              : "-",
            invoice_no,
            item_code: Number.isFinite(item_code) ? item_code : 0,
            quantity: Number.isFinite(quantity) ? quantity : 0,
            total_invoice_value: Number.isFinite(total_invoice_value)
              ? total_invoice_value
              : 0,
            seller_tin_id: sellerTin?.id ?? null,
            commodity_name: selectedCommodity?.product_name ?? null,
            tax_percent: selectedCommodity?.taxable_at ?? null,
            mrp: selectedCommodity?.mrp ?? null,
            crate_size: selectedCommodity?.crate_size ?? null,
            error: errors.length > 0,
            errorname: errors.join("\n"),
          } as BulkSheetData;
        })
        .filter((val): val is BulkSheetData => val !== null);

      if (parsedRows.length > 0) {
        const firstMonth = parsedRows[0].invoice_date.getMonth();
        const firstYear = parsedRows[0].invoice_date.getFullYear();
        const mixedMonths = parsedRows.some(
          (row) =>
            row.invoice_date.getMonth() !== firstMonth ||
            row.invoice_date.getFullYear() !== firstYear,
        );

        if (mixedMonths) {
          parsedRows.forEach((row) => {
            row.error = true;
            row.errorname = row.errorname
              ? row.errorname +
                "\n* Invoice month of all entries must be the same"
              : "* Invoice month of all entries must be the same";
          });
        }
      }

      // Cross-row check: stock availability per item_code
      if (dvatdata) {
        const stockResponse = await GetAllStock({
          dvatid: dvatdata.id,
          take: 10000,
          skip: 0,
        });
        if (stockResponse.status && stockResponse.data?.result) {
          const stockMap: { [commodityId: number]: number } = {};
          for (const s of stockResponse.data.result) {
            stockMap[s.commodity_masterId] =
              (stockMap[s.commodity_masterId] ?? 0) + s.quantity;
          }

          // Sum quantities per item_code across rows with valid item codes
          const uploadQuantityMap: { [itemCode: number]: number } = {};
          for (const row of parsedRows) {
            if (row.item_code > 0) {
              uploadQuantityMap[row.item_code] =
                (uploadQuantityMap[row.item_code] ?? 0) + row.quantity;
            }
          }

          parsedRows.forEach((row) => {
            if (row.item_code > 0) {
              const available = stockMap[row.item_code] ?? 0;
              const totalRequested = uploadQuantityMap[row.item_code] ?? 0;
              if (totalRequested > available) {
                if (!row.errorname.includes("* Insufficient stock")) {
                  row.error = true;
                  row.errorname = row.errorname
                    ? row.errorname +
                      `\n* Insufficient stock (available: ${available})`
                    : `* Insufficient stock (available: ${available})`;
                }
              }
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
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master>
  >([]);

  const [tindata, setTindata] = useState<Array<tin_number_master>>([]);

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
    take: 10,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [dailySale, setDailySale] = useState<Array<GroupedDailySale>>([]);

  const [selectedGroup, setSelectedGroup] = useState<GroupedDailySale | null>(
    null,
  );
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
      const daily_sale_response = await GetUserDailySale({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (daily_sale_response.status && daily_sale_response.data.result) {
        setPaginatin({
          skip: daily_sale_response.data.skip,
          take: daily_sale_response.data.take,
          total: daily_sale_response.data.total,
        });
        setDailySale(daily_sale_response.data.result);
      }
    }
    // setLoading(false);
  };

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

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_sale_response = await GetUserDailySale({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setPaginatin({
            skip: daily_sale_response.data.skip,
            take: daily_sale_response.data.take,
            total: daily_sale_response.data.total,
          });
          setDailySale(daily_sale_response.data.result);
        }
      }

      const commodity_response = await AllCommodityMaster({});

      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }

      const getalltinnumber = await getAllTinNumberMaster();

      if (getalltinnumber.status && getalltinnumber.data) {
        setTindata(getalltinnumber.data);
      }
      setIsLoading(false);
    };
    init();
  }, [userid]);

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
    const daily_sale_response = await GetUserDailySale({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_sale_response.status && daily_sale_response.data.result) {
      setDailySale(daily_sale_response.data.result);
      setPaginatin({
        skip: daily_sale_response.data.skip,
        take: daily_sale_response.data.take,
        total: daily_sale_response.data.total,
      });
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const Convertto31 = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    const response = await ConvertDvat31({
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
  const [deleteRecords, setDeleteRecords] = useState<number[]>([]);
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

    for (const id of ids) {
      const response = await DeleteSale({
        id,
        deletedById: userid,
      });
      if (response.data && response.status) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} sale record(s) deleted successfully.`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} sale record(s) could not be deleted.`);
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

  const handleBulkUpload = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    if (!tabledata || tabledata.length === 0) {
      return toast.error("No data to upload.");
    }

    // If any row has error, prevent upload and show error
    if (tabledata.some((row) => row.error)) {
      toast.error(
        "Please fix all errors in the uploaded data before proceeding.",
      );
      return;
    }

    const entries = tabledata.map((row) => {
      const taxPercent = row.tax_percent ?? "0";
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
        against_cfrom: false,
        is_against_fform: false,
        is_export: false,
      };
    });

    const response = await CreateMultiDailySale({ entries });

    if (response.status && response.data) {
      toast.success("Bulk upload successful.");
      setIsBulkModalOpen(false);
      setSheetFileName("");
      setTableData([]);
      await init();
    } else {
      toast.error(response.message);
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
                        {quantityCount == "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {parseFloat(record.amount).toFixed(2)}
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
                        {record.is_accept ? (
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
        title="Bulk Upload"
        open={isBulkModalOpen}
        onOk={handleBulkUpload}
        width={1000}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setSheetFileName("");
          setTableData([]);
        }}
      >
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="border text-center">Sr. No.</TableHead>
              <TableHead className="border text-center">TIN Number</TableHead>
              <TableHead className="border text-center">Trade Name</TableHead>
              <TableHead className="border text-center">Invoice No.</TableHead>
              <TableHead className="border text-center">Invoice Date</TableHead>
              <TableHead className="border text-center">Item Code</TableHead>
              <TableHead className="border text-center">Product Name</TableHead>
              <TableHead className="border text-center">Quantity</TableHead>
              <TableHead className="border text-center">
                Total Invoice Value
              </TableHead>
              <TableHead className="border text-center">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tabledata.map((val: BulkSheetData, index: number) => (
              <TableRow
                key={index}
                className={`${val.error ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
              >
                <TableCell className="p-2 border text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.tin_number}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {tindata.find((tin) => tin.tin_number == val.tin_number)
                    ?.name_of_dealer ?? "-"}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.invoice_no}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.invoice_date_display}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.item_code}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.commodity_name ?? "-"}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.quantity}
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {val.total_invoice_value}
                </TableCell>
                <TableCell className="p-2 border text-left whitespace-pre-line text-red-600">
                  {val.errorname || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sheetFileName && (
          <p className="mt-3 text-xs text-gray-600">
            Uploaded file: {sheetFileName}
          </p>
        )}
        {tabledata.some((val) => val.error) && (
          <Alert
            title={`${tabledata.filter((val) => val.error).length} row(s) have validation errors.`}
            type="error"
            showIcon
            className="mt-2"
          />
        )}
      </Modal>
      <Modal
        title="Generate DVAT 31/31 A Return"
        open={isModalOpen}
        onOk={Convertto31}
        onCancel={() => {
          setIsModalOpen(false);
          setSheetFileName("");
        }}
      >
        <p>Are you sure you want to generate DVAT 31/31 A Return?</p>
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
            <div className="hidden">
              <input
                type="file"
                ref={sheetRef}
                accept=".xlsx,.xls"
                onChange={handleSheetChange}
              />
            </div>

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
                {dvatdata?.commodity === "OIDC" && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      router.push("/dashboard/stock/tally_sale");
                    }}
                  >
                    Tally Sale
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
                  type="default"
                  onClick={() => sheetRef.current?.click()}
                >
                  Bulk Upload
                </Button>

                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setAddBox(true);
                  }}
                >
                  Add
                </Button>

                {dailySale.length > 0 && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    Generate DVAT 31/31 A
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {dailySale.length}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(
                  dailySale.reduce(
                    (acc, val) => acc + (Number(val.totalTaxableValue) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {dailySale
                  .reduce((acc, val) => acc + val.totalVatAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(
                  dailySale.reduce(
                    (acc, val) => acc + (Number(val.totalInvoiceValue) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>

          {dailySale.length > 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
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
                    {dailySale.map((group: GroupedDailySale, index: number) => (
                      <TableRow
                        key={index}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="p-2 text-center text-xs">
                          {group.count > 1 ? (
                            <button
                              onClick={() => {
                                setSelectedGroup(group);
                                setIsGroupModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {group.count} items
                            </button>
                          ) : (
                            <span>{group.count}</span>
                          )}
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
                                Are you sure you want to delete this Sale entry
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
                    ))}
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
              <p className="text-gray-500 text-sm">There is no daily sale.</p>
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
