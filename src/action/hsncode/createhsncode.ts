"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { hsncode } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateHSNCodePayload {
  createdby: number;
  head: string;
  description: string;
  hsncode: string;
  tech_description: string;
  trade1: string;
  trade2: string;
  trade3: string;
}

const CreateHSNCode = async (
  payload: CreateHSNCodePayload
): Promise<ApiResponseType<hsncode | null>> => {
  const functionname: string = CreateHSNCode.name;

  try {
    const hsncodedata = await prisma.hsncode.create({
      data: {
        createdById: payload.createdby,
        status: "ACTIVE",
        description: payload.description,
        head: payload.head,
        hsncode: payload.hsncode,
        tech_description: payload.tech_description,
        trade1: payload.trade1,
        trade2: payload.trade2,
        trade3: payload.trade3,
      },
    });

    return createResponse({
      message: hsncodedata
        ? "HSN Code created successfully"
        : "Unable to HSN Code.",
      functionname: functionname,
      data: hsncodedata ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateHSNCode;
