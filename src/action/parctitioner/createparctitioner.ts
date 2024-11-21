"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { parctitioner } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateParctitionerPayload {
  createdby: number;
  gsp_name: string;
  business_spoc_name: string;
  email: string;
  mobile: string;
  address: string;
}

const CreateParctitioner = async (
  payload: CreateParctitionerPayload
): Promise<ApiResponseType<parctitioner | null>> => {
  const functionname: string = CreateParctitioner.name;

  try {
    const parcitionerdata = await prisma.parctitioner.create({
      data: {
        createdById: payload.createdby,
        status: "ACTIVE",
        address: payload.address,
        business_spoc_name: payload.business_spoc_name,
        email: payload.email,
        gsp_name: payload.gsp_name,
        mobile: payload.mobile,
      },
    });

    return createResponse({
      message: parcitionerdata
        ? "Parcitioner create successfully"
        : "Unable to parctitioner.",
      functionname: functionname,
      data: parcitionerdata ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateParctitioner;
