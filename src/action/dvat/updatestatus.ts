"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { dvat04, DvatStatus } from "@prisma/client";

interface UpdateDvatStatusPayload {
  id: number;
  updatedby: number;
  status: DvatStatus;
  tinNumber?: string;
}

const UpdateDvatStatus = async (
  payload: UpdateDvatStatusPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = UpdateDvatStatus.name;
  
  try {
    const is_exist = await prisma.dvat04.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!is_exist)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    let tin_master_id: number = 1;

    if (payload.tinNumber) {
      const tin_master = await prisma.tin_number_master.create({
        data: {
          name_of_dealer: is_exist.tradename ?? "",
          tin_number: payload.tinNumber,
          status: "ACTIVE",
        },
      });

      if (!tin_master) {
        return createResponse({
          message: "Unable to create tin number. Please try again.",
          functionname,
        });
      }
      tin_master_id = tin_master.id;
    }

    const dvatresponse = await prisma.dvat04.update({
      where: {
        id: is_exist.id,
      },

      data: {
        status: payload.status,
        updatedById: payload.updatedby,
        ...(payload.tinNumber && { tinNumber: payload.tinNumber }),
        ...(payload.tinNumber && { tin_master_id: tin_master_id }),
      },
    });

    if (!dvatresponse)
      return createResponse({
        message: "Dvat update failed. Please try again.",
        functionname,
      });

    return createResponse({
      data: dvatresponse,
      message: "Dvat status updated successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateDvatStatus;
