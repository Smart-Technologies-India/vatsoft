"use server";
interface CreateCommodityMasterPayload {
  product_name: string;
  product_type: Dvat04Commodity;
  mrp: string;
  sale_price: string;
  oidc_price: string;
  oidc_discount_percent: string;
  taxable_at: string;
  description: string;
  remark: string;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, Dvat04Commodity } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateCommodityMaster = async (
  payload: CreateCommodityMasterPayload
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = CreateCommodityMaster.name;

  try {
    const commodity_master = await prisma.commodity_master.create({
      data: payload,
    });

    if (!commodity_master) {
      return createResponse({
        message: "Something want wrong. Unable to create Commodity.",
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
