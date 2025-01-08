"use server";
interface CreateTinNumberPayload {
  tinumber: string;
  name: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { tin_number_master, user } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateTinNumber = async (
  payload: CreateTinNumberPayload
): Promise<ApiResponseType<tin_number_master | null>> => {
  const functionname: string = CreateTinNumber.name;

  try {
    const tin_response = await prisma.tin_number_master.create({
      data: {
        tin_number: payload.tinumber,
        name_of_dealer: payload.name,
        status: "ACTIVE",
      },
    });

    if (!tin_response)
      return createResponse({
        message: "TIN Number Master not found. Please try again.",
        functionname,
      });

    return createResponse({
      message: "TIN Number Master data get successfully",
      functionname,
      data: tin_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateTinNumber;
