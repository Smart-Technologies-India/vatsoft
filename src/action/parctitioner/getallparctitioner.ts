"use server";

import { errorToString } from "@/utils/methods";
import { parctitioner } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllParctitionerPayload {
  skip: number;
  take: number;
}

const GetAllParctitioner = async (
  payload: GetAllParctitionerPayload
): Promise<PaginationResponse<parctitioner[] | null>> => {
  const functionname: string = GetAllParctitioner.name;

  try {
    const [parctitioner, totalCount] = await Promise.all([
      prisma.parctitioner.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.parctitioner.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      }),
    ]);

    return createPaginationResponse({
      message: parctitioner
        ? "Pagination Get successfully"
        : "Unable to get parctitioner.",
      functionname: functionname,
      data: parctitioner ?? null,
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

export default GetAllParctitioner;
