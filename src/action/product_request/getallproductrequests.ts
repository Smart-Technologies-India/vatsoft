"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { product_request } from "@prisma/client";

const GetAllProductRequests = async (): Promise<
  ApiResponseType<product_request[] | null>
> => {
  const functionname: string = GetAllProductRequests.name;

  try {
    const product_requests = await prisma.product_request.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobileOne: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: true,
      message: "Product requests fetched successfully",
      functionname: functionname,
      data: product_requests,
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

export default GetAllProductRequests;
