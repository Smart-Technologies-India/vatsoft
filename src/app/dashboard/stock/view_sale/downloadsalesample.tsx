import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { commodity_master, Dvat04Commodity } from "@prisma/client";
import { Button } from "antd";
import * as XLSX from "xlsx";

interface DownloadSaleSampleProps {
  commodity: Dvat04Commodity;
  setToolbarActionsOpen: (open: boolean) => void;
}
const DownloadSaleSample = (props: DownloadSaleSampleProps) => {
  const { commodity } = props;

  const downloadBulkTemplate = async () => {
    const commodityType = commodity;
    const isManufacturerCommodity =
      commodityType === "MANUFACTURER" || commodityType === "WHOLESALER";
    const isRestaurantCommodity = commodityType === "RESTAURANT";

    let commodityMasterData: commodity_master[] = [];
    const commodityResponse = await AllCommodityMaster({});
    if (commodityResponse.status && commodityResponse.data) {
      commodityMasterData = commodityResponse.data;
    }

    const commoditySheetRows = commodityMasterData
      .filter(
        (commodity) =>
          commodity.deletedAt == null && commodity.deletedById == null,
      )
      .map((commodity) => ({
        "Commodity ID": commodity.id,
        "Commodity Name": commodity.product_name,
      }));

    const getCommoditySpecificColumns = (rowVariant: 1 | 2 | 3) => {
      if (commodityType === "MANUFACTURER") {
        if (rowVariant === 1) {
          return {
            "Is Against C Form": "false",
            "Is Against F Form": "false",
            "Is Against E1": "false",
            "Is Against I Form": "false",
            "Is Exempt": "false",
            "Is H Export": "false",
            "Is Export": "false",
          };
        }

        if (rowVariant === 2) {
          return {
            "Is Against C Form": "true",
            "Is Against F Form": "false",
            "Is Against E1": "false",
            "Is Against I Form": "false",
            "Is Exempt": "false",
            "Is H Export": "false",
            "Is Export": "false",
          };
        }

        return {
          "Is Against C Form": "false",
          "Is Against F Form": "true",
          "Is Against E1": "false",
          "Is Against I Form": "false",
          "Is Exempt": "false",
          "Is H Export": "false",
          "Is Export": "false",
        };
      }

      if (commodityType === "FUEL") {
        if (rowVariant === 1) {
          return {
            "Is Against C Form": "false",
            "Is Against F Form": "false",
            "Is Exempt": "false",
          };
        }

        if (rowVariant === 2) {
          return {
            "Is Against C Form": "true",
            "Is Against F Form": "false",
            "Is Exempt": "false",
          };
        }

        return {
          "Is Against C Form": "false",
          "Is Against F Form": "true",
          "Is Exempt": "true",
        };
      }

      if (commodityType === "RESTAURANT") {
        if (rowVariant === 1) {
          return {
            "Pcs/mL": "true",
          };
        }

        if (rowVariant === 2) {
          return {
            "Pcs/mL": "false",
          };
        }

        return {
          "Pcs/mL": "true",
        };
      }

      return {};
    };

    const commoditySpecificInstructionRows =
      commodityType === "MANUFACTURER"
        ? [
            {
              Field: "Is Against C Form",
              "What to fill": "true or false",
              Rules:
                "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
            },
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
        : commodityType === "FUEL"
          ? [
              {
                Field: "Is Against C Form",
                "What to fill": "true or false",
                Rules:
                  "Preferred true/false. yes/no/1/0 are also accepted. NA or blank is not allowed.",
              },
              {
                Field: "Is Against F Form",
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
            ]
          : commodityType === "RESTAURANT"
            ? [
                {
                  Field: "Pcs/mL",
                  "What to fill": "true/false or ml/pcs or 1/0",
                  Rules:
                    "Accepted values: true, false, ml, pcs, 1, 0. true/ml/1 = mL quantity (taken as-is). false/pcs/0 = pcs quantity (system multiplies by commodity pack size).",
                },
              ]
          : [];

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
        ...getCommoditySpecificColumns(1),
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
        ...getCommoditySpecificColumns(2),
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
        ...getCommoditySpecificColumns(3),
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
      ...(isRestaurantCommodity
        ? [
            {
              Field: "Pcs/mL",
              "What to fill": "true/false or ml/pcs or 1/0",
              Rules:
                "For RESTAURANT accepted values are true, false, ml, pcs, 1, 0. true/ml/1 means quantity is mL (1:1 stock deduction). false/pcs/0 means quantity is pcs (deduction = quantity x pack size).",
            },
          ]
        : []),
      {
        Field: "Total Invoice Value",
        "What to fill": "Item-wise amount inclusive of VAT",
        Rules:
          "If multiple items in same invoice, enter value separately for each item row. Must be inclusive of VAT.",
      },
      ...commoditySpecificInstructionRows,
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsRows);
    const commoditySheet = XLSX.utils.json_to_sheet(commoditySheetRows);
    // commoditySheet["!protect"] = {
    //   password: "P@ssw0rd#8421",
    //   selectLockedCells: true,
    //   selectUnlockedCells: true,
    // };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    XLSX.utils.book_append_sheet(workbook, commoditySheet, "Commodity");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Upload");
    XLSX.writeFile(workbook, "vatsoft_sale_template.xlsx");
  };

  return (
    <>
      <Button
        size="small"
        block
        type="default"
        onClick={async () => {
          props.setToolbarActionsOpen(false);
          await downloadBulkTemplate();
        }}
      >
        Download Sample
      </Button>
    </>
  );
};

export default DownloadSaleSample;
