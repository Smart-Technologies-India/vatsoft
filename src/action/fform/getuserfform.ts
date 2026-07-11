"use server";

import { errorToString } from "@/utils/methods";
import { fform } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetUserFformPayload {
  name?: string;
  tin?: string;
  dvatid: number;
  take: number;
  skip: number;
}

const GetUserFform = async (
  payload: GetUserFformPayload
): Promise<PaginationResponse<Array<fform> | null>> => {
  const functionname: string = GetUserFform.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserFform",
      } as any;
    }

    const [fform_data, totalCount] = await Promise.all([
      prisma.fform.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          ...(payload.tin && {
            seller_tin_no: {
              contains: payload.tin,
            },
          }),
          ...(payload.name && {
            seller_name: {
              contains: payload.name,
            },
          }),
        },

        take: payload.take,
        skip: payload.skip,
      }),
      prisma.fform.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!fform_data) {
      return createPaginationResponse({
        message: "No F-Form Data found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All F-Form Data get successfully",
      functionname,
      data: fform_data,
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

export default GetUserFform;
