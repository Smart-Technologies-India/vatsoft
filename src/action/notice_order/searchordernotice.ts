"use server";

import { errorToString } from "@/utils/methods";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { FormType, order_notice, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchNoticeOrderPayload {
  userid?: number;
  fromdate?: Date;
  todate?: Date;
  period_year?: string;
  period_month?: string;
  dept?: SelectOffice;
  form_type?: FormType;
  tin?: string;
  tradename?: string;
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
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "SearchNoticeOrder",
      } as any;
    }

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
            ...(payload.tradename && {
              tradename: {
                contains: payload.tradename,
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
          ...(payload.period_year && payload.period_month && {
            returns_01: {
              year: payload.period_year,
              month: payload.period_month,
            },
          }),
        },
        include: {
          dvat: {
            select: {
              tinNumber: true,
              tradename: true,
            },
          },
          returns_01: {
            select: {
              year: true,
              month: true,
            },
          },
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
            ...(payload.tradename && {
              tradename: {
                contains: payload.tradename,
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
          ...(payload.period_year && payload.period_month && {
            returns_01: {
              year: payload.period_year,
              month: payload.period_month,
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
