"use server";

import { getCurrentDvatId, getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  creditdebitnote,
  commodity_master,
  tin_number_master,
  dvat04,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export type CurrentDvatCreditDebitNote = creditdebitnote & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
  dvat04: dvat04;
};

const GetCurrentDvatCreditDebitNotes = async (): Promise<
  ApiResponseType<CurrentDvatCreditDebitNote[]>
> => {
  const functionname: string = GetCurrentDvatCreditDebitNotes.name;

  try {
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentRefineryId) {
      return createResponse({
        message: "Refinery ID not found.",
        functionname,
        data: [],
      });
    }

    const refinery = await prisma.refinery.findUnique({
      where: { id: currentRefineryId },
    });

    if (!refinery) {
      return createResponse({
        message: "Refinery not found.",
        functionname,
        data: [],
      });
    }


    const notes = await prisma.creditdebitnote.findMany({
      where: {
        seller_tin_numberId: refinery.tin_master_id,
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

    return createResponse({
      message:
        notes.length === 0
          ? "No credit/debit notes found."
          : "Credit/debit notes retrieved successfully.",
      functionname,
      data: notes,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
      data: [],
    });
  }
};

export default GetCurrentDvatCreditDebitNotes;
