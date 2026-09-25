"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { PurchaseType } from "@prisma/client";
import prisma from "../../../prisma/database";

export interface ReturnEntryWithRelations {
  id: number;
  urn_number: string;
  invoice_number: string;
  invoice_date: Date;
  total_invoice_number: string;
  amount: string | null;
  vatamount: string | null;
  tax_percent: string | null;
  quantity: number | null;
  description_of_goods: string | null;
  remarks: string | null;
  purchase_type: PurchaseType | null;
  seller_tin_number: {
    tin_number: string;
    name_of_dealer: string | null;
    state: string | null;
  };
  dvat: {
    id: number;
    tinNumber: string | null;
    tradename: string | null;
  };
}

export interface GroupedReturnEntry {
  purchase_type: PurchaseType;
  entries: ReturnEntryWithRelations[];
  total: number;
  totalAmount: string;
  totalVat: string;
}

export interface ReturnEntryByTypeResponse {
  cform: GroupedReturnEntry | null;
  fform: GroupedReturnEntry | null;
  export: GroupedReturnEntry | null;
  allData: ReturnEntryWithRelations[];
}

const GetReturnEntryByType = async (): Promise<
  ApiResponseType<ReturnEntryByTypeResponse | null>
> => {
  const functionname: string = GetReturnEntryByType.name;

  try {
    // Fetch all return entries with relations
    const allReturnEntries = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        purchase_type: {
          in: [
            PurchaseType.FORMC_CONCESSION,
            PurchaseType.STOCK_TRANSFER,
            PurchaseType.OUTSIDE_INDIA,
          ],
        },
      },
      include: {
        seller_tin_number: {
          select: {
            tin_number: true,
            name_of_dealer: true,
            state: true,
          },
        },
        returns_01: {
          include: {
            dvat04: {
              select: {
                id: true,
                tinNumber: true,
                tradename: true,
              },
            },
          },
        },
      },
    });

    // Transform and group data
    const transformedEntries: ReturnEntryWithRelations[] = allReturnEntries.map(
      (entry) => ({
        id: entry.id,
        urn_number: entry.urn_number,
        invoice_number: entry.invoice_number,
        invoice_date: entry.invoice_date,
        total_invoice_number: entry.total_invoice_number,
        amount: entry.amount,
        vatamount: entry.vatamount,
        tax_percent: entry.tax_percent,
        quantity: entry.quantity,
        description_of_goods: entry.description_of_goods,
        remarks: entry.remarks,
        purchase_type: entry.purchase_type,
        seller_tin_number: entry.seller_tin_number,
        dvat: entry.returns_01.dvat04,
      } as ReturnEntryWithRelations),
    );

    // Group by purchase type
    const cformEntries = transformedEntries.filter(
      (e) => e.purchase_type === PurchaseType.FORMC_CONCESSION,
    );
    const fformEntries = transformedEntries.filter(
      (e) => e.purchase_type === PurchaseType.STOCK_TRANSFER,
    );
    const exportEntries = transformedEntries.filter(
      (e) => e.purchase_type === PurchaseType.OUTSIDE_INDIA,
    );

    const calculateGroupStats = (entries: ReturnEntryWithRelations[]) => {
      const totalAmount = entries
        .reduce((sum, e) => sum + parseFloat(e.total_invoice_number || "0"), 0)
        .toFixed(2);
      const totalVat = entries
        .reduce((sum, e) => sum + parseFloat(e.vatamount || "0"), 0)
        .toFixed(2);

      return { totalAmount, totalVat };
    };

    const response: ReturnEntryByTypeResponse = {
      cform:
        cformEntries.length > 0
          ? {
              purchase_type: PurchaseType.FORMC_CONCESSION,
              entries: cformEntries,
              total: cformEntries.length,
              ...calculateGroupStats(cformEntries),
            }
          : null,
      fform:
        fformEntries.length > 0
          ? {
              purchase_type: PurchaseType.STOCK_TRANSFER,
              entries: fformEntries,
              total: fformEntries.length,
              ...calculateGroupStats(fformEntries),
            }
          : null,
      export:
        exportEntries.length > 0
          ? {
              purchase_type: PurchaseType.OUTSIDE_INDIA,
              entries: exportEntries,
              total: exportEntries.length,
              ...calculateGroupStats(exportEntries),
            }
          : null,
      allData: transformedEntries,
    };

    return createResponse({
      message: "Return entries fetched successfully",
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetReturnEntryByType;
