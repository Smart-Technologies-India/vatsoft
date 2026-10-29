"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { commodity_master, tin_number_master } from "@prisma/client";

interface GetTransportPermitDetailsPayload {
  invoiceNumber: string;
  invoiceDate: string;
  sellerTinNumber: string;
}

export type GroupedPurchaseItem = {
  count: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
  records: Array<{
    id: number;
    commodity_master: commodity_master;
    seller_tin_number: tin_number_master;
    quantity: number;
    tax_percent: string;
    amount: string;
    vatamount: string;
    urn_number: string | null;
    is_accept: boolean;
  }>;
};

const GetTransportPermitDetails = async (
  payload: GetTransportPermitDetailsPayload,
): Promise<PaginationResponse<GroupedPurchaseItem | null>> => {
  const functionname: string = GetTransportPermitDetails.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetTransportPermitDetails",
      } as any;
    }

    // Look up the tin_number_master ID using the TIN number
    const tinRecord = await prisma.tin_number_master.findFirst({
      where: {
        tin_number: payload.sellerTinNumber,
      },
    });

    if (!tinRecord) {
      return createPaginationResponse({
        message: "Seller TIN record not found.",
        functionname,
      });
    }

    const invoiceDate = new Date(payload.invoiceDate);
    const nextDay = new Date(invoiceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const purchaseRecords = await prisma.daily_purchase.findMany({
      where: {
        invoice_number: payload.invoiceNumber,
        invoice_date: {
          gte: invoiceDate,
          lt: nextDay,
        },
        seller_tin_numberId: tinRecord.id,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    if (!purchaseRecords || purchaseRecords.length === 0) {
      return createPaginationResponse({
        message: "No purchase details found for this transport permit.",
        functionname,
      });
    }

    const totalTaxableValue = purchaseRecords.reduce(
      (sum, record) => sum + parseFloat(record.amount),
      0,
    );
    const totalVatAmount = purchaseRecords.reduce(
      (sum, record) => sum + parseFloat(record.vatamount),
      0,
    );
    const totalInvoiceValue = purchaseRecords.reduce(
      (sum, record) =>
        sum + (parseFloat(record.amount) + parseFloat(record.vatamount)),
      0,
    );

    const groupedData: GroupedPurchaseItem = {
      count: purchaseRecords.length,
      totalTaxableValue,
      totalVatAmount,
      totalInvoiceValue,
      records: purchaseRecords.map((record) => ({
        id: record.id,
        commodity_master: record.commodity_master,
        seller_tin_number: record.seller_tin_number,
        quantity: record.quantity,
        tax_percent: record.tax_percent,
        amount: record.amount,
        vatamount: record.vatamount,
        urn_number: record.urn_number,
        is_accept: record.is_accept,
      })),
    };

    return createPaginationResponse({
      message: "Transport Permit details fetched successfully.",
      functionname,
      data: groupedData,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetTransportPermitDetails;
