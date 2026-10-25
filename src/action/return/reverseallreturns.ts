"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "../../../prisma/database";

export async function reverseAllReturns(returns01Id: number) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    // Get all return entries for this filing
    const returnsEntries = await prisma.returns_entry.findMany({
      where: {
        returns_01Id: returns01Id,
        deletedAt: null,
      },
    });

    if (returnsEntries.length === 0) {
      return {
        success: false,
        message: "No return entries to reverse",
      };
    }

    // Get DVAT type from the first entry (all entries in a returns_01 should have the same type)
    const dvatType = returnsEntries[0].dvat_type;

    // Step 1: Delete all returns_entry records by setting deletedAt and deletedById
    await prisma.returns_entry.updateMany({
      where: {
        returns_01Id: returns01Id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Step 2: Update the corresponding daily_purchase or daily_sale records
    // Based on DVAT type, set is_accept to false
    if (dvatType === "DVAT_30" || dvatType === "DVAT_30_A") {
      // Update daily_purchase table
      for (const entry of returnsEntries) {
        await prisma.daily_purchase.updateMany({
          where: {
            invoice_number: entry.invoice_number,
            deletedAt: null,
          },
          data: {
            is_accept: false,
          },
        });
      }
    } else if (dvatType === "DVAT_31" || dvatType === "DVAT_31_A") {
      // Update daily_sale table
      for (const entry of returnsEntries) {
        await prisma.daily_sale.updateMany({
          where: {
            invoice_number: entry.invoice_number,
            deletedAt: null,
          },
          data: {
            is_accept: false,
          },
        });
      }
    }

    return {
      success: true,
      message: `Successfully reversed ${returnsEntries.length} return entries`,
      data: {
        entriesReversed: returnsEntries.length,
        dvatType: dvatType,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to reverse returns",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
