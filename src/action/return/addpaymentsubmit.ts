"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01 } from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import dayjs, { Dayjs } from "dayjs";

interface AddPaymentSubmitPayload {
  id: number;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  pending_cash?: string;
}

const AddPaymentSubmit = async (
  payload: AddPaymentSubmitPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPaymentSubmit.name;
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
        functionname: "AddPaymentSubmit",
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
          penalty: payload.penalty,
          filing_datetime: new Date(),
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
          track_id: "0",
          transaction_id: "0",
          is_quarterly: isExist.dvat04.frequencyFilings == "QUARTERLY",
        },
        include: {
          dvat04: true,
        },
      });
      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to update");
      }

      const isQuarterlyFiling =
        updateresponse.dvat04.frequencyFilings == "QUARTERLY";

      // await updateReturns01Work(isQuarterlyFiling, updateresponse);

      const filingDate = new Date();

      if (updateresponse.dvat04.compositionScheme || isQuarterlyFiling) {
        const monthsToUpdate = getMonthGroup(updateresponse.month ?? "");

        // Upsert for each month - create if not found, update if found
        for (const month of monthsToUpdate) {
          const dueDate = isQuarterlyFiling
            ? GetCompDueDate(updateresponse.year, month).toDate()
            : dayjs(`${updateresponse.year}-${getMonthIndex(month) + 1}-01`)
                .add(1, "month")
                .date(28)
                .toDate();

          const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";

          await prisma.return_filing.upsert({
            where: {
              dvatid_year_month: {
                dvatid: updateresponse.dvat04Id,
                year: updateresponse.year,
                month: month,
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
              month: month,
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
              status: "ACTIVE",
              createdById: currentUserId,
              due_date: dueDate.toISOString(),
            },
          });
        }
      } else {
        // Upsert for single month - create if not found, update if found
        const month = updateresponse.month ?? "";
        const dueDate = dayjs(
          `${updateresponse.year}-${getMonthIndex(month) + 1}-01`,
        )
          .add(1, "month")
          .date(28)
          .toDate();

        const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";

        await prisma.return_filing.upsert({
          where: {
            dvatid_year_month: {
              dvatid: updateresponse.dvat04Id,
              year: updateresponse.year,
              month: month,
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
            month: month,
            filing_date: filingDate,
            filing_status: true,
            return_status: returnStatus,
            status: "ACTIVE",
            createdById: currentUserId,
            due_date: dueDate.toISOString(),
          },
        });
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

export default AddPaymentSubmit;

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

const getMonthIndex = (monthName: string): number => {
  const months = [
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
  return months.indexOf(monthName);
};
const GetCompDueDate = (year: string, month: string): Dayjs => {
  let nextMonth: number;

  // Determine the next month based on the input month
  if (["April", "May", "June"].includes(month)) {
    nextMonth = 6; // July
  } else if (["July", "August", "September"].includes(month)) {
    nextMonth = 9; // October
  } else if (["October", "November", "December"].includes(month)) {
    nextMonth = 0; // January of next year
  } else if (["January", "February", "March"].includes(month)) {
    nextMonth = 3; // April
  } else {
    nextMonth = new Date(parseInt(year), 0).getMonth(); // Default case (though this shouldn't occur)
  }

  // Create the due date using Day.js and convert it to a Date object
  return dayjs(
    `${parseInt(year) + (nextMonth === 0 ? 1 : 0)}-${nextMonth + 1}-29`,
  );
};

// function getFromDateAndToDate(
//   year: string,
//   month: string,
// ): { fromDate: string; toDate: string } {
//   const monthNames = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   // Get the current month index
//   const monthIndex = monthNames.indexOf(month);
//   if (monthIndex === -1) {
//     throw new Error("Invalid month name");
//   }

//   // Calculate the `toDate`
//   // const toYear = month === "March" ? parseInt(year) + 1 : parseInt(year);
//   const toYear = parseInt(year);
//   const toDate = new Date(toYear, monthIndex + 1, 0); // Last day of the month

//   // Calculate the `fromDate` (current month - 2 months)
//   const fromDate = new Date(parseInt(year), monthIndex - 2, 1); // First day of the month

//   // Format the dates to DD-MM-YYYY
//   const formatDate = (date: Date): string => {
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   return {
//     fromDate: formatDate(fromDate),
//     toDate: formatDate(toDate),
//   };
// }

// const getsrno = (
//   selectOffice: SelectOffice,
//   last: number,
//   offset: number = 0,
// ): string => {
//   let pre =
//     selectOffice == SelectOffice.Dadra_Nagar_Haveli
//       ? "DNH"
//       : selectOffice == SelectOffice.DAMAN
//         ? "DD"
//         : "DIU";

//   let value1 =
//     selectOffice == SelectOffice.Dadra_Nagar_Haveli
//       ? "01"
//       : selectOffice == SelectOffice.DAMAN
//         ? "02"
//         : "03";

//   return `${pre}/${value1}/C/${last + offset + 1}`;
// };
// const getsrnofform = (
//   selectOffice: SelectOffice,
//   last: number,
//   offset: number = 0,
// ): string => {
//   let pre =
//     selectOffice == SelectOffice.Dadra_Nagar_Haveli
//       ? "DNH"
//       : selectOffice == SelectOffice.DAMAN
//         ? "DD"
//         : "DIU";

//   let value1 =
//     selectOffice == SelectOffice.Dadra_Nagar_Haveli
//       ? "01"
//       : selectOffice == SelectOffice.DAMAN
//         ? "02"
//         : "03";

//   return `${pre}/${value1}/F/${last + offset + 1}`;
// };

// const updateReturns01Work = async (
//   isQuarterlyFiling: boolean,
//   updateresponse: returns_01 & {
//     dvat04: dvat04;
//   },
// ): Promise<void> => {
//   let month: string = updateresponse.month ?? "";
//   let year: string = updateresponse.year;
//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   if (isQuarterlyFiling) {
//     year = ["April", "May", "June"].includes(month)
//       ? (parseInt(year) - 1).toString()
//       : year;
//     switch (month) {
//       case "April":
//         month = "March";
//         break;
//       case "May":
//         month = "March";
//         break;
//       case "June":
//         month = "March";
//         break;
//       case "July":
//         month = "June";
//         break;
//       case "August":
//         month = "June";
//         break;
//       case "September":
//         month = "June";
//         break;
//       case "October":
//         month = "September";
//         break;
//       case "November":
//         month = "September";
//         break;
//       case "December":
//         month = "September";
//         break;
//       case "January":
//         month = "December";
//         break;
//       case "February":
//         month = "December";
//         break;
//       case "March":
//         month = "December";
//         break;
//     }
//   } else {
//     if (month == "January") {
//       year = (parseInt(year) - 1).toString();
//     }
//     if (month == "January") {
//       month = "December";
//     } else {
//       month = months[months.indexOf(month) - 1];
//     }
//   }

//   const isBeforeApril2026: boolean =
//     parseInt(year) < 2026 ||
//     (parseInt(year) === 2026 &&
//       months.indexOf(month) < months.indexOf("April"));

//   let lastmonthreturn: returns_01 | null = null;

//   if (!isBeforeApril2026) {
//     lastmonthreturn = await prisma.returns_01.findFirst({
//       where: {
//         year: year,
//         month: month,
//         deletedAt: null,
//         deletedById: null,
//       },
//     });

//     if (!lastmonthreturn) {
//       throw new Error(
//         `No return found for the previous month: ${month} ${year}`,
//       );
//     }
//   }

//   // Get months to fetch based on filing frequency
//   let monthsToFetch: string[] = [updateresponse.month ?? ""];
//   if (isQuarterlyFiling) {
//     monthsToFetch = getMonthGroup(updateresponse.month ?? "");
//   }

//   const returnforms = await prisma.returns_entry.findMany({
//     where: {
//       deletedAt: null,
//       deletedById: null,
//       returns_01: {
//         dvat04Id: updateresponse.dvat04Id,
//         year: updateresponse.year,
//         month: { in: monthsToFetch },
//         deletedAt: null,
//         deletedById: null,
//         status: "ACTIVE",
//       },
//       status: "ACTIVE",
//     },
//     include: {
//       seller_tin_number: true,
//       state: true,
//       returns_01: true,
//     },
//   });

//   const challans = await prisma.challan.findMany({
//     where: {
//       deletedAt: null,
//       deletedById: null,
//       paymentstatus: "PAID",
//       returns_01: {
//         dvat04Id: updateresponse.dvat04Id,
//         year: updateresponse.year,
//         month: { in: monthsToFetch },
//         deletedAt: null,
//         deletedById: null,
//         status: "ACTIVE",
//       },
//     },
//   });
//   const r4Turnover = new R4Turnover(
//     returnforms,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.cash_payment ?? "0")
//       : 0,
//   );
//   const r5Turnover = new R5Turnover(
//     returnforms,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.cash_payment ?? "0")
//       : 0,
//   );

//   const netTaxCalc = new NetTaxCalculation(
//     returnforms,
//     challans,
//     updateresponse,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.pending_payment ?? "0")
//       : 0,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.cash_payment ?? "0")
//       : 0,
//     isQuarterlyFiling,
//   );

//   const centralSales = new CentralSalesCalculation(
//     returnforms,
//     challans,
//     updateresponse,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.pending_payment ?? "0")
//       : 0,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.cash_payment ?? "0")
//       : 0,
//     isQuarterlyFiling,
//   );

//   const thebalance = new TheBalance(
//     returnforms,
//     challans,
//     updateresponse,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.pending_payment ?? "0")
//       : 0,
//     !isBeforeApril2026 && lastmonthreturn
//       ? parseFloat(lastmonthreturn.cash_payment ?? "0")
//       : 0,
//     isQuarterlyFiling,
//   );
//   const vatpaidchallan: number = challans.reduce((acc, curr) => {
//     const vat = parseFloat(curr.vat ?? "0");
//     return acc + vat;
//   }, 0);
//   const interestpaidchallan: number = challans.reduce((acc, curr) => {
//     const interest = parseFloat(curr.interest ?? "0");
//     return acc + interest;
//   }, 0);
//   const penaltypaidchallan: number = challans.reduce((acc, curr) => {
//     const penalty = parseFloat(curr.penalty ?? "0");
//     return acc + penalty;
//   }, 0);
//   const otherpaidchallan: number = challans.reduce((acc, curr) => {
//     const others = parseFloat(curr.others ?? "0");
//     return acc + others;
//   }, 0);

//   const value =
//     netTaxCalc.total() -
//     (vatpaidchallan +
//       interestpaidchallan +
//       penaltypaidchallan +
//       otherpaidchallan);

//   await prisma.returns_01_work.create({
//     data: {
//       returnId: updateresponse.id,
//       dvatId: updateresponse.dvat04Id,
//       month: updateresponse.month,
//       frequency: updateresponse.dvat04.frequencyFilings ?? "",
//       filed: true,
//       tinNumber: updateresponse.dvat04.tinNumber,
//       tradeName: updateresponse.dvat04.tradename,
//       selectOffice: updateresponse.dvat04.selectOffice,
//       commodity: updateresponse.dvat04.commodity,
//       vatamount: (r4Turnover.get4_8() - r5Turnover.get5_4()).toFixed(2),
//       interest: netTaxCalc.getInterest().toFixed(2),
//       penalty: netTaxCalc.getPenalty().toFixed(2),
//       other_charge: centralSales.total_decrease().toFixed(2),
//       total_tax_amount: (
//         r4Turnover.get4_8() -
//         r5Turnover.get5_4() +
//         netTaxCalc.getInterest() +
//         centralSales.total_decrease()
//       ).toFixed(2),
//       R4_8: r4Turnover.get4_8(),
//       R4_9: r4Turnover.get4_9(),
//       R4_10: r4Turnover.get4_10(),
//       R5_4: r5Turnover.get5_4(),
//       R5_5: r5Turnover.get5_5(),
//       R5_6: r5Turnover.get5_6(),
//       R6_1_balance_payable: netTaxCalc.getR6_1().toFixed(2),
//       R6_INTEREST: netTaxCalc.getInterest().toFixed(2),
//       R6_penalty: netTaxCalc.getPenalty().toFixed(2),
//       R7_total_payable: netTaxCalc.total().toFixed(2),
//       RPAID_vat: vatpaidchallan.toFixed(2),
//       RPAID_interest: interestpaidchallan.toFixed(2),
//       RPAID_penalty: penaltypaidchallan.toFixed(2),
//       RPAID_others: otherpaidchallan.toFixed(2),
//       RPAID_total: (
//         vatpaidchallan +
//         interestpaidchallan +
//         penaltypaidchallan +
//         otherpaidchallan
//       ).toFixed(2),
//       excess_cash_next_month: thebalance.excessCash().toFixed(2),
//       excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
//       status: "VERIFY",
//       remark: "",
//       shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
//     },
//   });
//   const response_interest = await prisma.interest_working.findMany({
//     where: {
//       returnId: updateresponse.id,
//       dvatId: updateresponse.dvat04Id,
//       status: "ACTIVE",
//     },
//     orderBy: {
//       payment_date: "asc",
//     },
//   });

//   if (response_interest && response_interest.length > 0) {
//     let total = netTaxCalc.getR6_1();

//     // Prepare bulk update data instead of looping
//     const bulkUpdateData = [];

//     for (let i = 0; i < response_interest.length; i++) {
//       const amount = Number(response_interest[i].amount ?? 0);
//       const amount_cal = Math.min(total, amount);
//       const interest =
//         ((amount_cal * 0.15) / 365) * (response_interest[i].days_late ?? 0);

//       bulkUpdateData.push({
//         id: response_interest[i].id,
//         outstanding_before: total.toFixed(2),
//         interest: interest.toFixed(2),
//       });

//       total = total - amount;
//     }

//     for (const data of bulkUpdateData) {
//       await prisma.interest_working.update({
//         where: { id: data.id },
//         data: {
//           outstanding_before: data.outstanding_before,
//           interest: data.interest,
//         },
//       });
//     }
//   }
// };
