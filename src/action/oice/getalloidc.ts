"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetAllOIDCPayload {}

const GetAllOIDC = async (
  payload: GetAllOIDCPayload
): Promise<ApiResponseType<refunds[] | null>> => {
  const functionname: string = GetAllOIDC.name;

  try {
    const refunds_response = await prisma.refunds.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    return createResponse({
      message: refunds_response
        ? "All OIDC Data Get  successfully"
        : "Unable to get OIDC Data.",
      functionname: functionname,
      data: refunds_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllOIDC;
