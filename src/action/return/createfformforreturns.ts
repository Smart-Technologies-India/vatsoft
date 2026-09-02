"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import {
  CategoryOfEntry,
  DvatType,
  PurchaseType,
  SelectOffice,
  Status,
} from "@prisma/client";

interface CreateFFormForReturnsResponse {
  created: number;
  skipped: number;
  fforms: any[];
}

const CreateFFormForReturns = async (): Promise<
  ApiResponseType<CreateFFormForReturnsResponse | null>
> => {
  const functionname: string = CreateFFormForReturns.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Get all returns_entry that are eligible for F-Form (buyer-related entries)
    // but don't have a corresponding fform_returns record
    const returnsWithoutFForm = await prisma.returns_entry.findMany({
      where: {
        dvat_type: DvatType.DVAT_30_A,
        category_of_entry: CategoryOfEntry.INVOICE,
        purchase_type: PurchaseType.STOCK_TRANSFER,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        returns_01: {
          dvat04Id: currentDvatId,
          deletedAt: null,
          deletedById: null,
          status: "PAID",
        },
        fform_returns: {
          none: {},
        },
      },
      include: {
        returns_01: {
          include: {
            dvat04: true,
          },
        },
        seller_tin_number: true,
      },
    });

    if (returnsWithoutFForm.length === 0) {
      return {
        status: true,
        data: {
          created: 0,
          skipped: 0,
          fforms: [],
        },
        message: "No returns found that need F-Form.",
        functionname,
      };
    }

    // Group returns by buyer and month
    const groupedByBuyerAndPeriod = new Map<
      string,
      (typeof returnsWithoutFForm)[0][]
    >();

    returnsWithoutFForm.forEach((entry) => {
      // Group by individual month
      const key = `${entry.seller_tin_numberId}-${entry.returns_01.month}-${entry.returns_01.year}`;
      if (!groupedByBuyerAndPeriod.has(key)) {
        groupedByBuyerAndPeriod.set(key, []);
      }
      groupedByBuyerAndPeriod.get(key)!.push(entry);
    });

    const result: CreateFFormForReturnsResponse = {
      created: 0,
      skipped: 0,
      fforms: [],
    };

    const nanoid = customAlphabet("1234567890", 10);

    // Create F-Forms for each seller-period group
    for (const [, entries] of groupedByBuyerAndPeriod) {
      const firstEntry = entries[0];
      const returns01 = firstEntry.returns_01;
      const sellerTin = firstEntry.seller_tin_number;

      if (!sellerTin) {
        continue; // Skip if seller tin is not available
      }

      // Check if an fform already exists for this seller and month
      const monthDates = getMonthDateRange(
        returns01.year,
        returns01.month ?? "",
      );

      const existingFForm = await prisma.fform.findFirst({
        where: {
          dvat04Id: currentDvatId,
          seller_tin_no: sellerTin.tin_number,
          from_period: {
            gte: monthDates.fromDate,
            lte: monthDates.toDate,
          },
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      });

      let fformId: number;

      if (existingFForm) {
        fformId = existingFForm.id;
        result.skipped += entries.length;
      } else {
        // Create new F-Form for the month
        const srNo = nanoid();
        const monthDates = getMonthDateRange(
          returns01.year,
          returns01.month ?? "",
        );
        const officeOfIssue: SelectOffice =
          returns01.dvat04?.selectOffice || SelectOffice.Dadra_Nagar_Haveli;
        const now = new Date();
        const certdate = returns01.dvat04?.certificateDate || new Date();

        const newFForm = await prisma.fform.create({
          data: {
            dvat04Id: currentDvatId,
            sr_no: srNo,
            seller_tin_no: sellerTin.tin_number,
            seller_name: sellerTin.name_of_dealer || "Unknown",
            seller_address: sellerTin.state || "",
            date_of_issue: now,
            valid_date: certdate, // 1 year validity
            amount: entries
              .reduce(
                (sum, entry) =>
                  sum + parseFloat(entry.total_invoice_number || "0"),
                0,
              )
              .toString(),
            from_period: monthDates.fromDate,
            to_period: monthDates.toDate,
            office_of_issue: officeOfIssue,
            fform_type: returns01.return_type,
            status: "ACTIVE" as Status,
            createdById: currentUserId,
          },
        });

        fformId = newFForm.id;
        result.created += 1;
        result.fforms.push(newFForm);
      }

      // Create fform_returns entries for all the returns_entry records
      for (const entry of entries) {
        await prisma.fform_returns.create({
          data: {
            fformId,
            returns_entryId: entry.id,
          },
        });
      }
    }

    return {
      status: true,
      data: result,
      message: `Successfully processed ${returnsWithoutFForm.length} returns. Created ${result.created} F-Form(s).`,
      functionname,
    };
  } catch (error) {
    const errorMsg = errorToString(error);
    console.error(`[${functionname}] Error:`, errorMsg);
    return {
      status: false,
      data: null,
      message: errorMsg || "Failed to create F-Forms for returns",
      functionname,
    };
  }
};

const getMonthDateRange = (
  year: string,
  month: string,
): { fromDate: Date; toDate: Date } => {
  const yearNum = parseInt(year);
  const monthMap: { [key: string]: number } = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const monthIndex = monthMap[month] ?? 0;
  const fromDate = new Date(yearNum, monthIndex, 1);
  const toDate = new Date(yearNum, monthIndex + 1, 0); // Last day of the month

  return { fromDate, toDate };
};

export default CreateFFormForReturns;
