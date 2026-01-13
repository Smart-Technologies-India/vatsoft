"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

const GetUserDvat04FirstStock = async (): Promise<
  ApiResponseType<dvat04 | null>
> => {
  const functionname: string = GetUserDvat04FirstStock.name;

  try {
    const dvatid = await getCurrentDvatId();

    if (dvatid == null || dvatid == undefined) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: dvatid,
      },
    });
    if (!dvat04response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: dvat04response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserDvat04FirstStock;
