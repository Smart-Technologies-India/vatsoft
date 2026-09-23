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
import { getCurrentDvatId } from "@/lib/auth";

interface getPdfReturnPayload {
  month: string;
  year: string;
}

const getPdfReturn = async (
  payload: getPdfReturnPayload,
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
    const dvatid = await getCurrentDvatId();

    if (dvatid == null || dvatid == undefined) {
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "getPdfReturn",
      };
    }

    // Optimize: Combine dvat04 fetch with returns_01 in a single query using OR
    console.log("first call time start");
    const firstCallStartTime = new Date();
    const return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: dvatid,
        year: payload.year,
        month: payload.month,
        OR: [{ return_type: "REVISED" }, { return_type: "ORIGINAL" }],
      },
      orderBy: {
        return_type: "desc", // REVISED comes before ORIGINAL
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
    console.log(
      "first call time end",
      new Date().getTime() - firstCallStartTime.getTime(),
    );

    if (!return01response) {
      return {
        status: false,
        data: null,
        message: "User is not completed any return form. Please try again.",
        functionname: "getPdfReturn",
      };
    }

    // Optimize: Fetch returns_entry with only necessary relations
    console.log("second call time start");
    const secondCallStartTime = new Date();
    const returnforms = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: return01response.id,
        status: "ACTIVE",
      },
      include: {
        seller_tin_number: true,
      },
    });
    console.log(
      "second call time end",
      new Date().getTime() - secondCallStartTime.getTime(),
    );

    if (!returnforms || returnforms.length === 0)
      return {
        status: false,
        data: null,
        message: "Unable to get return forms. Please try again.",
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
