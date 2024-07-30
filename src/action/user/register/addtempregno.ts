"use server";
interface AddTempRegNoPayload {
  id: number;
  tempregno: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../../prisma/database";

const AddTempRegNo = async (
  payload: AddTempRegNoPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: parseInt(payload.id.toString()),
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvat04)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "AddTempRegNo",
      };

    const updateresponse = await prisma.dvat04.update({
      where: {
        id: dvat04.id,
        deletedAt: null,
        deletedById: null,
      },
      data: {
        tempregistrationnumber: payload.tempregno,
      },
    });

    if (!updateresponse)
      return {
        status: false,
        data: null,
        message: "Unable to add Temp registration number. Please try again.",
        functionname: "AddTempRegNo",
      };

    return {
      status: true,
      data: dvat04,
      message: "dvat04 data get successfully",
      functionname: "AddTempRegNo",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "AddTempRegNo",
    };
    return response;
  }
};

export default AddTempRegNo;
