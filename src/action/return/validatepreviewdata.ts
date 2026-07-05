"use server";

import prisma from "../../../prisma/database";

interface ValidatePreviewDataResponse {
  status: boolean;
  message: string;
  hasPendingSale: boolean;
  hasPendingPurchase: boolean;
  pendingSaleCount: number;
  pendingPurchaseCount: number;
}

export default async function ValidatePreviewData(
  month: string,
  year: string,
  dvatid: number | string,
  frequencyFilings?: string,
): Promise<ValidatePreviewDataResponse> {
  try {
    // Convert dvatid to number
    const dvatIdNumber = typeof dvatid === "string" ? parseInt(dvatid) : dvatid;

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

    // Determine if quarterly filing
    const isQuarterlyFiling =
      frequencyFilings?.toUpperCase() === "QUARTERLY";

    // Get list of months to check
    let monthsToCheck: string[] = [month];

    if (isQuarterlyFiling) {
      // Get the quarter for the given month
      const monthToQuarterMap: { [key: string]: string[] } = {
        January: ["January", "February", "March"],
        February: ["January", "February", "March"],
        March: ["January", "February", "March"],
        April: ["April", "May", "June"],
        May: ["April", "May", "June"],
        June: ["April", "May", "June"],
        July: ["July", "August", "September"],
        August: ["July", "August", "September"],
        September: ["July", "August", "September"],
        October: ["October", "November", "December"],
        November: ["October", "November", "December"],
        December: ["October", "November", "December"],
      };

      monthsToCheck = monthToQuarterMap[month] || [month];
    }

    // Build date ranges for all months to check
    const dateRanges: Array<{ start: Date; end: Date }> = [];

    for (const checkMonth of monthsToCheck) {
      let monthIndex = monthNames.indexOf(checkMonth);
      let targetYear = parseInt(year);

      // Handle January, February, March (fiscal year adjustment)
      if (monthIndex === 0 || monthIndex === 1 || monthIndex === 2) {
        targetYear = parseInt(year) + 1;
      }

      const monthStart = new Date(targetYear, monthIndex, 1);
      const monthEnd = new Date(targetYear, monthIndex + 1, 1);

      dateRanges.push({ start: monthStart, end: monthEnd });
    }

    // Check for pending daily_sale records (is_dvat_31 = false)
    const pendingSaleRecords = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: dvatIdNumber,
        is_dvat_31: false,
        OR: dateRanges.map((range) => ({
          invoice_date: {
            gte: range.start,
            lt: range.end,
          },
        })),
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        invoice_number: true,
        invoice_date: true,
      },
    });

    // Check for pending daily_purchase records (is_dvat_30a = false)
    const pendingPurchaseRecords = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: dvatIdNumber,
        is_dvat_30a: false,
        OR: dateRanges.map((range) => ({
          invoice_date: {
            gte: range.start,
            lt: range.end,
          },
        })),
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        invoice_number: true,
        invoice_date: true,
      },
    });

    const hasPendingSale = pendingSaleRecords.length > 0;
    const hasPendingPurchase = pendingPurchaseRecords.length > 0;

    if (hasPendingSale || hasPendingPurchase) {
      let errorMessage = "";

      if (isQuarterlyFiling) {
        errorMessage = `Cannot generate preview for this quarter. Pending records found:\n\n`;
      } else {
        errorMessage = `Cannot generate preview for ${month}. Pending records found:\n\n`;
      }

      if (hasPendingSale) {
        errorMessage += `• ${pendingSaleRecords.length} pending Sale record(s) need to be processed\n`;
      }

      if (hasPendingPurchase) {
        errorMessage += `• ${pendingPurchaseRecords.length} pending Purchase record(s) need to be processed`;
      }

      errorMessage +=
        "\n\nPlease convert these records to DVAT entries before generating the preview.";

      return {
        status: false,
        message: errorMessage,
        hasPendingSale,
        hasPendingPurchase,
        pendingSaleCount: pendingSaleRecords.length,
        pendingPurchaseCount: pendingPurchaseRecords.length,
      };
    }

    return {
      status: true,
      message: "All records are ready for preview",
      hasPendingSale: false,
      hasPendingPurchase: false,
      pendingSaleCount: 0,
      pendingPurchaseCount: 0,
    };
  } catch (error) {
    console.error("Error validating preview data:", error);
    return {
      status: false,
      message: "An error occurred while validating data",
      hasPendingSale: false,
      hasPendingPurchase: false,
      pendingSaleCount: 0,
      pendingPurchaseCount: 0,
    };
  }
}
