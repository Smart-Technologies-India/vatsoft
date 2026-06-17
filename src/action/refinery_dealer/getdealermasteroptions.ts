"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { DealerOption } from "./types";

const GetRefineryDealerOptions = async (): Promise<
  ApiResponseType<DealerOption[] | null>
> => {
  const functionname = GetRefineryDealerOptions.name;

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

    const dealers = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        status: "APPROVED",
      },
      select: {
        id: true,
        tradename: true,
        name: true,
        commodity: true,
        tin_master: {
          select: {
            tin_number: true,
          },
        },
      },
      orderBy: [{ tradename: "asc" }, { id: "asc" }],
    });


    const options: DealerOption[] = dealers
      .filter((item) => item.tin_master?.tin_number)
      .map((item) => ({
        id: item.id,
        tinNumber: item.tin_master.tin_number,
        tradeName: item.tradename || "",
        dealerName: item.name || "",
        commodity: item.commodity || null,
      }));

    return createResponse({
      message: "Dealer options fetched successfully.",
      functionname,
      data: options,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetRefineryDealerOptions;
