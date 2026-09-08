"use server";

import { errorToString } from "@/utils/methods";
import { challan, dvat04, returns_01, PaymentStatus } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetDvatChallanPayload {
  dvatid: number;
  paymentstatus?: PaymentStatus;
  skip: number;
  take: number;
}

export type DvatChallanWithRelations = challan & {
  dvat: dvat04;
  returns_01: returns_01 | null;
};

const GetDvatChallan = async (
  payload: GetDvatChallanPayload,
): Promise<PaginationResponse<DvatChallanWithRelations[] | null>> => {
  const functionname: string = GetDvatChallan.name;
  console.log(`Fetching DVAT Challans for DVAT ID: ${payload.dvatid}`);

  try {
    const [challanData, totalCount] = await Promise.all([
      await prisma.challan.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
          ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
        },
        include: {
          dvat: true,
          returns_01: true,
        },
        skip: payload.skip,
        take: payload.take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.challan.count({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
          ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
        },
      }),
    ]);

    return createPaginationResponse({
      message: challanData
        ? "DVAT Challans retrieved successfully"
        : "Unable to get challans.",
      functionname: functionname,
      data: challanData ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvatChallan;
