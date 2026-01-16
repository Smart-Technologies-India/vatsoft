"use server";
interface UpdateCommodityMasterPayload {
  id: number;
  updatedById: number;
  product_name?: string;
  product_type?: Dvat04Commodity;
  crate_size?: string;
  mrp?: string;
  sale_price?: string;
  oidc_price?: string;
  oidc_discount_percent?: string;
  taxable_at?: string;
  description?: string;
  remark?: string;
  status?: Status;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, Dvat04Commodity, Status } from "@prisma/client";
import prisma from "../../../prisma/database";

const UpdateCommodityMaster = async (
  payload: UpdateCommodityMasterPayload
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = UpdateCommodityMaster.name;

  try {
    const isexist = await prisma.commodity_master.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!isexist) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    const commodity_master = await prisma.commodity_master.update({
      where: {
        id: payload.id,
      },
      data: {
        updatedById: payload.updatedById,
        ...(payload.product_name && { product_name: payload.product_name }),
        ...(payload.product_type && { product_type: payload.product_type }),
        ...(payload.mrp && { mrp: payload.mrp }),
        ...(payload.sale_price && { sale_price: payload.sale_price }),
        ...(payload.oidc_discount_percent && {
          oidc_discount_percent: payload.oidc_discount_percent,
        }),
        ...(payload.taxable_at && { taxable_at: payload.taxable_at }),
        ...(payload.description && { description: payload.description }),
        ...(payload.remark && { remark: payload.remark }),
        ...(payload.status && { status: payload.status }),
        
      },
    });

    if (!commodity_master) {
      return createResponse({
        message: "Something went wrong, Unable to update.",
        functionname,
      });
    }

    return createResponse({
      message: "Commodity data fetched successfully",
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

export default UpdateCommodityMaster;
