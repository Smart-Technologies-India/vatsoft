"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import {
  ConstitutionOfBusiness,
  NatureOfBusiness,
  SelectOffice,
  TypeOfRegistration,
  dvat04,
} from "@prisma/client";

interface Dvat1CreateUpdatePayload {
  id: number;
  name: string;
  tradename?: string;
  natureOfBusiness: NatureOfBusiness;
  constitutionOfBusiness: ConstitutionOfBusiness;
  selectOffice: SelectOffice;
  typeOfRegistration: TypeOfRegistration;
  compositionScheme: boolean;
  annualTurnoverCategory: boolean;
  turnoverLastFinancialYear: string;
  turnoverCurrentFinancialYear: string;
  vatLiableDate: Date;
  pan: string;
  gst: string;
  buildingNumber: string;
  area: string;
  address: string;
  city: string;
  pincode: string;
  contact_one: string;
  contact_two?: string;
  email: string;
  faxNumber?: string;
  updatedby: number;
}

const DvatUpdate = async (
  payload: Dvat1CreateUpdatePayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = DvatUpdate.name;

  try {
    const is_exist = await prisma.dvat04.findFirst({
      where: {
        id: payload.id,
      },
    });

    if (!is_exist)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    const updateddvat = await prisma.dvat04.update({
      where: {
        id: is_exist.id,
      },
      data: {
        name: payload.name,
        tradename: payload.tradename,
        constitutionOfBusiness: payload.constitutionOfBusiness,
        natureOfBusiness: payload.natureOfBusiness,
        selectOffice: payload.selectOffice,
        typeOfRegistration: payload.typeOfRegistration,
        compositionScheme: payload.compositionScheme,
        annualTurnoverCategory: payload.annualTurnoverCategory,
        turnoverLastFinancialYear: payload.turnoverLastFinancialYear,
        turnoverCurrentFinancialYear: payload.turnoverCurrentFinancialYear,
        vatLiableDate: payload.vatLiableDate,
        pan: payload.pan,
        gst: payload.gst,
        buildingNumber: payload.buildingNumber,
        area: payload.area,
        address: payload.address,
        city: payload.city,
        pincode: payload.pincode,
        contact_one: payload.contact_one,
        ...(payload.contact_two && { contact_two: payload.contact_two }),
        email: payload.email,
        faxNumber: payload.faxNumber,
        updatedById: payload.updatedby,
      },
    });

    if (!updateddvat)
      return createResponse({
        message: "Dvat1 update failed. Please try again.",
        functionname,
      });
    return createResponse({
      message: "Dvat1 update failed. Please try again.",
      functionname,
      data: updateddvat,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DvatUpdate;
