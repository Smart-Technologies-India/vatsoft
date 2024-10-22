"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { FormType, order_notice, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchNoticeOrderPayload {
  fromdate?: Date;
  todate?: Date;
  dept: SelectOffice;
  form_type?: FormType;
}

const SearchNoticeOrder = async (
  payload: SearchNoticeOrderPayload
): Promise<ApiResponseType<Array<order_notice> | null>> => {
  const functionname: string = SearchNoticeOrder.name;

  try {
    const order_notice_response = await prisma.order_notice.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat: {
          selectOffice: payload.dept,
        },
        ...(payload.form_type && { form_type: payload.form_type }),
        ...(payload.fromdate &&
          payload.todate && {
            issue_date: {
              gte: payload.fromdate,
              lte: payload.todate,
            },
          }),
      },
    });
    console.log(order_notice_response);
    return createResponse({
      message: order_notice_response
        ? "Order Notice Get successfully"
        : "Unable to search Order Notice.",
      functionname: functionname,
      data: order_notice_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchNoticeOrder;
