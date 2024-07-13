"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01, returns_entry } from "@prisma/client";

interface getPdfReturnPayload {
  userid: number;
  month: string;
  year: string;
}

const getPdfReturn = async (
  payload: getPdfReturnPayload
): Promise<
  ApiResponseType<{
    returns_entry: returns_entry[];
    returns_01: returns_01;
  } | null>
> => {
  try {
    const dvat04resonse = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        createdById: payload.userid,
      },
    });

    if (!dvat04resonse) {
      return {
        status: false,
        data: null,
        message: "User is not register yet. Please try again.",
        functionname: "getPdfReturn",
      };
    }

    const return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: dvat04resonse.id,
        year: payload.year,
        month: payload.month,
      },
      include: {
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
        message: "User is not completed any return form. Please try again.",
        functionname: "getPdfReturn",
      };
    }

    const returnforms = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: return01response.id,
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
    });

    if (!returnforms)
      return {
        status: false,
        data: null,
        message: "Unable to get return froms. Please try again.",
        functionname: "getPdfReturn",
      };

    return {
      status: true,
      data: {
        returns_entry: returnforms,
        returns_01: return01response,
      },
      message: "Returns forms data get successfully",
      functionname: "getPdfReturn",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "getPdfReturn",
    };
    return response;
  }
};

export default getPdfReturn;
