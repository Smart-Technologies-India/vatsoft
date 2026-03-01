"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  challan,
  DvatType,
  PurchaseType,
  returns_01,
  ReturnType,
  SelectOffice,
} from "@prisma/client";
import { customAlphabet } from "nanoid";

interface AddPaymentOnlinePayload {
  id: number;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
}

const AddPaymentOnline = async (
  payload: AddPaymentOnlinePayload,
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = AddPaymentOnline.name;
  const nanoid = customAlphabet("1234567890", 12);

  const cpin: string = nanoid();

  try {
    const result: challan = await prisma.$transaction(async (prisma) => {
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
          // bank_name: payload.bank_name,
          // track_id: payload.track_id,
          // transaction_id: payload.transaction_id,
          // transaction_date: addPrismaDatabaseDate(new Date()).toISOString(),
          // paymentmode: "ONLINE",
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
        const filingDate = new Date();

        // Get all records to update to check due dates
        const recordsToUpdate = await prisma.return_filing.findMany({
          where: {
            filing_status: false,
            dvatid: updateresponse.dvat04Id,
            filing_date: null,
            year: updateresponse.year,
            month: { in: monthsToUpdate },
          },
        });

        // Update each record with appropriate return_status
        await Promise.all(
          recordsToUpdate.map((record) =>
            prisma.return_filing.update({
              where: { id: record.id },
              data: {
                filing_date: filingDate,
                filing_status: true,
                return_status:
                  record.due_date && record.due_date >= filingDate
                    ? "FILED"
                    : "LATEFILED",
              },
            }),
          ),
        );
      } else {
        const filingDate = new Date();

        // Get all records to update to check due dates
        const recordsToUpdate = await prisma.return_filing.findMany({
          where: {
            filing_status: false,
            dvatid: updateresponse.dvat04Id,
            filing_date: null,
            year: updateresponse.year,
            month: updateresponse.month ?? "",
          },
        });

        // Update each record with appropriate return_status
        await Promise.all(
          recordsToUpdate.map((record) =>
            prisma.return_filing.update({
              where: { id: record.id },
              data: {
                filing_date: filingDate,
                filing_status: true,
                return_status:
                  record.due_date && record.due_date >= filingDate
                    ? "FILED"
                    : "LATEFILED",
              },
            }),
          ),
        );
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

      let today = new Date();
      today.setDate(today.getDate() + 3);

      const challan_response = await prisma.challan.create({
        data: {
          dvatid: isExist.dvat04Id,
          cpin: cpin,
          vat: payload.vatamount,
          latefees: "0",
          interest: payload.interestamount,
          others: "0",
          penalty: payload.penalty,
          createdById: isExist.createdById,
          expire_date: today,
          total_tax_amount: payload.totaltaxamount,
          reason: "MONTHLYPAYMENT",
          paymentstatus: "CREATED",
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          // track_id: payload.track_id,
          // bank_name: payload.bank_name,
        },
      });

      if (!challan_response) {
        throw new Error(`Challan was not created`);
      }

      return challan_response;
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

  return `${pre}/${value1}/C/${last + 1}`;
};
