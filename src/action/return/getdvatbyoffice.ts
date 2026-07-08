"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  returns_01,
  dvat04,
  registration,
  SelectOffice,
  first_stock,
  DvatStatus,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";

interface GetDvatByOfficePayload {
  selectOffice?: SelectOffice;
  userRole?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

interface GetDvatByOfficeResponse {
  data: (dvat04 & { first_stock: first_stock[] })[];
  total: number;
  page: number;
  pageSize: number;
}

const GetDvatByOffice = async (
  payload: GetDvatByOfficePayload
): Promise<ApiResponseType<GetDvatByOfficeResponse | null>> => {
  const functionname: string = GetDvatByOffice.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetDvatByOffice",
      } as any;
    }

    const page = payload.page ?? 1;
    const pageSize = payload.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const search = payload.search?.trim() || "";

    // Build where clause based on user role
    const whereClause: any = {
      deletedAt: null,
      deletedBy: null,
      ...(payload.selectOffice && { selectOffice: payload.selectOffice }),
    };

    if (payload.userRole === "ADMIN") {
      whereClause.status = "APPROVED" as DvatStatus;
    } else {
      whereClause.OR = [
        { status: "PENDINGPROCESSING" as DvatStatus },
        { status: "VERIFICATION" as DvatStatus },
        { status: "APPROVED" as DvatStatus },
      ];
    }

    // Add search filter if provided
    if (search) {
      whereClause.AND = [
        {
          OR: [
            { tinNumber: { contains: search } },
            { tradename: { contains: search } },
            { contact_one: { contains: search } },
          ],
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.dvat04.count({
      where: whereClause,
    });

    let dvat_response = await prisma.dvat04.findMany({
      where: whereClause,
      include: {
        first_stock: {
          where: {
            deletedAt: null,
            deletedBy: null,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: {
        status: "asc",
      },
    });

    return createResponse({
      message: "DVAT data get successfully",
      functionname,
      data: {
        data: dvat_response,
        total,
        page,
        pageSize,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvatByOffice;
