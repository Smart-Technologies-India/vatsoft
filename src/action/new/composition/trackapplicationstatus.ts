"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import { TrackApplilcationStatusType } from "@/models/dashboard/regiser/track_application";

interface TrackApplilcationStatusPayload {
  dvatid?: number;
}

const TrackApplilcationStatus = async (
  payload: TrackApplilcationStatusPayload
): Promise<ApiResponseType<Array<TrackApplilcationStatusType> | null>> => {
  const functionname: string = TrackApplilcationStatus.name;

  try {
    const composition_response = await prisma.composition.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        ...(payload.dvatid && { dvatid: payload.dvatid }),
      },
      select: {
        id: true,
        arn: true,
        status: true,
        compositionScheme: true,
        createdAt: true,
        dept_user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return createResponse({
      message: composition_response
        ? "Composition Get successfully"
        : "Unable to get composition.",
      functionname: functionname,
      data: composition_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default TrackApplilcationStatus;
