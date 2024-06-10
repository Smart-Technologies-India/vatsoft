"use server";
interface DeleteAnx1Payload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure1 } from "@prisma/client";
import prisma from "../../../prisma/database";

const DeleteAnx1 = async (
  payload: DeleteAnx1Payload
): Promise<ApiResponseType<annexure1 | null>> => {
  try {
    const anx1response = await prisma.annexure1.delete({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!anx1response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "DeleteAnx1",
      };

    return {
      status: true,
      data: anx1response,
      message: "ANNEXURE 1 data deleted successfully",
      functionname: "DeleteAnx1",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "DeleteAnx1",
    };
    return response;
  }
};

export default DeleteAnx1;
