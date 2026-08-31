"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  dvat04,
  DvatType,
  PurchaseType,
  returns_01,
  ReturnType,
  SelectOffice,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  R4Turnover,
  R5Turnover,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

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

      if (updateresponse.dvat04.compositionScheme || isQuarterlyFiling) {
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

        // Get the last form (cform or fform) created for this office to determine serial number
        const lastcform = await prisma.cform.findFirst({
          where: {
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
            office_of_issue: isExist.dvat04.selectOffice,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const lastfformForSerial = await prisma.fform.findFirst({
          where: {
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
            office_of_issue: isExist.dvat04.selectOffice,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Get the highest serial number from both cform and fform
        const cformSerial = lastcform
          ? parseInt(lastcform.sr_no.split("/").pop() ?? "0", 10) || 0
          : 0;
        const fformSerial = lastfformForSerial
          ? parseInt(lastfformForSerial.sr_no.split("/").pop() ?? "0", 10) || 0
          : 0;
        const lastOfficeSerial = Math.max(cformSerial, fformSerial);

        // Create a Map to track seller ID to cform ID
        const sellerToCformMap = new Map<number, number>();
        let cformSrNoCounter = 0;

        // Create cforms for each seller
        for (const [sellerId, group] of Object.entries(groupedData)) {
          const sellerIdNum = parseInt(sellerId, 10);
          const representativeEntry = group.entries[0]; // Pick one entry to extract seller info

          const cformResponse = await prisma.cform.create({
            data: {
              amount: group.totalAmount.toFixed(2),
              dvat04Id: isExist.dvat04Id,
              office_of_issue: isExist.dvat04.selectOffice,
              date_of_issue: new Date(),
              valid_date: isExist.dvat04.certificateDate!,
              sr_no: getsrno(
                isExist.dvat04.selectOffice!,
                lastOfficeSerial,
                cformSrNoCounter++,
              ),
              seller_address: representativeEntry.seller_tin_number.state ?? "",
              seller_name:
                representativeEntry.seller_tin_number.name_of_dealer ?? "",
              seller_tin_no:
                representativeEntry.seller_tin_number.tin_number ?? "",
              cform_type: ReturnType.ORIGINAL,
              from_period: new Date(
                dates.fromDate.split("-").reverse().join("-"),
              ),
              to_period: new Date(dates.toDate.split("-").reverse().join("-")),
              status: "ACTIVE",
              createdById: isExist.createdById,
            },
          });

          // Store the mapping of seller ID to cform ID
          sellerToCformMap.set(sellerIdNum, cformResponse.id);
        }

        // Step 2: Add entries to `cform_returns` table using the Map
        const cformReturnsEntries: Array<{
          cformId: number;
          returns_entryId: number;
        }> = [];

        for (const [sellerId, group] of Object.entries(groupedData)) {
          const sellerIdNum = parseInt(sellerId, 10);
          const cformId = sellerToCformMap.get(sellerIdNum);

          if (!cformId) {
            throw new Error(
              `CForm entry for seller ${sellerIdNum} was not created`,
            );
          }

          group.entries.forEach((entry) => {
            // Verify entry belongs to the correct seller
            if (entry.seller_tin_numberId !== sellerIdNum) {
              throw new Error(
                `Entry ${entry.id} belongs to seller ${entry.seller_tin_numberId}, but expected ${sellerIdNum}`,
              );
            }

            cformReturnsEntries.push({
              cformId,
              returns_entryId: entry.id,
            });
          });
        }

        // Step 3: Insert `cform_returns` entries in bulk
        if (cformReturnsEntries.length > 0) {
          const response = await prisma.cform_returns.createMany({
            data: cformReturnsEntries,
          });
          if (!response) {
            throw new Error(`CForm return entry was not created`);
          }
        }
      }

      // fform start here
      const monthsToUpdate = getMonthGroup(isExist.month ?? "");

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
            month: { in: monthsToUpdate },
          },
        },
        include: {
          seller_tin_number: true,
          returns_01: true,
        },
      });

      // step 2 : group by month
      const groupedByMonth = returnEntry.reduce<
        Record<
          string,
          {
            month: string;
            year: string;
            totalAmount: number;
            entries: typeof returnEntry;
          }
        >
      >((acc, entry) => {
        const month = entry.returns_01.month ?? "";
        const year = entry.returns_01.year;
        const key = `${year}-${month}`;
        const amount = parseFloat(entry.total_invoice_number || "0");

        if (!acc[key]) {
          acc[key] = {
            month,
            year,
            totalAmount: 0,
            entries: [],
          };
        }

        acc[key].totalAmount += amount;
        acc[key].entries.push(entry);

        return acc;
      }, {});

      const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

      // Get the last form (cform or fform) created for this office to determine serial number
      const lastcformForFform = await prisma.cform.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          office_of_issue: isExist.dvat04.selectOffice,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lastfformForFform = await prisma.fform.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          office_of_issue: isExist.dvat04.selectOffice,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Get the highest serial number from both cform and fform
      const cformSerialForFform = lastcformForFform
        ? parseInt(lastcformForFform.sr_no.split("/").pop() ?? "0", 10) || 0
        : 0;
      const fformSerialForFform = lastfformForFform
        ? parseInt(lastfformForFform.sr_no.split("/").pop() ?? "0", 10) || 0
        : 0;
      const lastOfficeSerial = Math.max(
        cformSerialForFform,
        fformSerialForFform,
      );

      // Create a Map to track month key to fform ID
      const monthToFformMap = new Map<string, number>();
      let srNoCounter = 0;

      // Create fforms for each month
      for (const [monthKey, monthGroup] of Object.entries(groupedByMonth)) {
        const representativeEntry = monthGroup.entries[0];

        const fformResponse = await prisma.fform.create({
          data: {
            amount: monthGroup.totalAmount.toFixed(2),
            dvat04Id: isExist.dvat04Id,
            office_of_issue: isExist.dvat04.selectOffice,
            date_of_issue: new Date(
              dates.toDate.split("-").reverse().join("-"),
            ),
            valid_date: isExist.dvat04.certificateDate ?? new Date(),
            sr_no: getsrnofform(
              isExist.dvat04.selectOffice!,
              lastOfficeSerial,
              srNoCounter++,
            ),
            seller_address: representativeEntry.seller_tin_number.state ?? "",
            seller_name:
              representativeEntry.seller_tin_number.name_of_dealer ?? "",
            seller_tin_no:
              representativeEntry.seller_tin_number.tin_number ?? "",
            fform_type: ReturnType.ORIGINAL,
            from_period: new Date(
              dates.fromDate.split("-").reverse().join("-"),
            ),
            to_period: new Date(dates.toDate.split("-").reverse().join("-")),
            status: "ACTIVE",
            createdById: isExist.createdById,
          },
        });

        // Store the mapping of month key to fform ID
        monthToFformMap.set(monthKey, fformResponse.id);
      }

      // Step 2: Add entries to `fform_returns` table using the Map
      const fformReturnsEntries: {
        fformId: number;
        returns_entryId: number;
      }[] = [];

      for (const [monthKey, monthGroup] of Object.entries(groupedByMonth)) {
        const fformId = monthToFformMap.get(monthKey);

        if (!fformId) {
          throw new Error(`FForm entry for month ${monthKey} was not created`);
        }

        monthGroup.entries.forEach((entry) => {
          // Verify entry belongs to the correct DVAT
          if (entry.returns_01.dvat04Id !== isExist.dvat04Id) {
            throw new Error(
              `Entry ${entry.id} belongs to DVAT ${entry.returns_01.dvat04Id}, but expected ${isExist.dvat04Id}`,
            );
          }

          fformReturnsEntries.push({
            fformId,
            returns_entryId: entry.id,
          });
        });
      }

      // Step 3: Insert `fform_returns` entries in bulk
      if (fformReturnsEntries.length > 0) {
        const response = await prisma.fform_returns.createMany({
          data: fformReturnsEntries,
        });
        if (!response) {
          throw new Error(`FForm return entry was not created`);
        }
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

const updateReturns01Work = async (
  isQuarterlyFiling: boolean,
  updateresponse: returns_01 & {
    dvat04: dvat04;
  },
): Promise<void> => {
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
        status: "ACTIVE",
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
        status: "ACTIVE",
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

  const netTaxCalc = new NetTaxCalculation(
    returnforms,
    challans,
    updateresponse,
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
    updateresponse,
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
    updateresponse,
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
    netTaxCalc.total() -
    (vatpaidchallan +
      interestpaidchallan +
      penaltypaidchallan +
      otherpaidchallan);

  await prisma.returns_01_work.create({
    data: {
      returnId: updateresponse.id,
      dvatId: updateresponse.dvat04Id,
      month: updateresponse.month,
      frequency: updateresponse.dvat04.frequencyFilings ?? "",
      filed: true,
      tinNumber: updateresponse.dvat04.tinNumber,
      tradeName: updateresponse.dvat04.tradename,
      selectOffice: updateresponse.dvat04.selectOffice,
      commodity: updateresponse.dvat04.commodity,
      vatamount: (r4Turnover.get4_8() - r5Turnover.get5_4()).toFixed(2),
      interest: netTaxCalc.getInterest().toFixed(2),
      penalty: netTaxCalc.getPenalty().toFixed(2),
      other_charge: centralSales.total_decrease().toFixed(2),
      total_tax_amount: (
        r4Turnover.get4_8() -
        r5Turnover.get5_4() +
        netTaxCalc.getInterest() +
        centralSales.total_decrease()
      ).toFixed(2),
      R4_8: r4Turnover.get4_8(),
      R4_9: r4Turnover.get4_9(),
      R4_10: r4Turnover.get4_10(),
      R5_4: r5Turnover.get5_4(),
      R5_5: r5Turnover.get5_5(),
      R5_6: r5Turnover.get5_6(),
      R6_1_balance_payable: netTaxCalc.getR6_1().toFixed(2),
      R6_INTEREST: netTaxCalc.getInterest().toFixed(2),
      R6_penalty: netTaxCalc.getPenalty().toFixed(2),
      R7_total_payable: netTaxCalc.total().toFixed(2),
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
      excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
      status: "VERIFY",
      remark: "",
      shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
    },
  });
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

  if (response_interest && response_interest.length > 0) {
    let total = netTaxCalc.getR6_1();

    // Prepare bulk update data instead of looping
    const bulkUpdateData = [];

    for (let i = 0; i < response_interest.length; i++) {
      const amount = Number(response_interest[i].amount ?? 0);
      const amount_cal = Math.min(total, amount);
      const interest =
        ((amount_cal * 0.15) / 365) * (response_interest[i].days_late ?? 0);

      bulkUpdateData.push({
        id: response_interest[i].id,
        outstanding_before: total.toFixed(2),
        interest: interest.toFixed(2),
      });

      total = total - amount;
    }

    for (const data of bulkUpdateData) {
      await prisma.interest_working.update({
        where: { id: data.id },
        data: {
          outstanding_before: data.outstanding_before,
          interest: data.interest,
        },
      });
    }
  }
};
