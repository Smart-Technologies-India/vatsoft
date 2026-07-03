"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export interface RefinerySwitchOption {
  id: number;
  name: string;
  tinNumber: string;
  company: string;
}

export interface CurrentRefineryProfile {
  id: number;
  tinNumber: string;
  tradeName: string;
  legalName: string;
  company: string;
  pan: string;
  gst: string;
  address: string;
  city: string;
  pincode: string;
  email: string;
  contactOne: string;
  contactTwo: string;
}

export interface RefinerySwitchOptionsResponse {
  currentRefineryId: number;
  currentCompany: string;
  currentRefinery: CurrentRefineryProfile;
  options: RefinerySwitchOption[];
}

const GetRefinerySwitchOptions = async (): Promise<
  ApiResponseType<RefinerySwitchOptionsResponse | null>
> => {
  const functionname = GetRefinerySwitchOptions.name;

  try {
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentRefineryId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const currentRefinery = await prisma.refinery.findFirst({
      where: {
        deletedAt: null,
        id: currentRefineryId,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (!currentRefinery || !currentRefinery.company) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const sameCompanyRefineries = await prisma.refinery.findMany({
      where: {
        deletedAt: null,
        company: currentRefinery.company,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        tradename: true,
        tinNumber: true,
        company: true,
      },
    });

    const options: RefinerySwitchOption[] = sameCompanyRefineries.map(
      (item) => ({
        id: item.id,
        name:
          item.tradename?.trim() || item.name?.trim() || `Refinery ${item.id}`,
        tinNumber: item.tinNumber?.trim() || "-",
        company: item.company || "-",
      }),
    );

    return createResponse({
      message: "Refinery options fetched successfully.",
      functionname,
      data: {
        currentRefineryId: currentRefinery.id,
        currentCompany: currentRefinery.company,
        currentRefinery: {
          id: currentRefinery.id,
          tinNumber: currentRefinery.tinNumber?.trim() || "-",
          tradeName: currentRefinery.tradename?.trim() || "-",
          legalName: currentRefinery.name?.trim() || "-",
          company: currentRefinery.company || "-",
          pan: currentRefinery.pan?.trim() || "-",
          gst: currentRefinery.gst?.trim() || "-",
          address: currentRefinery.address?.trim() || "-",
          city: currentRefinery.city?.trim() || "-",
          pincode: currentRefinery.pincode?.trim() || "-",
          email: currentRefinery.email?.trim() || "-",
          contactOne: currentRefinery.contact_one?.trim() || "-",
          contactTwo: currentRefinery.contact_two?.trim() || "-",
        },
        options,
      },
    });
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    };
  }
};

export default GetRefinerySwitchOptions;
