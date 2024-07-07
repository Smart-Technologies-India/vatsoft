"use server";
interface SearchTinPayload {
  tinumber: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const SearchTin = async (
  payload: SearchTinPayload
): Promise<ApiResponseType<tin_number_master | null>> => {
  try {
    const tinuser = await prisma.tin_number_master.findFirst({
      where: {
        tin_number: payload.tinumber.toString(),
        status: "ACTIVE",
      },
    });

    if (!tinuser)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "SearchTin",
      };

    return {
      status: true,
      data: tinuser,
      message: "Tin user data get successfully",
      functionname: "SearchTin",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "SearchTin",
    };
    return response;
  }
};

export default SearchTin;
