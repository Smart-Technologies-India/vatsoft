"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { fform, returns_entry } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
interface GetFformEntryPayload {
  id: number;
}

const GetFformEntry = async (
  payload: GetFformEntryPayload
): Promise<ApiResponseType<returns_entry[] | null>> => {
  const functionname: string = GetFformEntry.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetFformEntry",
      } as any;
    }

    const fform_response = await prisma.fform_returns.findMany({
      where: {
        fformId: payload.id,
      },
      include: {
        returns_entry: true,
      },
    });

    if (!fform_response) {
      return createResponse({
        message: "No F-Form return entry found. Please try again.",
        functionname,
      });
    }

    const returnEntries = fform_response.map((item) => item.returns_entry);

    return createResponse({
      message: "F-Form Data get successfully",
      functionname,
      data: returnEntries,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};
export default GetFformEntry;
