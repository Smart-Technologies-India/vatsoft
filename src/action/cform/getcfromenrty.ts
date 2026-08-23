"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { cform, returns_entry } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
interface GetCformEntryPayload {
  id: number;
}

interface CformReturnData {
  id: number;
  description_of_goods: string | null;
  returns_entry: returns_entry;
}

const GetCformEntry = async (
  payload: GetCformEntryPayload
): Promise<ApiResponseType<CformReturnData[] | null>> => {
  const functionname: string = GetCformEntry.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetCformEntry",
      } as any;
    }

    const cform_response = await prisma.cform_returns.findMany({
      where: {
        cformId: payload.id,
      },
      include: {
        returns_entry: true,
      },
    });

    if (!cform_response) {
      return createResponse({
        message: "No C-Form return entry found. Please try again.",
        functionname,
      });
    }

    const returnData = cform_response.map((item) => ({
      id: item.id,
      description_of_goods: item.description_of_goods,
      returns_entry: item.returns_entry,
    }));

    return createResponse({
      message: "C-Form Data get successfully",
      functionname,
      data: returnData,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};
export default GetCformEntry;
