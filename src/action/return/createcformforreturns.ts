"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import { returns_01 } from "@prisma/client";

interface CreateCFormForReturnsResponse {
  created: number;
  skipped: number;
  cforms: any[];
}

const CreateCFormForReturns = async (): Promise<
  ApiResponseType<CreateCFormForReturnsResponse | null>
> => {
  const functionname: string = CreateCFormForReturns.name;

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

    // Get all returns_entry that belong to DVAT_30_A (C-Form applicable) entries
    // but don't have a corresponding cform_returns record
    // Include all months as they are grouped by quarters
    const quarterMonths = ["March", "June", "September", "December"];

    const returnsWithoutCForm = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        returns_01: {
          dvat04Id: currentDvatId,
          deletedAt: null,
          deletedById: null,
          status: "PAID",
          month: {
            in: quarterMonths,
          },
          // Include returns from all months (will be grouped by quarters)
        },
        // Entries that don't have a cform_returns record
        cfrom_returns: {
          none: {},
        },
        // Only include DVAT_30_A entries which are eligible for C-Form
        dvat_type: "DVAT_30_A",
        category_of_entry: "INVOICE",
        purchase_type: "FORMC_CONCESSION",
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

    if (returnsWithoutCForm.length === 0) {
      return {
        status: true,
        data: {
          created: 0,
          skipped: 0,
          cforms: [],
        },
        message: "No returns found that need C-Form.",
        functionname,
      };
    }

    const uniquereturns = new Map<number, returns_01>();
    for (const entry of returnsWithoutCForm) {
      if (!uniquereturns.has(entry.returns_01Id)) {
        uniquereturns.set(entry.returns_01Id, entry.returns_01);
      }
    }

    let return_entry_response: typeof returnsWithoutCForm = [];

    for (const entry of uniquereturns.values()) {
      const monthGroup = getMonthGroup(entry.month ?? "");
      const reutns_response = await prisma.returns_entry.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          returns_01: {
            dvat04Id: currentDvatId,
            deletedAt: null,
            deletedById: null,
            status: "PAID",
            month: {
              in: monthGroup,
            },
          },
          cfrom_returns: {
            none: {},
          },
          dvat_type: "DVAT_30_A",
          category_of_entry: "INVOICE",
          purchase_type: "FORMC_CONCESSION",
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
      return_entry_response.push(...reutns_response);
    }

    // Group returns by seller and quarter period
    const groupedBySellerAndPeriod = new Map<
      string,
      (typeof returnsWithoutCForm)[0][]
    >();

    return_entry_response.forEach((entry) => {
      // Group by quarter instead of individual month
      const monthGroup = getMonthGroup(entry.returns_01.month ?? "");
      const quarterKey = monthGroup.join("-"); // e.g., "April-May-June"
      const key = `${entry.seller_tin_numberId}-${quarterKey}-${entry.returns_01.year}`;
      if (!groupedBySellerAndPeriod.has(key)) {
        groupedBySellerAndPeriod.set(key, []);
      }
      groupedBySellerAndPeriod.get(key)!.push(entry);
    });
    // console.log(groupedBySellerAndPeriod);
    // console.log(groupedBySellerAndPeriod.size);

    const result: CreateCFormForReturnsResponse = {
      created: 0,
      skipped: 0,
      cforms: [],
    };

    const nanoid = customAlphabet("1234567890", 10);

    // Create C-Forms for each seller-period group
    for (const [, entries] of groupedBySellerAndPeriod) {
      const firstEntry = entries[0];
      const returns01 = firstEntry.returns_01;
      const sellerTin = firstEntry.seller_tin_number;

      // Check if a cform already exists for this seller and quarter period
      const monthGroup = getMonthGroup(returns01.month ?? "");
      const quarterDates = getQuarterDates(
        returns01.year,
        returns01.month ?? "",
      );
      const certdate = returns01.dvat04?.certificateDate || new Date();

      const existingCForm = await prisma.cform.findFirst({
        where: {
          dvat04Id: currentDvatId,
          seller_tin_no: sellerTin.tin_number,
          from_period: {
            gte: quarterDates.fromDate,
            lte: quarterDates.toDate,
          },
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      });

      let cformId: number;

      if (existingCForm) {
        cformId = existingCForm.id;
        result.skipped += entries.length;
      } else {
        // Create new C-Form for the quarter
        const srNo = nanoid();
        const now = new Date();
        const quarterDates = getQuarterDates(
          returns01.year,
          returns01.month ?? "",
        );
        const office = returns01.dvat04?.selectOffice || "Dadra_Nagar_Haveli";

        const newCForm = await prisma.cform.create({
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
            from_period: quarterDates.fromDate,
            to_period: quarterDates.toDate,
            office_of_issue: office,
            cform_type: returns01.return_type,
            status: "ACTIVE",
            createdById: currentUserId,
          },
        });

        cformId = newCForm.id;
        result.created += 1;
        result.cforms.push(newCForm);
      }

      // Create cform_returns entries for all the returns_entry records
      for (const entry of entries) {
        await prisma.cform_returns.create({
          data: {
            cformId,
            returns_entryId: entry.id,
          },
        });
      }
    }

    return {
      status: true,
      data: result,
      message: `Successfully processed ${return_entry_response.length} returns. Created ${result.created} C-Form(s).`,
      functionname,
    };
  } catch (error) {
    const errorMsg = errorToString(error);
    return {
      status: false,
      data: null,
      message: errorMsg || "Failed to create C-Forms for returns",
      functionname,
    };
  }
};

const getMonthGroup = (currentMonth: string): string[] => {
  const monthGroups = [
    ["April", "May", "June"],
    ["July", "August", "September"],
    ["October", "November", "December"],
    ["January", "February", "March"],
  ];

  // Find the group that contains the current month
  for (const group of monthGroups) {
    if (group.includes(currentMonth)) {
      return group;
    }
  }

  return [];
};

const getQuarterDates = (
  year: string,
  month: string,
): { fromDate: Date; toDate: Date } => {
  const yearNum = parseInt(year);

  if (["January", "February", "March"].includes(month)) {
    return {
      fromDate: new Date(yearNum, 0, 1), // January 1
      toDate: new Date(yearNum, 2, 31), // March 31
    };
  } else if (["April", "May", "June"].includes(month)) {
    return {
      fromDate: new Date(yearNum, 3, 1), // April 1
      toDate: new Date(yearNum, 5, 30), // June 30
    };
  } else if (["July", "August", "September"].includes(month)) {
    return {
      fromDate: new Date(yearNum, 6, 1), // July 1
      toDate: new Date(yearNum, 8, 30), // September 30
    };
  } else if (["October", "November", "December"].includes(month)) {
    return {
      fromDate: new Date(yearNum, 9, 1), // October 1
      toDate: new Date(yearNum, 11, 31), // December 31
    };
  }

  // Default fallback (should not reach here)
  return {
    fromDate: new Date(yearNum, 0, 1),
    toDate: new Date(yearNum, 11, 31),
  };
};

export default CreateCFormForReturns;
