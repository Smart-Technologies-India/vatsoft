"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { DvatType, Quarter, Status, returns_entry } from "@prisma/client";
import { getCurrentDvatId } from "@/lib/auth";

interface AddNilPayload {
  year: string;
  month: string;
  quarter: Quarter;
  createdById: number;
  dvat_type: DvatType;
  seller_tin_numberId: number;
  frequencyFilings?: string;
}

const AddNil = async (
  payload: AddNilPayload,
): Promise<ApiResponseType<boolean>> => {
  const functionname: string = AddNil.name;

  const dvatid = await getCurrentDvatId();

  if (!dvatid) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

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

  // Determine if quarterly filing
  const isQuarterlyFiling =
    payload.frequencyFilings?.toUpperCase() === "QUARTERLY";

  // Get months to process
  const quarterMonthsMap: Record<string, number[]> = {
    QUARTER1: [3, 4, 5], // Apr, May, Jun
    QUARTER2: [6, 7, 8], // Jul, Aug, Sep
    QUARTER3: [9, 10, 11], // Oct, Nov, Dec
    QUARTER4: [0, 1, 2], // Jan, Feb, Mar
  };

  const monthsToProcess = isQuarterlyFiling
    ? quarterMonthsMap[payload.quarter] || []
    : [monthNames.indexOf(payload.month)];

  if (!isQuarterlyFiling && monthsToProcess[0] === -1) {
    return createResponse({
      message: "Invalid month selected.",
      functionname,
    });
  }

  const isPurchaseType =
    payload.dvat_type === DvatType.DVAT_30 ||
    payload.dvat_type === DvatType.DVAT_30_A;
  const isSaleType =
    payload.dvat_type === DvatType.DVAT_31 ||
    payload.dvat_type === DvatType.DVAT_31_A;
  const isLocalType =
    payload.dvat_type === DvatType.DVAT_30 ||
    payload.dvat_type === DvatType.DVAT_31;

  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: dvatid,
        deletedAt: null,
        deletedById: null,
        status: "APPROVED",
      },
    });

    if (!dvat04) {
      return createResponse({
        message: "User Dvat04 not found.",
        functionname,
      });
    }

    // Process each month (single month for MONTHLY, 3 months for QUARTERLY)
    for (const monthIndex of monthsToProcess) {
      const monthName = monthNames[monthIndex];
      const startDate = new Date(parseInt(payload.year), monthIndex, 1);
      const endDate = new Date(parseInt(payload.year), monthIndex + 1, 1);

      // Check for existing entries
      if (isPurchaseType) {
        const purchaseCount = await prisma.daily_purchase.count({
          where: {
            dvat04Id: dvat04.id,
            is_dvat_30a: false,
            is_local: isLocalType,
            deletedAt: null,
            deletedById: null,
            invoice_date: {
              gte: startDate,
              lt: endDate,
            },
          },
        });

        if (purchaseCount > 0) {
          return createResponse({
            message: `Cannot add nil entry. Purchase entry exists for ${monthName}.`,
            functionname,
          });
        }
      }

      if (isSaleType) {
        const saleCount = await prisma.daily_sale.count({
          where: {
            dvat04Id: dvat04.id,
            is_dvat_31: false,
            is_local: isLocalType,
            deletedAt: null,
            deletedById: null,
            invoice_date: {
              gte: startDate,
              lt: endDate,
            },
          },
        });

        if (saleCount > 0) {
          return createResponse({
            message: `Cannot add nil entry. Sale entry exists for ${monthName}.`,
            functionname,
          });
        }
      }

      // Find or create returns_01
      const return_res = await prisma.returns_01.findFirst({
        where: {
          year: payload.year,
          quarter: payload.quarter,
          month: monthName,
          dvat04Id: dvat04.id,
          status: Status.ACTIVE,
          OR: [
            {
              return_type: "ORIGINAL",
            },
            {
              return_type: "REVISED",
            },
          ],
        },
      });

      if (return_res) {
        // Create entry for existing returns_01
        await prisma.returns_entry.create({
          data: {
            returns_01Id: return_res.id,
            dvat_type: payload.dvat_type,
            commodity_masterId: 1154,
            urn_number: "",
            total_invoice_number: "",
            invoice_number: "",
            description_of_goods: "Nil Filing",
            seller_tin_numberId: payload.seller_tin_numberId,
            status: Status.ACTIVE,
            invoice_date: new Date(
              parseInt(payload.year),
              monthIndex,
              5,
            ).toISOString(),
            createdById: payload.createdById,
            isnil: true,
          },
        });
      } else {
        // Create new returns_01 and entry
        const return_invoice = await prisma.returns_01.create({
          data: {
            rr_number: "",
            return_type: "ORIGINAL",
            year: payload.year,
            quarter: payload.quarter,
            month: monthName,
            dvat04Id: dvat04.id,
            filing_datetime: new Date(),
            file_status: Status.ACTIVE,
            total_tax_amount: "",
            status: Status.ACTIVE,
            createdById: payload.createdById,
            compositionScheme: dvat04.compositionScheme,
          },
        });

        if (!return_invoice) {
          return createResponse({
            message: "Return invoice is not created.",
            functionname,
          });
        }

        await prisma.returns_entry.create({
          data: {
            returns_01Id: return_invoice.id,
            dvat_type: payload.dvat_type,
            commodity_masterId: 1154,
            description_of_goods: "Nil Filing",
            urn_number: "",
            total_invoice_number: "",
            invoice_number: "",
            seller_tin_numberId: payload.seller_tin_numberId,
            status: Status.ACTIVE,
            invoice_date: new Date(
              parseInt(payload.year),
              monthIndex,
              5,
            ).toISOString(),
            createdById: payload.createdById,
            isnil: true,
          },
        });
      }
    }

    return createResponse({
      message: isQuarterlyFiling
        ? "Nil filing created successfully for all 3 months of the quarter"
        : "Return Invoice Created successfully",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddNil;
