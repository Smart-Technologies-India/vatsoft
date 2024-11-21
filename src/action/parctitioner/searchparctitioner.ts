"use server";

import { errorToString } from "@/utils/methods";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { parctitioner } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchParctitionerPayload {
  gsp_name?: string;
  business_spoc_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  skip: number;
  take: number;
}

const SearchParctitioner = async (
  payload: SearchParctitionerPayload
): Promise<PaginationResponse<Array<parctitioner> | null>> => {
  const functionname: string = SearchParctitioner.name;

  try {
    const [parctitioner_response, totalCount] = await Promise.all([
      prisma.parctitioner.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          ...(payload.gsp_name && {
            gsp_name: {
              contains: payload.gsp_name,
            },
          }),
          ...(payload.address && {
            address: {
              contains: payload.address,
            },
          }),
          ...(payload.business_spoc_name && {
            business_spoc_name: {
              contains: payload.business_spoc_name,
            },
          }),
          ...(payload.email && {
            email: {
              contains: payload.email,
            },
          }),
          ...(payload.mobile && {
            mobile: {
              contains: payload.mobile,
            },
          }),
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.parctitioner.count({
        where: {
          deletedAt: null,
          deletedById: null,
          ...(payload.gsp_name && {
            gsp_name: {
              contains: payload.gsp_name,
            },
          }),
          ...(payload.address && {
            address: {
              contains: payload.address,
            },
          }),
          ...(payload.business_spoc_name && {
            business_spoc_name: {
              contains: payload.business_spoc_name,
            },
          }),
          ...(payload.email && {
            email: {
              contains: payload.email,
            },
          }),
          ...(payload.mobile && {
            mobile: {
              contains: payload.mobile,
            },
          }),
        },
      }),
    ]);

    return createPaginationResponse({
      message: parctitioner_response
        ? "Parctitioner Get successfully"
        : "Unable to search Parctitioner.",
      functionname: functionname,
      data: parctitioner_response ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchParctitioner;
