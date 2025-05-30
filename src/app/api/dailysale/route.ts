import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/database";
import { customAlphabet } from "nanoid";

interface BodyData {
  VchNum: string;
  VchDt: string;
  TINNo: string;
  Items: {
    StockItem: string;
    Qty: string;
    BatchName: string;
    Rate: string;
  }[];
}
export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // get the request body
    const body = await req.json();

    const datalength = body["Data"].length;

    const bodydata: BodyData[] = body["Data"];

    const result = await prisma.$transaction(async (prisma) => {
      for (let data of bodydata) {
        const isexist = await prisma.tin_number_master.findFirst({
          where: {
            tin_number: data["TINNo"],
            deletedAt: null,
            status: "ACTIVE",
          },
        });

        if (!isexist) {
          throw new Error("TIN number not found.");
        }

        for (let items of data["Items"]) {
          const nanoid = customAlphabet(
            "1234567890abcdefghijklmnopqrstunvxyz",
            12
          );

          const isdvat = await prisma.dvat04.findFirst({
            where: {
              id: 797,
            },
          });

          if (!isdvat) {
            throw new Error("DVAT 04 record not found.");
          }
          const commodity = await prisma.commodity_master.findFirst({
            where: {
              oidc_code: "1584",
            },
          });
          if (!commodity) {
            throw new Error("Commodity master not found.");
          }

          const response = await prisma.daily_sale.create({
            data: {
              dvat04Id: 797,
              invoice_number: data["VchNum"],
              invoice_date: new Date(Date.parse(data["VchDt"])),
              commodity_masterId: 5,
              seller_tin_numberId: isexist.id,
              amount_unit: (
                parseFloat(items["Rate"].toString().split(" ")[0]) /
                commodity.crate_size
              ).toFixed(2),
              quantity: parseInt(items["Qty"]),
              tax_percent: commodity.taxable_at,
              amount: parseFloat(
                items["Rate"].toString().split(" ")[0]
              ).toFixed(2),
              vatamount: (
                parseFloat(items["Rate"].toString().split(" ")[0]) /
                commodity.crate_size
              ).toFixed(2),
              is_local:
                data["TINNo"].startsWith("25") || data["TINNo"].startsWith("26")
                  ? true
                  : false,
              is_dvat_31:
                data["TINNo"].startsWith("25") || data["TINNo"].startsWith("26")
                  ? false
                  : true,
              is_accept: false,
              urn_number: nanoid(),
              is_against_cform: false,
              createdById: isdvat.createdById,
            },
          });

          if (!response) {
            throw new Error("Failed to create daily sale record.");
          }
        }
      }
    });

    return NextResponse.json(
      { message: "Request processed successfully", data: result },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
