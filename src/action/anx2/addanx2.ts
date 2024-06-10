"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  LocationOfBusinessPlace,
  TypeOfPerson,
  annexure2,
} from "@prisma/client";

interface Anx2CreatePayload {
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
  try {
    const registrationresponse = await prisma.registration.findFirst({
      where: {
        userId: parseInt(payload.createdById.toString() ?? "0"),
      },
    });

    if (!registrationresponse)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "Anx2Create",
      };

    const annexure2response = await prisma.annexure2.create({
      data: {
        registrationId: registrationresponse.id,
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
      return {
        status: false,
        data: null,
        message: "Annexure 2 update failed. Please try again.",
        functionname: "Anx2Create",
      };

    return {
      status: true,
      data: annexure2response,
      message: "Annexure 2 updated successfully",
      functionname: "Anx2Create",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Anx2Create",
    };
    return response;
  }
};

export default Anx2Create;
