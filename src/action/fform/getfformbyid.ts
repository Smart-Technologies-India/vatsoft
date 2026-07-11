"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { fform } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
interface GetFformByIdPayload {
  id: number;
}

const GetFformById = async (
  payload: GetFformByIdPayload
): Promise<ApiResponseType<fform | null>> => {
  const functionname: string = GetFformById.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetFformById",
      } as any;
    }

    const fform_response = await prisma.fform.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        id: payload.id,
      },
    });

    if (!fform_response) {
      return createResponse({
        message: "No F-Form Data found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "F-Form Data get successfully",
      functionname,
      data: fform_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};
export default GetFformById;
