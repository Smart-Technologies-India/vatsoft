"use server";
interface DeleteAnx2Payload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure2 } from "@prisma/client";
import prisma from "../../../prisma/database";

const DeleteAnx2 = async (
  payload: DeleteAnx2Payload
): Promise<ApiResponseType<annexure2 | null>> => {
  try {
    const anx2response = await prisma.annexure2.delete({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!anx2response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "DeleteAnx2",
      };

    return {
      status: true,
      data: anx2response,
      message: "ANNEXURE 2 data deleted successfully",
      functionname: "DeleteAnx2",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "DeleteAnx2",
    };
    return response;
  }
};

export default DeleteAnx2;
