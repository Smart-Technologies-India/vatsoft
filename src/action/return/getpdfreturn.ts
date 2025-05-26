"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  registration,
  returns_01,
  returns_entry,
  state,
  tin_number_master,
  user,
} from "@prisma/client";
import { cookies } from "next/headers";

interface getPdfReturnPayload {
  userid: number;
  month: string;
  year: string;
}

const getPdfReturn = async (
  payload: getPdfReturnPayload
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

    const dvatid = cookies().get("dvat")?.value;
    if (!dvatid) {
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again",
        functionname: "getPdfReturn",
      };
    }

    console.log("dvatid", dvatid);


    const dvat04resonse = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: parseInt(dvatid),
        // createdById: payload.userid,
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

    let return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: dvat04resonse.id,
        year: payload.year,
        month: payload.month,
        return_type: "REVISED",
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
      return01response = await prisma.returns_01.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat04Id: dvat04resonse.id,
          year: payload.year,
          month: payload.month,
          return_type: "ORIGINAL",
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
    }


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
        status: "ACTIVE",
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
