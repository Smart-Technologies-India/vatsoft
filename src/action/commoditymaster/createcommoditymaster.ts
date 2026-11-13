"use server";
import { getCurrentUserId } from "@/lib/auth";
interface CreateCommodityMasterPayload {
  product_name: string;
  product_type: string;
  mrp: string;
  sale_price: string;
  oidc_price: string;
  oidc_discount_percent: string;
  taxable_at: string;
  description: string;
  remark: string;
  createdById: number;
  crate_size: number;
  pack_type: string;
  pack_size: string;
  market_type: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateCommodityMaster = async (
  payload: CreateCommodityMasterPayload,
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = CreateCommodityMaster.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateCommodityMaster",
      } as any;
    }

    const commodity_master = await prisma.commodity_master.create({
      data: {
        product_name: payload.product_name,
        product_type: payload.product_type as any,
        mrp: payload.mrp,
        sale_price: payload.sale_price,
        oidc_price: payload.oidc_price,
        oidc_discount_percent: payload.oidc_discount_percent,
        taxable_at: payload.taxable_at,
        description: payload.description,
        remark: payload.remark,
        createdById: payload.createdById,
        crate_size: payload.crate_size,
        pack_type: payload.pack_type as any,
        pack_size: payload.pack_size,
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

export default CreateCommodityMaster;
