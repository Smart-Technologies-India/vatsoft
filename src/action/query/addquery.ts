"use server";
interface AddQueryPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { deparment_doc_upload } from "@prisma/client";

const AddQuery = async (
  payload: AddQueryPayload
): Promise<ApiResponseType<deparment_doc_upload | null>> => {
  const functionname: string = AddQuery.name;
  try {
    const response = await prisma.deparment_doc_upload.create({
      data: {
        path: "test",
        createdById: 1,
        status: "ACTIVE",
      },
    });

    if (!response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddQuery;
