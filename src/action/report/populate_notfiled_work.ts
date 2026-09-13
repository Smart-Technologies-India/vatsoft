"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";

interface PopulateNotfiledWorkResponse {
  status: boolean;
  message: string;
  data?: {
    inserted: number;
    updated: number;
  };
}

const PopulateNotfiledWork =
  async (): Promise<PopulateNotfiledWorkResponse> => {
    const functionname = "PopulateNotfiledWork";
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        return {
          status: false,
          message: "Not authenticated. Please login.",
        };
      }

      const currentDate = new Date();

      // Get all unfiled, overdue returns with their dealer info
      const unfiledReturns = await prisma.return_filing.findMany({
        where: {
          filing_status: false, // Not filed
          due_date: {
            lt: currentDate, // Due date has passed
          },
          deletedAt: null,
          dvat: {
            deletedAt: null,
            deletedBy: null,
          },
        },
        include: {
          dvat: true,
        },
        orderBy: {
          due_date: "asc",
        },
      });

      if (!unfiledReturns || unfiledReturns.length === 0) {
        return {
          status: true,
          message: "No unfiled overdue returns found",
          data: { inserted: 0, updated: 0 },
        };
      }

      // Get all unique dvat IDs
      const dvatIds = Array.from(new Set(unfiledReturns.map((r) => r.dvat.id)));

      // BATCH FETCH: Get all paid challans for all dvats in ONE query (best for performance)
      const paidChallans = await prisma.challan.findMany({
        where: {
          dvatid: {
            in: dvatIds,
          },
          paymentstatus: "PAID",
          deletedAt: null,
        },
        include: {
          returns_01: {
            select: {
              month: true,
              year: true,
            },
          },
        },
      });

      // Create a map for O(1) lookup: key = "dvatId-month", value = total paid amount
      const paidAmountMap = new Map<string, number>();

      for (const challan of paidChallans) {
        if (challan.returns_01) {
          const key = `${challan.dvatid}-${challan.returns_01.month}`;
          const totalAmount = parseFloat(challan.total_tax_amount) || 0;
          paidAmountMap.set(key, (paidAmountMap.get(key) || 0) + totalAmount);
        }
      }

      // Helper function to convert month name to number (1-12)
      const getMonthNumber = (monthName: string): number => {
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
        const index = months.findIndex(
          (m) => m.toLowerCase() === (monthName || "").toLowerCase()
        );
        return index !== -1 ? index + 1 : 0; // Returns 1-12 or 0 if not found
      };

      let insertedCount = 0;
      let updatedCount = 0;

      // Process each unfiled return
      for (const filing of unfiledReturns) {
        const dvatId = filing.dvat.id;
        const monthName = filing.month as string;
        const monthNumber = getMonthNumber(monthName);

        // Validate month - must be a valid number between 1 and 12
        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
          console.error(
            `Invalid month value for dvatId: ${dvatId}, filing.month: ${monthName}. Skipping this record.`
          );
          continue;
        }

        // Skip if due_date is null
        if (!filing.due_date) {
          continue;
        }

        // Check if already exists in returns_notfiled_work
        const existing = await prisma.returns_notfiled_work.findFirst({
          where: {
            dvatId: dvatId,
            month: monthName,
          },
        });

        // Calculate date range for the specific month
        const year = filing.due_date.getFullYear();
        const startDate = new Date(year, monthNumber - 1, 1); // First day of the month
        const endDate = new Date(year, monthNumber, 1); // First day of next month


        // Get VAT amounts for this specific month and dvat
        const vatAmountRecords = await prisma.daily_purchase.findMany({
          where: {
            dvat04Id: dvatId,
            deletedAt: null,
            invoice_date: {
              gte: startDate,
              lt: endDate,
            },
          },
          select: {
            amount: true,
            commodity_master: {
              select: {
                id: true,
              },
            },
          },
        });


        let totalVatAmount = 0;
        for (const record of vatAmountRecords) {
          const amount = parseFloat(record.amount);
          const commodityId = record.commodity_master?.id;

          if (!isNaN(amount)) {
            let vatRate = 0.2; // Default 20%

            // If commodity id = 1 or 748: 12.75%
            if (commodityId === 1 || commodityId === 748) {
              vatRate = 0.1275;
            }
            // If commodity id = 2 or 749: 12.75%
            else if (commodityId === 2 || commodityId === 749) {
              vatRate = 0.135;
            }
            else if (commodityId === 1245 ) {
              vatRate = 0.06;
            }

            totalVatAmount += amount * vatRate;
           
          }
        }

        // Get RPAID_total from precomputed map
        const lookupKey = `${dvatId}-${monthName}`;
        const rPaidTotal = paidAmountMap.get(lookupKey) || 0;

        // Calculate balance
        const balance = totalVatAmount - rPaidTotal;

        // Calculate penalty: (current date - due_date) * 100
        const dueDate = new Date(filing.due_date);
        const daysDue = Math.floor(
          (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const penalty = Math.max(0, daysDue * 100);

        // Calculate interest: ((balance * 0.15) / 365) * x
        // where x = (current date - (due_date - 13 days))
        const dueDate13DaysBack = new Date(dueDate);
        dueDate13DaysBack.setDate(dueDate13DaysBack.getDate() - 13);
        const daysForInterest = Math.floor(
          (currentDate.getTime() - dueDate13DaysBack.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const interest = Math.max(
          0,
          ((balance * 0.15) / 365) * daysForInterest,
        );

        // Calculate total_tax_amount = balance + interest + penalty
        //if balance is nagative only only add panalty in total tax amount
        const totalTaxAmount = balance < 0 ? penalty : balance + interest + penalty;

        const dataToUpsert = {
          dvatId: dvatId,
          month: monthName,
          frequency: filing.dvat.frequencyFilings || "MONTHLY",
          tinNumber: filing.dvat.tinNumber,
          tradeName: filing.dvat.tradename,
          selectOffice: filing.dvat.selectOffice,
          commodity: filing.dvat.commodity,
          vatamount: totalVatAmount.toFixed(2),
          RPAID_total: rPaidTotal.toFixed(2),
          balance: balance.toFixed(2),
          penalty: penalty.toFixed(2),
          interest: interest.toFixed(2),
          total_tax_amount: totalTaxAmount.toFixed(2),
          due_date: filing.due_date,
        };

        if (existing) {
          // Update existing record
          await prisma.returns_notfiled_work.update({
            where: { id: existing.id },
            data: dataToUpsert,
          });
          updatedCount++;
        } else {
          // Create new record
          await prisma.returns_notfiled_work.create({
            data: dataToUpsert,
          });
          insertedCount++;
        }
      }

      return {
        status: true,
        message: `Successfully populated returns_notfiled_work table. Inserted: ${insertedCount}, Updated: ${updatedCount}`,
        data: { inserted: insertedCount, updated: updatedCount },
      };
    } catch (error) {
      return {
        status: false,
        message: errorToString(error),
      };
    }
  };

export default PopulateNotfiledWork;
