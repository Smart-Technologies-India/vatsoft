"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { Gender, TitleParticulasOfperson, annexure1 } from "@prisma/client";

interface Anx1CreatePayload {
  dvatId: number;
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
  const functionname: string = Anx1Create.name;

  try {
    const annexure1response = await prisma.annexure1.create({
      data: {
        dvatId: payload.dvatId,
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
      return createResponse({
        message: "Annexure 1 create failed. Please try again.",
        functionname,
      });

    return createResponse({
      message: "Annexure 1 updated successfully",
      functionname,
      data: annexure1response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Anx1Create;
