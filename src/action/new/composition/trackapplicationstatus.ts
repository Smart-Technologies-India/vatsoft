"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import { TrackApplilcationStatusType } from "@/models/dashboard/regiser/track_application";

interface TrackApplilcationStatusPayload {
  dvatid?: number;
  searchArn?: string;
  searchTradeName?: string;
  take?: number;
  skip?: number;
}

const TrackApplilcationStatus = async (
  payload: TrackApplilcationStatusPayload
): Promise<ApiResponseType<Array<TrackApplilcationStatusType> | null>> => {
  const functionname: string = TrackApplilcationStatus.name;

  try {
    const where: any = {
      deletedAt: null,
      deletedById: null,
      ...(payload.dvatid && { dvatid: payload.dvatid }),
    };

    if (payload.searchArn) {
      where.arn = {
        contains: payload.searchArn,
        mode: "insensitive",
      };
    }

    const composition_response = await prisma.composition.findMany({
      where,
      select: {
        id: true,
        arn: true,
        status: true,
        compositionScheme: true,
        createdAt: true,
        dvatid: true,
        dvat: {
          select: {
            tinNumber: true,
            tradename: true,
          },
        },
        dept_user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: payload.take || 10,
      skip: payload.skip || 0,
    });

    return createResponse({
      message: composition_response
        ? "Composition Get successfully"
        : "Unable to get composition.",
      functionname: functionname,
      data: (composition_response ?? null) as TrackApplilcationStatusType[] | null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default TrackApplilcationStatus;
