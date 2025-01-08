"use server";
interface CreateDailySalePayload {
  dvatid: number;
  commodityid: number;
  quantity: number;
  seller_tin_id: number;
  invoice_number: string;
  invoice_date: Date;
  tax_percent: string;
  amount: string;
  vatamount: string;
  amount_unit: string;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

const CreateDailySale = async (
  payload: CreateDailySalePayload
): Promise<ApiResponseType<stock | null>> => {
  const functionname: string = CreateDailySale.name;

  try {
    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwyz", 12);
    const ref_no: string = nanoid();
    const isdata = await prisma.daily_sale.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        is_dvat_31: false,
        dvat04Id: payload.dvatid,
      },
    });

    if (isdata) {
      if (isdata.invoice_date.getMonth() != payload.invoice_date.getMonth()) {
        return createResponse({
          message:
            "Kindly convert pending invoice from daily purchase to DVAT 31 A",
          functionname,
        });
      }
    }

    const result = await prisma.$transaction(async (prisma) => {
      const purchaser_response = await prisma.tin_number_master.findFirst({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          id: payload.seller_tin_id,
        },
      });

      if (!purchaser_response) {
        throw new Error("Seller TIN number not found.");
      }

      const seller_dvat = await prisma.dvat04.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          id: payload.dvatid,
        },
      });
      if (!seller_dvat) {
        throw new Error("Seller Dvat not found.");
      }

      if (seller_dvat.tinNumber == purchaser_response.tin_number) {
        throw new Error("Invalid TIN number.");
      }

      if (!seller_dvat.tinNumber) {
        throw new Error("Seller Dvat TIN number is not set.");
      }

      const daily_sale_response = await prisma.daily_sale.create({
        data: {
          seller_tin_numberId: payload.seller_tin_id,
          amount_unit: payload.amount_unit,
          dvat04Id: payload.dvatid,
          invoice_number: payload.invoice_number,
          invoice_date: payload.invoice_date,
          commodity_masterId: payload.commodityid,
          quantity: payload.quantity,
          tax_percent: payload.tax_percent,
          amount: payload.amount,
          vatamount: payload.vatamount,
          is_dvat_31: false,
          createdById: payload.createdById,
          urn_number: ref_no,
          is_local:
            purchaser_response.tin_number.startsWith("25") ||
            purchaser_response.tin_number.startsWith("26"),
        },
        include: {
          seller_tin_number: true,
        },
      });

      if (!daily_sale_response) {
        throw new Error("Something went wrong. Unable to create daily sale.");
      }

      const isexist = await prisma.stock.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          dvat04Id: daily_sale_response.dvat04Id,
          commodity_masterId: daily_sale_response.commodity_masterId,
        },
      });

      if (!isexist) {
        throw new Error("Stock does not exist.");
      }

      if (payload.quantity > isexist.quantity) {
        throw new Error(
          `Insufficient stock. You requested ${payload.quantity}, but only ${isexist.quantity} is available.`
        );
      }

      const update_response = await prisma.stock.update({
        where: {
          id: isexist.id,
        },
        data: {
          quantity: isexist.quantity - payload.quantity,
        },
      });

      if (!update_response) {
        throw new Error("Unable to update stock.");
      }

      const userstock = await prisma.dvat04.findFirst({
        where: {
          tinNumber: daily_sale_response.seller_tin_number.tin_number,
        },
      });

      if (userstock) {
        if (
          purchaser_response.tin_number.startsWith("25") ||
          purchaser_response.tin_number.startsWith("26")
        ) {
          const saller_response = await prisma.tin_number_master.findFirst({
            where: {
              status: "ACTIVE",
              deletedAt: null,
              tin_number: seller_dvat.tinNumber,
            },
          });

          if (!saller_response) {
            throw new Error("Seller TIN number not found.");
          }
          const create_response = await prisma.daily_purchase.create({
            data: {
              dvat04Id: userstock.id,
              seller_tin_numberId: saller_response.id,
              invoice_number: payload.invoice_number,
              invoice_date: payload.invoice_date,
              commodity_masterId: payload.commodityid,
              quantity: payload.quantity,
              tax_percent: payload.tax_percent,
              amount: payload.amount,
              amount_unit: payload.amount_unit,
              vatamount: payload.vatamount,
              is_dvat_30a: false,
              createdById: payload.createdById,
              is_local: true,
              urn_number: ref_no,
            },
          });

          if (!create_response) {
            throw new Error("Unable to create daily purchase.");
          }
        }

        // const isstock = await prisma.stock.findFirst({
        //   where: {
        //     deletedAt: null,
        //     deletedBy: null,
        //     status: "ACTIVE",
        //     dvat04Id: userstock.id,
        //     commodity_masterId: payload.commodityid,
        //   },
        // });

        // if (isstock) {
        //   const stock_respone = await prisma.stock.update({
        //     where: {
        //       id: isstock.id,
        //     },
        //     data: {
        //       quantity: payload.quantity + isstock.quantity,
        //       updatedById: payload.createdById,
        //     },
        //   });

        //   if (!stock_respone) {
        //     throw new Error("Unable to update stock.");
        //   }
        // } else {
        //   const stock_respone = await prisma.stock.create({
        //     data: {
        //       quantity: payload.quantity,
        //       commodity_masterId: payload.commodityid,
        //       dvat04Id: userstock.id,
        //       createdById: payload.createdById,
        //       status: "ACTIVE",
        //     },
        //   });

        //   if (!stock_respone) {
        //     throw new Error("Unable to create new stock.");
        //   }
        // }
      }

      return update_response;
    });

    return createResponse({
      message: "Daily Sale Created successfully",
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDailySale;
