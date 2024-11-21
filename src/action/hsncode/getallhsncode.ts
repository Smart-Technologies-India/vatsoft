"use server";

import { errorToString } from "@/utils/methods";
import { hsncode } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllHSNCodePayload {
  skip: number;
  take: number;
}

const GetAllHSNCode = async (
  payload: GetAllHSNCodePayload
): Promise<PaginationResponse<hsncode[] | null>> => {
  const functionname: string = GetAllHSNCode.name;

  try {
    const [hsncode, totalCount] = await Promise.all([
      prisma.hsncode.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.hsncode.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      }),
    ]);

    return createPaginationResponse({
      message: hsncode
        ? "Pagination Get successfully"
        : "Unable to get hsncode.",
      functionname: functionname,
      data: hsncode ?? null,
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

export default GetAllHSNCode;
