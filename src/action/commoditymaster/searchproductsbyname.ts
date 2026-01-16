"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchProductsByNameProps {
  product_name: string;
}

const SearchProductsByName = async (
  payload: SearchProductsByNameProps
): Promise<ApiResponseType<commodity_master[]>> => {
  const functionname: string = SearchProductsByName.name;

  try {
    const products = await prisma.commodity_master.findMany({
      where: {
        product_name: {
          contains: payload.product_name,
        },
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return createResponse({
      message: `Found ${products.length} matching products`,
      functionname,
      data: products,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: [],
    });
  }
};

export default SearchProductsByName;
