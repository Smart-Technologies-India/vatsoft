import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/database";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // get the request body
    const body = await req.json();

    const take = body["take"] || 10;
    const skip = body["skip"] || 0;

    const [data, count] = await Promise.all([
      prisma.commodity_master.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          product_type: "LIQUOR",
        },
        select: {
          id: true,
          product_name: true,
          crate_size: true,
          pack_type: true,
        },
        take: take,
        skip: skip,
      }),
      prisma.commodity_master.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          product_type: "LIQUOR",
        },
      }),
    ]);

    const result = {
      data: data,
      total: count,
      take: take,
      skip: skip,
    };

    return NextResponse.json(
      { status: true, message: "Request processed successfully", data: result },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: false,
        error: "Failed to process request. error: " + error.message,
      },
      { status: 200 }
    );
  }
}
