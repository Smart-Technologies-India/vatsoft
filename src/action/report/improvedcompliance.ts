"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface ImprovedCompliancePayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  improvementPeriod?: number; // months to check for improvement (default 6)
}

interface DealerComplianceData {
  id: number;
  tinNumber: string;
  name: string;
  tradename: string;
  commodity: string;
  selectOffice: string;
  contact_one: string;
  previousDefaultCount: number;
  currentComplianceMonths: number;
  improvementScore: number;
  lastDefaultDate: string;
  consecutiveFilings: number;
}

const ImprovedCompliance = async (
  payload: ImprovedCompliancePayload,
): Promise<{
  status: boolean;
  data?: DealerComplianceData[];
  message?: string;
}> => {
  try {
    const improvementPeriod = payload.improvementPeriod || 6;
    const currentDate = new Date();

    // Calculate date ranges
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - improvementPeriod);

    const oneYearAgo = new Date();
    oneYearAgo.setMonth(currentDate.getMonth() - 12);

    // Build where clause for dvat04
    const dvatWhereClause: any = {
      status: "APPROVED",
    };

    if (payload.selectOffice) {
      dvatWhereClause.selectOffice = payload.selectOffice;
    }

    // Get all dealers
    const dealers = await prisma.dvat04.findMany({
      where: dvatWhereClause,
      select: {
        id: true,
        tinNumber: true,
        name: true,
        tradename: true,
        commodity: true,
        selectOffice: true,
        contact_one: true,
      },
    });

    const improvedDealers: DealerComplianceData[] = [];

    for (const dealer of dealers) {
      // Get return filing records for the past year
      const pastYearFilings = await prisma.return_filing.findMany({
        where: {
          dvatid: dealer.id,
          status: "ACTIVE",
          due_date: {
            gte: oneYearAgo,
          },
        },
        orderBy: {
          due_date: "desc",
        },
        select: {
          id: true,
          month: true,
          year: true,
          filing_status: true,
          filing_date: true,
          due_date: true,
          return_status: true,
        },
      });

      if (pastYearFilings.length === 0) continue;
      // Split into recent period (last 6 months) and older period (6-12 months ago)
      const recentFilings = pastYearFilings.filter((f) => {
        if (!f.due_date) return false;
        return new Date(f.due_date) >= sixMonthsAgo;
      });

      const olderFilings = pastYearFilings.filter((f) => {
        if (!f.due_date) return false;
        return (
          new Date(f.due_date) < sixMonthsAgo &&
          new Date(f.due_date) >= oneYearAgo
        );
      });

      if (recentFilings.length === 0 || olderFilings.length === 0) continue;

      // Count defaults in older period (not filed at all)
      const oldDefaultCount = olderFilings.filter(
        (f) => f.filing_status === false,
      ).length;

      // Count successful filings in recent period (filed, whether on time or late)
      const recentSuccessCount = recentFilings.filter(
        (f) => f.filing_status === true,
      ).length;

      // Calculate compliance rates
      const oldComplianceRate =
        olderFilings.length > 0
          ? ((olderFilings.length - oldDefaultCount) / olderFilings.length) *
            100
          : 0;

      const recentComplianceRate =
        recentFilings.length > 0
          ? (recentSuccessCount / recentFilings.length) * 100
          : 0;

      // Check for improvement: had defaults before (compliance < 70%) but now compliant (compliance >= 80%)
      if (
        oldDefaultCount >= 2 &&
        oldComplianceRate < 70 &&
        recentComplianceRate >= 80
      ) {
        // Find last default date
        const lastDefault = olderFilings.find((f) => f.filing_status === false);

        // Count consecutive recent filings
        let consecutiveCount = 0;
        for (const filing of recentFilings) {
          if (filing.filing_status === true) {
            consecutiveCount++;
          } else {
            break;
          }
        }

        improvedDealers.push({
          id: dealer.id,
          tinNumber: dealer.tinNumber || "N/A",
          name: dealer.name || "N/A",
          tradename: dealer.tradename || "N/A",
          commodity: dealer.commodity || "OTHER",
          selectOffice: dealer.selectOffice || "N/A",
          contact_one: dealer.contact_one || "N/A",
          previousDefaultCount: oldDefaultCount,
          currentComplianceMonths: recentSuccessCount,
          improvementScore: recentComplianceRate - oldComplianceRate,
          lastDefaultDate:
            lastDefault?.due_date?.toISOString().split("T")[0] || "N/A",
          consecutiveFilings: consecutiveCount,
        });
      }
    }

    // Sort by improvement score (highest improvement first)
    improvedDealers.sort((a, b) => b.improvementScore - a.improvementScore);

    return {
      status: true,
      data: improvedDealers,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default ImprovedCompliance;
