"use server";

import { errorToString } from "@/utils/methods";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { FormType, order_notice, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchNoticeOrderPayload {
  userid?: number;
  fromdate?: Date;
  todate?: Date;
  dept?: SelectOffice;
  form_type?: FormType;
  tin?: string;
  order?: string;
  dvatid?: number;
  skip: number;
  take: number;
}

const SearchNoticeOrder = async (
  payload: SearchNoticeOrderPayload
): Promise<PaginationResponse<Array<order_notice> | null>> => {
  const functionname: string = SearchNoticeOrder.name;

  try {
    const [order_notice_response, totalCount] = await Promise.all([
      prisma.order_notice.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat: {
            ...(payload.userid && { createdById: payload.userid }),
            ...(payload.dvatid && { id: payload.dvatid }),
            ...(payload.dept && { selectOffice: payload.dept }),
            ...(payload.tin && {
              tinNumber: {
                contains: payload.tin,
              },
            }),
            deletedAt: null,
            deletedById: null,
          },
          ...(payload.order && {
            ref_no: {
              contains: payload.order,
            },
          }),
          ...(payload.form_type && { form_type: payload.form_type }),
          ...(payload.fromdate &&
            payload.todate && {
              issue_date: {
                gte: payload.fromdate,
                lte: payload.todate,
              },
            }),
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.order_notice.count({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat: {
            ...(payload.userid && { createdById: payload.userid }),
            ...(payload.dvatid && { id: payload.dvatid }),
            ...(payload.dept && { selectOffice: payload.dept }),
            ...(payload.tin && {
              tinNumber: {
                contains: payload.tin,
              },
            }),
            deletedAt: null,
            deletedById: null,
          },
          ...(payload.order && {
            ref_no: {
              contains: payload.order,
            },
          }),
          ...(payload.form_type && { form_type: payload.form_type }),
          ...(payload.fromdate &&
            payload.todate && {
              issue_date: {
                gte: payload.fromdate,
                lte: payload.todate,
              },
            }),
        },
      }),
    ]);

    return createPaginationResponse({
      message: order_notice_response
        ? "Order Notice Get successfully"
        : "Unable to search Order Notice.",
      functionname: functionname,
      data: order_notice_response ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchNoticeOrder;
