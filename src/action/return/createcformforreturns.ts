"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { returns_01, SelectOffice } from "@prisma/client";

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

    // Group returns by seller and quarter period
    const groupedBySellerAndPeriod = new Map<
      string,
      (typeof returnsWithoutCForm)[0][]
    >();

    returnsWithoutCForm.forEach((entry) => {
      // Group by quarter instead of individual month
      const monthGroup = getMonthGroup(entry.returns_01.month ?? "");
      const quarterKey = monthGroup.join("-"); // e.g., "April-May-June"
      const key = `${entry.seller_tin_numberId}-${quarterKey}-${entry.returns_01.year}`;
      if (!groupedBySellerAndPeriod.has(key)) {
        groupedBySellerAndPeriod.set(key, []);
      }
      groupedBySellerAndPeriod.get(key)!.push(entry);
    });

    // Validate that all three months of the quarter have filed returns, and at least one has entries
    const validQuarterGroups = new Map<
      string,
      (typeof returnsWithoutCForm)[0][]
    >();

    for (const [key, entries] of groupedBySellerAndPeriod) {
      const firstEntry = entries[0];
      const monthGroup = getMonthGroup(firstEntry.returns_01.month ?? "");
      const year = firstEntry.returns_01.year;
      const sellerId = firstEntry.seller_tin_numberId;

      // Step 1: Check if ALL three months of the quarter have FILED returns (status = "PAID")
      let allMonthsHaveFiledReturns = true;

      for (const month of monthGroup) {
        const filedReturn = await prisma.returns_01.findFirst({
          where: {
            dvat04Id: currentDvatId,
            deletedAt: null,
            deletedById: null,
            status: "PAID", // Return must be filed/paid
            year: year,
            month: month,
          },
        });

        if (!filedReturn) {
          allMonthsHaveFiledReturns = false;
          break;
        }
      }

      // Step 2: If all three months have filed returns, check if at least one has C-Form entries
      if (allMonthsHaveFiledReturns) {
        let hasAtLeastOneEntry = false;

        for (const month of monthGroup) {
          const monthHasEntry = await prisma.returns_entry.findFirst({
            where: {
              deletedAt: null,
              deletedById: null,
              status: "ACTIVE",
              seller_tin_numberId: sellerId,
              cfrom_returns: {
                none: {}, // Must NOT have a cform_returns record
              },
              returns_01: {
                dvat04Id: currentDvatId,
                deletedAt: null,
                deletedById: null,
                status: "PAID",
                year: year,
                month: month,
              },
              dvat_type: "DVAT_30_A",
              category_of_entry: "INVOICE",
              purchase_type: "FORMC_CONCESSION",
            },
          });

          if (monthHasEntry) {
            hasAtLeastOneEntry = true;
            break;
          }
        }

        if (hasAtLeastOneEntry) {
          // All three months are filed AND at least one has C-Form entries - C-Form can be created
          validQuarterGroups.set(key, entries);
        }
      }
    }

    const result: CreateCFormForReturnsResponse = {
      created: 0,
      skipped: 0,
      cforms: [],
    };

    let cformSrNoCounter = 0;

    console.log("Valid quarter groups:", validQuarterGroups);
    // Create C-Forms for quarters where all three months are filed AND at least one has entries
    for (const [, entries] of validQuarterGroups) {
      const firstEntry = entries[0];
      const returns01 = firstEntry.returns_01;
      const sellerTin = firstEntry.seller_tin_number;

      // Check if a cform already exists for this seller and quarter period
      const quarterDates = getQuarterDates(
        returns01.year,
        returns01.month ?? "",
      );
      console.log("Quarter Dates:", quarterDates);
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

        const now = new Date();
        const quarterDates = getQuarterDates(
          returns01.year,
          returns01.month ?? "",
        );
        const office = returns01.dvat04?.selectOffice || "Dadra_Nagar_Haveli";

        console.log(quarterDates);
        const lastcform = await prisma.cform.findFirst({
          where: {
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
            office_of_issue: office,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Get the highest serial number from both cform and fform
        const cformSerial = lastcform
          ? parseInt(lastcform.sr_no.split("/").pop() ?? "0", 10) || 0
          : 0;

        const newCForm = await prisma.cform.create({
          data: {
            dvat04Id: currentDvatId,
            sr_no: getsrno(office, cformSerial, cformSrNoCounter++),
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
              .toFixed(2),
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
      message: `Successfully processed ${returnsWithoutCForm.length} returns. Created ${result.created} C-Form(s).`,
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

const getsrno = (
  selectOffice: SelectOffice,
  last: number,
  offset: number = 0,
): string => {
  let pre =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "DNH"
      : selectOffice == SelectOffice.DAMAN
        ? "DD"
        : "DIU";

  let value1 =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "01"
      : selectOffice == SelectOffice.DAMAN
        ? "02"
        : "03";

  return `${pre}/${value1}/C/${last + offset + 1}`;
};
