"use server";

import { errorToString } from "@/utils/methods";
import { commodity_master, manufacturer_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetManufacturerPurchasePayload {
  dvatid: number;
  take: number;
  skip: number;
}

const GetManufacturerPurchase = async (
  payload: GetManufacturerPurchasePayload
): Promise<
  PaginationResponse<Array<
    manufacturer_purchase & {
      commodity_master: commodity_master;
    }
  > | null>
> => {
  const functionname: string = GetManufacturerPurchase.name;

  try {
    const [manufacturer_purchase_response, totalCount] = await Promise.all([
      prisma.manufacturer_purchase.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
        include: {
          commodity_master: true,
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.manufacturer_purchase.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!manufacturer_purchase_response) {
      return createPaginationResponse({
        message: "No Manufacturer Purchase found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All Manufacturer Purchase Data get successfully",
      functionname,
      data: manufacturer_purchase_response,
      take: payload.take,
      skip: payload.skip,
      total: totalCount ?? 0,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetManufacturerPurchase;
