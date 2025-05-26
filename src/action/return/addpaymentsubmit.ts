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
import { customAlphabet } from "nanoid";

interface AddPaymentSubmitPayload {
  id: number;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
}

const AddPaymentSubmit = async (
  payload: AddPaymentSubmitPayload
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPaymentSubmit.name;
  const nanoid = customAlphabet("1234567890", 12);

  const cpin: string = nanoid();

  try {
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
          const amount = parseFloat(entry.amount || "0");

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
          }))
        );

        const dates = getFromDateAndToDate(isExist.year, isExist.month ?? "");

        const lastcform = await prisma.cform.findFirst({
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const cformResponses = await Promise.all(
          Object.values(groupedData).map((group, index) => {
            const representativeEntry = group.entries[0]; // Pick one entry to extract seller info

            return prisma.cform.create({
              data: {
                amount: group.totalAmount.toString(),
                dvat04Id: isExist.dvat04Id,
                office_of_issue: isExist.dvat04.selectOffice,
                date_of_issue: new Date(),
                valid_date: isExist.dvat04.certificateDate!,
                sr_no: getsrno(
                  isExist.dvat04.selectOffice!,
                  parseInt(
                    lastcform ? lastcform.sr_no.split("/").pop() ?? "0" : "1"
                  ),
                  index
                ),
                seller_address:
                  representativeEntry.seller_tin_number.state ?? "",
                seller_name:
                  representativeEntry.seller_tin_number.name_of_dealer ?? "",
                seller_tin_no:
                  representativeEntry.seller_tin_number.tin_number ?? "",
                cform_type: ReturnType.ORIGINAL,
                from_period: new Date(
                  dates.fromDate.split("-").reverse().join("-")
                ),
                to_period: new Date(
                  dates.toDate.split("-").reverse().join("-")
                ),
                status: "ACTIVE",
                createdById: isExist.createdById,
              },
            });
          })
        );

        const cformReturnsEntries: Array<{
          cformId: number;
          returns_entryId: number;
        }> = [];

        Object.values(groupedData).forEach((group, groupIndex) => {
          const cform = cformResponses[groupIndex];

          if (!cform || !cform.id) {
            throw new Error(
              `CForm entry for group ${groupIndex} was not created`
            );
          }

          group.entries.forEach((entry) => {
            cformReturnsEntries.push({
              cformId: cform.id,
              returns_entryId: entry.id,
            });
          });
        });

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
  month: string
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
  id: number,
  index: number
): string => {
  let pre =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "DNH"
      : selectOffice == SelectOffice.DAMAN
      ? "DD"
      : "DIU";

  return `${pre}/C/${id + index}`;
};
