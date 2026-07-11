"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface DeleteCreditDebitNotePayload {
  id: number;
}

const DeleteCreditDebitNote = async (
  payload: DeleteCreditDebitNotePayload,
): Promise<ApiResponseType<null>> => {
  const functionname: string = DeleteCreditDebitNote.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return createResponse({
        message: "User not authenticated.",
        functionname,
      });
    }

    // Validate ID
    if (!Number.isInteger(payload.id) || payload.id <= 0) {
      return createResponse({
        message: "Invalid credit/debit note ID.",
        functionname,
      });
    }

    const note = await prisma.creditdebitnote.findUnique({
      where: { id: payload.id },
    });

    if (!note) {
      return createResponse({
        message: "Credit/Debit note not found.",
        functionname,
      });
    }

    if (note.deletedAt !== null) {
      return createResponse({
        message: "Credit/Debit note has already been deleted.",
        functionname,
      });
    }

    await prisma.creditdebitnote.update({
      where: { id: payload.id },
      data: {
        deletedAt: new Date(),
        deletedById: currentUserId,
      },
    });

    return createResponse({
      message: "Credit/Debit note deleted successfully.",
      functionname,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default DeleteCreditDebitNote;
