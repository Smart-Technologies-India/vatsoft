"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { commodity_master, dvat04, first_stock } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "../../../prisma/database";

interface GetDepartmentFirstStockByDvatIdPayload {
  dvat04Id: number;
}

interface DepartmentFirstStockData {
  dvat04: dvat04;
  stock: Array<first_stock & { commodity_master: commodity_master }>;
}

const GetDepartmentFirstStockByDvatId = async (
  payload: GetDepartmentFirstStockByDvatIdPayload,
): Promise<ApiResponseType<DepartmentFirstStockData | null>> => {
  const functionname: string = GetDepartmentFirstStockByDvatId.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetDepartmentFirstStockByDvatId",
      } as any;
    }

    const dvatData = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvat04Id,
        deletedAt: null,
        deletedBy: null,
      },
    });

    if (!dvatData) {
      return createResponse({
        message: "Dealer not found.",
        functionname,
      });
    }

    const stockData = await prisma.first_stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: dvatData.id,
      },
      include: {
        commodity_master: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return createResponse({
      message: "First stock fetched successfully.",
      functionname,
      data: {
        dvat04: dvatData,
        stock: stockData,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDepartmentFirstStockByDvatId;
