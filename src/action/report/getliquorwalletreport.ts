"use server";
import prisma from "../../../prisma/database";

export interface LiquorWalletGroupRecord {
  dvatId: number;
  tinNumber: string | null;
  tradename: string | null;
  totalCredit: string;
  totalDebit: string;
  balance: string | null;
}

const GetLiquorWalletReport = async (): Promise<{
  status: boolean;
  message: string;
  data?: LiquorWalletGroupRecord[];
}> => {
  try {
    // Get all liquor wallet history records with DVAT info
    const historyRecords = await prisma.liquor_wallet_history.findMany({
      include: {
        dvat: {
          select: {
            id: true,
            tinNumber: true,
            tradename: true,
            wallet: true,
          },
        },
      },
      orderBy: {
        dvatId: "desc",
      },
    });

    // Group by DVAT and aggregate
    const groupedMap = new Map<
      number,
      {
        dvat: { id: number; tinNumber: string | null; tradename: string | null; wallet: string | null };
        creditAmount: number;
        debitAmount: number;
      }
    >();

    historyRecords.forEach((record) => {
      const dvatId = record.dvatId;
      const amount = parseFloat(record.amount || "0") || 0;

      if (!groupedMap.has(dvatId)) {
        groupedMap.set(dvatId, {
          dvat: record.dvat,
          creditAmount: 0,
          debitAmount: 0,
        });
      }

      const group = groupedMap.get(dvatId)!;
      if (record.type === "CREDIT") {
        group.creditAmount += amount;
      } else if (record.type === "DEBIT") {
        group.debitAmount += amount;
      }
    });

    // Convert map to formatted records
    const formattedRecords: LiquorWalletGroupRecord[] = Array.from(groupedMap.values())
      .map((group) => ({
        dvatId: group.dvat.id,
        tinNumber: group.dvat.tinNumber,
        tradename: group.dvat.tradename,
        totalCredit: group.creditAmount.toFixed(2),
        totalDebit: group.debitAmount.toFixed(2),
        balance: group.dvat.wallet || "0",
      }))
      .filter((record) => record.tinNumber && record.tradename);

    return {
      status: true,
      message: "Records fetched successfully",
      data: formattedRecords,
    };
  } catch (error) {
    console.error("Error fetching liquor wallet report:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch liquor wallet report",
    };
  }
};

export default GetLiquorWalletReport;
