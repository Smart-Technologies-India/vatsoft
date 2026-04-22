"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../../prisma/database";
import {
  Dvat04Commodity,
  DvatStatus,
  FrequencyFilings,
  Role,
  SelectOffice,
  dvat04,
  user,
} from "@prisma/client";

interface CreateNewUserDvat04Payload {
  firstName: string;
  lastName: string;
  mobile: string;
  pan: string;
  tinNumber: string;
  name: string;
  tradename: string;
  selectOffice: SelectOffice;
  compositionScheme: boolean;
  commodity: Dvat04Commodity;
  frequencyFilings: FrequencyFilings;
}

type CreateNewUserDvat04Response = {
  user: user;
  dvat04: dvat04;
  isExistingUser: boolean;
};

const ALLOWED_COMMODITIES: Dvat04Commodity[] = [
  Dvat04Commodity.FUEL,
  Dvat04Commodity.LIQUOR,
];

const CreateNewUserDvat04 = async (
  payload: CreateNewUserDvat04Payload,
): Promise<ApiResponseType<CreateNewUserDvat04Response | null>> => {
  const functionname = CreateNewUserDvat04.name;

  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return createResponse({
        functionname,
        message: "Not authenticated. Please login.",
      });
    }

    const mobile = payload.mobile.trim();
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const pan = payload.pan.trim().toUpperCase();
    const tinNumber = payload.tinNumber.trim();
    const name = payload.name.trim();
    const tradename = payload.tradename.trim();

    if (
      !mobile ||
      !firstName ||
      !lastName ||
      !pan ||
      !tinNumber ||
      !name ||
      !tradename
    ) {
      return createResponse({
        functionname,
        message: "All required fields must be filled.",
      });
    }

    if (!/^\d{11}$/.test(tinNumber)) {
      return createResponse({
        functionname,
        message: "TIN number must be exactly 11 digits.",
      });
    }

    if (payload.selectOffice === SelectOffice.DAMAN) {
      if (!tinNumber.startsWith("2500")) {
        return createResponse({
          functionname,
          message: "For DAMAN office, TIN number must start with 2500.",
        });
      }
    }

    if (payload.selectOffice === SelectOffice.DIU) {
      if (!tinNumber.startsWith("2501")) {
        return createResponse({
          functionname,
          message: "For DIU office, TIN number must start with 2501.",
        });
      }
    }

    if (payload.selectOffice === SelectOffice.Dadra_Nagar_Haveli) {
      if (!tinNumber.startsWith("2600") && !tinNumber.startsWith("2650")) {
        return createResponse({
          functionname,
          message:
            "For Dadra_Nagar_Haveli office, TIN number must start with 2600 or 2650.",
        });
      }
    }

    if (!Object.values(SelectOffice).includes(payload.selectOffice)) {
      return createResponse({
        functionname,
        message: "Invalid office selected.",
      });
    }

    if (!ALLOWED_COMMODITIES.includes(payload.commodity)) {
      return createResponse({
        functionname,
        message: "Only FUEL or LIQUOR commodity is allowed.",
      });
    }

    if (!Object.values(FrequencyFilings).includes(payload.frequencyFilings)) {
      return createResponse({
        functionname,
        message: "Invalid filing frequency selected.",
      });
    }

    const isTinExists = await prisma.dvat04.findFirst({
      where: {
        tinNumber,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (isTinExists) {
      return createResponse({
        functionname,
        message: "TIN number already exists. Please use a unique TIN number.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: {
          mobileOne: mobile,
          deletedAt: null,
        },
      });

      const userData =
        existingUser ??
        (await tx.user.create({
          data: {
            firstName,
            lastName,
            mobileOne: mobile,
            pan,
            role: Role.USER,
          },
        }));

      const tinMasterData = await tx.tin_number_master.create({
        data: {
          tin_number: tinNumber,
          name_of_dealer: tradename,
          status: "ACTIVE",
        },
      });

      const dvatData = await tx.dvat04.create({
        data: {
          createdById: userData.id,
          updatedById: userData.id,
          tin_master_id: tinMasterData.id,
          name,
          tradename,
          tinNumber,
          contact_one: userData.mobileOne,
          selectOffice: payload.selectOffice,
          compositionScheme: payload.compositionScheme,
          commodity: payload.commodity,
          frequencyFilings: payload.frequencyFilings,
          status: DvatStatus.VERIFICATION,
          pan,
        },
      });

      await tx.registration.create({
        data: {
          dvat04Id: dvatData.id,
          dept_user_id: currentUserId,
          createdById: currentUserId,
        },
      });

      return {
        user: userData,
        dvat04: dvatData,
        isExistingUser: Boolean(existingUser),
      };
    });

    return createResponse({
      functionname,
      message: result.isExistingUser
        ? "Existing user found. DVAT-04 created successfully."
        : "New user and DVAT-04 created successfully.",
      data: result,
    });
  } catch (error) {
    return createResponse({
      functionname,
      message: errorToString(error),
    });
  }
};

export default CreateNewUserDvat04;
