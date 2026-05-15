"use server";

import { errorToString } from "@/utils/methods";
import {
  challan,
  dvat04,
  returns_01,
  SelectOffice,
  PaymentStatus,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetDeptChallanPayload {
  dept: SelectOffice;
  paymentstatus?: PaymentStatus;
  skip: number;
  take: number;
}

export type DepartmentChallanWithRelations = challan & {
  dvat: dvat04;
  returns_01: returns_01 | null;
};

const GetDeptChallan = async (
  payload: GetDeptChallanPayload
): Promise<PaginationResponse<DepartmentChallanWithRelations[] | null>> => {
  const functionname: string = GetDeptChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetDeptChallan",
      } as any;
    }

    const [challan, totalCount] = await Promise.all([
      await prisma.challan.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
          ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
        },
        include: {
          dvat: true,
          returns_01: true,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
          ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
        },
      }),
    ]);

    return createPaginationResponse({
      message: challan
        ? "All Challan Get successfully"
        : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
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

export default GetDeptChallan;
