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
  tax_period_year?: string;
  tax_period_month?: string;
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

    // Calculate date range for month filtering
    let monthStartDate: Date | undefined;
    let monthEndDate: Date | undefined;
    
    if (payload.tax_period_year && payload.tax_period_month) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = monthNames.indexOf(payload.tax_period_month);
      const year = parseInt(payload.tax_period_year);
      
      if (monthIndex !== -1) {
        monthStartDate = new Date(year, monthIndex, 1);
        monthEndDate = new Date(year, monthIndex + 1, 0);
      }
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
          ...(monthStartDate && monthEndDate && {
            AND: [
              {
                tax_period_from: {
                  lte: monthEndDate,
                },
              },
              {
                tax_period_to: {
                  gte: monthStartDate,
                },
              },
            ],
          }),
        },
        include: {
          dvat: {
            select: {
              frequencyFilings: true,
              tinNumber: true,
              tradename: true,
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
          ...(monthStartDate && monthEndDate && {
            AND: [
              {
                tax_period_from: {
                  lte: monthEndDate,
                },
              },
              {
                tax_period_to: {
                  gte: monthStartDate,
                },
              },
            ],
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
