"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../prisma/database";

interface DeletedInvoiceInfo {
  returns_01Id: number;
  total_invoice_number: number[];
  deleted_count: number;
}

interface DuplicateCleanupResult {
  total_groups: number;
  total_deleted: number;
  total_kept: number;
  deleted_invoices_by_return: DeletedInvoiceInfo[];
}

const FixReturns = async (): Promise<
  ApiResponseType<DuplicateCleanupResult>
> => {
  const functionname: string = FixReturns.name;

  try {
    // Find duplicate combinations using GROUP BY and HAVING at database level
    const duplicateCombinations = await prisma.$queryRaw<
      Array<{
        invoice_number: string;
        dvat_type: string;
        returns_01Id: number;
        total_invoice_number: string;
        commodity_masterId: number | null;
        urn_number: string;
        quantity: number | null;
        count: number;
      }>
    >`
      SELECT 
        invoice_number,
        dvat_type,
        returns_01Id,
        total_invoice_number,
        commodity_masterId,
        urn_number,
        quantity,
        COUNT(*) as count
      FROM returns_entry
      WHERE deletedAt IS NULL
      GROUP BY invoice_number, dvat_type, returns_01Id, total_invoice_number, commodity_masterId, urn_number, quantity
      HAVING COUNT(*) > 1
    `;

    if (duplicateCombinations.length === 0) {
      return createResponse({
        message: "No duplicate entries found",
        functionname,
        data: {
          total_groups: 0,
          total_deleted: 0,
          total_kept: 0,
          deleted_invoices_by_return: [],
        },
      });
    }

    // Fetch all duplicate record details
    const allDuplicateRecords = await prisma.$queryRaw<
      Array<{
        id: number;
        invoice_number: string;
        dvat_type: string;
        returns_01Id: number;
        total_invoice_number: string;
        commodity_masterId: number | null;
        urn_number: string;
        quantity: number | null;
      }>
    >`
      SELECT 
        id,
        invoice_number,
        dvat_type,
        returns_01Id,
        total_invoice_number,
        commodity_masterId,
        urn_number,
        quantity
      FROM returns_entry
      WHERE deletedAt IS NULL
      AND (invoice_number, dvat_type, returns_01Id, total_invoice_number, commodity_masterId, urn_number, quantity) IN (
        SELECT 
          invoice_number, dvat_type, returns_01Id, total_invoice_number, commodity_masterId, urn_number, quantity
        FROM returns_entry
        WHERE deletedAt IS NULL
        GROUP BY invoice_number, dvat_type, returns_01Id, total_invoice_number, commodity_masterId, urn_number, quantity
        HAVING COUNT(*) > 1
      )
      ORDER BY returns_01Id, invoice_number, dvat_type, total_invoice_number, commodity_masterId, urn_number, quantity, id
    `;

    // Group records by combination and identify which to delete
    const groupMap = new Map<
      string,
      Array<{ id: number; total_invoice_number: string; returns_01Id: number }>
    >();
    const idsToDelete: number[] = [];
    const deletedInvoicesByReturn = new Map<number, number[]>();

    allDuplicateRecords.forEach((record) => {
      const key = `${record.invoice_number}|${record.dvat_type}|${record.returns_01Id}|${record.total_invoice_number}|${record.commodity_masterId}|${record.urn_number}|${record.quantity}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }

      groupMap.get(key)!.push({
        id: record.id,
        total_invoice_number: record.total_invoice_number,
        returns_01Id: record.returns_01Id,
      });
    });

    // For each group, keep first and mark rest for deletion
    groupMap.forEach((records) => {
      for (let i = 1; i < records.length; i++) {
        const recordToDelete = records[i];
        idsToDelete.push(recordToDelete.id);

        // Track deleted invoice amounts by returns_01Id
        if (!deletedInvoicesByReturn.has(recordToDelete.returns_01Id)) {
          deletedInvoicesByReturn.set(recordToDelete.returns_01Id, []);
        }
        deletedInvoicesByReturn
          .get(recordToDelete.returns_01Id)!
          .push(parseFloat(recordToDelete.total_invoice_number));
      }
    });

    // Soft delete the duplicate records
    if (idsToDelete.length > 0) {
      await prisma.returns_entry.updateMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
        data: {
          deletedAt: new Date(),
          deletedById: 1, // Update with actual user ID if available
        },
      });
    }

    // Prepare result with deleted invoices grouped by returns_01Id
    const deleted_invoices_by_return: DeletedInvoiceInfo[] = Array.from(
      deletedInvoicesByReturn.entries()
    ).map(([returns_01Id, totalInvoiceNumbers]) => ({
      returns_01Id,
      total_invoice_number: totalInvoiceNumbers.sort((a, b) => a - b),
      deleted_count: totalInvoiceNumbers.length,
    }));

    return createResponse({
      message: `Cleaned up ${idsToDelete.length} duplicate records. Kept ${allDuplicateRecords.length - idsToDelete.length} records.`,
      functionname,
      data: {
        total_groups: groupMap.size,
        total_deleted: idsToDelete.length,
        total_kept: allDuplicateRecords.length - idsToDelete.length,
        deleted_invoices_by_return: deleted_invoices_by_return.sort(
          (a, b) => a.returns_01Id - b.returns_01Id
        ),
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default FixReturns;
