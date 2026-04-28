"use server";

import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { errorToString } from "@/utils/methods";
import { MissingInvoiceComplaintWithCreator } from "@/models/missinginvoice";

interface GetUserMissingInvoiceComplaintsPayload {
  dvatid: number;
  skip: number;
  take: number;
}

const GetUserMissingInvoiceComplaints = async (
  payload: GetUserMissingInvoiceComplaintsPayload,
): Promise<
  PaginationResponse<Array<MissingInvoiceComplaintWithCreator> | null>
> => {
  const functionname = GetUserMissingInvoiceComplaints.name;

  try {
    const where = {
      deletedAt: null,
      dvat04Id: payload.dvatid,
    };

    const [complaints, total] = await Promise.all([
      prisma.missing_invoice_complaint.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileOne: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.missing_invoice_complaint.count({ where }),
    ]);

    return createPaginationResponse({
      message: "Missing invoice complaints fetched successfully",
      functionname,
      data: complaints,
      skip: payload.skip,
      take: payload.take,
      total,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};
export default GetUserMissingInvoiceComplaints;
