"use server";

import { challan, refinery_sale } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface ChallanWithRefinerySales {
  challan: challan;
  refinerySales: refinery_sale[];
  totalAmount: number;
}

const GetChallanWithRefinerySales = async (
  challanId: number,
): Promise<ApiResponseType<ChallanWithRefinerySales | null>> => {
  const functionname = GetChallanWithRefinerySales.name;

  try {
    const challanData = await prisma.challan.findFirst({
      where: {
        id: challanId,
        deletedAt: null,
      },
    });

    if (!challanData) {
      return createResponse({
        message: "Challan not found.",
        functionname,
      });
    }

    const refinerySales = await prisma.refinery_sale.findMany({
      where: {
        challanId: challanId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        refinery: true,
        commodity_master: true,
      },
      orderBy: [{ invoice_date: "desc" }, { id: "asc" }],
    });

    const totalAmount = refinerySales.reduce((sum, sale) => {
      const amount = parseFloat(sale.amount || "0");
      const vatAmount = parseFloat(sale.vatamount || "0");
      return sum + amount + vatAmount;
    }, 0);
    return createResponse({
      message: "Challan details fetched successfully.",
      functionname,
      data: {
        challan: challanData,
        refinerySales,
        totalAmount,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetChallanWithRefinerySales;
