"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  challan,
  DvatType,
  PurchaseType,
  ReturnType,
  SelectOffice,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";

interface AddPaymentOnlinePayload {
  id: number;
  // rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  challan_vat: string;
  challan_interest: string;
  challan_penalty: string;
  challan_other?: string;
  pending_cash?: string;
  challan_total_tax_amount: string;
}

const AddPaymentOnline = async (
  payload: AddPaymentOnlinePayload,
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = AddPaymentOnline.name;
  const nanoid = customAlphabet("1234567890", 12);
  const createOrderId = customAlphabet("1234567890abcdef", 24);

  const cpin: string = nanoid();

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddPaymentOnline",
      } as any;
    }

    const result: challan = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          dvat04Id: currentDvatId,
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
      const filingDate = new Date();

      await prisma.returns_01.update({
        where: {
          id: payload.id,
        },
        data: {
          penalty: payload.penalty,
          filing_datetime: filingDate,
          challan_number: cpin,
          other_charge: payload.challan_other ?? "0",
          ...(payload.pending_payment && {
            pending_payment: payload.pending_payment,
          }),
          ...(payload.pending_cash && {
            cash_payment: payload.pending_cash,
          }),
          interest: payload.interestamount,
          vatamount: payload.vatamount,
          total_tax_amount: (
            parseFloat(payload.totaltaxamount) +
            parseFloat(payload.challan_other ?? "0")
          ).toString(),
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

      await prisma.return_filing.findMany({
        where: {
          filing_status: false,
          dvatid: updateresponse.dvat04Id,
          filing_date: null,
          year: updateresponse.year,
          month: { in: monthsToUpdate },
        },
      });

      // await Promise.all(
      //   recordsToUpdate.map((record) =>
      //     prisma.return_filing.update({
      //       where: { id: record.id },
      //       data: {
      //         filing_date: filingDate,
      //         filing_status: true,
      //         return_status:
      //           record.due_date && record.due_date >= filingDate
      //             ? "FILED"
      //             : "LATEFILED",
      //       },
      //     }),
      //   ),
      // );

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
            status: "ACTIVE",
            office_of_issue: isExist.dvat04.selectOffice,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const lastfformForSerial = await prisma.fform.findFirst({
          where: {
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
      const monthsToUpdatefform = getMonthGroup(isExist.month ?? "");

      // step 1 : get all entry grouped by month
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
            month: { in: monthsToUpdatefform },
          },
        },
        include: {
          seller_tin_number: true,
          returns_01: {
            select: {
              month: true,
              year: true,
              dvat04Id: true,
            },
          },
        },
      });

      // step 2 : group by month (not by seller)
      const groupedByMonth = returnEntry.reduce<
        Record<
          string,
          {
            month: string;
            year: string;
            entries: typeof returnEntry;
            totalAmount: number;
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
            entries: [],
            totalAmount: 0,
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
          status: "ACTIVE",
          office_of_issue: isExist.dvat04.selectOffice,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lastfformForFform = await prisma.fform.findFirst({
        where: {
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
            sr_no: getsrno(
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

      // Link entries by month
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

      // Insert `fform_returns` entries in bulk
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
          paymentstatus: "CREATED",
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          returnid: isExist.id,
          // track_id: payload.track_id,
          // bank_name: payload.bank_name,
        },
      });

      if (!challan_response) {
        throw new Error(`Challan was not created`);
      }

      const orderId = createOrderId();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.payment_intent.updateMany({
        where: {
          challanId: challan_response.id,
          status: {
            in: ["CREATED", "INITIATED"],
          },
          completedAt: null,
        },
        data: {
          status: "EXPIRED",
          completedAt: new Date(),
          failure_reason: "Superseded by a newer payment session.",
        },
      });

      const challanWithOrder = await prisma.challan.update({
        where: {
          id: challan_response.id,
        },
        data: {
          order_id: orderId,
        },
      });

      await prisma.payment_intent.create({
        data: {
          token: orderId,
          gateway_order_id: orderId,
          challanId: challanWithOrder.id,
          dvatid: challanWithOrder.dvatid,
          returnid: challanWithOrder.returnid,
          type: "DEMAND",
          expected_amount: challanWithOrder.total_tax_amount,
          status: "CREATED",
          expiresAt,
        },
      });

      return challanWithOrder;
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

export default AddPaymentOnline;

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
