"use server";

import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { errorToString } from "@/utils/methods";
import { Prisma, Quarter, return_due } from "@prisma/client";

interface GetReturnDuesPayload {
  skip: number;
  take: number;
  year?: number;
  quarter?: Quarter;
  search?: string;
}

const parseQuarterSearch = (value: string): Quarter | null => {
  const normalized = value.trim().toUpperCase();
  if (normalized === "Q1" || normalized === "QUARTER1") return Quarter.QUARTER1;
  if (normalized === "Q2" || normalized === "QUARTER2") return Quarter.QUARTER2;
  if (normalized === "Q3" || normalized === "QUARTER3") return Quarter.QUARTER3;
  if (normalized === "Q4" || normalized === "QUARTER4") return Quarter.QUARTER4;
  return null;
};

const GetReturnDues = async (
  payload: GetReturnDuesPayload,
): Promise<PaginationResponse<Array<return_due> | null>> => {
  const functionname = GetReturnDues.name;

  try {
    const where: Prisma.return_dueWhereInput = {};

    // Always restrict to: current month, last 2 months, and all future months
    const today = new Date();
    const cutoff = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const cutoffYear = cutoff.getFullYear();
    const cutoffMonth = cutoff.getMonth() + 1; // 1-indexed
    where.OR = [
      { year: { gt: cutoffYear } },
      { year: cutoffYear, month: { gte: cutoffMonth } },
    ];

    if (typeof payload.year === "number" && !Number.isNaN(payload.year)) {
      where.year = payload.year;
    }

    if (payload.quarter) {
      where.quarter = payload.quarter;
    }

    const search = payload.search?.trim();
    if (search) {
      const searchNumber = Number(search);
      const quarterSearch = parseQuarterSearch(search);
      const orFilters: Prisma.return_dueWhereInput[] = [];

      if (!Number.isNaN(searchNumber)) {
        orFilters.push(
          { year: searchNumber },
          { month: searchNumber },
          { payment: searchNumber },
          { filing: searchNumber },
        );
      }

      if (quarterSearch) {
        orFilters.push({ quarter: quarterSearch });
      }

      if (orFilters.length > 0) {
        where.AND = [{ OR: where.OR }, { OR: orFilters }];
        delete where.OR;
      }
    }

    const [result, total] = await Promise.all([
      prisma.return_due.findMany({
        where,
        orderBy: [{ year: "asc" }, { month: "asc" }, { id: "asc" }],
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.return_due.count({ where }),
    ]);

    return createPaginationResponse({
      message: "Return due dates fetched successfully",
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
      data: null,
      skip: payload.skip,
      take: payload.take,
      total: 0,
    });
  }
};

export default GetReturnDues;
