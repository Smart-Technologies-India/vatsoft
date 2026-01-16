"use server";

import { errorToString } from "@/utils/methods";
import { safeParse } from "valibot";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { ProductRequestSchema } from "@/schema/productrequest";
import { product_request } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";

const CreateProductRequest = async (
  data: unknown
): Promise<ApiResponseType<product_request | null>> => {
  const functionname: string = CreateProductRequest.name;

  const parsed = safeParse(ProductRequestSchema, data);

  if (!parsed.success) {
    const errors = parsed.issues.map((issue) => issue.message).join(", ");
    return {
      status: false,
      message: errors,
      functionname: functionname,
      data: null,
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: false,
      message: "User not found. Please login again.",
      functionname: functionname,
      data: null,
    };
  }

  try {
    const product_request_response = await prisma.product_request.create({
      data: {
        product_name: parsed.output.product_name,
        company_name: parsed.output.company_name,
        pack_type: parsed.output.pack_type,
        crate_size: parsed.output.crate_size,
        requestedById: userId,
        createdById: userId,
      },
    });

    if (!product_request_response) {
      return {
        status: false,
        message: "Failed to create product request",
        functionname: functionname,
        data: null,
      };
    }

    return {
      status: true,
      message: "Product request submitted successfully",
      functionname: functionname,
      data: null,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
      functionname: functionname,
      data: null,
    };
  }
};

export default CreateProductRequest;
