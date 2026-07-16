"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, Button, Modal, Pagination } from "antd";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import CreateMultiDailySaleManufacturer from "@/action/stock/createmultidailysalemanufacturer";
import GetAllStock from "@/action/stock/getallstock";
import GetAllDvat04 from "@/action/dvat/getalldvat";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";

import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetUnacceptedSales from "@/action/stock/getunacceptedsales";

interface SaleBulkUploadProps {
  setToolbarActionsOpen: (open: boolean) => void;
  filedReturnPeriods: Set<string>;
  onUploadComplete: () => Promise<void>;
}

const SaleBulkUpload = (props: SaleBulkUploadProps) => {
  const sheetRef = useRef<HTMLInputElement>(null);

  const manufacturerBulkUploadDvatIds = new Set([821, 35]);

  const [sheetFileName, setSheetFileName] = useState<string>("");

  interface BulkSheetData {
    tin_number: string;
    invoice_date: Date;
    invoice_date_display: string;
    invoice_no: string;
    item_code: number;
    quantity: number; // Always in pieces for database storage
    quantity_in_crates: number | null; // Original crate quantity (for MANUFACTURER/WHOLESALER)
    pcs_ml: boolean | null; // RESTAURANT only: true = mL, false = pcs
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
    pack_size: number | null;
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

  const router = useRouter();

  const [dvatdata, setDvatData] = useState<dvat04>();
  const [userid, setUserid] = useState<number>(0);
  const [tindata, setTindata] = useState<Array<tin_number_master>>([]);
  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master>
  >([]);

  const tinNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const tin of tindata) {
      map[tin.tin_number] = tin.name_of_dealer ?? "-";
    }
    return map;
  }, [tindata]);

  const isManufacturerBulkUpload =
    dvatdata?.commodity === "MANUFACTURER" ||
    dvatdata?.commodity === "WHOLESALER";

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04Anx({});

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }

      const getalltinnumber = await getAllTinNumberMaster();
      if (getalltinnumber.status && getalltinnumber.data) {
        setTindata(getalltinnumber.data);
      }

      const commodity_response = await AllCommodityMaster({});

      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }
    };
    init();
  }, [userid, router]);

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
    if (["true", "yes", "y", "1", "ml"].includes(normalized)) return true;
    if (["false", "no", "n", "0", "pcs"].includes(normalized)) return false;
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
    // OIDC users sell LIQUOR-typed products.
    // MANUFACTURER and WHOLESALER use their own product type
    // so the commodity lookup finds the correct crate_size for quantity conversion.
    if (dvatdata?.commodity === "OIDC" || isManufacturerBulkUpload || dvatdata?.commodity === "RESTAURANT") {
      return "LIQUOR";
    }
    return dvatdata?.commodity;
  };

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
      // Determine tax percent based on composition scheme
      let taxPercent: string;
      
      if (dvatdata?.compositionScheme) {
        // If composition scheme is true, use 1% for all sales
        taxPercent = "1";
      } else {
        // Otherwise use regular logic
        taxPercent = isManufacturerBulkUpload
          ? row.sale_type === "CFORM"
            ? "2"
            : row.sale_type === "REGULAR"
              ? "20"
              : "0"
          : row.sale_type === "CFORM"
            ? "2"
            : row.sale_type === "REGULAR"
              ? (row.tax_percent ?? "0")
              : "0";
      }

      const totalInvoice = Number(row.total_invoice_value);
      const taxableValue = (totalInvoice / (100 + Number(taxPercent))) * 100;
      const vatValue = totalInvoice - taxableValue;
      const amountUnit = totalInvoice / Number(row.quantity);

      // Use the parsed date directly (already in UTC from parseDateDDMMYYYY)
      const invoiceDate = row.invoice_date;

      return {
        dvatid: dvatdata.id,
        commodityid: row.item_code,
        quantity: Number(row.quantity), // Always stored in pieces (converted from crates for manufacturer-style bulk uploads)
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

        const response = isManufacturerBulkUpload
          ? await CreateMultiDailySaleManufacturer({ entries: chunk })
          : await CreateMultiDailySale({ entries: chunk });

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
      await props.onUploadComplete();
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

  const getPeriodKey = (year: string | number, month: string) =>
    `${year}-${month}`;

  const handleDownloadUnacceptedSales = async () => {
    if (!dvatdata) {
      toast.error("DVAT data not found");
      return;
    }

    try {
      const response = await GetUnacceptedSales({ dvatid: dvatdata.id });

      if (!response.status || !response.data) {
        toast.error(response.message);
        return;
      }

      if (response.data.length === 0) {
        toast.info("No unaccepted sales found");
        return;
      }

      // Create worksheet data
      const worksheetData = [
        ["Trade Name", "TIN Number", "Contact", "Pending Invoices"],
        ...response.data.map((row) => [
          row.seller_trade_name,
          row.seller_tin_number,
          row.seller_contact,
          row.pending_invoice_count,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Unaccepted Sales");

      // Set column widths
      worksheet["!cols"] = [
        { wch: 30 }, // Trade Name
        { wch: 15 }, // TIN Number
        { wch: 20 }, // Contact
        { wch: 18 }, // Pending Invoices
      ];

      const fileName = `unaccepted_sales_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(
        `Downloaded ${response.data.length} seller(s) with pending invoices`
      );
    } catch (error) {
      toast.error("Failed to download unaccepted sales");
      console.error(error);
    }
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
          normalizeText(
            readSheetField(row, ["Pcs/mL", "pcs/ml", "pcs_ml"]),
          ),
        ].join("|");

        groupedData[key] = (groupedData[key] ?? 0) + 1;
      });

      const expectedProductType = getExpectedProductType();
      const isCrateCommodity = isManufacturerBulkUpload;
      const commodityType = dvatdata?.commodity;

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
          const pcs_ml_raw = readSheetField(row, [
            "Pcs/mL",
            "pcs/ml",
            "pcs_ml",
          ]);

          const isAllNull =
            tin_number === "" &&
            invoice_no === "" &&
            normalizeText(invoice_date_raw) === "" &&
            normalizeText(item_code_raw) === "" &&
            normalizeText(quantity_raw) === "" &&
            normalizeText(total_invoice_value_raw) === "" &&
            normalizeText(pcs_ml_raw) === "" &&
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
                "RESTAURANT",
                "FUEL",
                "OIDC",
                "MANUFACTURER",
                "WHOLESALER",
              ].includes(buyerCommodity);
            } else if (sellerCommodity === "OIDC") {
              // OIDC can sell to LIQUOR and MANUFACTURER
              isValidSale = [
                "LIQUOR",
                "RESTAURANT",
                "MANUFACTURER",
                "WHOLESALER",
                "RESTAURANT",
              ].includes(buyerCommodity);
            } else if (
              sellerCommodity === "MANUFACTURER" ||
              sellerCommodity === "WHOLESALER"
            ) {
              // MANUFACTURER can sell to OIDC and LIQUOR
              isValidSale = [
                "OIDC",
                "LIQUOR",
                "RESTAURANT",
                "WHOLESALER",
                "MANUFACTURER",
              ].includes(buyerCommodity);
            } else if (
              sellerCommodity === "LIQUOR" ||
              sellerCommodity === "RESTAURANT"
            ) {
              // LIQUOR can sell to LIQUOR, MANUFACTURER, OIDC, and WHOLESALER
              isValidSale = [
                "LIQUOR",
                "RESTAURANT",
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

            if (props.filedReturnPeriods.has(periodKey)) {
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
          const quantityInCrates =
            isCrateCommodity && Number.isFinite(parsedQuantity)
              ? parsedQuantity
              : isCrateCommodity && !Number.isFinite(parsedQuantity)
                ? 0
                : null;

          const parsedPcsMl = parseBooleanValue(pcs_ml_raw);

          if (commodityType === "RESTAURANT" && parsedPcsMl == null) {
            errors.push(
              "* Pcs/mL must be true/false/ml/pcs/1/0 (true|ml|1 = mL, false|pcs|0 = pcs)",
            );
          }

          if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            errors.push(
              isCrateCommodity
                ? "* Quantity must be a number in crates and greater than 0"
                : "* Quantity must be a number in pieces and greater than 0",
            );
          } else if (
            !Number.isInteger(parsedQuantity) &&
            !isManufacturerBulkUpload
          ) {
            errors.push(
              isCrateCommodity
                ? "* Quantity must be a whole number in crates"
                : "* Quantity must be a whole number in pieces",
            );
          }

          // For MANUFACTURER/WHOLESALER: parsedQuantity is in crates, convert to pieces
          // For others: parsedQuantity is already in pieces
          const normalizedQuantity =
            selectedCommodity &&
            isCrateCommodity &&
            Number.isFinite(parsedQuantity)
              ? parsedQuantity *
                (selectedCommodity.crate_size > 0
                  ? selectedCommodity.crate_size
                  : 1)
              : selectedCommodity &&
                  commodityType === "RESTAURANT" &&
                  Number.isFinite(parsedQuantity)
                ? parsedPcsMl === true
                  ? parsedQuantity
                  : parsedPcsMl === false
                    ? parsedQuantity *
                      (Number(selectedCommodity.pack_size) > 0
                        ? Number(selectedCommodity.pack_size)
                        : 1)
                    : 0
              : Number.isFinite(parsedQuantity)
                ? parsedQuantity
                : 0;

          if (
            commodityType === "RESTAURANT" &&
            parsedPcsMl === false &&
            selectedCommodity &&
            Number(selectedCommodity.pack_size) <= 0
          ) {
            errors.push("* Pack size is not configured for selected item code");
          }

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

          const requiredColumnsByCommodity: Array<{
            label: string;
            parsed: boolean | null;
          }> =
            commodityType === "MANUFACTURER"
              ? [
                  { label: "Is Against C Form", parsed: parsedAgainstCFrom },
                  { label: "Is Against F Form", parsed: parsedAgainstFForm },
                  { label: "Is Against E1", parsed: parsedAgainstE1 },
                  { label: "Is Against I Form", parsed: parsedAgainstIForm },
                  { label: "Is Exempt", parsed: parsedIsExempt },
                  { label: "Is H Export", parsed: parsedHExport },
                  { label: "Is Export", parsed: parsedIsExport },
                ]
              : commodityType === "FUEL"
                ? [
                    {
                      label: "Is Against C Form",
                      parsed: parsedAgainstCFrom,
                    },
                    {
                      label: "Is Against F Form",
                      parsed: parsedAgainstFForm,
                    },
                    { label: "Is Exempt", parsed: parsedIsExempt },
                  ]
                : [];

          for (const column of requiredColumnsByCommodity) {
            if (column.parsed == null) {
              errors.push(
                `* ${column.label} must be true/false (yes/no/1/0 also accepted)`,
              );
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

          const allowedFlagKeysByCommodity =
            commodityType === "MANUFACTURER"
              ? [
                  "CFORM",
                  "FFORM",
                  "E1",
                  "IFORM",
                  "EXEMPT",
                  "H_EXPORT",
                  "EXPORT",
                ]
              : commodityType === "WHOLESALER"
                ? ["CFORM"]
                : commodityType === "FUEL"
                  ? ["CFORM", "FFORM", "EXEMPT"]
                  : [];

          const selectedAllowedFlags = selectedFlags.filter((flag) =>
            allowedFlagKeysByCommodity.includes(flag.key),
          );

          if (selectedAllowedFlags.length > 1) {
            errors.push("* Only one type can be true in a row");
          }

          if (
            normalizedType &&
            selectedAllowedFlags.length === 1 &&
            selectedAllowedFlags[0].key !== normalizedType
          ) {
            errors.push("* Type and boolean flags do not match for this row");
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
          if (commodityType === "LIQUOR" || commodityType === "RESTAURANT") {
            saleType = "REGULAR";
          } else if (commodityType === "FUEL") {
            if (selectedAllowedFlags.length === 0) {
              saleType = "REGULAR";
            } else if (
              normalizedType &&
              ["CFORM", "FFORM", "EXEMPT"].includes(normalizedType)
            ) {
              saleType = normalizedType;
            } else if (selectedAllowedFlags.length === 1) {
              saleType = selectedAllowedFlags[0].key;
            }
          } else if (selectedAllowedFlags.length === 0) {
            saleType = "REGULAR";
          } else if (normalizedType) {
            saleType = normalizedType;
          } else if (selectedAllowedFlags.length === 1) {
            saleType = selectedAllowedFlags[0].key;
          }

          const skipMrpValidationForManufacturerTypes =
            commodityType === "MANUFACTURER" &&
            ["FFORM", "IFORM", "H_EXPORT", "E1", "EXPORT"].includes(
              saleType,
            );

          if (
            !skipMrpValidationForManufacturerTypes &&
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
            const packSize =
              Number(selectedCommodity.pack_size) > 0
                ? Number(selectedCommodity.pack_size)
                : 1;

            const comparisonQuantity =
              commodityType === "RESTAURANT"
                ? normalizedQuantity / packSize
                : normalizedQuantity;

            const minUnitPrice =
             mrp / crateSize;
            const pricePerUnit = total_invoice_value / comparisonQuantity;

            if (
              Number.isFinite(mrp) &&
              Number.isFinite(minUnitPrice) &&
              Number.isFinite(comparisonQuantity) &&
              comparisonQuantity > 0 &&
              pricePerUnit <
                (isManufacturerBulkUpload
                  ? minUnitPrice * 0.25
                  : minUnitPrice * 0.75)
            ) {
              errors.push("* Given item price must not be less than MRP");
            }
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
            pcs_ml: commodityType === "RESTAURANT" ? parsedPcsMl : null,
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
            crate_size: selectedCommodity?.crate_size
              ? Number(selectedCommodity.crate_size)
              : null,
            pack_size: selectedCommodity?.pack_size
              ? Number(selectedCommodity.pack_size)
              : null,
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

      // Cross-row check: stock availability per item_code.
      // Manufacturer-style uploads and special DVAT IDs should bypass stock validation.
      if (
        dvatdata &&
        !isManufacturerBulkUpload &&
        !manufacturerBulkUploadDvatIds.has(dvatdata.id)
      ) {
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
      event.target.value = "";
    }
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
          item.row.pcs_ml === null ? "" : item.row.pcs_ml ? "true" : "false",
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

  useEffect(() => {
    setBulkCurrentPage(1);
  }, [bulkSearchTerm, bulkSortKey, bulkSortOrder, tabledata]);

  const bulkUploadTableColumnCount =
    dvatdata?.commodity === "MANUFACTURER" ||
    dvatdata?.commodity === "WHOLESALER"
      ? 13
      : dvatdata?.commodity === "RESTAURANT"
        ? 12
      : 11;

  return (
    <>
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
              ) : dvatdata?.commodity === "RESTAURANT" ? (
                <>
                  <TableHead className="border text-center">Quantity</TableHead>
                  <TableHead className="border text-center">Pcs/mL</TableHead>
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
                          {val.quantity_in_crates !== null
                            ? val.quantity_in_crates
                            : "-"}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.quantity}
                        </TableCell>
                      </>
                    ) : dvatdata?.commodity === "RESTAURANT" ? (
                      <>
                        <TableCell className="p-2 border text-center">
                          {val.quantity}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.pcs_ml === null ? "-" : val.pcs_ml ? "true" : "false"}
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

      <div className="hidden">
        <input
          type="file"
          ref={sheetRef}
          accept=".xlsx,.xls"
          onChange={handleSheetChange}
        />
      </div>

      <div className="space-y-2">
        <Button
          size="small"
          block
          type="primary"
          onClick={() => {
            props.setToolbarActionsOpen(false);
            sheetRef.current?.click();
          }}
        >
          Bulk Upload
        </Button>

        {(dvatdata?.commodity === "MANUFACTURER" ||
          dvatdata?.commodity === "WHOLESALER") && (
          <Button
            size="small"
            block
            type="default"
            onClick={handleDownloadUnacceptedSales}
          >
            Unaccepted Sales
          </Button>
        )}
      </div>
    </>
  );
};

export default SaleBulkUpload;
