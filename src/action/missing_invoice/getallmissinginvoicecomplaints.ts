"use server";

import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { errorToString } from "@/utils/methods";
import { MissingInvoiceComplaintWithCreator } from "@/models/missinginvoice";
import { MissingInvoiceStatus, MissingInvoiceType } from "@prisma/client";

interface GetAllMissingInvoiceComplaintsPayload {
  skip: number;
  take: number;
  status?: MissingInvoiceStatus;
  invoice_type?: MissingInvoiceType;
  search?: string;
}

const GetAllMissingInvoiceComplaints = async (
  payload: GetAllMissingInvoiceComplaintsPayload,
): Promise<
  PaginationResponse<Array<MissingInvoiceComplaintWithCreator> | null>
> => {
  const functionname = GetAllMissingInvoiceComplaints.name;

  try {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (payload.status) {
      where.status = payload.status;
    }

    if (payload.invoice_type) {
      where.invoice_type = payload.invoice_type;
    }

    if (payload.search && payload.search.trim().length > 0) {
      where.OR = [
        { invoice_number: { contains: payload.search.trim() } },
        { supplier_tin: { contains: payload.search.trim() } },
        { customer_tin_no: { contains: payload.search.trim() } },
        { customer_name: { contains: payload.search.trim() } },
      ];
    }

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
      data: null,
      skip: payload.skip,
      take: payload.take,
      total: 0,
    });
  }
};

export default GetAllMissingInvoiceComplaints;
