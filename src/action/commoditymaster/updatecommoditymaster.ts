"use server";
import { getCurrentUserId } from "@/lib/auth";
interface UpdateCommodityMasterPayload {
  id: number;
  product_name?: string;
  product_type?: string;
  crate_size?: number;
  mrp?: string;
  sale_price?: string;
  oidc_price?: string;
  oidc_discount_percent?: string;
  taxable_at?: string;
  description?: string;
  remark?: string;
  status?: string;
  pack_type?: string;
  pack_size?: string;
  market_type?: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, Status } from "@prisma/client";
import prisma from "../../../prisma/database";

const UpdateCommodityMaster = async (
  payload: UpdateCommodityMasterPayload
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = UpdateCommodityMaster.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "UpdateCommodityMaster",
      } as any;
    }

    const isexist = await prisma.commodity_master.findFirst({
      where: {
        id: payload.id,
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
        updatedById: currentUserId,
        ...(payload.product_name && { product_name: payload.product_name }),
        ...(payload.product_type && { product_type: payload.product_type as any }),
        ...(payload.mrp && { mrp: payload.mrp }),
        ...(payload.sale_price && { sale_price: payload.sale_price }),
        ...(payload.oidc_price && { oidc_price: payload.oidc_price }),
        ...(payload.oidc_discount_percent && {
          oidc_discount_percent: payload.oidc_discount_percent,
        }),
        ...(payload.taxable_at && { taxable_at: payload.taxable_at }),
        ...(payload.description && { description: payload.description }),
        ...(payload.remark && { remark: payload.remark }),
        ...(payload.status && { status: payload.status as Status }),
        ...(payload.crate_size !== undefined && { crate_size: payload.crate_size }),
        ...(payload.pack_type && { pack_type: payload.pack_type as any }),
        ...(payload.pack_size && { pack_size: payload.pack_size }),
        ...(payload.market_type && { market_type: payload.market_type as any }),
      },
    });

    if (!commodity_master) {
      return createResponse({
        message: "Something went wrong, Unable to update.",
        functionname,
      });
    }

    return createResponse({
      message: "Commodity data updated successfully",
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
