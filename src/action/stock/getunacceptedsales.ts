"use server";

import prisma from "../../../prisma/database";

interface UnacceptedSalesRow {
  seller_tin_number: string;
  seller_trade_name: string;
  seller_contact: string;
  pending_invoice_count: number;
}

export default async function GetUnacceptedSales({
  dvatid,
}: {
  dvatid: number;
}): Promise<{ status: boolean; data?: UnacceptedSalesRow[]; message: string }> {
  try {
    // Get all daily sales that are not accepted for this DVAT
    const unacceptedSales = await prisma.daily_sale.groupBy({
      by: ["seller_tin_numberId"],
      where: {
        dvat04Id: dvatid,
        is_accept: false, // Unaccepted sales
      },
      _count: {
        id: true,
      },
    });

    // Get seller details from dvat04
    const result: UnacceptedSalesRow[] = [];

    for (const sale of unacceptedSales) {
      if (sale.seller_tin_numberId) {
        const seller = await prisma.dvat04.findFirst({
          where: {
            id: sale.seller_tin_numberId,
          },
          select: {
            tinNumber: true,
            tradename: true,
            contact_one: true,
          },
        });

        if (seller) {
          result.push({
            seller_tin_number: seller.tinNumber ?? "",
            seller_trade_name: seller.tradename ?? "",
            seller_contact: seller.contact_one ?? "",
            pending_invoice_count: sale._count.id,
          });
        }
      }
    }

    return {
      status: true,
      data: result,
      message: "Unaccepted sales retrieved successfully",
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve unaccepted sales",
    };
  }
}
