"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetBlacklistedDvatsPayload {
  searchTerm?: string;
  skip: number;
  take: number;
}

interface BlacklistedDvatResult {
  id: number;
  dvatId: number;
  tinnumber: string;
  tradename: string;
  commodity: string;
  office: string;
  frequency: string;
  created_at: Date;
}

const GetBlacklistedDvats = async (
  payload: GetBlacklistedDvatsPayload,
): Promise<PaginationResponse<Array<BlacklistedDvatResult> | null>> => {
  const functionname: string = GetBlacklistedDvats.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const searchTerm = (payload.searchTerm ?? "").trim().toLowerCase();

    // Build where condition
    const whereCondition: any = {
      deleted_at: null,
    };

    if (searchTerm) {
      whereCondition.OR = [
        {
          tinnumber: {
            contains: searchTerm,
          },
        },
        {
          tradename: {
            contains: searchTerm,
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.dvatblock.count({
      where: whereCondition,
    });

    // Fetch blacklisted DVAT records
    const blacklistedRecords = await prisma.dvatblock.findMany({
      where: whereCondition,
      skip: payload.skip,
      take: payload.take,
      orderBy: {
        created_at: "desc",
      },
    });

    const result: BlacklistedDvatResult[] = blacklistedRecords.map((record) => ({
      id: record.id,
      dvatId: record.dvatId,
      tinnumber: record.tinnumber || "",
      tradename: record.tradename || "",
      commodity: record.commodity || "",
      office: record.office || "",
      frequency: record.frequency || "",
      created_at: record.created_at,
    }));

    return createPaginationResponse({
      message: "Blacklisted DVAT records fetched successfully.",
      functionname,
      data: result,
      skip: payload.skip,
      take: payload.take,
      total,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetBlacklistedDvats;
