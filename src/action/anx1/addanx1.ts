"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { Gender, TitleParticulasOfperson, annexure1 } from "@prisma/client";

interface Anx1CreatePayload {
  createdById: number;
  titleParticulasOfperson: TitleParticulasOfperson;
  nameOfPerson: string;
  dateOfBirth: Date;
  gender: Gender;
  fatherName: string;
  panNumber: string;
  aadharNumber: string;
  designation: string;
  eductionQualification: string;
  rbuildingName: string;
  rareaName: string;
  rvillageName: string;
  rpincode: string;
  pbuildingName: string;
  pareaName: string;
  pvillageName: string;
  ppincode: string;
  contact: string;
  email: string;
}

const Anx1Create = async (
  payload: Anx1CreatePayload
): Promise<ApiResponseType<annexure1 | null>> => {
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
        functionname: "Anx1Create",
      };

    const annexure1response = await prisma.annexure1.create({
      data: {
        registrationId: registrationresponse.id,
        createdById: payload.createdById,
        updatedById: payload.createdById,
        titleParticulasOfperson: payload.titleParticulasOfperson,
        nameOfPerson: payload.nameOfPerson,
        dateOfBirth: payload.dateOfBirth,
        gender: payload.gender,
        fatherName: payload.fatherName,
        panNumber: payload.panNumber,
        aadharNumber: payload.aadharNumber,
        designation: payload.designation,
        eductionQualification: payload.eductionQualification,
        rbuildingName: payload.rbuildingName,
        rareaName: payload.rareaName,
        rvillageName: payload.rvillageName,
        rpincode: payload.rpincode,
        pbuildingName: payload.pbuildingName,
        pareaName: payload.pareaName,
        pvillageName: payload.pvillageName,
        ppincode: payload.ppincode,
        contact: payload.contact,
        email: payload.email,
      },
    });

    if (!annexure1response)
      return {
        status: false,
        data: null,
        message: "Annexure 1 update failed. Please try again.",
        functionname: "Anx1Create",
      };

    return {
      status: true,
      data: annexure1response,
      message: "Annexure 1 updated successfully",
      functionname: "Anx1Create",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Anx1Create",
    };
    return response;
  }
};

export default Anx1Create;
