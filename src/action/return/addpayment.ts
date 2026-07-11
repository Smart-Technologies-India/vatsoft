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
import { customAlphabet } from "nanoid";

interface AddPaymentPayload {
  id: number;
  bank_name: string;
  transaction_id: string;
  track_id: string;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  challan_vat: string;
  challan_interest: string;
  challan_penalty: string;
  challan_other?: string;
  challan_total_tax_amount: string;
  pending_cash?: string;
}

const AddPayment = async (
  payload: AddPaymentPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPayment.name;
  const nanoid = customAlphabet("1234567890", 12);

  const cpin: string = nanoid();

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddPayment",
      } as any;
    }

    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          OR: [
            {
              return_type: "REVISED",
            },
            {
              return_type: "ORIGINAL",
            },
          ],
        },
        include: {
          dvat04: true,
        },
      });

      if (!isExist) {
        throw new Error("Invalid Id, try again");
      }

      // For new component logic: component calls this separately for each return with already-determined values
      // Just update the specific return, don't divide or find other quarterly returns
      const transactionDate = addPrismaDatabaseDate(new Date()).toISOString();
      const filingDate = new Date();

      await prisma.returns_01.update({
        where: {
          id: payload.id,
        },
        data: {
          bank_name: payload.bank_name,
          track_id: payload.track_id,
          transaction_id: payload.transaction_id,
          transaction_date: transactionDate,
          paymentmode: "ONLINE",
          rr_number: payload.rr_number,
          penalty: payload.penalty,
          filing_datetime: filingDate,
          challan_number: cpin,
          ...(payload.pending_payment && {
            pending_payment: payload.pending_payment,
          }),
          ...(payload.pending_cash && {
            cash_payment: payload.pending_cash,
          }),
          interest: payload.interestamount,
          vatamount: payload.vatamount,
          total_tax_amount: payload.totaltaxamount,
          status: "PAID",
        },
      });

      const updateresponse = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
        },
        include: {
          dvat04: true,
        },
      });

      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to update");
      }

      // Get monthly targets for filing status update (still needed for quarterly months)
      const monthsToUpdate = getTargetMonths(
        updateresponse.month ?? "",
        updateresponse.dvat04.frequencyFilings === "QUARTERLY",
      );

      const isComp = updateresponse.dvat04.compositionScheme ?? false;

      const getFilingDueDate = (month: string, year: string): Date => {
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
        const monthIndex = monthNames.indexOf(month);
        const yearNum = parseInt(year, 10);

        if (isComp) {
          if (["January", "February", "March"].includes(month))
            return new Date(yearNum, 3, 28); // April 28
          if (["April", "May", "June"].includes(month))
            return new Date(yearNum, 6, 28); // July 28
          if (["July", "August", "September"].includes(month))
            return new Date(yearNum, 9, 28); // October 28
          return new Date(yearNum + 1, 0, 28); // January 28 next year
        }

        const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
        const nextYear = monthIndex === 11 ? yearNum + 1 : yearNum;
        return new Date(nextYear, nextMonth, 28);
      };

      await Promise.all(
        monthsToUpdate.map((month) => {
          const dueDate = getFilingDueDate(month, updateresponse.year);
          const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";
          return prisma.return_filing.upsert({
            where: {
              dvatid_year_month: {
                dvatid: updateresponse.dvat04Id,
                year: updateresponse.year,
                month,
              },
            },
            update: {
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
            },
            create: {
              dvatid: updateresponse.dvat04Id,
              year: updateresponse.year,
              month,
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
              due_date: dueDate,
              status: "ACTIVE",
              createdById: payload.id,
            },
          });
        }),
      );

      if (
        ["March", "June", "September", "December"].includes(isExist.month ?? "")
      ) {
        const monthsToUpdate = getMonthGroup(isExist.month ?? "");

        // step 1 : get all entry
        const returnEntry = await prisma.returns_entry.findMany({
          where: {
            dvat_type: DvatType.DVAT_30_A,
            category_of_entry: CategoryOfEntry.INVOICE,
            purchase_type: PurchaseType.FORMC_CONCESSION,
            status: "ACTIVE",
            deletedAt: null,
            deletedById: null,
            returns_01: {
              dvat04Id: isExist.dvat04Id,
              year: isExist.year,
              // isExist.month == "March"
              //   ? (parseInt(isExist.year) + 1).toString()
              //   : isExist.year,
              month: { in: monthsToUpdate },
            },
          },
          include: {
            seller_tin_number: true,
          },
        });

        // step 2 : get all entry
        const groupedData = returnEntry.reduce<
          Record<
            number,
            {
              seller_tin_numberId: number;
              totalAmount: number;
              entries: typeof returnEntry;
            }
          >
        >((acc, entry) => {
          const sellerId = entry.seller_tin_numberId;
          const amount = parseFloat(entry.total_invoice_number || "0");

          if (!acc[sellerId]) {
            acc[sellerId] = {
              seller_tin_numberId: sellerId,
              totalAmount: 0,
              entries: [],
            };
          }

          acc[sellerId].totalAmount += amount;
          acc[sellerId].entries.push(entry);

          return acc;
        }, {});

        const flatData = Object.values(groupedData).flatMap((group) =>
          group.entries.map((entry) => ({
            ...entry,
            amount: group.totalAmount.toString(), // Overwrite or add the total amount
          })),
        );

        const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

        const lastcform = await prisma.cform.findFirst({
          where: {
            status: "ACTIVE",
            office_of_issue: isExist.dvat04.selectOffice,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const lastOfficeSerial = lastcform
          ? parseInt(lastcform.sr_no.split("/").pop() ?? "0", 10) || 0
          : 0;

        const cformResponses = await Promise.all(
          Object.values(groupedData).map((group, index) => {
            const representativeEntry = group.entries[0]; // Pick one entry to extract seller info

            return prisma.cform.create({
              data: {
                amount: group.totalAmount.toFixed(2),
                dvat04Id: isExist.dvat04Id,
                office_of_issue: isExist.dvat04.selectOffice,
                date_of_issue: new Date(),
                valid_date: isExist.dvat04.certificateDate!,
                sr_no: getsrno(
                  isExist.dvat04.selectOffice!,
                  lastOfficeSerial,
                  index,
                ),
                seller_address:
                  representativeEntry.seller_tin_number.state ?? "",
                seller_name:
                  representativeEntry.seller_tin_number.name_of_dealer ?? "",
                seller_tin_no:
                  representativeEntry.seller_tin_number.tin_number ?? "",
                cform_type: ReturnType.ORIGINAL,
                from_period: new Date(
                  dates.fromDate.split("-").reverse().join("-"),
                ),
                to_period: new Date(
                  dates.toDate.split("-").reverse().join("-"),
                ),
                status: "ACTIVE",
                createdById: isExist.createdById,
              },
            });
          }),
        );

        // const cformResponses = await Promise.all(
        //   flatData.map((val: any, index: number) =>
        //     prisma.cform.create({
        //       data: {
        //         amount: val.amount,
        //         dvat04Id: isExist.dvat04Id,
        //         office_of_issue: isExist.dvat04.selectOffice,
        //         date_of_issue: new Date(),
        //         valid_date: isExist.dvat04.certificateDate!,
        //         sr_no: getsrno(
        //           isExist.dvat04.selectOffice!,
        //           parseInt(
        //             lastcform ? lastcform.sr_no.split("/").pop() ?? "0" : "1"
        //           ),
        //           index
        //         ),
        //         seller_address: val.seller_tin_number.state ?? "",
        //         seller_name: val.seller_tin_number.name_of_dealer ?? "",
        //         seller_tin_no: val.seller_tin_number.tin_number ?? "",
        //         cform_type: ReturnType.ORIGINAL,
        //         // from_period: dates.fromDate,
        //         // to_period: dates.toDate,
        //         from_period: new Date(
        //           dates.fromDate.split("-").reverse().join("-")
        //         ),
        //         to_period: new Date(
        //           dates.toDate.split("-").reverse().join("-")
        //         ),
        //         status: "ACTIVE",
        //         createdById: isExist.createdById,
        //       },
        //     })
        //   )
        // );

        const cformReturnsEntries: Array<{
          cformId: number;
          returns_entryId: number;
        }> = [];

        Object.values(groupedData).forEach((group, groupIndex) => {
          const cform = cformResponses[groupIndex];

          if (!cform || !cform.id) {
            throw new Error(
              `CForm entry for group ${groupIndex} was not created`,
            );
          }

          group.entries.forEach((entry) => {
            cformReturnsEntries.push({
              cformId: cform.id,
              returns_entryId: entry.id,
            });
          });
        });

        // Step 2: Add entries to `cform_returns` table
        // const cformReturnsEntries: {
        //   cformId: number;
        //   returns_entryId: number;
        // }[] = [];

        // Object.values(groupedData).forEach((group, groupIndex) => {
        //   const cformId = cformResponses[groupIndex]?.id; // Ensure the ID is resolved

        //   if (!cformId) {
        //     throw new Error(
        //       `CForm entry for group ${groupIndex} was not created`
        //     );
        //   }

        //   group.entries.forEach((entry) => {
        //     cformReturnsEntries.push({
        //       cformId,
        //       returns_entryId: entry.id,
        //     });
        //   });
        // });

        // Step 3: Insert `cform_returns` entries in bulk
        if (cformReturnsEntries.length > 0) {
          const response = await prisma.cform_returns.createMany({
            data: cformReturnsEntries,
          });
          if (!response) {
            throw new Error(`CForm return entry was not created`);
          }
        }
        // }

        // const create_response = await prisma.cform.createMany({
        //   data: flatData.map((val: any, index: number) => ({
        //     amount: val.amount,
        //     dvat04Id: isExist.dvat04Id,
        //     office_of_issue: isExist.dvat04.selectOffice,
        //     date_of_issue: dates.toDate,
        //     valid_date: isExist.dvat04.certificateDate!,
        //     sr_no: getsrno(
        //       val.dvat04.selectOffice,
        //       parseInt(lastcform.sr_no.split("/").pop() ?? "0"),
        //       index
        //     ),
        //     seller_address: val.seller_tin_number.state ?? "",
        //     seller_name: val.seller_tin_number.name_of_dealer ?? "",
        //     seller_tin_no: val.seller_tin_number.tin_number ?? "",
        //     cform_type: ReturnType.ORIGINAL,
        //     from_period: dates.fromDate,
        //     to_period: dates.toDate,
        //     status: "ACTIVE",
        //     createdById: isExist.createdById,
        //   })),
        // });

        // if (!create_response) {
        //   throw new Error("C-Forms note create try again.");
        // }
      }

      // fform start here
      const monthsToUpdateffrom = getMonthGroup(isExist.month ?? "");

      // step 1 : get all entry
      const returnEntry = await prisma.returns_entry.findMany({
        where: {
          dvat_type: DvatType.DVAT_30_A,
          category_of_entry: CategoryOfEntry.INVOICE,
          purchase_type: PurchaseType.STOCK_TRANSFER,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          returns_01: {
            dvat04Id: isExist.dvat04Id,
            year:
              isExist.month == "March"
                ? (parseInt(isExist.year) + 1).toString()
                : isExist.year,
            month: { in: monthsToUpdateffrom },
          },
        },
        include: {
          seller_tin_number: true,
        },
      });

      // step 2 : get all entry
      const groupedData = returnEntry.reduce<
        Record<
          number,
          {
            seller_tin_numberId: number;
            totalAmount: number;
            entries: typeof returnEntry;
          }
        >
      >((acc, entry) => {
        const sellerId = entry.seller_tin_numberId;
        const amount = parseFloat(entry.total_invoice_number || "0");

        if (!acc[sellerId]) {
          acc[sellerId] = {
            seller_tin_numberId: sellerId,
            totalAmount: 0,
            entries: [],
          };
        }

        acc[sellerId].totalAmount += amount;
        acc[sellerId].entries.push(entry);

        return acc;
      }, {});

      const flatData = Object.values(groupedData).flatMap((group) =>
        group.entries.map((entry) => ({
          ...entry,
          amount: group.totalAmount.toString(), // Overwrite or add the total amount
        })),
      );

      const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

      const lastfform = await prisma.fform.findFirst({
        where: {
          status: "ACTIVE",
          office_of_issue: isExist.dvat04.selectOffice,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lastOfficeSerial = lastfform
        ? parseInt(lastfform.sr_no.split("/").pop() ?? "0", 10) || 0
        : 0;

      const fformResponses = await Promise.all(
        flatData.map((val: any, index: number) =>
          prisma.fform.create({
            data: {
              amount: val.amount.toFixed(2),
              dvat04Id: isExist.dvat04Id,
              office_of_issue: isExist.dvat04.selectOffice,
              date_of_issue: dates.toDate,
              valid_date: isExist.dvat04.certificateDate!,
              sr_no: getsrno(isExist.dvat04.selectOffice!, lastOfficeSerial),
              seller_address: val.seller_tin_number.state ?? "",
              seller_name: val.seller_tin_number.name_of_dealer ?? "",
              seller_tin_no: val.seller_tin_number.tin_number ?? "",
              fform_type: ReturnType.ORIGINAL,
              from_period: dates.fromDate,
              to_period: dates.toDate,
              status: "ACTIVE",
              createdById: isExist.createdById,
            },
          }),
        ),
      );

      // Step 2: Add entries to `fform_returns` table
      const fformReturnsEntries: {
        fformId: number;
        returns_entryId: number;
      }[] = [];

      Object.values(groupedData).forEach((group, groupIndex) => {
        const fformId = fformResponses[groupIndex]?.id; // Ensure the ID is resolved

        if (!fformId) {
          throw new Error(
            `FForm entry for group ${groupIndex} was not created`,
          );
        }

        group.entries.forEach((entry) => {
          fformReturnsEntries.push({
            fformId,
            returns_entryId: entry.id,
          });
        });
      });

      // Step 3: Insert `fform_returns` entries in bulk
      if (fformReturnsEntries.length > 0) {
        const response = await prisma.fform_returns.createMany({
          data: fformReturnsEntries,
        });
        if (!response) {
          throw new Error(`FForm return entry was not created`);
        }
      }

      let today = new Date();
      today.setDate(today.getDate() + 7);

      const challan_response = await prisma.challan.create({
        data: {
          dvatid: isExist.dvat04Id,
          cpin: cpin,
          vat: payload.challan_vat,
          latefees: "0",
          interest: payload.challan_interest,
          others: payload.challan_other ?? "0",
          penalty: payload.challan_penalty,
          createdById: isExist.createdById,
          expire_date: today,
          total_tax_amount: payload.challan_total_tax_amount,
          reason: "MONTHLYPAYMENT",
          paymentstatus: "PAID",
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          track_id: payload.track_id,
          bank_name: payload.bank_name,
          returnid: payload.id,
        },
      });

      if (!challan_response) {
        throw new Error(`Challan was not created`);
      }

      return updateresponse;
    });

    return createResponse({
      message: "Payment completed successfully.",
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

export default AddPayment;

const getTargetMonths = (
  currentMonth: string,
  isCompositionScheme: boolean,
): string[] => {
  if (!currentMonth) {
    return [];
  }

  return isCompositionScheme ? getMonthGroup(currentMonth) : [currentMonth];
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

const getQuarterlyDistributedAmount = (
  value: string,
  isQuarterlyFiling: boolean,
): string => {
  if (!isQuarterlyFiling) {
    return value;
  }

  const parsedValue = parseFloat(value || "0");

  if (Number.isNaN(parsedValue)) {
    return value;
  }

  return (parsedValue / 3).toFixed(2);
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
  // const toYear = month === "March" ? parseInt(year) + 1 : parseInt(year);
  const toYear = parseInt(year);
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
