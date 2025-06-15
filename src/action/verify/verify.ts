"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { cform, dvat04, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface VerifyCFormPayload {
  search: string;
}

const VerifyCForm = async (
  payload: VerifyCFormPayload
): Promise<ApiResponseType<(cform & { dvat04: dvat04 }) | null>> => {
  const functionname: string = VerifyCForm.name;

  try {
    const cfrom_response = await prisma.cform.findFirst({
      where: {
        status: "ACTIVE",
        sr_no: payload.search,
        deletedAt: null,
      },
      include: {
        dvat04: true,
      },
    });

    if (!cfrom_response) {
      return createResponse({
        message: "No cform found",
        functionname,
        data: null,
      });
    }

    return createResponse({
      message: "Password generated Successful",
      functionname,
      data: cfrom_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default VerifyCForm;
