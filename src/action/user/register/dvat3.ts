"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../../prisma/database";
import { DepositType, dvat04 } from "@prisma/client";

interface Dvat3CreateUpdatePayload {
  createdById: number;
  securityDepositAmount?: string;
  depositType: DepositType;
  dateOfExpiry: Date;
  nameOfBank: string;
  branchName: string;
  transactionId: string;
  numberOfOwners: number;
  nmberOfManagers: number;
  numberOfSignatory: number;
  nameOfManager: string;
  nameOfSignatory: string;
}

const Dvat3CreateUpdate = async (
  payload: Dvat3CreateUpdatePayload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const isExist = await prisma.dvat04.findFirst({
      where: {
        createdById: payload.createdById,
      },
    });

    if (!isExist) {
      return {
        status: false,
        data: null,
        message: "Dvat3 not found.",
        functionname: "Dvat3CreateUpdate",
      };
    }

    const updateddvat3 = await prisma.dvat04.update({
      where: {
        id: isExist.id,
      },
      data: {
        securityDepositAmount: payload.securityDepositAmount,
        depositType: payload.depositType,
        dateOfExpiry: payload.dateOfExpiry,
        nameOfBank: payload.nameOfBank,
        branchName: payload.branchName,
        transactionId: payload.transactionId,
        numberOfOwners: payload.numberOfOwners,
        nmberOfManagers: payload.nmberOfManagers,
        numberOfSignatory: payload.numberOfSignatory,
        nameOfManager: payload.nameOfManager,
        nameOfSignatory: payload.nameOfSignatory,
        updatedById: payload.createdById,
      },
    });

    if (!updateddvat3)
      return {
        status: false,
        data: null,
        message: "Dvat3 update failed. Please try again.",
        functionname: "Dvat3CreateUpdate",
      };

    return {
      status: true,
      data: updateddvat3,
      message: "Dvat3 updated successfully",
      functionname: "Dvat3CreateUpdate",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Dvat3CreateUpdate",
    };
    return response;
  }
};

export default Dvat3CreateUpdate;
