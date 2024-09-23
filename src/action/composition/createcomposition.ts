"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { composition } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateCompositionPayload {
  dvatid: number;
  createdby: number;
  compositionScheme: boolean;
  turnoverLastFinancialYear: string;
  turnoverCurrentFinancialYear: string;
  remark?: string;
}

const CreateComposition = async (
  payload: CreateCompositionPayload
): Promise<ApiResponseType<composition | null>> => {
  const functionname: string = CreateComposition.name;

  try {
    const nanoid = customAlphabet("1234567890", 12);
    const arn: string = nanoid();

    const composition_response = await prisma.composition.create({
      data: {
        dvatid: payload.dvatid,
        compositionScheme: payload.compositionScheme,
        status: "PENDING",
        arn: arn,
        dept_user_id: 8,
        turnoverLastFinancialYear: payload.turnoverLastFinancialYear,
        turnoverCurrentFinancialYear: payload.turnoverCurrentFinancialYear,
        createdById: payload.createdby,
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    return createResponse({
      message: composition_response
        ? "Composition create successfully"
        : "Unable to create composition.",
      functionname: functionname,
      data: composition_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateComposition;
