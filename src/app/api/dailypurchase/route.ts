import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/database";
import { customAlphabet } from "nanoid";

interface BodyData {
  SupplierTIN: string;
  VchNum: string;
  VchDt: string;
  CustomerTINNo: string;
  // CustomerName: string;
  Items: {
    StockItem: string;
    BatchName: string;
    Qty: number;
    Rate: number;
    MasterID: number;
    // Conversion: number;
    Amount: number;
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bodydata: BodyData[] = Array.isArray(body?.Data) ? body.Data : [];
    const datalength = bodydata.length;

    if (datalength === 0) {
      return NextResponse.json(
        { status: false, error: "No data provided." },
        { status: 400 }
      );
    }

    const createUrn = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);
    const CHUNK_SIZE = 10;
    const transactionOptions = { timeout: 30000, maxWait: 10000 } as const;

    const tinCache = new Map<string, { id: number }>();
    const dvatCache = new Map<string, { id: number; createdById: number }>();
    const commodityCache = new Map<number, { id: number; crate_size: number; taxable_at: string }>();

    let createdCount = 0;

    for (let index = 0; index < bodydata.length; index += CHUNK_SIZE) {
      const chunk = bodydata.slice(index, index + CHUNK_SIZE);

      await prisma.$transaction(async (tx) => {
        for (const data of chunk) {
          let tin = tinCache.get(data.CustomerTINNo);
          if (!tin) {
            const tinResponse = await tx.tin_number_master.findFirst({
              where: {
                tin_number: data.CustomerTINNo,
                deletedAt: null,
                status: "ACTIVE",
              },
              select: { id: true },
            });

            if (!tinResponse) {
              throw new Error(
                `TIN number not found for ${data.CustomerTINNo} for voucher no ${data.VchNum}.`
              );
            }

            tin = tinResponse;
            tinCache.set(data.CustomerTINNo, tin);
          }

          let dvat = dvatCache.get(data.SupplierTIN);
          if (!dvat) {
            const dvatResponse = await tx.dvat04.findFirst({
              where: { tinNumber: data.SupplierTIN },
              select: { id: true, createdById: true },
            });

            if (!dvatResponse) {
              throw new Error(
                `DVAT 04 record not found for ${data.SupplierTIN} for voucher no ${data.VchNum}.`
              );
            }

            dvat = dvatResponse;
            dvatCache.set(data.SupplierTIN, dvat);
          }

          const invoiceDate = new Date(Date.parse(data.VchDt));

          for (const item of data.Items) {
            const masterId = parseInt(item.MasterID.toString());

            let commodity = commodityCache.get(masterId);
            if (!commodity) {
              const commodityResponse = await tx.commodity_master.findFirst({
                where: {
                  id: masterId,
                  deletedAt: null,
                },
                select: {
                  id: true,
                  crate_size: true,
                  taxable_at: true,
                },
              });

              if (!commodityResponse) {
                throw new Error(
                  `Commodity master not found for ${item.MasterID} for voucher no ${data.VchNum}.`
                );
              }

              commodity = {
                id: commodityResponse.id,
                crate_size: commodityResponse.crate_size,
                taxable_at: commodityResponse.taxable_at
                  ? commodityResponse.taxable_at.toString()
                  : "0",
              };
              commodityCache.set(masterId, commodity);
            }

            const quantity = item.Qty * commodity.crate_size;

            const existingEntry = await tx.tally_purchase.findFirst({
              where: {
                seller_tin_number: {
                  tin_number: data.CustomerTINNo,
                },
                invoice_number: data.VchNum,
                commodity_masterId: commodity.id,
                batch_name: item.BatchName,
                quantity,
              },
              select: { id: true },
            });

            if (existingEntry) {
              throw new Error(
                `Entry already exists for ${data.CustomerTINNo} with invoice number ${data.VchNum} and batch ${item.BatchName}.`
              );
            }

            const testAmount = item.Rate * item.Qty;

            await tx.tally_purchase.create({
              data: {
                dvat04Id: dvat.id,
                invoice_number: data.VchNum,
                invoice_date: invoiceDate,
                commodity_masterId: commodity.id,
                seller_tin_numberId: tin.id,
                quantity,
                tax_percent: commodity.taxable_at,
                amount_unit: ((testAmount * 1.2) / commodity.crate_size).toFixed(2),
                amount: testAmount.toFixed(2),
                vatamount: (testAmount * 0.2).toFixed(2),
                batch_name: item.BatchName,
                is_local:
                  data.CustomerTINNo.startsWith("25") ||
                  data.CustomerTINNo.startsWith("26"),
                is_dvat_30a:
                  data.CustomerTINNo.startsWith("25") ||
                  data.CustomerTINNo.startsWith("26"),
                is_accept: false,
                urn_number: createUrn(),
                is_against_cform: false,
                createdById: dvat.createdById,
              },
            });

            createdCount += 1;
          }
        }
      }, transactionOptions);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Request processed successfully",
        data: {
          received: datalength,
          created: createdCount,
        },
      },
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
