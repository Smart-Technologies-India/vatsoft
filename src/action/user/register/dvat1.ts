"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../../prisma/database";
import {
  ConstitutionOfBusiness,
  NatureOfBusiness,
  SelectOffice,
  TypeOfRegistration,
  dvat04,
} from "@prisma/client";

interface Dvat1CreateUpdatePayload {
  createdById: number;
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
}

const Dvat1CreateUpdate = async (
  payload: Dvat1CreateUpdatePayload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const isExist = await prisma.dvat04.findFirst({
      where: {
        createdById: payload.createdById,
      },
    });

    if (!isExist) {
      const registrationinfo = await prisma.registration.findFirst({
        where: {
          userId: payload.createdById,
        },
      });

      if (!registrationinfo)
        return {
          status: false,
          data: null,
          message: "Registration not found. Please try again.",
          functionname: "Dvat1CreateUpdate",
        };

      const dvat = await prisma.dvat04.create({
        data: {
          registrationId: registrationinfo.id,
          name: payload.name,
          ...(payload.tradename && { tradename: payload.tradename }),
          natureOfBusiness: payload.natureOfBusiness,
          constitutionOfBusiness: payload.constitutionOfBusiness,
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
          ...(payload.faxNumber && { faxNumber: payload.faxNumber }),
          createdById: payload.createdById,
          updatedById: payload.createdById,
        },
      });

      if (!dvat)
        return {
          status: false,
          data: null,
          message: "Dvat1 create failed. Please try again.",
          functionname: "Dvat1CreateUpdate",
        };

      return {
        status: true,
        data: dvat,
        message: "Dvat1 created successfully",
        functionname: "Dvat1CreateUpdate",
      };
    }

    const updateddvat = await prisma.dvat04.update({
      where: {
        id: isExist.id,
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
        updatedById: payload.createdById,
      },
    });

    if (!updateddvat)
      return {
        status: false,
        data: null,
        message: "Dvat1 update failed. Please try again.",
        functionname: "Dvat1CreateUpdate",
      };

    return {
      status: true,
      data: updateddvat,
      message: "Dvat1 updated successfully",
      functionname: "Dvat1CreateUpdate",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Dvat1CreateUpdate",
    };
    return response;
  }
};

export default Dvat1CreateUpdate;
