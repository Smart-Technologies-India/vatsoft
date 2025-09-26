"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { parctitioner } from "@prisma/client";
import axios from "axios";
import qs from "qs";

interface GetPaymentStatusPayload {
  Amount: string;
  applicant_id: string;
}

const GetPaymentStatus = async (
  payload: GetPaymentStatusPayload
): Promise<ApiResponseType<parctitioner | null>> => {
  const functionname: string = GetPaymentStatus.name;

  try {
    let data = qs.stringify({
      queryRequest: `|1000605|${payload.applicant_id}|${payload.Amount}|`,
      aggregatorId: "SBIEPAY",
      merchantId: "1000605",
    });

    const response = await axios.post(
      "https://test.sbiepay.sbi/payagg/statusQuery/getStatusQuery",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        maxBodyLength: Infinity,
      }
    );

    return createResponse({
      message:
        response.status === 200
          ? "Payment status fetched successfully"
          : "Unable to fetch payment status.",
      functionname: functionname,
      data: response.data ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetPaymentStatus;
