"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../../prisma/database";
import { user } from "@prisma/client";

interface RegisterUserPayload {
  id: number;
  firstName?: string;
  lastName?: string;
  mobileOne?: string;
  mobileTwo?: string;
  email?: string;
  address?: string;
  aadhar?: string;
  pan?: string;
  designation?: string;
  isAuthorisedSignatory?: boolean;
  signatoreUploadPath?: string;
  gender?: string;
  dob?: Date;
  passportNumber?: string;
  buildingName?: string;
  area?: string;
  city?: string;
  pincode?: string;
}

const registerUser = async (
  payload: RegisterUserPayload
): Promise<ApiResponseType<user | null>> => {
  try {
    let data_to_update: any = {};
    if (payload.firstName) data_to_update.firstName = payload.firstName;
    if (payload.lastName) data_to_update.lastName = payload.lastName;
    if (payload.mobileOne) data_to_update.mobileOne = payload.mobileOne;
    if (payload.mobileTwo) data_to_update.mobileTwo = payload.mobileTwo;
    if (payload.email) data_to_update.email = payload.email;
    if (payload.address) data_to_update.address = payload.address;
    if (payload.aadhar) data_to_update.aadhar = payload.aadhar;
    if (payload.pan) data_to_update.pan = payload.pan;
    if (payload.designation) data_to_update.designation = payload.designation;
    if (payload.isAuthorisedSignatory)
      data_to_update.isAuthorisedSignatory = payload.isAuthorisedSignatory;
    if (payload.signatoreUploadPath)
      data_to_update.signatoreUploadPath = payload.signatoreUploadPath;
    if (payload.gender) data_to_update = payload.gender;
    if (payload.dob) data_to_update = payload.dob;
    if (payload.passportNumber) data_to_update = payload.passportNumber;
    if (payload.buildingName) data_to_update = payload.buildingName;
    if (payload.area) data_to_update = payload.area;
    if (payload.city) data_to_update = payload.city;
    if (payload.pincode) data_to_update = payload.pincode;

    if (payload.email) {
      const isemailexist = await prisma.user.findFirst({
        where: {
          email: payload.email,
        },
      });

      if (isemailexist && isemailexist.id !== payload.id) {
        return {
          status: false,
          data: null,
          message: "Email already exist. Please try again.",
          functionname: "registerUser",
        };
      }
    }

    if (payload.mobileOne) {
      const iscontactoneexist = await prisma.user.findFirst({
        where: {
          mobileOne: payload.mobileOne,
        },
      });

      if (iscontactoneexist && iscontactoneexist.id !== payload.id) {
        return {
          status: false,
          data: null,
          message: "Contact number already exist. Please try again.",
          functionname: "registerUser",
        };
      }
    }

    if (payload.aadhar) {
      const isAadharExist = await prisma.user.findFirst({
        where: {
          aadhar: payload.aadhar,
        },
      });

      if (isAadharExist && isAadharExist.id !== payload.id) {
        return {
          status: false,
          data: null,
          message: "Aadhar number already exist. Please try again.",
          functionname: "registerUser",
        };
      }
    }

    const updateresponse = await prisma.user.update({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
      data: data_to_update,
    });

    if (!updateresponse)
      return {
        status: false,
        data: null,
        message: "User update failed. Please try again.",
        functionname: "registerUser",
      };

    const isRegistration = await prisma.registration.findFirst({
      where: {
        userId: payload.id,
      },
    });

    if (!isRegistration) {
      const registration = await prisma.registration.create({
        data: {
          userId: payload.id,
          createdById: payload.id,
          updatedById: payload.id,
        },
      });

      if (!registration)
        return {
          status: false,
          data: null,
          message: "Registration create failed. Please try again.",
          functionname: "registerUser",
        };
    }

    return {
      status: true,
      data: updateresponse,
      message: "User updated successfully",
      functionname: "registerUser",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "registerUser",
    };
    return response;
  }
};

export default registerUser;
