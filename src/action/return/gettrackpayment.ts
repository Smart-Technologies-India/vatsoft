"use server";
interface GetTrackPaymentPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01, returns_entry } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetTrackPayment = async (
  payload: GetTrackPaymentPayload
): Promise<ApiResponseType<returns_entry[] | null>> => {
  const functionname: string = GetTrackPayment.name;
  try {
    const dvat04response = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        returns_01: true,
      },
    });


    // const filteredResponse = dvat04response.map(entry => ({
    //   ...entry,
    //   returns_01: entry.returns_01.filter(related => related.deletedAt === null && related.deletedById === null),
    // }));
    
    // NOT: [{ transaction_id: null, track_id: null }],
    if (!dvat04response)
      return createResponse({
        message: "Invalid user id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: dvat04response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetTrackPayment;
