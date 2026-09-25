"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface GroupedCommodity {
  commodityid: number;
  totalQuantity: number;
  purchaseIds: number[];
  urnNumbers: string[];
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface GroupAcceptSaleResponse {
  successCount: number;
  failedCount: number;
  processedCommodities: number;
  failedCommodities: string[];
}

const GroupAcceptSale = async (
  dvatid: number,
  groupedCommodities: GroupedCommodity[],
): Promise<ApiResponseType<GroupAcceptSaleResponse | null>> => {
  const functionname: string = GroupAcceptSale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const response: GroupAcceptSaleResponse = {
      successCount: 0,
      failedCount: 0,
      processedCommodities: 0,
      failedCommodities: [],
    };

    for (const group of groupedCommodities) {
      try {
        await prisma.$transaction(async (prisma) => {
          // 1. Find or create stock
          const isstock = await prisma.stock.findFirst({
            where: {
              deletedAt: null,
              deletedById: null,
              status: "ACTIVE",
              dvat04Id: dvatid,
              commodity_masterId: group.commodityid,
            },
          });

          if (!isstock) {
            throw new Error("Stock not found for commodity");
          }

          // 2. Update stock with total quantity
          const stock_response = await prisma.stock.upsert({
            where: {
              id: isstock.id,
            },
            update: {
              quantity: group.totalQuantity + isstock.quantity,
              updatedById: currentUserId,
            },
            create: {
              quantity: group.totalQuantity,
              commodity_masterId: group.commodityid,
              dvat04Id: dvatid,
              createdById: currentUserId,
              status: "ACTIVE",
            },
          });

          if (!stock_response) {
            throw new Error("Unable to update or create stock.");
          }

          // 3. Update all purchase records in this group to mark as accepted
          const purchases_update = await prisma.daily_purchase.updateMany({
            where: {
              id: {
                in: group.purchaseIds,
              },
              status: "ACTIVE",
              deletedAt: null,
              deletedById: null,
            },
            data: {
              is_accept: true,
            },
          });

          if (!purchases_update) {
            throw new Error("Unable to update daily purchase records");
          }

          // 4. Update all sales with corresponding URNs to mark as accepted
          const sales_update = await prisma.daily_sale.updateMany({
            where: {
              urn_number: {
                in: group.urnNumbers.filter((urn) => urn !== ""),
              },
              status: "ACTIVE",
              deletedAt: null,
              deletedById: null,
            },
            data: {
              is_accept: true,
            },
          });

          if (!sales_update) {
            throw new Error("Unable to update sale records");
          }
        });

        response.successCount += group.purchaseIds.length;
        response.processedCommodities += 1;
      } catch (commodityError) {
        response.failedCount += group.purchaseIds.length;
        response.failedCommodities.push(
          `Commodity ID ${group.commodityid}: ${errorToString(commodityError)}`,
        );
      }
    }

    return createResponse({
      message: `Processed ${response.processedCommodities} commodity group(s). Accepted ${response.successCount} purchase record(s).`,
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GroupAcceptSale;
