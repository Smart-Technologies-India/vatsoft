import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/database";
import { customAlphabet } from "nanoid";

interface BodyData {
  SupplierTIN: string;
  VchNum: string;
  VchDt: string;
  CustomerTINNo: string;
  CustomerName: string;
  Items: {
    StockItem: string;
    BatchName: string;
    Qty: number;
    Rate: number;
    MasterID: number;
    Conversion: number;
    Amount: number;
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
            tin_number: data["CustomerTINNo"],
            deletedAt: null,
            status: "ACTIVE",
          },
        });

        if (!isexist) {
          throw new Error(
            `TIN number not found for ${data["CustomerTINNo"]} for ${data["VchNum"]}.`
          );
        }

        const isdvat = await prisma.dvat04.findFirst({
          where: {
            tinNumber: data["SupplierTIN"],
          },
        });

        if (!isdvat) {
          throw new Error(
            `DVAT 04 record not found for ${data["SupplierTIN"]} for ${data["VchNum"]}.`
          );
        }

        for (let items of data["Items"]) {
          const nanoid = customAlphabet(
            "1234567890abcdefghijklmnopqrstunvxyz",
            12
          );

          const commodity = await prisma.commodity_master.findFirst({
            where: {
              id: parseInt(items["MasterID"].toString()),
              deletedAt: null,
            },
          });

          if (!commodity) {
            throw new Error(
              `Commodity master not found for ${items["MasterID"]} for ${data["VchNum"]}. `
            );
          }

          // let commodity;

          // if (items["StockItem"].startsWith("DU_")) {
          //   commodity = await prisma.commodity_master.findFirst({
          //     where: {
          //       du_oidc_code: items["MasterID"].toString(),
          //       deletedAt: null,
          //     },
          //   });
          //   if (!commodity) {
          //     throw new Error(
          //       `Commodity master not found for ${items["MasterID"]}.`
          //     );
          //   }
          // } else if (items["StockItem"].startsWith("SL_")) {
          //   commodity = await prisma.commodity_master.findFirst({
          //     where: {
          //       dn_oidc_code: items["MasterID"].toString(),
          //       deletedAt: null,
          //     },
          //   });
          //   if (!commodity) {
          //     throw new Error(
          //       `Commodity master not found for ${items["MasterID"]}.`
          //     );
          //   }
          // } else {
          //   commodity = await prisma.commodity_master.findFirst({
          //     where: {
          //       oidc_code: items["MasterID"].toString(),
          //       deletedAt: null,
          //     },
          //   });
          //   if (!commodity) {
          //     throw new Error(
          //       `Commodity master not found for ${items["MasterID"]}.`
          //     );
          //   }
          // }

          // if (commodity === null) {
          //   throw new Error(
          //     `Commodity master not found for ${items["MasterID"]}.`
          //   );
          // }

          const test_amount = items["Rate"] * items["Qty"];

          const response = await prisma.tally_sale.create({
            data: {
              dvat04Id: isdvat.id,
              invoice_number: data["VchNum"],
              invoice_date: new Date(Date.parse(data["VchDt"])),
              commodity_masterId: commodity.id,
              seller_tin_numberId: isexist.id,
              quantity: items["Qty"] * commodity.crate_size,
              tax_percent: commodity.taxable_at,
              amount_unit: (items["Rate"] / commodity.crate_size).toFixed(2),
              amount: (test_amount * 1.2).toFixed(2),
              vatamount: (test_amount * 0.2).toFixed(2),
              is_local:
                data["CustomerTINNo"].startsWith("25") ||
                data["CustomerTINNo"].startsWith("26")
                  ? true
                  : false,
              is_dvat_31:
                data["CustomerTINNo"].startsWith("25") ||
                data["CustomerTINNo"].startsWith("26")
                  ? false
                  : true,
              is_accept: false,
              urn_number: nanoid(),
              is_against_cform: false,
              createdById: isdvat.createdById,
            },
          });

          if (!response) {
            throw new Error("Failed to create tally sale record.");
          }
        }
      }
    });

    return NextResponse.json(
      { message: "Request processed successfully", data: result },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process request. error: " + error.message },
      { status: 500 }
    );
  }
}
