"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserDailySalePayload {
  dvatid: number;
  take: number;
  skip: number;
}

export type GroupedDailySale = {
  invoice_number: string;
  invoice_date: Date;
  seller_tin_id: number;
  seller_tin_number: tin_number_master;
  records: Array<daily_sale & {
    commodity_master: commodity_master;
    seller_tin_number: tin_number_master;
  }>;
  count: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
};

const GetUserDailySale = async (
  payload: GetUserDailySalePayload
): Promise<
  PaginationResponse<Array<GroupedDailySale> | null>
> => {
  const functionname: string = GetUserDailySale.name;

  try {
    const daily_sale_response = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_31: false,
        dvat04Id: payload.dvatid,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [
        { invoice_date: 'desc' },
        { invoice_number: 'desc' },
      ],
    });

    if (!daily_sale_response) {
      return createPaginationResponse({
        message: "No Daily sale found. Please try again.",
        functionname,
      });
    }

    // Group records by invoice_number, invoice_date, and seller_tin_id
    const groupedMap = new Map<string, GroupedDailySale>();


    daily_sale_response.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;
      
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count++;
        existing.totalTaxableValue += parseFloat(record.amount_unit) * record.quantity;
        existing.totalVatAmount += parseFloat(record.vatamount);
        existing.totalInvoiceValue += parseFloat(record.amount_unit) * record.quantity + parseFloat(record.vatamount);
      } else {
        groupedMap.set(key, {
          invoice_number: record.invoice_number,
          invoice_date: record.invoice_date,
          seller_tin_id: record.seller_tin_numberId,
          seller_tin_number: record.seller_tin_number,
          records: [record],
          count: 1,
          totalTaxableValue: parseFloat(record.amount_unit) * record.quantity,
          totalVatAmount: parseFloat(record.vatamount),
          totalInvoiceValue: parseFloat(record.amount_unit) * record.quantity + parseFloat(record.vatamount),
        });
      }
    });

    const groupedArray = Array.from(groupedMap.values());
    const totalCount = groupedArray.length;

    // Apply pagination to grouped results
    const paginatedGroups = groupedArray.slice(
      payload.skip,
      payload.skip + payload.take
    );

    return createPaginationResponse({
      message: "All Daily sale Data get successfully",
      functionname,
      data: paginatedGroups,
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

export default GetUserDailySale;
