"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { getCurrentUserId } from "@/lib/auth";

interface DeleteProductRequestProps {
  id: number;
}

const DeleteProductRequest = async (
  data: DeleteProductRequestProps
): Promise<ApiResponseType<null>> => {
  const functionname: string = DeleteProductRequest.name;

  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: false,
      message: "User not found. Please login again.",
      functionname: functionname,
      data: null,
    };
  }

  try {
    const product_request = await prisma.product_request.update({
      where: {
        id: data.id,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    if (!product_request) {
      return {
        status: false,
        message: "Failed to delete product request",
        functionname: functionname,
        data: null,
      };
    }

    return {
      status: true,
      message: "Product request deleted successfully",
      functionname: functionname,
      data: null,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
      functionname: functionname,
      data: null,
    };
  }
};

export default DeleteProductRequest;
