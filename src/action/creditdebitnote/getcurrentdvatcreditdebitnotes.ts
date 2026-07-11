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
    const currentDvatId = await getCurrentDvatId();
    if (!currentDvatId) {
      return createResponse({
        message: "DVAT ID not found.",
        functionname,
        data: [],
      });
    }

    const notes = await prisma.creditdebitnote.findMany({
      where: {
        dvat04Id: currentDvatId,
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
      message: notes.length === 0
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
