"use server";
interface CreateCommodityFromRequestPayload {
  product_name: string;
  product_type: string;
  crate_size: string;
  mrp: string;
  sale_price: string;
  oidc_price: string;
  oidc_discount_percent: string;
  taxable_at: string;
  description: string;
  remark: string;
  createdById: number;
  pack_type: string;
  company_name: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, Dvat04Commodity, PackType } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateCommodityFromRequest = async (
  payload: CreateCommodityFromRequestPayload
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = CreateCommodityFromRequest.name;

  try {
    const commodity_master = await prisma.commodity_master.create({
      data: {
        product_name: payload.product_name,
        product_type: payload.product_type as Dvat04Commodity,
        crate_size: parseInt(payload.crate_size),
        mrp: payload.mrp,
        sale_price: payload.sale_price,
        oidc_price: payload.oidc_price,
        oidc_discount_percent: payload.oidc_discount_percent,
        taxable_at: payload.taxable_at,
        description: payload.description,
        remark: payload.remark,
        pack_type: payload.pack_type as PackType,
        createdById: payload.createdById,
      },
    });

    if (!commodity_master) {
      return createResponse({
        message: "Something went wrong. Unable to create Commodity.",
        functionname,
      });
    }

    return createResponse({
      message: "Commodity Created successfully",
      functionname,
      data: commodity_master,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateCommodityFromRequest;
