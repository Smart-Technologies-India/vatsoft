"use server";
import { getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface UpdateInvoiceNumberPayload {
  ids: number[]; // Changed to array for batch updates
  invoiceNumber: string;
}

const UpdateInvoiceNumber = async (
  payload: UpdateInvoiceNumberPayload
): Promise<ApiResponseType<{ updatedCount: number } | null>> => {
  const functionname: string = UpdateInvoiceNumber.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Validate input
    if (!payload.invoiceNumber || payload.invoiceNumber.trim() === "") {
      return {
        status: false,
        data: null,
        message: "Invoice number cannot be empty.",
        functionname,
      } as any;
    }

    if (!payload.ids || payload.ids.length === 0) {
      return {
        status: false,
        data: null,
        message: "No records selected to update.",
        functionname,
      } as any;
    }

    // Find all sale items to be updated
    const saleItems = await prisma.daily_sale.findMany({
      where: {
        id: {
          in: payload.ids,
        },
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (saleItems.length === 0) {
      return {
        status: false,
        data: null,
        message: "No sale items found or already deleted.",
        functionname,
      } as any;
    }

    // Check if any item is already accepted
    // const acceptedItems = saleItems.filter((item) => item.is_accept);
    // if (acceptedItems.length > 0) {
    //   return {
    //     status: false,
    //     data: null,
    //     message: `Cannot modify ${acceptedItems.length} accepted sale item(s). Only update non-accepted items.`,
    //     functionname,
    //   } as any;
    // }

    // Update all sale items with the new invoice number
    const updateResponse = await prisma.daily_sale.updateMany({
      where: {
        id: {
          in: payload.ids,
        },
      },
      data: {
        invoice_number: payload.invoiceNumber.trim(),
      },
    });

    // Get all URM numbers from updated items and update related purchases
    const urmNumbers = saleItems
      .map((item) => item.urn_number)
      .filter((urm): urm is string => urm !== null && urm !== undefined);
    
    if (urmNumbers.length > 0) {
      await prisma.daily_purchase.updateMany({
        where: {
          urn_number: {
            in: urmNumbers,
          },
          deletedAt: null,
        },
        data: {
          invoice_number: payload.invoiceNumber.trim(),
        },
      });
    }

    return createResponse({
      message: `Invoice number updated successfully for ${updateResponse.count} record(s).`,
      functionname,
      data: { updatedCount: updateResponse.count },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateInvoiceNumber;
