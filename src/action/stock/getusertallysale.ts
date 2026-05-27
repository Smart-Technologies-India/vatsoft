"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  tally_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentDvatId } from "@/lib/auth";

interface GetUserTallySalePayload {
  take: number;
  skip: number;
  
}

export type GroupedTallySale = {
  invoice_number: string;
  invoice_date: Date;
  seller_tin_id: number;
  seller_tin_number: tin_number_master;
  records: Array<
    tally_sale & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  >;
  count: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
};

const GetUserTallySale = async (
  payload: GetUserTallySalePayload,
): Promise<PaginationResponse<Array<GroupedTallySale> | null>> => {
  const functionname: string = GetUserTallySale.name;

  try {
    const dvatId = await getCurrentDvatId();
    if (!dvatId) {
      return createPaginationResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    const tally_sale_response = await prisma.tally_sale.findMany({
      where: {
        status: "ACTIVE",
        dvat04Id: dvatId,
        is_converted: false,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    if (!tally_sale_response) {
      return createPaginationResponse({
        message: "No tally sale found. Please try again.",
        functionname,
      });
    }

    const groupedMap = new Map<string, GroupedTallySale>();

    tally_sale_response.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count++;
        existing.totalTaxableValue +=
          parseFloat(record.amount);
        existing.totalVatAmount += parseFloat(record.vatamount);
        existing.totalInvoiceValue +=
          parseFloat(record.amount) + parseFloat(record.vatamount);
      } else {
        groupedMap.set(key, {
          invoice_number: record.invoice_number,
          invoice_date: record.invoice_date,
          seller_tin_id: record.seller_tin_numberId,
          seller_tin_number: record.seller_tin_number,
          records: [record],
          count: 1,
          totalTaxableValue: parseFloat(record.amount),
          totalVatAmount: parseFloat(record.vatamount),
          totalInvoiceValue: parseFloat(record.amount) + parseFloat(record.vatamount),
        });
      }
    });

    const groupedArray = Array.from(groupedMap.values());
    const totalCount = groupedArray.length;

    const paginatedArray = groupedArray.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    return createPaginationResponse({
      message: "Tally sale data retrieved successfully",
      functionname,
      data: paginatedArray,
      allData: groupedArray,
      take: payload.take,
      skip: payload.skip,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserTallySale;
