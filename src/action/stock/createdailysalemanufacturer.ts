"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface CreateDailySaleManufacturerPayload {
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
  against_cfrom: boolean;
  is_against_fform: boolean;
  is_exempt?: boolean;
  is_against_iform?: boolean;
  is_h_export?: boolean;
  is_against_e1?: boolean;
  is_export: boolean;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

const CreateDailySaleManufacturer = async (
  payload: CreateDailySaleManufacturerPayload
): Promise<ApiResponseType<stock | null>> => {
  const functionname: string = CreateDailySaleManufacturer.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateDailySaleManufacturer",
      } as any;
    }

    const invoiceDate = new Date(payload.invoice_date);
    const april2026Start = new Date(2026, 3, 1);

    if (invoiceDate < april2026Start) {
      return createResponse({
        message:
          "The return upto March 2026 has to be filed on old portal.",
        functionname,
      });
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const invoiceMonthName = monthNames[invoiceDate.getMonth()];
    const invoiceYear = invoiceDate.getFullYear().toString();

    const filedReturnFiling = await prisma.return_filing.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvatid: payload.dvatid,
        year: invoiceYear,
        month: invoiceMonthName,
        filing_status: true,
        OR: [{ return_status: "FILED" }, { return_status: "LATEFILED" }],
      },
    });

    console.log("Filed Return Filing:", filedReturnFiling);

    const paidReturn = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatid,
        year: invoiceYear,
        month: invoiceMonthName,
        OR: [{ return_type: "REVISED" }, { return_type: "ORIGINAL" }],
        rr_number: {
          not: "",
        },
      },
    });

    console.log("Paid Return:", paidReturn);
    
    if (filedReturnFiling || paidReturn) {
      return createResponse({
        message: `The return for ${invoiceMonthName} is already filed. Kindly file revise return.`,
        functionname,
      });
    }

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
          createdById: currentUserId,
          urn_number: ref_no,
          is_against_cform: payload.against_cfrom,
          is_against_fform: payload.is_against_fform,
          is_exempt: payload.is_exempt ?? false,
          is_against_iform: payload.is_against_iform ?? false,
          is_h_export: payload.is_h_export ?? false,
          is_against_e1: payload.is_against_e1 ?? false,
          is_export: payload.is_export,
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

      // For MANUFACTURER: Only update stock if it exists, don't throw error if not found
      const isexist = await prisma.stock.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          dvat04Id: daily_sale_response.dvat04Id,
          commodity_masterId: daily_sale_response.commodity_masterId,
        },
      });

      let update_response = null;

      // If stock exists, update it without checking quantity
      if (isexist) {
        update_response = await prisma.stock.update({
          where: {
            id: isexist.id,
          },
          data: {
            quantity: Math.max(0, isexist.quantity - payload.quantity),
          },
        });

        if (!update_response) {
          throw new Error("Unable to update stock.");
        }
      }
      // If stock doesn't exist, just continue without error

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
              is_dvat_30a: !(
                seller_dvat.tinNumber.startsWith("25") ||
                seller_dvat.tinNumber.startsWith("26")
              ),
              createdById: currentUserId,
              is_local:
                seller_dvat.tinNumber.startsWith("25") ||
                seller_dvat.tinNumber.startsWith("26"),
              urn_number: ref_no,
            },
          });

          if (!create_response) {
            throw new Error("Unable to create daily purchase.");
          }
        }
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

export default CreateDailySaleManufacturer;
