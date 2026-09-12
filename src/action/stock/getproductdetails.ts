"use server";

import prisma from "../../../prisma/database";

interface ProductDetails {
  lastPurchaseDate: string | null;
  lastSaleDate: string | null;
  isStockSnapshot: boolean;
}

export default async function GetProductDetails({
  dvat04Id,
  commodityMasterId,
}: {
  dvat04Id: number;
  commodityMasterId: number;
}): Promise<{
  status: boolean;
  data?: ProductDetails;
  message: string;
}> {
  try {
    // Get last purchase date
    const lastPurchaseQuery: any = {
      dvat04Id: dvat04Id,
      deletedAt: null,
    };
    if (commodityMasterId !== 0) {
      lastPurchaseQuery.commodity_masterId = commodityMasterId;
    }

    const lastPurchase = await prisma.daily_purchase.findFirst({
      where: lastPurchaseQuery,
      orderBy: {
        invoice_date: "desc",
      },
      select: {
        invoice_date: true,
      },
    });

    // Get last sale date
    const lastSaleQuery: any = {
      dvat04Id: dvat04Id,
      deletedAt: null,
    };
    if (commodityMasterId !== 0) {
      lastSaleQuery.commodity_masterId = commodityMasterId;
    }

    const lastSale = await prisma.daily_sale.findFirst({
      where: lastSaleQuery,
      orderBy: {
        invoice_date: "desc",
      },
      select: {
        invoice_date: true,
      },
    });

    // Check if stock has snapshot entries
    const stockQuery: any = {
      dvat04Id: dvat04Id,
      deletedAt: null,
    };
    if (commodityMasterId !== 0) {
      stockQuery.commodity_masterId = commodityMasterId;
    }

    const stocks = await prisma.stock.findMany({
      where: stockQuery,
      include: {
        stock_update_snapshot: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    const isStockSnapshot = stocks.some(
      (stock) => stock.stock_update_snapshot.length > 0,
    );

    return {
      status: true,
      data: {
        lastPurchaseDate: lastPurchase
          ? new Date(lastPurchase.invoice_date).toLocaleDateString("en-IN")
          : null,
        lastSaleDate: lastSale
          ? new Date(lastSale.invoice_date).toLocaleDateString("en-IN")
          : null,
        isStockSnapshot: isStockSnapshot,
      },
      message: "Product details fetched successfully",
    };
  } catch (error: any) {
    return {
      status: false,
      message: error.message || "Failed to fetch product details",
    };
  }
}
