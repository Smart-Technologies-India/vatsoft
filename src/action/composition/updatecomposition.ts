"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { composition, CompositionStatus, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface UpdateCompositionPayload {
  id: number;
  officer_date: Date;
  officer_remark: string;
  status: CompositionStatus;
  userid: number;
  compositionScheme: boolean;
}

const UpdateComposition = async (
  payload: UpdateCompositionPayload
): Promise<ApiResponseType<composition | null>> => {
  const functionname: string = UpdateComposition.name;

  try {
    const composition_response = await prisma.composition.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
      include: {
        createdBy: true,
        dept_user: true,
      },
    });

    if (!composition_response) {
      return createResponse({
        message: "Unable to get composition",
        functionname: functionname,
      });
    }

    const update_respone = await prisma.composition.update({
      where: {
        deletedAt: null,
        deletedById: null,
        id: composition_response.id,
      },
      data: {
        officer_date: payload.officer_date,
        officerremark: payload.officer_remark,
        status: payload.status,
        updatedById: payload.userid,
      },
      include: {
        createdBy: true,
      },
    });

    if (payload.status == "COMPLETED") {
      const dvat04response = await prisma.dvat04.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          createdById: update_respone.createdBy.id,
          status: "APPROVED",
        },
      });

      if (!dvat04response)
        return createResponse({
          message: "Invalid id. Please try again.",
          functionname,
        });

      const dvat_update_response = await prisma.dvat04.update({
        where: {
          deletedAt: null,
          deletedBy: null,
          id: dvat04response.id,
          status: "APPROVED",
        },
        data: {
          compositionScheme: payload.compositionScheme,
          updatedById: payload.userid,
        },
      });
    }

    return createResponse({
      message: update_respone
        ? "Composition updated successfully"
        : "Unable to update composition.",
      functionname: functionname,
      data: update_respone ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateComposition;
