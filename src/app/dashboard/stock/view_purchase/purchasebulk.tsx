import { Alert, Button, Modal, Pagination } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateMultiDailyPurchase from "@/action/stock/createmultidailypurchase";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";

interface PurchaseBulkUploadProps {
  setToolbarActionsOpen: (open: boolean) => void;
  onUploadComplete: () => Promise<void>;
}

const PurchaseBulk = (props: PurchaseBulkUploadProps) => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [dvatdata, setDvatData] = useState<dvat04>();

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
  const [sheetFileName, setSheetFileName] = useState<string>("");
  const sheetRef = useRef<HTMLInputElement>(null);

  interface BulkSheetData {
    tin_number: string;
    invoice_no: string;
    invoice_date: Date;
    invoice_date_display: string;
    item_code: number;
    quantity: number; // Always in pieces for database storage
    quantity_in_crates: number | null; // Original crate quantity (for MANUFACTURER/WHOLESALER)
    total_invoice_value: number;
    purchase_type: string;
    against_cfrom: boolean;
    is_against_fform: boolean;
    is_against_e1form: boolean;
    is_against_iform: boolean;
    is_against_hform: boolean;
    is_exempt: boolean;
    is_export: boolean;
    seller_tin_id: number | null;
    commodity_name: string | null;
    tax_percent: string | null;
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
  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    [],
  );
  const [tindata, setTindata] = useState<tin_number_master[]>([]);

  const normalizedStatus = (dvatdata?.status ?? "").toUpperCase();

  const init = async () => {
    const dvat_response = await GetUserDvat04();

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
    }

    const commodity_response = await AllCommodityMaster({});
    if (commodity_response.status && commodity_response.data) {
      setCommodityMaster(commodity_response.data);
    }
    const tin_response = await getAllTinNumberMaster();
    if (tin_response.status && tin_response.data) {
      setTindata(tin_response.data);
    }
  };

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04();

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }

      const commodity_response = await AllCommodityMaster({});
      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }
      const tin_response = await getAllTinNumberMaster();
      if (tin_response.status && tin_response.data) {
        setTindata(tin_response.data);
      }
    };
    init();
  }, [userid, router]);

  const normalizePurchaseType = (value: unknown): string | null => {
    const normalized = normalizeText(value)
      .toLowerCase()
      .replace(/[_\s-]+/g, "");

    if (!normalized) return null;

    if (["regular", "reguler"].includes(normalized)) return "REGULAR";
    if (["againstcform", "cform"].includes(normalized)) return "AGAINST_CFORM";
    if (["againstfform", "fform"].includes(normalized)) return "AGAINST_FFORM";
    if (["againste1", "againste1form", "e1", "e1form"].includes(normalized))
      return "AGAINST_E1";
    if (["againstiform", "iform"].includes(normalized)) return "AGAINST_IFORM";
    if (["exempt", "isexempt"].includes(normalized)) return "EXEMPT";
    if (["hexport", "ishexport", "againsthform", "hform"].includes(normalized))
      return "H_EXPORT";
    if (["export", "isexport"].includes(normalized)) return "EXPORT";

    return null;
  };

  const getPurchaseTypeLabel = (purchaseType: string): string => {
    switch (purchaseType) {
      case "AGAINST_CFORM":
        return "Against C Form";
      case "AGAINST_FFORM":
        return "Against F Form";
      case "AGAINST_E1":
        return "Against E1";
      case "AGAINST_IFORM":
        return "Against I Form";
      case "EXEMPT":
        return "Exempt";
      case "H_EXPORT":
        return "H Export";
      case "EXPORT":
        return "Export";
      default:
        return "Regular";
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

  const getPurchaseRowTypeLabel = (row: BulkSheetData): string => {
    if (row.against_cfrom) return "Against C Form";
    if (row.is_against_fform) return "Against F Form";
    if (row.is_against_e1form) return "Against E1";
    if (row.is_against_iform) return "Against I Form";
    if (row.is_exempt) return "Exempt";
    if (row.is_against_hform) return "H Export";
    if (row.is_export) return "Export";
    return "Regular";
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

  const parseExcelNumber = (value: unknown): number => {
    if (typeof value === "number") return value;
    const text = normalizeText(value).replace(/,/g, "");
    if (text === "") return NaN;
    return Number(text);
  };

  const parseDateDDMMYYYY = (value: unknown): Date | null => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // Normalize to local date-only to avoid timezone time components
      // affecting month comparisons in bulk validation.
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
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
  const sellerTinNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const tin of tindata) {
      map[tin.id] = tin.name_of_dealer ?? "-";
    }
    return map;
  }, [tindata]);

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
      const purchaseSheetName =
        workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() === "purchase upload",
        ) ??
        workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() !== "instructions",
        ) ??
        workbook.SheetNames[0];

      if (!purchaseSheetName) {
        toast.error("No sheet found in uploaded file.");
        return;
      }

      const worksheet = workbook.Sheets[purchaseSheetName];
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

      const isCrateCommodity =
        dvatdata?.commodity === "MANUFACTURER" ||
        dvatdata?.commodity == "WHOLESALER";
      const commodityType = dvatdata?.commodity;

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
          const is_against_e1_raw = readSheetField(row, [
            "Is Against E1",
            "is against e1",
            "is_against_e1",
            "Against E1",
            "against e1",
          ]);
          const is_against_iform_raw = readSheetField(row, [
            "Is Against I Form",
            "is against i form",
            "is_against_i_form",
            "Against I Form",
            "against i form",
          ]);
          const is_against_hform_raw = readSheetField(row, [
            "Is H Export",
            "is h export",
            "is_h_export",
            "Is Against H Form",
            "is against h form",
            "is_against_h_form",
          ]);
          const is_export_raw = readSheetField(row, [
            "Is Export",
            "is export",
            "is_export",
          ]);
          const is_exempt_raw = readSheetField(row, [
            "Is Exempt",
            "is exempt",
            "is_exempt",
            "Exempt",
            "exempt",
          ]);
          const purchase_type_raw = readSheetField(row, [
            "Type",
            "type",
            "Purchase Type",
            "purchase type",
            "purchase_type",
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
            normalizeText(is_against_e1_raw) === "" &&
            normalizeText(is_against_iform_raw) === "" &&
            normalizeText(is_against_hform_raw) === "" &&
            normalizeText(is_exempt_raw) === "" &&
            normalizeText(is_export_raw) === "" &&
            normalizeText(purchase_type_raw) === "";

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

          let userCommodityType = "LIQUOR";

          if (
            dvatdata?.commodity === "MANUFACTURER" ||
            dvatdata?.commodity === "WHOLESALER" ||
            dvatdata?.commodity === "OIDC" ||
            dvatdata?.commodity === "LIQUOR"
          ) {
            userCommodityType = "LIQUOR";
          } else {
            userCommodityType = dvatdata?.commodity ?? "OTHER";
          }

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

          const parsedQuantity = parseExcelNumber(quantity_raw);

          // Store the original crate quantity for MANUFACTURER/WHOLESALER (even if invalid, for display purposes)
          const quantityInCrates =
            isCrateCommodity && Number.isFinite(parsedQuantity)
              ? parsedQuantity
              : isCrateCommodity && !Number.isFinite(parsedQuantity)
                ? 0
                : null;

          if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            errors.push(
              isCrateCommodity
                ? "* Quantity must be a number in crates and greater than 0"
                : "* Quantity must be a number in pieces and greater than 0",
            );
          } else if (!Number.isInteger(parsedQuantity)) {
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
          const parsedAgainstFForm = parseBooleanValue(is_against_fform_raw);
          const parsedAgainstE1 = parseBooleanValue(is_against_e1_raw);
          const parsedAgainstIForm = parseBooleanValue(is_against_iform_raw);
          const parsedAgainstHForm = parseBooleanValue(is_against_hform_raw);
          const parsedIsExempt = parseBooleanValue(is_exempt_raw);
          const parsedIsExport = parseBooleanValue(is_export_raw);
          const normalizedType = normalizePurchaseType(purchase_type_raw);

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
              label: "Is Against E1",
              raw: is_against_e1_raw,
              parsed: parsedAgainstE1,
            },
            {
              label: "Is Against I Form",
              raw: is_against_iform_raw,
              parsed: parsedAgainstIForm,
            },
            {
              label: "Is Exempt",
              raw: is_exempt_raw,
              parsed: parsedIsExempt,
            },
            {
              label: "Is H Export",
              raw: is_against_hform_raw,
              parsed: parsedAgainstHForm,
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
                  { label: "Is H Export", parsed: parsedAgainstHForm },
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
                : commodityType === "WHOLESALER"
                  ? [
                      {
                        label: "Is Against C Form",
                        parsed: parsedAgainstCFrom,
                      },
                    ]
                  : [];

          for (const column of requiredColumnsByCommodity) {
            if (column.parsed == null) {
              errors.push(
                `* ${column.label} must be true/false (yes/no/1/0 also accepted)`,
              );
            }
          }

          const allFlagSources = [
            { key: "AGAINST_CFORM", value: parsedAgainstCFrom },
            { key: "AGAINST_FFORM", value: parsedAgainstFForm },
            { key: "AGAINST_E1", value: parsedAgainstE1 },
            { key: "AGAINST_IFORM", value: parsedAgainstIForm },
            { key: "EXEMPT", value: parsedIsExempt },
            { key: "H_EXPORT", value: parsedAgainstHForm },
            { key: "EXPORT", value: parsedIsExport },
          ];

          if (normalizeText(purchase_type_raw) !== "" && !normalizedType) {
            errors.push(
              "* Type must be one of: REGULAR, AGAINST_CFORM, AGAINST_FFORM, AGAINST_E1, AGAINST_IFORM, EXEMPT, H_EXPORT, EXPORT",
            );
          }

          const selectedFlags = allFlagSources.filter(
            (item) => item.value === true,
          );
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

          let purchaseType = "REGULAR";

          if (commodityType === "LIQUOR") {
            purchaseType = "REGULAR";
          } else if (commodityType === "WHOLESALER") {
            purchaseType = parsedAgainstCFrom ? "AGAINST_CFORM" : "REGULAR";
          } else if (commodityType === "FUEL") {
            const fuelSelectedFlags = [
              { key: "AGAINST_CFORM", value: parsedAgainstCFrom },
              { key: "AGAINST_FFORM", value: parsedAgainstFForm },
              { key: "EXEMPT", value: parsedIsExempt },
            ].filter((item) => item.value === true);

            if (fuelSelectedFlags.length > 1) {
              errors.push("* Only one type can be true in a row");
            }

            if (
              normalizedType &&
              fuelSelectedFlags.length === 1 &&
              fuelSelectedFlags[0].key !== normalizedType
            ) {
              errors.push("* Type and boolean flags do not match for this row");
            }

            if (fuelSelectedFlags.length === 0) {
              purchaseType = "REGULAR";
            } else if (normalizedType) {
              purchaseType = normalizedType;
            } else if (fuelSelectedFlags.length === 1) {
              purchaseType = fuelSelectedFlags[0].key;
            }
          } else if (selectedFlags.length === 0) {
            purchaseType = "REGULAR";
          } else if (normalizedType) {
            purchaseType = normalizedType;
          } else if (selectedFlags.length === 1) {
            purchaseType = selectedFlags[0].key;
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

          const against_cfrom = purchaseType === "AGAINST_CFORM";
          const is_against_fform = purchaseType === "AGAINST_FFORM";
          const is_against_e1form = purchaseType === "AGAINST_E1";
          const is_against_iform = purchaseType === "AGAINST_IFORM";
          const is_against_hform = purchaseType === "H_EXPORT";
          const is_exempt = purchaseType === "EXEMPT";
          const is_export = purchaseType === "EXPORT";

          return {
            tin_number,
            invoice_no,
            invoice_date: invoice_date ?? new Date(Number.NaN),
            invoice_date_display: invoice_date
              ? formatDateDDMMYYYY(invoice_date)
              : "-",
            item_code: Number.isFinite(item_code) ? item_code : 0,
            quantity: Number.isFinite(normalizedQuantity)
              ? normalizedQuantity
              : 0,
            quantity_in_crates: quantityInCrates,
            total_invoice_value: Number.isFinite(total_invoice_value)
              ? total_invoice_value
              : 0,
            purchase_type: purchaseType,
            against_cfrom,
            is_against_fform,
            is_against_e1form,
            is_against_iform,
            is_against_hform,
            is_exempt,
            is_export,
            seller_tin_id: sellerTin?.id ?? null,
            commodity_name: selectedCommodity?.product_name ?? null,
            tax_percent: selectedCommodity?.taxable_at ?? null,
            crate_size: selectedCommodity?.crate_size ?? null,
            error: errors.length > 0,
            errorname: errors.join("\n"),
          } as BulkSheetData;
        })
        .filter((val): val is BulkSheetData => val !== null);

      // Cross-row check: all invoice dates must be in the same month
      const validDates = parsedRows.filter(
        (r) => !Number.isNaN(r.invoice_date.getTime()),
      );
      if (validDates.length > 0) {
        const firstMonth = validDates[0].invoice_date.getMonth();
        const firstYear = validDates[0].invoice_date.getFullYear();
        const mixedMonths = validDates.some(
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
      const isCrateCommodity =
        dvatdata?.commodity === "MANUFACTURER" ||
        dvatdata?.commodity == "WHOLESALER";
      const taxPercent = isCrateCommodity
        ? row.purchase_type === "REGULAR"
          ? "20"
          : "0"
        : row.purchase_type === "AGAINST_CFORM"
          ? "2"
          : [
                "AGAINST_FFORM",
                "AGAINST_E1",
                "AGAINST_IFORM",
                "EXEMPT",
                "H_EXPORT",
                "EXPORT",
              ].includes(row.purchase_type)
            ? "0"
            : (row.tax_percent ?? "0");
      const totalInvoice = Number(row.total_invoice_value);
      const taxableValue = (totalInvoice / (100 + Number(taxPercent))) * 100;
      const vatValue = totalInvoice - taxableValue;
      const amountUnit = totalInvoice / Number(row.quantity);

      // Use the parsed date directly (already in UTC from parseDateDDMMYYYY)
      const invoiceDate = row.invoice_date;

      return {
        dvatid: dvatdata.id,
        commodityid: row.item_code,
        quantity: Number(row.quantity), // Stored in pieces; for MANUFACTURER/WHOLESALER this is converted from crate quantity.
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
        is_against_e1form: row.is_against_e1form,
        is_against_iform: row.is_against_iform,
        is_against_hform: row.is_against_hform,
        is_exempt: row.is_exempt,
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

        const response = await CreateMultiDailyPurchase({ entries: chunk });

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
      setBulkSearchTerm("");
      setBulkSortKey("sr_no");
      setBulkSortOrder("asc");
      setBulkCurrentPage(1);
      setBulkPageSize(10);
      await init();
      await props.onUploadComplete();
      router.refresh();
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

  const filteredSortedBulkRows = useMemo(() => {
    const normalizedSearch = bulkSearchTerm.trim().toLowerCase();

    const rows = tabledata
      .map((row, originalIndex) => ({
        row,
        originalIndex,
        tradeName: row.seller_tin_id
          ? (sellerTinNameMap[row.seller_tin_id] ?? "-")
          : "-",
      }))
      .filter((item) => {
        if (!normalizedSearch) return true;

        const searchableValue = [
          item.row.tin_number,
          item.tradeName,
          item.row.invoice_no,
          item.row.invoice_date_display,
          item.row.item_code.toString(),
          item.row.commodity_name ?? "",
          item.row.quantity.toString(),
          item.row.total_invoice_value.toString(),
          item.row.purchase_type,
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
          return item.row.item_code;
        case "product_name":
          return item.row.commodity_name ?? "";
        case "quantity":
          return item.row.quantity;
        case "total_invoice_value":
          return item.row.total_invoice_value;
        case "against_cform":
          return item.row.purchase_type;
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
  }, [tabledata, sellerTinNameMap, bulkSearchTerm, bulkSortKey, bulkSortOrder]);

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
    dvatdata?.commodity == "WHOLESALER"
      ? 13
      : 11;

  return (
    <>
      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">Bulk Upload</div>
        }
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
          className: "bg-blue-600 hover:bg-blue-700",
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
            <option value="product_name">Sort by Item Name</option>
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
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3  min-w-40 w-60">
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
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3 min-w-60 w-80">
                  Item Name
                </TableHead>
                {dvatdata?.commodity === "MANUFACTURER" ||
                dvatdata?.commodity === "WHOLESALER" ? (
                  <>
                    <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                      Quantity (Crates)
                    </TableHead>
                    <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                      Quantity (Pieces)
                    </TableHead>
                  </>
                ) : (
                  <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                    Quantity
                  </TableHead>
                )}
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Total Invoice Value
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Type
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3 min-w-40 w-60">
                  Error
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBulkRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={bulkUploadTableColumnCount}
                    className="p-4 border border-gray-200 text-center text-sm text-gray-600"
                  >
                    No rows found for current search/filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBulkRows.map(
                  ({ row: val, originalIndex, tradeName }) => (
                    <TableRow
                      key={`${val.invoice_no}-${val.item_code}-${originalIndex}`}
                      className={`${
                        val.error
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <TableCell className="p-3 border border-gray-200 text-center text-sm">
                        {originalIndex + 1}
                      </TableCell>
                      <TableCell className="p-3 border border-gray-200 text-center text-sm">
                        {val.tin_number}
                      </TableCell>
                      <TableCell className="p-3 border border-gray-200 text-center text-sm">
                        {tradeName}
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
                      {dvatdata?.commodity === "MANUFACTURER" ||
                      dvatdata?.commodity === "WHOLESALER" ? (
                        <>
                          <TableCell className="p-3 border border-gray-200 text-center text-sm">
                            {val.quantity_in_crates !== null
                              ? val.quantity_in_crates
                              : "-"}
                          </TableCell>
                          <TableCell className="p-3 border border-gray-200 text-center text-sm">
                            {val.quantity}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="p-3 border border-gray-200 text-center text-sm">
                          {val.quantity}
                        </TableCell>
                      )}
                      <TableCell className="p-3 border border-gray-200 text-center text-sm">
                        {val.total_invoice_value.toFixed(2)}
                      </TableCell>
                      <TableCell className="p-3 border border-gray-200 text-center text-sm">
                        {dvatdata?.commodity === "MANUFACTURER" ||
                        dvatdata?.commodity == "WHOLESALER"
                          ? getPurchaseRowTypeLabel(val)
                          : getPurchaseTypeLabel(val.purchase_type)}
                      </TableCell>
                      <TableCell className="p-3 border border-gray-200 text-left text-sm text-red-600 whitespace-pre-line">
                        {val.errorname || "-"}
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>
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
            className="mt-4 rounded-lg"
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
    </>
  );
};

export default PurchaseBulk;
