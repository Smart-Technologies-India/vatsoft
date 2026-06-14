import { Dvat04Commodity } from "@prisma/client";
import { Button } from "antd";
import * as XLSX from "xlsx";

interface DownloadPurchaseSampleProps {
  commodity: Dvat04Commodity;
  setToolbarActionsOpen: (open: boolean) => void;
}
const DownloadPurchaseSample = (props: DownloadPurchaseSampleProps) => {
  const downloadBulkTemplate = () => {
    const isManufacturerCommodity =
      props.commodity === "MANUFACTURER" ||
      props.commodity == "WHOLESALER";
    const rows = [
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1001-A",
        "Invoice Date": "04/05/2026",
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
        ...(!isManufacturerCommodity && {
          Type: "REGULAR",
        }),
      },
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1001-A",
        "Invoice Date": "04/05/2026",
        "Item Code": 2,
        ...(isManufacturerCommodity
          ? { "Quantity in Crates": 1 }
          : { Quantity: 12 }),
        "Total Invoice Value": 8600,
        "Is Against C Form": isManufacturerCommodity ? "false" : "true",
        ...(isManufacturerCommodity && {
          "Is Against F Form": "true",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "false",
        }),
        ...(!isManufacturerCommodity && {
          Type: "AGAINST_CFORM",
        }),
      },
      {
        "TIN Number": "25000000000",
        "Invoice No": "INV1002-B",
        "Invoice Date": "05/05/2026",
        "Item Code": 3,
        ...(isManufacturerCommodity
          ? { "Quantity in Crates": 3 }
          : { Quantity: 30 }),
        "Total Invoice Value": 15000,
        "Is Against C Form": "false",
        ...(isManufacturerCommodity && {
          "Is Against F Form": "false",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "true",
        }),
        ...(!isManufacturerCommodity && {
          Type: "REGULAR",
        }),
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
        Rules: isManufacturerCommodity
          ? "If multiple items in same invoice, enter value separately for each item row. Tax will be calculated at 0%."
          : "If multiple items in same invoice, enter value separately for each item row. Must be inclusive of VAT.",
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
                "REGULAR, AGAINST_CFORM, AGAINST_FFORM, AGAINST_E1, AGAINST_IFORM, EXEMPT, H_EXPORT, EXPORT",
              Rules:
                "Only one type is allowed per row. If blank, it will be treated as REGULAR.",
            },
          ]),
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Upload");
    XLSX.writeFile(workbook, "vatsoft_purchase_template.xlsx");
  };

  return (
    <>
      <Button
        size="small"
        block
        type="default"
        onClick={() => {
          props.setToolbarActionsOpen(false);
          downloadBulkTemplate();
        }}
      >
        Download Sample
      </Button>
    </>
  );
};

export default DownloadPurchaseSample;
