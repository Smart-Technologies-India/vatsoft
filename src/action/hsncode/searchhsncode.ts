"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";

import { hsncode } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchHSNCodePayload {
  head?: string;
  description?: string;
  hsncode?: string;
  tech_description?: string;
  trade1?: string;
  trade2?: string;
  trade3?: string;
}

const SearchHSNCode = async (
  payload: SearchHSNCodePayload
): Promise<ApiResponseType<hsncode | null>> => {
  const functionname: string = SearchHSNCode.name;

  // Check that at least one search parameter is provided
  if (
    !payload.description &&
    !payload.head &&
    !payload.hsncode &&
    !payload.tech_description &&
    !payload.trade1 &&
    !payload.trade2 &&
    !payload.trade3
  ) {
    return createResponse({
      message: "Please provide at least one search parameter.",
      functionname,
      data: null,
    });
  }

  try {
    const hsncode_response = await prisma.hsncode.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        ...(payload.description && {
          OR: [
            { description: { contains: payload.description } },
            { tech_description: { contains: payload.description } },
            { trade1: { contains: payload.description } },
            { trade2: { contains: payload.description } },
            { trade3: { contains: payload.description } },
          ],
        }),
        ...(payload.head && {
          head: {
            contains: payload.head,
          },
        }),
        ...(payload.hsncode && {
          hsncode: {
            contains: payload.hsncode,
          },
        }),
        ...(payload.tech_description && {
          tech_description: {
            contains: payload.tech_description,
          },
        }),
        ...(payload.trade1 && {
          trade1: {
            contains: payload.trade1,
          },
        }),
        ...(payload.trade2 && {
          trade2: {
            contains: payload.trade2,
          },
        }),
        ...(payload.trade2 && {
          trade2: {
            contains: payload.trade2,
          },
        }),
      },
    });

    return createResponse({
      message: hsncode_response
        ? "HSN Code Get successfully"
        : "Unable to search HSN Code.",
      functionname: functionname,
      data: hsncode_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchHSNCode;
