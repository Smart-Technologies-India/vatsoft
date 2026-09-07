"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  registration,
  returns_01,
  returns_entry,
  tin_number_master,
  user,
} from "@prisma/client";

interface GetReturnByIdPayload {
  returnId: number;
}

const GetReturnById = async (
  payload: GetReturnByIdPayload
): Promise<
  ApiResponseType<{
    returns_entry: Array<
      returns_entry & { seller_tin_number: tin_number_master }
    >;
    returns_01: returns_01 & {
      createdBy: user;
      dvat04: dvat04 & { registration: registration[] };
    };
  } | null>
> => {
  try {
    if (!payload.returnId) {
      return {
        status: false,
        data: null,
        message: "Return ID is required.",
        functionname: "GetReturnById",
      };
    }

    // Fetch return by ID
    const return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.returnId,
      },
      include: {
        createdBy: true,
        dvat04: {
          include: {
            registration: true,
          },
        },
      },
    });

    if (!return01response) {
      return {
        status: false,
        data: null,
        message: "Return not found. Please try again.",
        functionname: "GetReturnById",
      };
    }

    // Fetch return entries for this return
    const returnforms = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: return01response.id,
        status: "ACTIVE",
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
    });

    if (!returnforms) {
      return {
        status: false,
        data: null,
        message: "Unable to get return forms. Please try again.",
        functionname: "GetReturnById",
      };
    }

    return {
      status: true,
      data: {
        returns_entry: returnforms,
        returns_01: return01response,
      },
      message: "Return data fetched successfully",
      functionname: "GetReturnById",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetReturnById",
    };
    return response;
  }
};

export default GetReturnById;
