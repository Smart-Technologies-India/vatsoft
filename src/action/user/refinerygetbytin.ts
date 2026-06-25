"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface RefineryGetByTinPayload {
  tin_number: string;
}

export interface RefineryTinOption {
  id: number;
  name: string;
}

const RefineryGetByTin = async (
  payload: RefineryGetByTinPayload,
): Promise<ApiResponseType<RefineryTinOption[]>> => {
  const functionname = RefineryGetByTin.name;

  try {
    const tinNumber = payload.tin_number.trim();

    if (!tinNumber) {
      return createResponse({
        functionname,
        message: "Enter valid TIN number.",
      });
    }

    const refineries = await prisma.refinery.findMany({
      where: {
        OR: [
          { status: "APPROVED" },
          { status: "VERIFICATION" },
          { status: "PENDINGPROCESSING" },
        ],
        deletedAt: null,
        tinNumber,
      },
      select: {
        id: true,
        name: true,
        tradename: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (refineries.length === 0) {
      return createResponse({
        functionname,
        message: "No refinery account found for this TIN number.",
      });
    }

    const options: RefineryTinOption[] = refineries.map((item) => ({
      id: item.id,
      name: item.name?.trim() || item.tradename?.trim() || `Refinery ${item.id}`,
    }));

    return createResponse({
      functionname,
      message: "Refinery account list fetched successfully.",
      data: options,
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default RefineryGetByTin;