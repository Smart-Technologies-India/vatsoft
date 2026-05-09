"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { Prisma, ProductRequest } from "@prisma/client";

interface GetAllProductRequestsPayload {
  productName?: string;
  status?: ProductRequest;
}

const GetAllProductRequests = async (
  payload?: GetAllProductRequestsPayload
): Promise<
  ApiResponseType<
    Prisma.product_requestGetPayload<{
      include: {
        requestedBy: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            mobileOne: true;
            email: true;
          };
        };
        createdBy: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
          };
        };
      };
    }>[] | null
  >
> => {
  const functionname: string = GetAllProductRequests.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAllProductRequests",
      } as any;
    }

    const normalizedProductName = payload?.productName?.trim();

    const product_requests = await prisma.product_request.findMany({
      where: {
        deletedAt: null,
        ...(normalizedProductName
          ? {
              product_name: {
                contains: normalizedProductName,
              },
            }
          : {}),
        ...(payload?.status
          ? {
              status: payload.status,
            }
          : {}),
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
