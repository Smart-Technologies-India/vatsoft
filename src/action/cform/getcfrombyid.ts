"use server";
import { errorToString } from "@/utils/methods";
import { cform } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
interface GetUserCformPayload {
  id: number;
}

const GetCformById = async (
  payload: GetUserCformPayload
): Promise<ApiResponseType<cform | null>> => {
  const functionname: string = GetCformById.name;

  try {
    const cform_response = await prisma.cform.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        id: payload.id,
      },
    });

    if (!cform_response) {
      return createResponse({
        message: "No C-Form Data found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "C-Form Data get successfully",
      functionname,
      data: cform_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};
export default GetCformById;
