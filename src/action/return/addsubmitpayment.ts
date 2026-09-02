"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  DvatType,
  PurchaseType,
  returns_01,
  ReturnType,
  SelectOffice,
} from "@prisma/client";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface AddSubmitPaymentPayload {
  id: number;
  rr_number: string;
  penalty: string;
}

const AddSubmitPayment = async (
  payload: AddSubmitPaymentPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddSubmitPayment.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddSubmitPayment",
      } as any;
    }

    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          OR: [
            {
              status: "PAID",
              return_type: "REVISED",
            },
            {
              status: "LATE",
              return_type: "REVISED",
            },
            {
              status: "PAID",
              return_type: "ORIGINAL",
            },
            {
              status: "LATE",
              return_type: "ORIGINAL",
            },
          ],
          penalty: payload.penalty,
        },
        include: {
          dvat04: true,
        },
      });

      if (!isExist) {
        throw new Error("Invalid Id, try again");
      }
      const updateresponse = await prisma.returns_01.update({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
        data: {
          transaction_date: addPrismaDatabaseDate(new Date()).toISOString(),
          paymentmode: "ONLINE",
          rr_number: payload.rr_number,
          filing_datetime: new Date(),
        },
        include: {
          dvat04: true,
        },
      });
      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to submit");
      }

      if (updateresponse.dvat04.compositionScheme) {
        const monthsToUpdate = getMonthGroup(updateresponse.month ?? "");
        await prisma.return_filing.updateMany({
          where: {
            filing_status: false,
            dvatid: updateresponse.dvat04Id,
            filing_date: null,
            year: updateresponse.year,
            month: { in: monthsToUpdate },
          },
          data: {
            filing_date: new Date(),
            filing_status: true,
          },
        });
      } else {
        await prisma.return_filing.updateMany({
          where: {
            filing_status: false,
            dvatid: updateresponse.dvat04Id,
            filing_date: null,
            year: updateresponse.year,
            month: updateresponse.month ?? "",
          },
          data: {
            filing_date: new Date(),
            filing_status: true,
          },
        });
      }

      // if (
      //   ["March", "June", "September", "December"].includes(isExist.month ?? "")
      // ) {
      //   const monthsToUpdate = getMonthGroup(isExist.month ?? "");

      //   // step 1 : get all entry
      //   const returnEntry = await prisma.returns_entry.findMany({
      //     where: {
      //       dvat_type: DvatType.DVAT_30_A,
      //       category_of_entry: CategoryOfEntry.INVOICE,
      //       purchase_type: PurchaseType.FORMC_CONCESSION,
      //       status: "ACTIVE",
      //       deletedAt: null,
      //       deletedById: null,
      //       returns_01: {
      //         dvat04Id: isExist.dvat04Id,
      //         year:
      //           isExist.month == "March"
      //             ? (parseInt(isExist.year) + 1).toString()
      //             : isExist.year,
      //         month: { in: monthsToUpdate },
      //       },
      //     },
      //     include: {
      //       seller_tin_number: true,
      //     },
      //   });

      //   // step 2 : get all entry
      //   const groupedData = returnEntry.reduce<
      //     Record<
      //       number,
      //       {
      //         seller_tin_numberId: number;
      //         totalAmount: number;
      //         entries: typeof returnEntry;
      //       }
      //     >
      //   >((acc, entry) => {
      //     const sellerId = entry.seller_tin_numberId;
      //     const amount = parseFloat(entry.total_invoice_number || "0");

      //     if (!acc[sellerId]) {
      //       acc[sellerId] = {
      //         seller_tin_numberId: sellerId,
      //         totalAmount: 0,
      //         entries: [],
      //       };
      //     }

      //     acc[sellerId].totalAmount += amount;
      //     acc[sellerId].entries.push(entry);

      //     return acc;
      //   }, {});

      //   const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

      //   // Get the last form (cform or fform) created for this office to determine serial number
      //   const lastcform = await prisma.cform.findFirst({
      //     where: {
      //       deletedAt: null,
      //       deletedById: null,
      //       status: "ACTIVE",
      //       office_of_issue: isExist.dvat04.selectOffice,
      //     },
      //     orderBy: {
      //       createdAt: "desc",
      //     },
      //   });

      //   const lastfform = await prisma.fform.findFirst({
      //     where: {
      //       deletedAt: null,
      //       deletedById: null,
      //       status: "ACTIVE",
      //       office_of_issue: isExist.dvat04.selectOffice,
      //     },
      //     orderBy: {
      //       createdAt: "desc",
      //     },
      //   });

      //   // Get the highest serial number from both cform and fform
      //   const cformSerial = lastcform
      //     ? parseInt(lastcform.sr_no.split("/").pop() ?? "0", 10) || 0
      //     : 0;
      //   const fformSerial = lastfform
      //     ? parseInt(lastfform.sr_no.split("/").pop() ?? "0", 10) || 0
      //     : 0;
      //   const lastOfficeSerial = Math.max(cformSerial, fformSerial);

      //   // Create a Map to track seller ID to cform ID
      //   const sellerToCformMap = new Map<number, number>();
      //   let cformSrNoCounter = 0;

      //   // Create cforms for each seller
      //   for (const [sellerId, group] of Object.entries(groupedData)) {
      //     const sellerIdNum = parseInt(sellerId, 10);
      //     const representativeEntry = group.entries[0]; // Pick one entry to extract seller info

      //     const cformResponse = await prisma.cform.create({
      //       data: {
      //         amount: group.totalAmount.toFixed(2),
      //         dvat04Id: isExist.dvat04Id,
      //         office_of_issue: isExist.dvat04.selectOffice,
      //         date_of_issue: new Date(
      //           dates.toDate.split("-").reverse().join("-"),
      //         ),
      //         valid_date: isExist.dvat04.certificateDate!,
      //         sr_no: getsrno(
      //           isExist.dvat04.selectOffice!,
      //           lastOfficeSerial,
      //           cformSrNoCounter++,
      //         ),
      //         seller_address: representativeEntry.seller_tin_number.state ?? "",
      //         seller_name:
      //           representativeEntry.seller_tin_number.name_of_dealer ?? "",
      //         seller_tin_no:
      //           representativeEntry.seller_tin_number.tin_number ?? "",
      //         cform_type: ReturnType.ORIGINAL,
      //         from_period: new Date(
      //           dates.fromDate.split("-").reverse().join("-"),
      //         ),
      //         to_period: new Date(dates.toDate.split("-").reverse().join("-")),
      //         status: "ACTIVE",
      //         createdById: isExist.createdById,
      //       },
      //     });

      //     // Store the mapping of seller ID to cform ID
      //     sellerToCformMap.set(sellerIdNum, cformResponse.id);
      //   }

      //   // Step 2: Add entries to `cform_returns` table using the Map
      //   const cformReturnsEntries: {
      //     cformId: number;
      //     returns_entryId: number;
      //   }[] = [];

      //   for (const [sellerId, group] of Object.entries(groupedData)) {
      //     const sellerIdNum = parseInt(sellerId, 10);
      //     const cformId = sellerToCformMap.get(sellerIdNum);

      //     if (!cformId) {
      //       throw new Error(
      //         `CForm entry for seller ${sellerIdNum} was not created`,
      //       );
      //     }

      //     group.entries.forEach((entry) => {
      //       // Verify entry belongs to the correct DVAT
      //       if (entry.seller_tin_numberId !== sellerIdNum) {
      //         throw new Error(
      //           `Entry ${entry.id} belongs to seller ${entry.seller_tin_numberId}, but expected ${sellerIdNum}`,
      //         );
      //       }

      //       cformReturnsEntries.push({
      //         cformId,
      //         returns_entryId: entry.id,
      //       });
      //     });
      //   }

      //   // Step 3: Insert `cform_returns` entries in bulk
      //   if (cformReturnsEntries.length > 0) {
      //     const response = await prisma.cform_returns.createMany({
      //       data: cformReturnsEntries,
      //     });
      //     if (!response) {
      //       throw new Error(`CForm return entry was not created`);
      //     }
      //   }
      // }

      // fform start here
      // const monthsToUpdate = getMonthGroup(isExist.month ?? "");

      // // step 1 : get all entry
      // const returnEntry = await prisma.returns_entry.findMany({
      //   where: {
      //     dvat_type: DvatType.DVAT_30_A,
      //     category_of_entry: CategoryOfEntry.INVOICE,
      //     purchase_type: PurchaseType.STOCK_TRANSFER,
      //     status: "ACTIVE",
      //     deletedAt: null,
      //     deletedById: null,
      //     returns_01: {
      //       dvat04Id: isExist.dvat04Id,
      //       year:
      //         isExist.month == "March"
      //           ? (parseInt(isExist.year) + 1).toString()
      //           : isExist.year,
      //       month: { in: monthsToUpdate },
      //     },
      //   },
      //   include: {
      //     seller_tin_number: true,
      //     returns_01: true,
      //   },
      // });

      // // step 2 : group by month
      // const groupedByMonth = returnEntry.reduce<
      //   Record<
      //     string,
      //     {
      //       month: string;
      //       year: string;
      //       totalAmount: number;
      //       entries: typeof returnEntry;
      //     }
      //   >
      // >((acc, entry) => {
      //   const month = entry.returns_01.month ?? "";
      //   const year = entry.returns_01.year;
      //   const key = `${year}-${month}`;
      //   const amount = parseFloat(entry.total_invoice_number || "0");

      //   if (!acc[key]) {
      //     acc[key] = {
      //       month,
      //       year,
      //       totalAmount: 0,
      //       entries: [],
      //     };
      //   }

      //   acc[key].totalAmount += amount;
      //   acc[key].entries.push(entry);

      //   return acc;
      // }, {});

      // const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

      // // Get the last form (cform or fform) created for this office to determine serial number
      // const lastcformForSerial = await prisma.cform.findFirst({
      //   where: {
      //     deletedAt: null,
      //     deletedById: null,
      //     status: "ACTIVE",
      //     office_of_issue: isExist.dvat04.selectOffice,
      //   },
      //   orderBy: {
      //     createdAt: "desc",
      //   },
      // });

      // const lastfformForSerial = await prisma.fform.findFirst({
      //   where: {
      //     deletedAt: null,
      //     deletedById: null,
      //     status: "ACTIVE",
      //     office_of_issue: isExist.dvat04.selectOffice,
      //   },
      //   orderBy: {
      //     createdAt: "desc",
      //   },
      // });

      // // Get the highest serial number from both cform and fform
      // const cformSerialForFform = lastcformForSerial
      //   ? parseInt(lastcformForSerial.sr_no.split("/").pop() ?? "0", 10) || 0
      //   : 0;
      // const fformSerialForFform = lastfformForSerial
      //   ? parseInt(lastfformForSerial.sr_no.split("/").pop() ?? "0", 10) || 0
      //   : 0;
      // const lastOfficeSerial = Math.max(
      //   cformSerialForFform,
      //   fformSerialForFform,
      // );

      // // Create a Map to track month keys to fform IDs
      // const monthToFformMap = new Map<string, number>();
      // let srNoCounter = 0;

      // // Create fforms for each month
      // for (const [monthKey, monthGroup] of Object.entries(groupedByMonth)) {
      //   const representativeEntry = monthGroup.entries[0];

      //   const fformResponse = await prisma.fform.create({
      //     data: {
      //       amount: monthGroup.totalAmount.toFixed(2),
      //       dvat04Id: isExist.dvat04Id,
      //       office_of_issue: isExist.dvat04.selectOffice,
      //       date_of_issue: new Date(
      //         dates.toDate.split("-").reverse().join("-"),
      //       ),
      //       valid_date: isExist.dvat04.certificateDate ?? new Date(),
      //       sr_no: getsrnofform(
      //         isExist.dvat04.selectOffice!,
      //         lastOfficeSerial,
      //         srNoCounter++,
      //       ),
      //       seller_address: representativeEntry.seller_tin_number.state ?? "",
      //       seller_name:
      //         representativeEntry.seller_tin_number.name_of_dealer ?? "",
      //       seller_tin_no:
      //         representativeEntry.seller_tin_number.tin_number ?? "",
      //       fform_type: ReturnType.ORIGINAL,
      //       from_period: new Date(
      //         dates.fromDate.split("-").reverse().join("-"),
      //       ),
      //       to_period: new Date(dates.toDate.split("-").reverse().join("-")),
      //       status: "ACTIVE",
      //       createdById: isExist.createdById,
      //     },
      //   });

      //   // Store the mapping of month key to fform ID
      //   monthToFformMap.set(monthKey, fformResponse.id);
      // }

      // // Step 2: Add entries to `fform_returns` table using the Map
      // const fformReturnsEntries: {
      //   fformId: number;
      //   returns_entryId: number;
      // }[] = [];

      // for (const [monthKey, monthGroup] of Object.entries(groupedByMonth)) {
      //   const fformId = monthToFformMap.get(monthKey);

      //   if (!fformId) {
      //     throw new Error(`FForm entry for month ${monthKey} was not created`);
      //   }

      //   // Add all entries from this month to the fform_returns list
      //   monthGroup.entries.forEach((entry) => {
      //     // Verify entry belongs to the correct DVAT
      //     if (entry.returns_01.dvat04Id !== isExist.dvat04Id) {
      //       throw new Error(
      //         `Entry ${entry.id} belongs to DVAT ${entry.returns_01.dvat04Id}, but expected ${isExist.dvat04Id}`,
      //       );
      //     }

      //     fformReturnsEntries.push({
      //       fformId,
      //       returns_entryId: entry.id,
      //     });
      //   });
      // }

      // // Step 3: Insert `fform_returns` entries in bulk
      // if (fformReturnsEntries.length > 0) {
      //   const response = await prisma.fform_returns.createMany({
      //     data: fformReturnsEntries,
      //   });
      //   if (!response) {
      //     throw new Error(`FForm return entry was not created`);
      //   }
      // }

      return updateresponse;
    });

    return createResponse({
      message: "Form submitted completed successfully.",
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddSubmitPayment;

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

function getFromDateAndToDate(
  year: string,
  month: string,
): { fromDate: string; toDate: string } {
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

  // Get the current month index
  const monthIndex = monthNames.indexOf(month);
  if (monthIndex === -1) {
    throw new Error("Invalid month name");
  }

  // Calculate the `toDate`
  const toYear = month === "March" ? parseInt(year) + 1 : parseInt(year);
  const toDate = new Date(toYear, monthIndex + 1, 0); // Last day of the month

  // Calculate the `fromDate` (current month - 2 months)
  const fromDate = new Date(parseInt(year), monthIndex - 2, 1); // First day of the month

  // Format the dates to DD-MM-YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return {
    fromDate: formatDate(fromDate),
    toDate: formatDate(toDate),
  };
}

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

const getsrnofform = (
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

  return `${pre}/${value1}/F/${last + offset + 1}`;
};
