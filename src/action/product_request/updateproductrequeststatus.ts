"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { getCurrentUserId } from "@/lib/auth";
import { ProductRequest } from "@prisma/client";

interface UpdateProductRequestStatusProps {
  id: number;
  status: ProductRequest;
}

const UpdateProductRequestStatus = async (
  data: UpdateProductRequestStatusProps
): Promise<ApiResponseType<null>> => {
  const functionname: string = UpdateProductRequestStatus.name;

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
        status: data.status,
        updatedById: userId,
      },
    });

    if (!product_request) {
      return {
        status: false,
        message: "Failed to update product request status",
        functionname: functionname,
        data: null,
      };
    }

    return {
      status: true,
      message: "Product request status updated successfully",
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

export default UpdateProductRequestStatus;
