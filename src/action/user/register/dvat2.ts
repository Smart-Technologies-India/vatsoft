"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../../prisma/database";
import {
  AccountingBasis,
  FrequencyFilings,
  TypeOfAccount,
  dvat04,
} from "@prisma/client";
import { CommodityData } from "@/models/main";

interface Dvat2UpdatePayload {
  id: number;
  noticeServingBuildingName: string;
  noticeServingArea: string;
  noticeServingAddress: string;
  noticeServingCity: string;
  noticeServingPincode: string;
  additionalGodown: string;
  additionalFactory: string;
  additionalShops: string;
  otherPlaceOfBusiness: string;
  accountnumber: string;
  typeOfAccount: TypeOfAccount;
  bankName: string;
  ifscCode: string;
  addressOfBank: string;
  ownCapital: string;
  loanFromBank: string;
  loanFromOther: string;
  plantAndMachinery: string;
  landAndBuilding: string;
  otherAssetsInvestments: string;
  accountingBasis: AccountingBasis;
  frequencyFilings: FrequencyFilings;
  CommodityData: CommodityData[];
  updatedby: number;
}

const Dvat2Update = async (
  payload: Dvat2UpdatePayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = Dvat2Update.name;

  try {
    const is_exist = await prisma.dvat04.findFirst({
      where: {
        id: payload.id,
      },
    });

    if (!is_exist) {
      return createResponse({
        message: "Dvat2 not found.",
        functionname,
      });
    }

    let commodity_data_to_insert = {};

    if (payload.CommodityData.length >= 1) {
      commodity_data_to_insert = {
        ...commodity_data_to_insert,
        selectComOneId: parseInt(payload.CommodityData[0].id),
        purposeOne: payload.CommodityData[0].purpose,
        descriptionOne: payload.CommodityData[0].description,
      };
    }

    if (payload.CommodityData.length >= 2) {
      commodity_data_to_insert = {
        ...commodity_data_to_insert,
        selectComTwoId: parseInt(payload.CommodityData[1].id),
        purposeTwo: payload.CommodityData[1].purpose,
        descriptionTwo: payload.CommodityData[1].description,
      };
    }

    if (payload.CommodityData.length >= 3) {
      commodity_data_to_insert = {
        ...commodity_data_to_insert,
        selectComThreeId: parseInt(payload.CommodityData[2].id),
        purposeThree: payload.CommodityData[2].purpose,
        descriptionThree: payload.CommodityData[2].description,
      };
    }

    if (payload.CommodityData.length >= 4) {
      commodity_data_to_insert = {
        ...commodity_data_to_insert,
        selectComFourId: parseInt(payload.CommodityData[3].id),
        purposeFour: payload.CommodityData[3].purpose,
        descriptionFour: payload.CommodityData[3].description,
      };
    }

    if (payload.CommodityData.length >= 5) {
      commodity_data_to_insert = {
        ...commodity_data_to_insert,
        selectComFiveId: parseInt(payload.CommodityData[4].id),
        purposeFive: payload.CommodityData[4].purpose,
        descriptionFive: payload.CommodityData[4].description,
      };
    }

    const updateddvat2 = await prisma.dvat04.update({
      where: {
        id: is_exist.id,
      },
      data: {
        noticeServingBuildingName: payload.noticeServingBuildingName,
        noticeServingArea: payload.noticeServingArea,
        noticeServingAddress: payload.noticeServingAddress,
        noticeServingCity: payload.noticeServingCity,
        noticeServingPincode: payload.noticeServingPincode,
        additionalGodown: payload.additionalGodown,
        additionalFactory: payload.additionalFactory,
        additionalShops: payload.additionalShops,
        otherPlaceOfBusiness: payload.otherPlaceOfBusiness,
        accountnumber: payload.accountnumber,
        typeOfAccount: payload.typeOfAccount,
        bankName: payload.bankName,
        ifscCode: payload.ifscCode,
        addressOfBank: payload.addressOfBank,
        ownCapital: payload.ownCapital,
        loanFromBank: payload.loanFromBank,
        loanFromOther: payload.loanFromOther,
        plantAndMachinery: payload.plantAndMachinery,
        landAndBuilding: payload.landAndBuilding,
        otherAssetsInvestments: payload.otherAssetsInvestments,
        accountingBasis: payload.accountingBasis,
        frequencyFilings: payload.frequencyFilings,
        updatedById: payload.updatedby,
        ...commodity_data_to_insert,
      },
    });

    if (!updateddvat2)
      return createResponse({
        message: "Dvat2 update failed. Please try again.",
        functionname,
      });

    return createResponse({
      message: "Dvat2 updated successfully",
      functionname,
      data: updateddvat2,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Dvat2Update;
