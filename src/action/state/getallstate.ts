"use server";
interface GetAllStatePayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { state } from "@prisma/client";

const GetAllState = async (
  payload: GetAllStatePayload
): Promise<ApiResponseType<state[] | null>> => {
  try {
    const allstates = await prisma.state.findMany({
      where: {
        deletedAt: null,
      },
    });

    if (!allstates)
      return {
        status: false,
        data: null,
        message: "Unable to get state. Please try again.",
        functionname: "GetAllState",
      };

    return {
      status: true,
      data: allstates,
      message: "State data get successfully",
      functionname: "GetAllState",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAllState",
    };
    return response;
  }
};

export default GetAllState;
