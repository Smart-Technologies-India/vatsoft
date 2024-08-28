"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import { DepositType, dvat04 } from "@prisma/client";

interface Dvat3UpdatePayload {
  id: number;
  securityDepositAmount?: string;
  depositType: DepositType;
  dateOfExpiry: Date;
  nameOfBank: string;
  branchName: string;
  transactionId: string;
  numberOfOwners: number;
  numberOfManagers: number;
  numberOfSignatory: number;
  nameOfManager: string;
  nameOfSignatory: string;
  updatedby: number;
}

const Dvat3Update = async (
  payload: Dvat3UpdatePayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = Dvat3Update.name;

  try {
    const is_exist = await prisma.dvat04.findFirst({
      where: {
        id: payload.id,
      },
    });

    if (!is_exist) {
      return createResponse({
        message: "Dvat3 not found.",
        functionname,
      });
    }

    const updateddvat3 = await prisma.dvat04.update({
      where: {
        id: is_exist.id,
      },
      data: {
        securityDepositAmount: payload.securityDepositAmount,
        depositType: payload.depositType,
        dateOfExpiry: payload.dateOfExpiry,
        nameOfBank: payload.nameOfBank,
        branchName: payload.branchName,
        transactionId: payload.transactionId,
        numberOfOwners: payload.numberOfOwners,
        numberOfManagers: payload.numberOfManagers,
        numberOfSignatory: payload.numberOfSignatory,
        nameOfManager: payload.nameOfManager,
        nameOfSignatory: payload.nameOfSignatory,
        updatedById: payload.updatedby,
      },
    });

    if (!updateddvat3)
      return createResponse({
        message: "Dvat3 update failed. Please try again.",
        functionname,
      });

    return createResponse({
      message: "Dvat3 updated successfully.",
      functionname,
      data: updateddvat3,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Dvat3Update;
