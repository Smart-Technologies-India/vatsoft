"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface SearchDvatForBlacklistPayload {
  searchTerm?: string;
  skip: number;
  take: number;
}

interface DvatForBlacklistResult {
  id: number;
  tinNumber: string;
  tradename: string;
  commodity: string;
  selectOffice: string;
  frequencyFilings: string;
  isBlacklisted: boolean;
}

const SearchDvatForBlacklist = async (
  payload: SearchDvatForBlacklistPayload,
): Promise<PaginationResponse<Array<DvatForBlacklistResult> | null>> => {
  const functionname: string = SearchDvatForBlacklist.name;

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
      OR: [
        {
          tinNumber: {
            contains: searchTerm,
          },
        },
        {
          tradename: {
            contains: searchTerm,
          },
        },
      ],
    };

    // Get total count
    const total = await prisma.dvat04.count({
      where: whereCondition,
    });

    // Fetch DVAT records
    const dvatRecords = await prisma.dvat04.findMany({
      where: whereCondition,
      select: {
        id: true,
        tinNumber: true,
        tradename: true,
        commodity: true,
        selectOffice: true,
        frequencyFilings: true,
      },
      skip: payload.skip,
      take: payload.take,
      orderBy: {
        tinNumber: "asc",
      },
    });

    // Get blacklisted DVAT IDs
    const blacklistedDvatIds = await prisma.dvatblock.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        dvatId: true,
      },
    });

    const blacklistedIds = new Set(blacklistedDvatIds.map((b) => b.dvatId));

    // Map to result format
    const result: DvatForBlacklistResult[] = dvatRecords.map((dvat) => ({
      id: dvat.id,
      tinNumber: dvat.tinNumber || "",
      tradename: dvat.tradename || "",
      commodity: dvat.commodity || "",
      selectOffice: dvat.selectOffice || "",
      frequencyFilings: dvat.frequencyFilings || "",
      isBlacklisted: blacklistedIds.has(dvat.id),
    }));

    return createPaginationResponse({
      message: "DVAT records fetched successfully.",
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

export default SearchDvatForBlacklist;
