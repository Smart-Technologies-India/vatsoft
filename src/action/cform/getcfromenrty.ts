"use server";
import { errorToString } from "@/utils/methods";
import { cform, returns_entry } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
interface GetCformEntryPayload {
  id: number;
}

const GetCformEntry = async (
  payload: GetCformEntryPayload
): Promise<ApiResponseType<returns_entry[] | null>> => {
  const functionname: string = GetCformEntry.name;

  try {
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

    const returnEntries = cform_response.map((item) => item.returns_entry);

    return createResponse({
      message: "C-Form Data get successfully",
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
export default GetCformEntry;
