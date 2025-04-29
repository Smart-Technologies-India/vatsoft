"use server";
interface DvatTrackApplicationStatusPayload {
  dept: SelectOffice;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import { dvat04, registration, SelectOffice, user } from "@prisma/client";
import { DvatTrackApplicationStatusType } from "@/models/dashboard/regiser/track_application";

const DvatTrackApplicationStatus = async (
  payload: DvatTrackApplicationStatusPayload
): Promise<ApiResponseType<Array<DvatTrackApplicationStatusType> | null>> => {
  const functionname: string = DvatTrackApplicationStatus.name;
  try {
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        selectOffice: payload.dept,
        NOT: [
          {
            status: "NONE",
          },
          {
            status: "VERIFICATION",
          },
        ],
        deletedAt: null,
        deletedById: null,
      },

      select: {
        id: true,
        tempregistrationnumber: true,
        status: true,
        compositionScheme: true,
        createdAt: true,
        registration: {
          select: {
            dept_user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!dvat04response) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return {
      status: true,
      data: dvat04response,
      message: "dvat04 data get successfully",
      functionname: "GetAllDvat",
    };
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DvatTrackApplicationStatus;
