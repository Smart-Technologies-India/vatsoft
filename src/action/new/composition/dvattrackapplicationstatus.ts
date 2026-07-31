"use server";
interface DvatTrackApplicationStatusPayload {
  dept: SelectOffice;
  searchArn?: string;
  searchTradeName?: string;
  take?: number;
  skip?: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import { DvatTrackApplicationStatusType } from "@/models/dashboard/regiser/track_application";
import { SelectOffice } from "@prisma/client";

const DvatTrackApplicationStatus = async (
  payload: DvatTrackApplicationStatusPayload
): Promise<ApiResponseType<Array<DvatTrackApplicationStatusType> | null>> => {
  const functionname: string = DvatTrackApplicationStatus.name;
  try {
    const where: any = {
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
    };

    if (payload.searchArn) {
      where.tempregistrationnumber = {
        contains: payload.searchArn,
        mode: "insensitive",
      };
    }

    if (payload.searchTradeName) {
      where.tinNumber = {
        contains: payload.searchTradeName,
        mode: "insensitive",
      };
    }

    const dvat04response = await prisma.dvat04.findMany({
      where,
      select: {
        id: true,
        tempregistrationnumber: true,
        contact_one: true,
        status: true,
        compositionScheme: true,
        createdAt: true,
        tinNumber: true,
        tradename: true,
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
      take: payload.take || 10,
      skip: payload.skip || 0,
    });

    if (!dvat04response) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return {
      status: true,
      data: dvat04response as DvatTrackApplicationStatusType[],
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
