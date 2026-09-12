"use server";

import prisma from "../../../prisma/database";

interface FirstStockData {
  id: number;
  product_name: string;
  quantity: number;
  description: string | null;
  commodity_master_id: number;
  crate_size: number;
}

export default async function GetFirstStockByDvat({
  dvat04Id,
}: {
  dvat04Id: number;
}): Promise<{
  status: boolean;
  data?: FirstStockData[];
  message: string;
}> {
  try {
    const firstStocks = await prisma.first_stock.findMany({
      where: {
        dvat04Id: dvat04Id,
        deletedAt: null,
      },
      include: {
        commodity_master: {
          select: {
            id: true,
            product_name: true,
            description: true,
            crate_size: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedData = firstStocks.map((item) => ({
      id: item.id,
      product_name: item.commodity_master.product_name,
      quantity: item.quantity,
      description: item.commodity_master.description || null,
      commodity_master_id: item.commodity_master.id,
      crate_size: item.commodity_master.crate_size,
    }));

    return {
      status: true,
      data: formattedData,
      message: "First stock data fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching first stock data:", error);
    return {
      status: false,
      message: error.message || "Failed to fetch first stock data",
    };
  }
}
