"use client";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import DeleteSale from "@/action/stock/deletesale";
import GetSaleDeleteImpact from "@/action/stock/getsaledeleteimpact";
import GetUserDailySale, {
  DailySaleSummary,
  GroupedDailySale,
} from "@/action/stock/getuserdailysale";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import GetAllStock from "@/action/stock/getallstock";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import GetAllDvat04 from "@/action/dvat/getalldvat";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import * as XLSX from "xlsx";

const DocumentWiseDetails = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toolbarActionsOpen, setToolbarActionsOpen] = useState(false);

  const sheetRef = useRef<HTMLInputElement>(null);
  const [sheetFileName, setSheetFileName] = useState<string>("");

  interface BulkSheetData {
    tin_number: string;
    invoice_date: Date;
    invoice_date_display: string;
    invoice_no: string;
    item_code: number;
    quantity: number; // Always in pieces for database storage
    quantity_in_crates: number | null; // Original crate quantity (for MANUFACTURER/WHOLESALER)
    total_invoice_value: number;
    sale_type: string;
    against_cfrom: boolean;
    is_against_fform: boolean;
    is_exempt: boolean;
    is_against_iform: boolean;
    is_h_export: boolean;
    is_against_e1: boolean;
    is_export: boolean;
    seller_tin_id: number | null;
    commodity_name: string | null;
    tax_percent: string | null;
    mrp: string | null;
    crate_size: number | null;
    error: boolean;
    errorname: string;
  }

  type BulkUploadSortKey =
    | "sr_no"
    | "tin_number"
    | "trade_name"
    | "invoice_no"
    | "invoice_date"
    | "item_code"
    | "product_name"
    | "quantity"
    | "total_invoice_value"
    | "against_cform";

  type BulkUploadSortOrder = "asc" | "desc";

  const [tabledata, setTableData] = useState<BulkSheetData[]>([]);
  const hasBulkUploadErrors = tabledata.some((row) => row.error);
  const [bulkSearchTerm, setBulkSearchTerm] = useState<string>("");
  const [bulkSortKey, setBulkSortKey] = useState<BulkUploadSortKey>("sr_no");
  const [bulkSortOrder, setBulkSortOrder] =
    useState<BulkUploadSortOrder>("asc");
  const [bulkCurrentPage, setBulkCurrentPage] = useState<number>(1);
  const [bulkPageSize, setBulkPageSize] = useState<number>(10);
  const [filedReturnPeriods, setFiledReturnPeriods] = useState<Set<string>>(
    new Set(),
  );

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
      return new Date(
        Date.UTC(
          value.getUTCFullYear(),
          value.getUTCMonth(),
          value.getUTCDate(),
        ),
      );
    }

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }

    const raw = normalizeText(value);
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  };

  const formatDateDDMMYYYY = (date: Date): string => {
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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

  const normalizeSaleType = (value: unknown): string | null => {
    const normalized = normalizeText(value)
      .toLowerCase()
      .replace(/[_\s-]+/g, "");

    if (!normalized) return null;

    if (["regular", "reguler"].includes(normalized)) return "REGULAR";
    if (["againstcform", "cform"].includes(normalized)) return "CFORM";
    if (["againstfform", "fform"].includes(normalized)) return "FFORM";
    if (["exempt", "isexempt"].includes(normalized)) return "EXEMPT";
    if (["againstiform", "iform"].includes(normalized)) return "IFORM";
    if (["hexport", "hformexport", "hform", "ishexport"].includes(normalized)) {
      return "H_EXPORT";
    }
    if (["againste1", "againste1form", "e1", "e1form"].includes(normalized)) {
      return "E1";
    }
    if (["export", "isexport", "directexport"].includes(normalized)) {
      return "EXPORT";
    }

    return null;
  };

  const getSaleTypeLabel = (saleType: string): string => {
    switch (saleType) {
      case "CFORM":
        return "Against C Form";
      case "FFORM":
        return "Against F Form";
      case "EXEMPT":
        return "Exempt";
      case "IFORM":
        return "Against I Form";
      case "H_EXPORT":
        return "H Export";
      case "E1":
        return "Against E1";
      case "EXPORT":
        return "Export";
      default:
        return "Regular";
    }
  };

  const getSaleRowTypeLabel = (row: BulkSheetData): string => {
    if (row.against_cfrom) return "Against C Form";
    if (row.is_against_fform) return "Against F Form";
    if (row.is_against_e1) return "Against E1";
    if (row.is_against_iform) return "Against I Form";
    if (row.is_exempt) return "Exempt";
    if (row.is_h_export) return "H Export";
    if (row.is_export) return "Export";
    return "Regular";
  };

  const getExpectedProductType = () => {
    if (
      dvatdata?.commodity === "OIDC" ||
      dvatdata?.commodity === "MANUFACTURER" ||
      dvatdata?.commodity == "WHOLESALER"
    ) {
      return "LIQUOR";
    }

    return dvatdata?.commodity;
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

  const downloadBulkTemplate = () => {
    const isManufacturerCommodity =
      dvatdata?.commodity === "MANUFACTURER" ||
      dvatdata?.commodity === "WHOLESALER";
    const rows = [
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1001-A",
        "Invoice Date": "05/05/2026",
        "Item Code": 1,
        ...(isManufacturerCommodity
          ? { "Quantity in Crates": 2 }
          : { Quantity: 24 }),
        "Total Invoice Value": 12000,
        "Is Against C Form": "false",
        ...(isManufacturerCommodity && {
          "Is Against F Form": "false",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "false",
        }),
      },
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1001-A",
        "Invoice Date": "05/05/2026",
        "Item Code": 2,
        ...(isManufacturerCommodity
          ? { "Quantity in Crates": 1 }
          : { Quantity: 12 }),
        "Total Invoice Value": 8600,
        "Is Against C Form": "true",
        ...(isManufacturerCommodity && {
          "Is Against F Form": "false",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "false",
        }),
      },
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1002-B",
        "Invoice Date": "06/05/2026",
        "Item Code": 3,
        ...(isManufacturerCommodity
          ? { "Quantity in Crates": 3 }
          : { Quantity: 30 }),
        "Total Invoice Value": 15000,
        "Is Against C Form": "false",
        ...(isManufacturerCommodity && {
          "Is Against F Form": "true",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "false",
        }),
      },
    ];

    const instructionsRows = [
      {
        Field: "TIN Number",
        "What to fill": "Buyer TIN (11 digits)",
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
        Rules: "Use valid item code from commodity master.",
      },
      {
        Field: isManufacturerCommodity ? "Quantity in Crates" : "Quantity",
        "What to fill": isManufacturerCommodity
          ? "Numeric quantity in crates"
          : "Numeric quantity in pieces",
        Rules: isManufacturerCommodity
          ? "Enter crates only. System will automatically convert crates to pieces using commodity crate size."
          : "Enter pieces only (not crate, not words like twenty four).",
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
      ...(isManufacturerCommodity
        ? [
            {
              Field: "Is Against F Form",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
            {
              Field: "Is Against E1",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
            {
              Field: "Is Against I Form",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
            {
              Field: "Is Exempt",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
            {
              Field: "Is H Export",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
            {
              Field: "Is Export",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
          ]
        : [
            {
              Field: "Type",
              "What to fill":
                "REGULAR, CFORM, FFORM, EXEMPT, IFORM, H_EXPORT, E1, EXPORT",
              Rules:
                "Only one type is allowed per row. If blank, it will be treated as REGULAR.",
            },
          ]),
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
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
      const saleSheetName =
        workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() === "sale upload",
        ) ??
        workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() !== "instructions",
        ) ??
        workbook.SheetNames[0];

      if (!saleSheetName) {
        toast.error("No sheet found in uploaded file.");
        return;
      }

      const worksheet = workbook.Sheets[saleSheetName];
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
          normalizeText(
            readSheetField(row, [
              "Quantity",
              "quantity",
              "Quantity in Crates",
              "quantity in crates",
              "quantity_in_crates",
            ]),
          ),
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
      const isManufacturerCommodity =
        dvatdata?.commodity === "MANUFACTURER" ||
        dvatdata?.commodity === "WHOLESALER";

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
          const quantity_raw = readSheetField(row, [
            "Quantity",
            "quantity",
            "Quantity in Crates",
            "quantity in crates",
            "quantity_in_crates",
          ]);
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
          const is_against_fform_raw = readSheetField(row, [
            "Is Against F Form",
            "is against f form",
            "is_against_f_form",
            "Against F Form",
            "against f form",
          ]);
          const is_exempt_raw = readSheetField(row, [
            "Is Exempt",
            "is exempt",
            "is_exempt",
            "Exempt",
            "exempt",
          ]);
          const is_against_iform_raw = readSheetField(row, [
            "Is Against I Form",
            "is against i form",
            "is_against_i_form",
            "Against I Form",
            "against i form",
          ]);
          const is_h_export_raw = readSheetField(row, [
            "Is H Export",
            "is h export",
            "is_h_export",
            "H Export",
            "h export",
          ]);
          const is_against_e1_raw = readSheetField(row, [
            "Is Against E1",
            "is against e1",
            "is_against_e1",
            "Against E1",
            "against e1",
          ]);
          const is_export_raw = readSheetField(row, [
            "Is Export",
            "is export",
            "is_export",
          ]);
          const sale_type_raw = readSheetField(row, [
            "Type",
            "type",
            "Sale Type",
            "sale type",
            "sale_type",
          ]);

          const isAllNull =
            tin_number === "" &&
            invoice_no === "" &&
            normalizeText(invoice_date_raw) === "" &&
            normalizeText(item_code_raw) === "" &&
            normalizeText(quantity_raw) === "" &&
            normalizeText(total_invoice_value_raw) === "" &&
            normalizeText(against_cfrom_raw) === "" &&
            normalizeText(is_against_fform_raw) === "" &&
            normalizeText(is_exempt_raw) === "" &&
            normalizeText(is_against_iform_raw) === "" &&
            normalizeText(is_h_export_raw) === "" &&
            normalizeText(is_against_e1_raw) === "" &&
            normalizeText(is_export_raw) === "" &&
            normalizeText(sale_type_raw) === "";

          if (isAllNull) return null;

          const errors: string[] = [];

          if (!/^\d{11}$/.test(tin_number)) {
            errors.push("* TIN Number must be 11 digits");
          } else if (dvatdata?.tinNumber && tin_number === dvatdata.tinNumber) {
            errors.push("* TIN Number cannot be your own TIN");
          } else if (
            dvatdata?.commodity &&
            tinCommodityMap[tin_number] !== undefined &&
            tinCommodityMap[tin_number] !== null
          ) {
            // Validate based on commodity selling rules
            const buyerCommodity = tinCommodityMap[tin_number];
            const sellerCommodity = dvatdata.commodity;
            let isValidSale = false;

            if (sellerCommodity === "FUEL") {
              // FUEL can only sell to FUEL
              isValidSale = [
                "LIQUOR",
                "FUEL",
                "OIDC",
                "MANUFACTURER",
                "WHOLESALER",
              ].includes(buyerCommodity);
            } else if (sellerCommodity === "OIDC") {
              // OIDC can sell to LIQUOR and MANUFACTURER
              isValidSale = ["LIQUOR", "MANUFACTURER", "WHOLESALER"].includes(
                buyerCommodity,
              );
            } else if (
              sellerCommodity === "MANUFACTURER" ||
              sellerCommodity === "WHOLESALER"
            ) {
              // MANUFACTURER can sell to OIDC and LIQUOR
              isValidSale = ["OIDC", "LIQUOR"].includes(buyerCommodity);
            } else if (sellerCommodity === "LIQUOR") {
              // LIQUOR can sell to LIQUOR, MANUFACTURER, OIDC, and WHOLESALER
              isValidSale = [
                "LIQUOR",
                "MANUFACTURER",
                "OIDC",
                "WHOLESALER",
              ].includes(buyerCommodity);
            }

            if (!isValidSale) {
              errors.push(
                `* Buyer TIN commodity (${buyerCommodity.toLowerCase()}) cannot purchase from your commodity (${sellerCommodity.toLowerCase()})`,
              );
            }
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
          } else {
            const invoiceMonth = monthNames[invoice_date.getUTCMonth()];
            const invoiceYear = invoice_date.getUTCFullYear().toString();
            const periodKey = getPeriodKey(invoiceYear, invoiceMonth);

            if (filedReturnPeriods.has(periodKey)) {
              errors.push(
                `* Return already filed for ${invoiceMonth} ${invoiceYear}`,
              );
            }
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

          const parsedQuantity = parseExcelNumber(quantity_raw);
          
          // Store the original crate quantity for MANUFACTURER/WHOLESALER (even if invalid, for display purposes)
          const quantityInCrates = isManufacturerCommodity && Number.isFinite(parsedQuantity) 
            ? parsedQuantity 
            : isManufacturerCommodity && !Number.isFinite(parsedQuantity)
            ? 0
            : null;
          
          if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            errors.push(
              isManufacturerCommodity
                ? "* Quantity must be a number in crates and greater than 0"
                : "* Quantity must be a number in pieces and greater than 0",
            );
          } else if (!Number.isInteger(parsedQuantity)) {
            errors.push(
              isManufacturerCommodity
                ? "* Quantity must be a whole number in crates"
                : "* Quantity must be a whole number in pieces",
            );
          }

          // For MANUFACTURER/WHOLESALER: parsedQuantity is in crates, convert to pieces
          // For others: parsedQuantity is already in pieces
          const normalizedQuantity =
            selectedCommodity && isManufacturerCommodity && Number.isFinite(parsedQuantity)
              ? parsedQuantity *
                (selectedCommodity.crate_size > 0
                  ? selectedCommodity.crate_size
                  : 1)
              : Number.isFinite(parsedQuantity)
              ? parsedQuantity
              : 0;

          const total_invoice_value = parseExcelNumber(total_invoice_value_raw);
          if (
            !Number.isFinite(total_invoice_value) ||
            total_invoice_value <= 0
          ) {
            errors.push("* Total Invoice Value must be greater than 0");
          }

          const parsedAgainstCFrom = parseBooleanValue(against_cfrom_raw);
          const parsedAgainstFForm = parseBooleanValue(is_against_fform_raw);
          const parsedIsExempt = parseBooleanValue(is_exempt_raw);
          const parsedAgainstIForm = parseBooleanValue(is_against_iform_raw);
          const parsedHExport = parseBooleanValue(is_h_export_raw);
          const parsedAgainstE1 = parseBooleanValue(is_against_e1_raw);
          const parsedIsExport = parseBooleanValue(is_export_raw);
          const normalizedType = normalizeSaleType(sale_type_raw);

          const booleanColumnInputs: Array<{
            label: string;
            raw: unknown;
            parsed: boolean | null;
          }> = [
            {
              label: "Is Against C Form",
              raw: against_cfrom_raw,
              parsed: parsedAgainstCFrom,
            },
            {
              label: "Is Against F Form",
              raw: is_against_fform_raw,
              parsed: parsedAgainstFForm,
            },
            {
              label: "Is Exempt",
              raw: is_exempt_raw,
              parsed: parsedIsExempt,
            },
            {
              label: "Is Against I Form",
              raw: is_against_iform_raw,
              parsed: parsedAgainstIForm,
            },
            {
              label: "Is H Export",
              raw: is_h_export_raw,
              parsed: parsedHExport,
            },
            {
              label: "Is Against E1",
              raw: is_against_e1_raw,
              parsed: parsedAgainstE1,
            },
            {
              label: "Is Export",
              raw: is_export_raw,
              parsed: parsedIsExport,
            },
          ];

          for (const input of booleanColumnInputs) {
            if (normalizeText(input.raw) !== "" && input.parsed == null) {
              errors.push(
                `* ${input.label} must be true/false (yes/no/1/0 also accepted)`,
              );
            }
          }

          if (isManufacturerCommodity) {
            const requiredManufacturerColumns = [
              { label: "Is Against C Form", parsed: parsedAgainstCFrom },
              { label: "Is Against F Form", parsed: parsedAgainstFForm },
              { label: "Is Against E1", parsed: parsedAgainstE1 },
              { label: "Is Against I Form", parsed: parsedAgainstIForm },
              { label: "Is Exempt", parsed: parsedIsExempt },
              { label: "Is H Export", parsed: parsedHExport },
              { label: "Is Export", parsed: parsedIsExport },
            ];

            for (const column of requiredManufacturerColumns) {
              if (column.parsed == null) {
                errors.push(
                  `* ${column.label} must be true/false (yes/no/1/0 also accepted)`,
                );
              }
            }
          }

          if (normalizeText(sale_type_raw) !== "" && !normalizedType) {
            errors.push(
              "* Type must be one of: REGULAR, CFORM, FFORM, EXEMPT, IFORM, H_EXPORT, E1, EXPORT",
            );
          }

          const selectedFlags = [
            { key: "CFORM", value: parsedAgainstCFrom },
            { key: "FFORM", value: parsedAgainstFForm },
            { key: "EXEMPT", value: parsedIsExempt },
            { key: "IFORM", value: parsedAgainstIForm },
            { key: "H_EXPORT", value: parsedHExport },
            { key: "E1", value: parsedAgainstE1 },
            { key: "EXPORT", value: parsedIsExport },
          ].filter((item) => item.value === true);

          if (selectedFlags.length > 1) {
            errors.push("* Only one type can be true in a row");
          }

          if (
            normalizedType &&
            selectedFlags.length === 1 &&
            selectedFlags[0].key !== normalizedType
          ) {
            errors.push("* Type and boolean flags do not match for this row");
          }

          if (
            selectedCommodity &&
            Number.isFinite(normalizedQuantity) &&
            normalizedQuantity > 0 &&
            Number.isFinite(total_invoice_value) &&
            total_invoice_value > 0
          ) {
            const mrp = parseExcelNumber(selectedCommodity.mrp);
            const crateSize =
              selectedCommodity.crate_size > 0
                ? selectedCommodity.crate_size
                : 1;
            const minUnitPrice = mrp / crateSize;
            const pricePerUnit = total_invoice_value / normalizedQuantity;

            if (
              Number.isFinite(mrp) &&
              Number.isFinite(minUnitPrice) &&
              pricePerUnit <
                (dvatdata?.commodity == "MANUFACTURER" ||
                dvatdata?.commodity == "WHOLESALER"
                  ? minUnitPrice * 0.25
                  : minUnitPrice * 0.75)
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

          let saleType = "REGULAR";
          if (normalizedType) {
            saleType = normalizedType;
          } else if (selectedFlags.length === 1) {
            saleType = selectedFlags[0].key;
          }

          const against_cfrom = saleType === "CFORM";
          const is_against_fform = saleType === "FFORM";
          const is_exempt = saleType === "EXEMPT";
          const is_against_iform = saleType === "IFORM";
          const is_h_export = saleType === "H_EXPORT";
          const is_against_e1 = saleType === "E1";
          const is_export = saleType === "EXPORT";

          return {
            tin_number,
            invoice_date: invoice_date ?? new Date(Number.NaN),
            invoice_date_display: invoice_date
              ? formatDateDDMMYYYY(invoice_date)
              : "-",
            invoice_no,
            item_code: Number.isFinite(item_code) ? item_code : 0,
            quantity: Number.isFinite(normalizedQuantity)
              ? normalizedQuantity
              : 0,
            quantity_in_crates: quantityInCrates,
            total_invoice_value: Number.isFinite(total_invoice_value)
              ? total_invoice_value
              : 0,
            sale_type: saleType,
            against_cfrom,
            is_against_fform,
            is_exempt,
            is_against_iform,
            is_h_export,
            is_against_e1,
            is_export,
            seller_tin_id: sellerTin?.id ?? null,
            commodity_name: selectedCommodity?.product_name ?? null,
            tax_percent: selectedCommodity?.taxable_at ?? null,
            mrp: selectedCommodity?.mrp ?? null,
            crate_size: selectedCommodity?.crate_size ? Number(selectedCommodity.crate_size) : null,
            error: errors.length > 0,
            errorname: errors.join("\n"),
          } as BulkSheetData;
        })
        .filter((val): val is BulkSheetData => val !== null);

      const validInvoiceDateRows = parsedRows.filter(
        (row) => !Number.isNaN(row.invoice_date.getTime()),
      );

      if (validInvoiceDateRows.length > 0) {
        const firstMonth = validInvoiceDateRows[0].invoice_date.getUTCMonth();
        const firstYear = validInvoiceDateRows[0].invoice_date.getUTCFullYear();
        const mixedMonths = validInvoiceDateRows.some(
          (row) =>
            row.invoice_date.getUTCMonth() !== firstMonth ||
            row.invoice_date.getUTCFullYear() !== firstYear,
        );

        if (mixedMonths) {
          const monthBuckets = validInvoiceDateRows.reduce(
            (acc, row) => {
              const key = `${row.invoice_date.getUTCFullYear()}-${String(
                row.invoice_date.getUTCMonth() + 1,
              ).padStart(2, "0")}`;
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

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
      setBulkSearchTerm("");
      setBulkSortKey("sr_no");
      setBulkSortOrder("asc");
      setBulkCurrentPage(1);
      setBulkPageSize(10);
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

  // Search, Sort, and Filter states for daily sale table
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<
    "invoice_number" | "invoice_date" | "trade_name" | "tin_number" | "invoice_value"
  >("invoice_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [acceptStatusFilter, setAcceptStatusFilter] = useState<"all" | "pending" | "accepted">("all");

  const tinNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const tin of tindata) {
      map[tin.tin_number] = tin.name_of_dealer ?? "-";
    }
    return map;
  }, [tindata]);

  const filteredSortedBulkRows = useMemo(() => {
    const normalizedSearch = bulkSearchTerm.trim().toLowerCase();

    const rows = tabledata
      .map((row, originalIndex) => ({
        row,
        originalIndex,
        tradeName: tinNameMap[row.tin_number] ?? "-",
      }))
      .filter((item) => {
        if (!normalizedSearch) return true;

        const searchableValue = [
          item.row.tin_number,
          item.tradeName,
          item.row.invoice_no,
          item.row.invoice_date_display,
          item.row.item_code?.toString(),
          item.row.commodity_name ?? "",
          item.row.quantity?.toString(),
          item.row.total_invoice_value?.toString(),
          item.row.sale_type,
          item.row.against_cfrom ? "true" : "false",
          item.row.is_against_fform ? "true" : "false",
          item.row.is_against_e1 ? "true" : "false",
          item.row.is_against_iform ? "true" : "false",
          item.row.is_exempt ? "true" : "false",
          item.row.is_h_export ? "true" : "false",
          item.row.is_export ? "true" : "false",
          item.row.errorname ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableValue.includes(normalizedSearch);
      });

    const getSortValue = (item: {
      row: BulkSheetData;
      originalIndex: number;
      tradeName: string;
    }): string | number => {
      switch (bulkSortKey) {
        case "sr_no":
          return item.originalIndex;
        case "tin_number":
          return item.row.tin_number;
        case "trade_name":
          return item.tradeName;
        case "invoice_no":
          return item.row.invoice_no;
        case "invoice_date":
          return item.row.invoice_date_display;
        case "item_code":
          return item.row.item_code ?? 0;
        case "product_name":
          return item.row.commodity_name ?? "";
        case "quantity":
          return item.row.quantity ?? 0;
        case "total_invoice_value":
          return item.row.total_invoice_value ?? 0;
        case "against_cform":
          return item.row.sale_type;
        default:
          return item.originalIndex;
      }
    };

    rows.sort((a, b) => {
      if (a.row.error !== b.row.error) {
        return a.row.error ? -1 : 1;
      }

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      let compareResult = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        compareResult = aValue - bValue;
      } else {
        compareResult = String(aValue).localeCompare(
          String(bValue),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        );
      }

      if (compareResult === 0) {
        compareResult = a.originalIndex - b.originalIndex;
      }

      return bulkSortOrder === "asc" ? compareResult : -compareResult;
    });

    return rows;
  }, [tabledata, tinNameMap, bulkSearchTerm, bulkSortKey, bulkSortOrder]);

  const totalBulkRowsAfterFilter = filteredSortedBulkRows.length;
  const paginatedBulkRows = useMemo(() => {
    const start = (bulkCurrentPage - 1) * bulkPageSize;
    return filteredSortedBulkRows.slice(start, start + bulkPageSize);
  }, [filteredSortedBulkRows, bulkCurrentPage, bulkPageSize]);

  const [dailySale, setDailySale] = useState<Array<GroupedDailySale>>([]);


  useEffect(() => {
    setBulkCurrentPage(1);
  }, [bulkSearchTerm, bulkSortKey, bulkSortOrder, tabledata]);

  // Filtered and sorted daily sale data
  const filteredAndSortedSale = useMemo(() => {
    let filtered = [...dailySale];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.invoice_number.toLowerCase().includes(search) ||
          group.seller_tin_number.name_of_dealer.toLowerCase().includes(search) ||
          group.seller_tin_number.tin_number.includes(search)
      );
    }

    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((group) => {
        const invoiceDate = new Date(group.invoice_date);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      });
    }

    // Apply accept status filter
    if (acceptStatusFilter !== "all") {
      filtered = filtered.filter((group) => {
        const hasPending = group.records.some((r) => !r.is_accept);
        
        if (acceptStatusFilter === "pending") return hasPending;
        if (acceptStatusFilter === "accepted") return !hasPending;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "invoice_number":
          compareValue = a.invoice_number.localeCompare(b.invoice_number);
          break;
        case "invoice_date":
          compareValue = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
          break;
        case "trade_name":
          compareValue = a.seller_tin_number.name_of_dealer.localeCompare(
            b.seller_tin_number.name_of_dealer
          );
          break;
        case "tin_number":
          compareValue = a.seller_tin_number.tin_number.localeCompare(
            b.seller_tin_number.tin_number
          );
          break;
        case "invoice_value":
          compareValue = a.totalInvoiceValue - b.totalInvoiceValue;
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [dailySale, searchTerm, sortField, sortOrder, dateFilter, acceptStatusFilter]);

  // Summary values based on current search/filter result (before pagination)
  const visibleSaleSummary = useMemo(() => {
    return filteredAndSortedSale.reduce(
      (acc, group) => {
        acc.totalInvoices += 1;
        acc.totalTaxableValue += group.totalTaxableValue;
        acc.totalVatAmount += group.totalVatAmount;
        acc.totalInvoiceValue += group.totalInvoiceValue;
        return acc;
      },
      {
        totalInvoices: 0,
        totalTaxableValue: 0,
        totalVatAmount: 0,
        totalInvoiceValue: 0,
      },
    );
  }, [filteredAndSortedSale]);

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

  const [saleSummary, setSaleSummary] = useState<DailySaleSummary>({
    totalInvoices: 0,
    totalTaxableValue: 0,
    totalVatAmount: 0,
    totalInvoiceValue: 0,
  });

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
      await loadFiledReturnPeriods(dvat_response.data.id);
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
        setSaleSummary(
          (daily_sale_response.data.summary as
            | DailySaleSummary
            | undefined) ?? {
            totalInvoices: 0,
            totalTaxableValue: 0,
            totalVatAmount: 0,
            totalInvoiceValue: 0,
          },
        );
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
        await loadFiledReturnPeriods(dvat_response.data.id);
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
          setSaleSummary(
            (daily_sale_response.data.summary as
              | DailySaleSummary
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

      const getalltinnumber = await getAllTinNumberMaster();

      if (getalltinnumber.status && getalltinnumber.data) {
        setTindata(getalltinnumber.data);
      }
      setIsLoading(false);
    };
    init();
  }, [userid, router, loadFiledReturnPeriods]);

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
      setSaleSummary(
        (daily_sale_response.data.summary as DailySaleSummary | undefined) ?? {
          totalInvoices: 0,
          totalTaxableValue: 0,
          totalVatAmount: 0,
          totalInvoiceValue: 0,
        },
      );
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalesConfirmed, setIsSalesConfirmed] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    uploadedRows: number;
    totalRows: number;
  }>({
    currentChunk: 0,
    totalChunks: 0,
    uploadedRows: 0,
    totalRows: 0,
  });

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

  const getCrateCount = (row: BulkSheetData): string => {
    const crateSize = row.crate_size && row.crate_size > 0 ? row.crate_size : 0;
    if (!crateSize || !Number.isFinite(row.quantity) || row.quantity <= 0) {
      return "-";
    }
    
    const crateCount = row.quantity / crateSize;
    if (!Number.isFinite(crateCount)) return "-";

    return Number.isInteger(crateCount)
      ? crateCount.toString()
      : crateCount.toFixed(2);
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
      const taxPercent =
      dvatdata?.commodity === "MANUFACTURER" ||
      dvatdata?.commodity === "WHOLESALER"
          ? row.sale_type === "REGULAR"
            ? "20"
            : "0"
          : row.sale_type === "CFORM"
              ? "2"
            : row.sale_type === "REGULAR"
                  ? (row.tax_percent ?? "0")
              : "0";
      const totalInvoice = Number(row.total_invoice_value);
      const taxableValue = (totalInvoice / (100 + Number(taxPercent))) * 100;
      const vatValue = totalInvoice - taxableValue;
      const amountUnit = totalInvoice / Number(row.quantity);

      // Use the parsed date directly (already in UTC from parseDateDDMMYYYY)
      const invoiceDate = row.invoice_date;

      return {
        dvatid: dvatdata.id,
        commodityid: row.item_code,
        quantity: Number(row.quantity), // Always stored in pieces (converted from crates for MANUFACTURER/WHOLESALER)
        seller_tin_id: row.seller_tin_id!,
        invoice_number: row.invoice_no,
        invoice_date: invoiceDate,
        tax_percent: taxPercent,
        amount: taxableValue.toFixed(2),
        vatamount: vatValue.toFixed(2),
        amount_unit: amountUnit.toFixed(2),
        createdById: userid,
        against_cfrom: row.against_cfrom,
        is_against_fform: row.is_against_fform,
        is_exempt: row.is_exempt,
        is_against_iform: row.is_against_iform,
        is_h_export: row.is_h_export,
        is_against_e1: row.is_against_e1,
        is_export: row.is_export,
        batch_name: null,
      };
    });

    setIsBulkUploading(true);
    const CHUNK_SIZE = 300;
    const totalChunks = Math.ceil(entries.length / CHUNK_SIZE);
    setBulkUploadProgress({
      currentChunk: 0,
      totalChunks,
      uploadedRows: 0,
      totalRows: entries.length,
    });

    try {
      for (let index = 0; index < entries.length; index += CHUNK_SIZE) {
        const chunk = entries.slice(index, index + CHUNK_SIZE);
        const currentChunk = Math.floor(index / CHUNK_SIZE) + 1;

        setBulkUploadProgress((prev) => ({
          ...prev,
          currentChunk,
        }));

        const response = await CreateMultiDailySale({ entries: chunk });

        if (!response.status) {
          toast.error(response.message);
          return;
        }

        setBulkUploadProgress((prev) => ({
          ...prev,
          uploadedRows: Math.min(
            prev.uploadedRows + chunk.length,
            prev.totalRows,
          ),
        }));
      }

      toast.success(
        `Bulk upload successful. ${entries.length} row(s) uploaded.`,
      );
      setIsBulkModalOpen(false);
      setSheetFileName("");
      setTableData([]);
      await init();
    } finally {
      setIsBulkUploading(false);
      setBulkUploadProgress({
        currentChunk: 0,
        totalChunks: 0,
        uploadedRows: 0,
        totalRows: 0,
      });
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  const bulkUploadTableColumnCount =
    dvatdata?.commodity === "MANUFACTURER" ||
    dvatdata?.commodity === "WHOLESALER"
      ? 13
      : 11;

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
        confirmLoading={isBulkUploading}
        width={1400}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setSheetFileName("");
          setTableData([]);
          setBulkSearchTerm("");
          setBulkSortKey("sr_no");
          setBulkSortOrder("asc");
          setBulkCurrentPage(1);
          setBulkPageSize(10);
        }}
        okText="Upload"
        cancelText="Cancel"
        okButtonProps={{
          style: hasBulkUploadErrors ? { display: "none" } : undefined,
        }}
      >
        {isBulkUploading && bulkUploadProgress.totalRows > 0 && (
          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <p>
              Uploading chunk {bulkUploadProgress.currentChunk} of{" "}
              {bulkUploadProgress.totalChunks}
            </p>
            <p>
              Uploaded {bulkUploadProgress.uploadedRows} /{" "}
              {bulkUploadProgress.totalRows} rows (
              {Math.floor(
                (bulkUploadProgress.uploadedRows /
                  bulkUploadProgress.totalRows) *
                  100,
              )}
              %)
            </p>
          </div>
        )}

        <div className="mb-3 mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            type="text"
            value={bulkSearchTerm}
            onChange={(event) => setBulkSearchTerm(event.target.value)}
            placeholder="Search by TIN, trade name, invoice, item, product, error"
            className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
          />
          <select
            value={bulkSortKey}
            onChange={(event) =>
              setBulkSortKey(event.target.value as BulkUploadSortKey)
            }
            className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="sr_no">Sort by Row Number</option>
            <option value="tin_number">Sort by TIN Number</option>
            <option value="trade_name">Sort by Trade Name</option>
            <option value="invoice_no">Sort by Invoice No</option>
            <option value="invoice_date">Sort by Invoice Date</option>
            <option value="item_code">Sort by Item Code</option>
            <option value="product_name">Sort by Product Name</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="total_invoice_value">Sort by Invoice Value</option>
            <option value="against_cform">Sort by Type</option>
          </select>
          <select
            value={bulkSortOrder}
            onChange={(event) =>
              setBulkSortOrder(event.target.value as BulkUploadSortOrder)
            }
            className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <p className="mb-2 text-xs text-gray-600">
          Showing {paginatedBulkRows.length} of {totalBulkRowsAfterFilter}{" "}
          filtered row(s). Error rows are pinned on top.
        </p>

        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="border text-center">Sr. No.</TableHead>
              <TableHead className="border text-center">TIN Number</TableHead>
              <TableHead className="border text-center  min-w-40 w-60">
                Trade Name
              </TableHead>
              <TableHead className="border text-center">Invoice No.</TableHead>
              <TableHead className="border text-center">Invoice Date</TableHead>
              <TableHead className="border text-center">Item Code</TableHead>
              <TableHead className="border text-center min-w-80 w-80">
                Product Name
              </TableHead>
              {dvatdata?.commodity === "MANUFACTURER" ||
              dvatdata?.commodity === "WHOLESALER" ? (
                <>
                  <TableHead className="border text-center">
                    Quantity (Crates)
                  </TableHead>
                  <TableHead className="border text-center">
                    Quantity (Pieces)
                  </TableHead>
                </>
              ) : (
                <TableHead className="border text-center">Quantity</TableHead>
              )}
              <TableHead className="border text-center">
                Total Invoice Value
              </TableHead>
              <TableHead className="border text-center">Type</TableHead>
              <TableHead className="border text-center min-w-40 w-80">
                Error
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBulkRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={bulkUploadTableColumnCount}
                  className="p-4 border text-center text-sm text-gray-600"
                >
                  No rows found for current search/filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBulkRows.map(
                ({ row: val, originalIndex, tradeName }) => (
                  <TableRow
                    key={`${val.invoice_no}-${val.item_code}-${originalIndex}`}
                    className={`${val.error ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
                  >
                    <TableCell className="p-2 border text-center">
                      {originalIndex + 1}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {val.tin_number}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {tradeName}
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
                    <TableCell className="p-2 border text-left min-w-60 w-70 whitespace-normal wrap-break-word">
                      {val.commodity_name ?? "-"}
                    </TableCell>
                    {dvatdata?.commodity === "MANUFACTURER" ||
                    dvatdata?.commodity === "WHOLESALER" ? (
                      <>
                        <TableCell className="p-2 border text-center">
                          {val.quantity_in_crates !== null ? val.quantity_in_crates : "-"}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.quantity}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className="p-2 border text-center">
                        {val.quantity}
                      </TableCell>
                    )}
                    <TableCell className="p-2 border text-center">
                      {val.total_invoice_value.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {dvatdata?.commodity === "MANUFACTURER" ||
                      dvatdata?.commodity === "WHOLESALER"
                        ? getSaleRowTypeLabel(val)
                        : getSaleTypeLabel(val.sale_type)}
                    </TableCell>
                    <TableCell className="p-2 border text-left whitespace-pre-line text-red-600">
                      {val.errorname || "-"}
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
        {totalBulkRowsAfterFilter > 0 && (
          <div className="mt-3 flex justify-end">
            <Pagination
              current={bulkCurrentPage}
              pageSize={bulkPageSize}
              total={totalBulkRowsAfterFilter}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, size) => {
                setBulkCurrentPage(page);
                if (size !== bulkPageSize) {
                  setBulkPageSize(size);
                }
              }}
              onShowSizeChange={(_, size) => {
                setBulkPageSize(size);
                setBulkCurrentPage(1);
              }}
            />
          </div>
        )}
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
            className="mt-2"
          />
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
          setSheetFileName("");
          setIsSalesConfirmed(false);
        }}
        okText="Finalize Sales Data"
        cancelText="Cancel"
        okButtonProps={{ disabled: !isSalesConfirmed, danger: true }}
        width={600}
      >
        <div className="py-3 space-y-4">
          <p className="text-sm text-gray-700">
            You are about to <strong>finalize all Sales entries</strong> for
            the selected tax period.
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
                              onClick={() => {
                                setToolbarActionsOpen(false);
                                setIsModalOpen(true);
                              }}
                            >
                              Generate DVAT 31/31 A
                            </Button>
                          )}

                          <Button
                            size="small"
                            block
                            type="default"
                            onClick={() => {
                              setToolbarActionsOpen(false);
                              downloadBulkTemplate();
                            }}
                          >
                            Download Sample
                          </Button>

                          <Button
                            size="small"
                            block
                            type="primary"
                            onClick={() => {
                              setToolbarActionsOpen(false);
                              sheetRef.current?.click();
                            }}
                          >
                            Bulk Upload
                          </Button>

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
                {visibleSaleSummary.totalInvoices}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(visibleSaleSummary.totalTaxableValue)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {visibleSaleSummary.totalVatAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
              <p className="text-lg font-medium text-gray-900">
                {formatAmount(visibleSaleSummary.totalInvoiceValue)}
              </p>
            </div>
          </div>

          {dailySale.length > 0 ? (
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
                      onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
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
                          setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start Date"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) =>
                          setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
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
                      onChange={(e) => setAcceptStatusFilter(e.target.value as any)}
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
                  Showing {filteredAndSortedSale.length} of {dailySale.length} records
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
                    {filteredAndSortedSale.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-gray-500 text-sm">
                            No sale records match your filters.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedSale.map((group: GroupedDailySale, index: number) => (
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
                    )))}
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
