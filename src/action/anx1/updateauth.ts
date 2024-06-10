"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { annexure1 } from "@prisma/client";

interface Anx1UpdatePayload {
  id: number;
  auth: boolean;
}

const Anx1Update = async (
  payload: Anx1UpdatePayload
): Promise<ApiResponseType<annexure1 | null>> => {
  try {
    const isExist = await prisma.annexure1.findFirst({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!isExist)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "Anx1Create",
      };

    const annexure1response = await prisma.annexure1.update({
      where: {
        id: isExist.id,
      },

      data: {
        isAuthorisedSignatory: payload.auth,
      },
    });

    if (!annexure1response)
      return {
        status: false,
        data: null,
        message: "Annexure 1 update failed. Please try again.",
        functionname: "Anx1Update",
      };

    return {
      status: true,
      data: annexure1response,
      message: "Annexure 1 updated successfully",
      functionname: "Anx1Update",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Anx1Update",
    };
    return response;
  }
};

export default Anx1Update;
