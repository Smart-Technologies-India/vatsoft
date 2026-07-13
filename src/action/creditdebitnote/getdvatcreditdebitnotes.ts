"use server";

import { getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  creditdebitnote,
  commodity_master,
  tin_number_master,
  dvat04,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export type DvatCreditDebitNote = creditdebitnote & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
  dvat04: dvat04;
  isInverted: boolean; // true if note type is inverted (current user is buyer)
};

const GetDvatCreditDebitNotes = async (): Promise<
  ApiResponseType<DvatCreditDebitNote[]>
> => {
  const functionname: string = GetDvatCreditDebitNotes.name;

  try {
    const currentDvatId = await getCurrentDvatId();
    if (!currentDvatId) {
      return createResponse({
        message: "DVAT ID not found.",
        functionname,
        data: [],
      });
    }

    const currentDvat = await prisma.dvat04.findUnique({
      where: { id: currentDvatId },
    });

    if (!currentDvat) {
      return createResponse({
        message: "DVAT not found.",
        functionname,
        data: [],
      });
    }

    // Get notes where current DVAT is seller OR buyer
    const notes = await prisma.creditdebitnote.findMany({
      where: {
        OR: [
          // Notes where current user is the seller
          {
            seller_tin_numberId: currentDvatId,
          },
          // Notes where current user is the buyer
          {
            dvat04Id: currentDvatId,
          },
        ],
        deletedAt: null,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
        dvat04: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process notes to add isInverted flag
    const processedNotes: DvatCreditDebitNote[] = notes.map((note) => ({
      ...note,
      isInverted: note.dvat04Id === currentDvatId, // true if current user is buyer
    }));

    return createResponse({
      message:
        processedNotes.length === 0
          ? "No credit/debit notes found."
          : "Credit/debit notes retrieved successfully.",
      functionname,
      data: processedNotes,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
      data: [],
    });
  }
};

export default GetDvatCreditDebitNotes;
