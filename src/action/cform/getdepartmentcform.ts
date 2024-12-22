"use server";

import { errorToString } from "@/utils/methods";
import { cform, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserCformPayload {
  dept: SelectOffice;
  fromdate?: Date;
  todate?: Date;
  sr_no?: string;
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
          dvat04: {
            selectOffice: payload.dept,
          },
          ...(payload.sr_no && { sr_no: payload.sr_no }),
          ...(payload.fromdate &&
            payload.todate && {
              date_of_issue: {
                gte: payload.fromdate,
                lte: payload.todate,
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
          dvat04: {
            selectOffice: payload.dept,
          },
          ...(payload.sr_no && { sr_no: payload.sr_no }),
          ...(payload.fromdate &&
            payload.todate && {
              date_of_issue: {
                gte: payload.fromdate,
                lte: payload.todate,
              },
            }),
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
