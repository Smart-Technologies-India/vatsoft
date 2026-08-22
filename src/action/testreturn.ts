"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, returns_01 } from "@prisma/client";
import prisma from "../../prisma/database";
import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  R4Turnover,
  R5Turnover,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

interface TestPaymentSubmitPayload {
  id: number;
}

const TestReturn = async (
  payload: TestPaymentSubmitPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = TestReturn.name;

  try {
    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          //   status: "ACTIVE",
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
          id: isExist.id,
        },
        data: {
          //   transaction_date: addPrismaDatabaseDate(new Date()).toISOString(),
          //   paymentmode: "ONLINE",
          //   rr_number: "56781234",
          //   penalty: "50",
          //   filing_datetime: new Date(),
          //   challan_number: "1234",
          //   ...(payload.pending_payment && {
          //     pending_payment: payload.pending_payment,
          //   }),
          //   ...(payload.pending_cash && {
          //     cash_payment: payload.pending_cash,
          //   }),
          //   interest: payload.interestamount,
          //   vatamount: payload.vatamount,
          //   total_tax_amount: payload.totaltaxamount,
          //   interest: "500",
          //   vatamount: "1000",
          //   total_tax_amount: "1500",
          //   status: "PAID",
          //   track_id: "0",
          transaction_id: "1234",
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

      let month: string = updateresponse.month ?? "";
      let year: string = updateresponse.year;
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

      if (isQuarterlyFiling) {
        year = ["April", "May", "June"].includes(month)
          ? (parseInt(year) - 1).toString()
          : year;
        switch (month) {
          case "April":
            month = "March";
            break;
          case "May":
            month = "March";
            break;
          case "June":
            month = "March";
            break;
          case "July":
            month = "June";
            break;
          case "August":
            month = "June";
            break;
          case "September":
            month = "June";
            break;
          case "October":
            month = "September";
            break;
          case "November":
            month = "September";
            break;
          case "December":
            month = "September";
            break;
          case "January":
            month = "December";
            break;
          case "February":
            month = "December";
            break;
          case "March":
            month = "December";
            break;
        }
      } else {
        if (month == "January") {
          year = (parseInt(year) - 1).toString();
        }
        if (month == "January") {
          month = "December";
        } else {
          month = months[months.indexOf(month) - 1];
        }
      }

      // check is the date is blow then april 2026 using month and year

      const isBeforeApril2026: boolean =
        parseInt(year) < 2026 ||
        (parseInt(year) === 2026 &&
          months.indexOf(month) < months.indexOf("April"));

      let lastmonthreturn: returns_01 | null = null;

      if (!isBeforeApril2026) {
        lastmonthreturn = await prisma.returns_01.findFirst({
          where: {
            year: year,
            month: month,
            deletedAt: null,
            deletedById: null,
          },
        });

        if (!lastmonthreturn) {
          throw new Error(
            `No return found for the previous month: ${month} ${year}`,
          );
        }
      }

      // Get months to fetch based on filing frequency
      let monthsToFetch: string[] = [updateresponse.month ?? ""];
      if (isQuarterlyFiling) {
        monthsToFetch = getMonthGroup(updateresponse.month ?? "");
      }

      const returnforms = await prisma.returns_entry.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          returns_01: {
            dvat04Id: updateresponse.dvat04Id,
            year: updateresponse.year,
            month: { in: monthsToFetch },
            deletedAt: null,
            deletedById: null,
          },
          status: "ACTIVE",
        },
        include: {
          seller_tin_number: true,
          state: true,
          returns_01: true,
        },
      });

      const challans = await prisma.challan.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          paymentstatus: "PAID",
          returns_01: {
            dvat04Id: updateresponse.dvat04Id,
            year: updateresponse.year,
            month: { in: monthsToFetch },
            deletedAt: null,
            deletedById: null,
          },
        },
      });

      const r4Turnover = new R4Turnover(
        returnforms,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.cash_payment ?? "0")
          : 0,
      );
      const r5Turnover = new R5Turnover(
        returnforms,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.cash_payment ?? "0")
          : 0,
      );
      const netTaxCalculation = new NetTaxCalculation(
        returnforms,
        challans,
        isExist,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.pending_payment ?? "0")
          : 0,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.cash_payment ?? "0")
          : 0,
        isQuarterlyFiling,
      );

      const centralSales = new CentralSalesCalculation(
        returnforms,
        challans,
        isExist,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.pending_payment ?? "0")
          : 0,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.cash_payment ?? "0")
          : 0,
        isQuarterlyFiling,
      );

      const thebalance = new TheBalance(
        returnforms,
        challans,
        isExist,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.pending_payment ?? "0")
          : 0,
        !isBeforeApril2026 && lastmonthreturn
          ? parseFloat(lastmonthreturn.cash_payment ?? "0")
          : 0,
        isQuarterlyFiling,
      );
      const vatpaidchallan: number = challans.reduce((acc, curr) => {
        const vat = parseFloat(curr.vat ?? "0");
        return acc + vat;
      }, 0);
      const interestpaidchallan: number = challans.reduce((acc, curr) => {
        const interest = parseFloat(curr.interest ?? "0");
        return acc + interest;
      }, 0);
      const penaltypaidchallan: number = challans.reduce((acc, curr) => {
        const penalty = parseFloat(curr.penalty ?? "0");
        return acc + penalty;
      }, 0);
      const otherpaidchallan: number = challans.reduce((acc, curr) => {
        const others = parseFloat(curr.others ?? "0");
        return acc + others;
      }, 0);

      const value =
        netTaxCalculation.total() -
        (vatpaidchallan +
          interestpaidchallan +
          penaltypaidchallan +
          otherpaidchallan);

      const returns_01_works = await prisma.returns_01_work.create({
        data: {
          returnId: updateresponse.id,
          dvatId: updateresponse.dvat04Id,
          frequency: updateresponse.dvat04?.frequencyFilings ?? "MONTHLY",
          filed: true,
          tinNumber: updateresponse.dvat04.tinNumber,
          tradeName: updateresponse.dvat04.tradename,
          selectOffice: updateresponse.dvat04.selectOffice,
          commodity: updateresponse.dvat04.commodity,
          vatamount: (r4Turnover.get4_8() - r5Turnover.get5_4()).toFixed(2),
          interest: netTaxCalculation.getInterest().toFixed(2),
          penalty: netTaxCalculation.getPenalty().toFixed(2),
          other_charge: centralSales.total_decrease().toFixed(2),
          total_tax_amount: (
            r4Turnover.get4_8() -
            r5Turnover.get5_4() +
            netTaxCalculation.getInterest() +
            centralSales.total_decrease() +
            netTaxCalculation.getPenalty()
          ).toFixed(2),
          R4_8: r4Turnover.get4_8(),
          R4_9: r4Turnover.get4_9(),
          R4_10: r4Turnover.get4_10(),
          R5_4: r5Turnover.get5_4(),
          R5_5: r5Turnover.get5_5(),
          R5_6: r5Turnover.get5_6(),
          R6_1_balance_payable: netTaxCalculation.getR6_1().toFixed(2),
          R6_INTEREST: netTaxCalculation.getInterest().toFixed(2),
          R6_penalty: netTaxCalculation.getPenalty().toFixed(2),
          R7_total_payable: netTaxCalculation.total().toFixed(2),
          RPAID_vat: vatpaidchallan.toFixed(2),
          RPAID_interest: interestpaidchallan.toFixed(2),
          RPAID_penalty: penaltypaidchallan.toFixed(2),
          RPAID_others: otherpaidchallan.toFixed(2),
          RPAID_total: (
            vatpaidchallan +
            interestpaidchallan +
            penaltypaidchallan +
            otherpaidchallan
          ).toFixed(2),
          excess_cash_next_month: thebalance.excessCash().toFixed(2),
          excess_itc_next_month: thebalance
            .balance_carried_forward()
            .toFixed(2),
          status: "VERIFY",
          remark: "",
          shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
        },
      });

      //   new to update
      if (!returns_01_works) {
        throw new Error("Something went wrong! Unable to create return work");
      }

      const response_interest = await prisma.interest_working.findMany({
        where: {
          returnId: updateresponse.id,
          dvatId: updateresponse.dvat04Id,
          status: "ACTIVE",
        },
        orderBy: {
          payment_date: "asc",
        },
      });

      if (!response_interest) {
        throw new Error("No active interest working found");
      }

      let total = netTaxCalculation.getR6_1();

      for (let i = 0; i < response_interest.length; i++) {
        const amount = Number(response_interest[i].amount ?? 0);
        const amount_cal = Math.min(total, amount);
        const interest =
          ((amount_cal * 0.15) / 365) * (response_interest[i].days_late ?? 0);

        const res = await prisma.interest_working.update({
          where: {
            id: response_interest[i].id,
          },
          data: {
            outstanding_before: total.toFixed(2),
            interest: interest.toFixed(2),
          },
        });
        total = total - amount;
      }
      return isExist;
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

interface CreateInterestWorkingPayload {
  dvatid: number;
}
const CreateInterestWorking = async (
  payload: CreateInterestWorkingPayload,
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = CreateInterestWorking.name;

  try {
    const result = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!result) {
      throw new Error("Invalid dvatid, try again");
    }

    const getchallan = await prisma.challan.findMany({
      where: {
        dvatid: result.id,
        deletedAt: null,
        deletedById: null,
        paymentstatus: "PAID",
        NOT: {
          total_tax_amount: "0",
        },
      },
      include: {
        returns_01: true,
        dvat: true,
      },
    });

    const isquar = result.frequencyFilings == "QUARTERLY";

    // Quarter to months mapping
    const quarterMonthsMap: Record<string, string[]> = {
      QUARTER1: ["April", "May", "June"],
      QUARTER2: ["July", "August", "September"],
      QUARTER3: ["October", "November", "December"],
      QUARTER4: ["January", "February", "March"],
    };

    // Calculate due date based on quarterly or monthly filing

    // Get current month name
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

    for (let i = 0; i < getchallan.length; i++) {
      const paymentDate = new Date(getchallan[i].transaction_date ?? "");
      const returnMonth = getchallan[i].returns_01?.month;
      const returnYear = getchallan[i].returns_01?.year;

      // Get month index from month name
      const monthIndex = monthNames.indexOf(returnMonth ?? "");

      let dueDateYear = parseInt(
        returnYear ?? new Date().getFullYear().toString(),
      );
      let dueDateMonth: number;

      if (isquar) {
        // For quarterly filing, find next quarter's first month
        let nextQuarterFirstMonth = "April"; // Default
        for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
          if (months.includes(returnMonth ?? "")) {
            // Get first month of next quarter
            if (quarter === "QUARTER1") {
              nextQuarterFirstMonth = "July";
            } else if (quarter === "QUARTER2") {
              nextQuarterFirstMonth = "October";
            } else if (quarter === "QUARTER3") {
              nextQuarterFirstMonth = "January";
            } else if (quarter === "QUARTER4") {
              nextQuarterFirstMonth = "April";
            }
            break;
          }
        }

        dueDateMonth = monthNames.indexOf(nextQuarterFirstMonth);

        // If next quarter month is earlier in the year, it's next year
        if (dueDateMonth < monthIndex) {
          dueDateYear++;
        }
      } else {
        // For monthly filing: 15th of next month
        dueDateMonth = monthIndex + 1; // Next month

        if (dueDateMonth > 11) {
          // If it goes beyond December (11)
          dueDateMonth = 0; // January
          dueDateYear++;
        }
      }

      const dueDate = new Date(dueDateYear, dueDateMonth, 15);

      // Calculate days late based on payment date vs due date
      const daysLate = Math.max(
        0,
        Math.floor(
          (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      if (
        getchallan[i].total_tax_amount != "0" &&
        getchallan[i].total_tax_amount != null
      ) {
        await prisma.interest_working.create({
          data: {
            dvatId: result.id,
            returnId: getchallan[i].returns_01!.id,
            challanId: getchallan[i].id,
            month: getchallan[i].returns_01!.month,
            outstanding_before: 0,
            interest: 0,
            payment_date: paymentDate,
            amount: getchallan[i].total_tax_amount,
            due_date: dueDate,
            days_late: daysLate,
            status: "ACTIVE",
          },
        });
      }
    }

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

export { TestReturn, CreateInterestWorking };
