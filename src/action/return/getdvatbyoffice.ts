"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  returns_01,
  dvat04,
  registration,
  SelectOffice,
  first_stock,
} from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDvatByOfficePayload {
  selectOffice: SelectOffice;
}

const GetDvatByOffice = async (
  payload: GetDvatByOfficePayload
): Promise<
  ApiResponseType<(dvat04 & { first_stock: first_stock[] })[] | null>
> => {
  const functionname: string = GetDvatByOffice.name;
  try {
    let dvat_response = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        selectOffice: payload.selectOffice,
        OR: [
          {
            status: "PENDINGPROCESSING",
          },
          {
            status: "VERIFICATION",
          },
          {
            status: "APPROVED",
          },
        ],
      },
      include: {
        first_stock: true,
      },
    });

    if (!dvat_response) {
      return createResponse({
        message: "No data found",
        functionname,
      });
    }

    return createResponse({
      message: "DVAT data get successfully",
      functionname,
      data: dvat_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvatByOffice;
