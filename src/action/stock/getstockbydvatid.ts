"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";

interface StockData {
  id: number;
  commodityId: number;
  itemCode: string;
  itemName: string;
  stockCount: number;
  firstStockCount: number;
  saleCount: number;
  purchaseCount: number;
}

interface DvatInfo {
  id: number;
  tinNumber: string | null;
  tradename: string | null;
}

interface StockResponse {
  dvatInfo: DvatInfo;
  stockData: StockData[];
}

interface GetStockByDvatIdPayload {
  dvatId: number;
}

const GetStockByDvatId = async (
  payload: GetStockByDvatIdPayload,
): Promise<ApiResponseType<StockResponse | null>> => {
  const functionname: string = GetStockByDvatId.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Fetch DVAT info
    const dvatInfo = await prisma.dvat04.findUnique({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.dvatId,
      },
      select: {
        id: true,
        tinNumber: true,
        tradename: true,
      },
    });

    if (!dvatInfo) {
      return createResponse({
        message: "DVAT record not found",
        functionname,
        data: null,
      });
    }

    const stockDataMap = new Map<number, StockData>();

    // Get stock data
    const stockQueryResult = await prisma.stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatId,
      },
      include: {
        commodity_master: {
          select: {
            id: true,
            product_name: true,
            oidc_code: true,
          },
        },
      },
    });

    // Build map from stock data
    for (const stock of stockQueryResult) {
      if (stock.commodity_master) {
        stockDataMap.set(stock.commodity_master.id, {
          id: stock.commodity_master.id,
          commodityId: stock.commodity_master.id,
          itemCode:
            stock.commodity_master.oidc_code ||
            `ID-${stock.commodity_master.id}`,
          itemName: stock.commodity_master.product_name,
          stockCount: stock.quantity,
          firstStockCount: 0,
          saleCount: 0,
          purchaseCount: 0,
        });
      }
    }

    // Get first stock data
    const firstStockQueryResult = await prisma.first_stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatId,
      },
      include: {
        commodity_master: {
          select: {
            id: true,
            product_name: true,
            oidc_code: true,
          },
        },
      },
    });

    for (const firstStock of firstStockQueryResult) {
      if (firstStock.commodity_master) {
        const existingData = stockDataMap.get(firstStock.commodity_master.id);
        if (existingData) {
          existingData.firstStockCount = firstStock.quantity;
        } else {
          stockDataMap.set(firstStock.commodity_master.id, {
            id: firstStock.commodity_master.id,
            commodityId: firstStock.commodity_master.id,
            itemCode:
              firstStock.commodity_master.oidc_code ||
              `ID-${firstStock.commodity_master.id}`,
            itemName: firstStock.commodity_master.product_name,
            stockCount: 0,
            firstStockCount: firstStock.quantity,
            saleCount: 0,
            purchaseCount: 0,
          });
        }
      }
    }

    // Get sale data
    const saleQueryResult = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatId,
      },
      include: {
        commodity_master: {
          select: {
            id: true,
            product_name: true,
            oidc_code: true,
          },
        },
      },
    });

    for (const sale of saleQueryResult) {
      if (sale.commodity_master) {
        const existingData = stockDataMap.get(sale.commodity_master.id);
        if (existingData) {
          existingData.saleCount += sale.quantity;
        } else {
          stockDataMap.set(sale.commodity_master.id, {
            id: sale.commodity_master.id,
            commodityId: sale.commodity_master.id,
            itemCode:
              sale.commodity_master.oidc_code ||
              `ID-${sale.commodity_master.id}`,
            itemName: sale.commodity_master.product_name,
            stockCount: 0,
            firstStockCount: 0,
            saleCount: sale.quantity,
            purchaseCount: 0,
          });
        }
      }
    }

    // Get purchase data (only where is_accept is true)
    const purchaseQueryResult = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatId,
        is_accept: true,
      },
      include: {
        commodity_master: {
          select: {
            id: true,
            product_name: true,
            oidc_code: true,
          },
        },
      },
    });

    for (const purchase of purchaseQueryResult) {
      if (purchase.commodity_master) {
        const existingData = stockDataMap.get(purchase.commodity_master.id);
        if (existingData) {
          existingData.purchaseCount += purchase.quantity;
        } else {
          stockDataMap.set(purchase.commodity_master.id, {
            id: purchase.commodity_master.id,
            commodityId: purchase.commodity_master.id,
            itemCode:
              purchase.commodity_master.oidc_code ||
              `ID-${purchase.commodity_master.id}`,
            itemName: purchase.commodity_master.product_name,
            stockCount: 0,
            firstStockCount: 0,
            saleCount: 0,
            purchaseCount: purchase.quantity,
          });
        }
      }
    }

    // Convert map to array - show all items with any data
    const filteredStockData = Array.from(stockDataMap.values()).sort((a, b) =>
      a.itemName.localeCompare(b.itemName),
    );

    return createResponse({
      message: "Stock data retrieved successfully",
      functionname,
      data: {
        dvatInfo,
        stockData: filteredStockData,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetStockByDvatId;
