"use server";

import { errorToString } from "@/utils/methods";
import { cform } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserCformPayload {
  name?: string;
  tin?: string;
  dvatid: number;
  take: number;
  skip: number;
}

const GetUserCform = async (
  payload: GetUserCformPayload
): Promise<PaginationResponse<Array<cform> | null>> => {
  const functionname: string = GetUserCform.name;

  try {
    const [cform_data, totalCount] = await Promise.all([
      prisma.cform.findMany({
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
      prisma.cform.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!cform_data) {
      return createPaginationResponse({
        message: "No C-Form Data found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All C-Form Data get successfully",
      functionname,
      data: cform_data,
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

export default GetUserCform;
