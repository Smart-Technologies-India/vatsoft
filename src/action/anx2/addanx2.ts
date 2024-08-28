"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  LocationOfBusinessPlace,
  TypeOfPerson,
  annexure2,
} from "@prisma/client";

interface Anx2CreatePayload {
  dvatId: number;
  createdById: number;
  typeOfPerson: TypeOfPerson;
  name: string;
  branchName: string;
  contact: string;
  buildingName: string;
  areaName: string;
  village: string;
  pinCode: string;
  dateOfExtablishment: Date;
  locationOfBusinessPlace: LocationOfBusinessPlace;
  underStateAct: string;
  underCstAct: string;
}

const Anx2Create = async (
  payload: Anx2CreatePayload
): Promise<ApiResponseType<annexure2 | null>> => {
  const functionname: string = Anx2Create.name;

  try {
    const annexure2response = await prisma.annexure2.create({
      data: {
        dvatId: payload.dvatId,
        createdById: payload.createdById,
        updatedById: payload.createdById,
        typeOfPerson: payload.typeOfPerson,
        name: payload.name,
        branchName: payload.branchName,
        contact: payload.contact,
        buildingName: payload.buildingName,
        areaName: payload.areaName,
        village: payload.village,
        pinCode: payload.pinCode,
        dateOfExtablishment: payload.dateOfExtablishment,
        locationOfBusinessPlace: payload.locationOfBusinessPlace,
        underStateAct: payload.underStateAct,
        underCstAct: payload.underCstAct,
      },
    });

    if (!annexure2response)
      return createResponse({
        message: "Annexure 2 create failed. Please try again.",
        functionname,
      });

    return createResponse({
      message: "Annexure 2 updated successfully",
      functionname,
      data: annexure2response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Anx2Create;
