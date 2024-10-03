"use server";
interface AddTempRegNoPayload {
  id: number;
  tempregno: string;
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const AddTempRegNo = async (
  payload: AddTempRegNoPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = AddTempRegNo.name;

  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: parseInt(payload.id.toString()),
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvat04)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    const updateresponse = await prisma.dvat04.update({
      where: {
        id: dvat04.id,
        deletedAt: null,
        deletedById: null,
        status: "NONE",
      },
      data: {
        tempregistrationnumber: payload.tempregno,
        status: "PENDINGPROCESSING",
      },
    });

    if (!updateresponse)
      return createResponse({
        message: "Unable to add Temp registration number. Please try again.",
        functionname,
      });

    const createregistration = await prisma.registration.create({
      data: {
        dvat04Id: updateresponse.id,
        dept_user_id: 8,
        physicalVerification: false,
        createdById: payload.userid,
        status: "ACTIVE",
      },
    });
    if (!createregistration)
      return createResponse({
        message: "Unable to create registration. Please try again.",
        functionname,
      });

    return {
      status: true,
      data: dvat04,
      message: "dvat04 data get successfully",
      functionname: "AddTempRegNo",
    };
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddTempRegNo;
