"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  NatureOfBusiness,
  registration,
  RegistrationStatus,
} from "@prisma/client";

interface UpdateRegistrationPayload {
  id: number;
  updatedby: number;

  physicalVerification?: boolean;
  date_of_visit?: Date;
  natureOfBusiness?: NatureOfBusiness;
  date_of_purchases?: Date;
  amount_of_purchases?: string;
  date_of_sales?: Date;
  amount_of_sales?: string;
  capital_proposed?: string;
  amount_of_stock?: string;
  books_of_account?: string;
  verification_of_originals?: string;
  verification_of_title?: string;
  other_information?: string;
  security_deposit?: boolean;
  security_deposit_amount?: string;
  security_deposit_date?: Date;
  date_of_expiry_security_deposit?: Date;
  bank?: string;
  name_of_person?: string;
  address?: string;
  plant_and_machinery?: string;
  raw_materials?: string;
  packing_materials?: string;

  dept_user_id?: number;
  commissioner_note?: string;
  joint_commissioner_note?: string;
  dy_commissioner?: string;
  vat_officer_note?: string;
  asst_vat_officer_note?: string;
  inspector_note?: string;
  udc_note?: string;
  ldc_note?: string;

  registration_date?: Date;
  all_doc_upload?: boolean;
  all_appointment?: boolean;
  necessary_payments?: boolean;

  status: RegistrationStatus;
}

const UpdateRegistration = async (
  payload: UpdateRegistrationPayload
): Promise<ApiResponseType<registration | null>> => {
  const functionname: string = UpdateRegistration.name;

  try {
    const is_exist = await prisma.registration.findFirst({
      where: {
        id: payload.id,
      },
    });

    if (!is_exist)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    const annexure1response = await prisma.registration.update({
      where: {
        id: is_exist.id,
      },

      data: {
        status: payload.status,
        ...(payload.updatedby && { updatedById: payload.updatedby }),

        ...(payload.physicalVerification && {
          physicalVerification: payload.physicalVerification,
        }),
        ...(payload.date_of_visit && { date_of_visit: payload.date_of_visit }),
        ...(payload.natureOfBusiness && {
          natureOfBusiness: payload.natureOfBusiness,
        }),
        ...(payload.date_of_purchases && {
          date_of_purchases: payload.date_of_purchases,
        }),
        ...(payload.amount_of_purchases && {
          amount_of_purchases: payload.amount_of_purchases,
        }),
        ...(payload.date_of_sales && { date_of_sales: payload.date_of_sales }),
        ...(payload.amount_of_sales && {
          amount_of_sales: payload.amount_of_sales,
        }),
        ...(payload.capital_proposed && {
          capital_proposed: payload.capital_proposed,
        }),
        ...(payload.amount_of_stock && {
          amount_of_stock: payload.amount_of_stock,
        }),
        ...(payload.books_of_account && {
          books_of_account: payload.books_of_account,
        }),
        ...(payload.verification_of_originals && {
          verification_of_originals: payload.verification_of_originals,
        }),
        ...(payload.verification_of_title && {
          verification_of_title: payload.verification_of_title,
        }),
        ...(payload.other_information && {
          other_information: payload.other_information,
        }),
        ...(payload.security_deposit && {
          security_deposit: payload.security_deposit,
        }),
        ...(payload.security_deposit_amount && {
          security_deposit_amount: payload.security_deposit_amount,
        }),
        ...(payload.security_deposit_date && {
          security_deposit_date: payload.security_deposit_date,
        }),
        ...(payload.date_of_expiry_security_deposit && {
          date_of_expiry_security_deposit:
            payload.date_of_expiry_security_deposit,
        }),
        ...(payload.bank && { bank: payload.bank }),
        ...(payload.name_of_person && {
          name_of_person: payload.name_of_person,
        }),
        ...(payload.address && { address: payload.address }),
        ...(payload.plant_and_machinery && {
          plant_and_machinery: payload.plant_and_machinery,
        }),
        ...(payload.raw_materials && { raw_materials: payload.raw_materials }),
        ...(payload.packing_materials && {
          packing_materials: payload.packing_materials,
        }),

        ...(payload.dept_user_id && {
          dept_user_id: payload.dept_user_id,
        }),
        ...(payload.commissioner_note && {
          commissioner_note: payload.commissioner_note,
        }),
        ...(payload.joint_commissioner_note && {
          joint_commissioner_note: payload.joint_commissioner_note,
        }),
        ...(payload.dy_commissioner && {
          dy_commissioner: payload.dy_commissioner,
        }),
        ...(payload.vat_officer_note && {
          vat_officer_note: payload.vat_officer_note,
        }),
        ...(payload.asst_vat_officer_note && {
          asst_vat_officer_note: payload.asst_vat_officer_note,
        }),
        ...(payload.inspector_note && {
          inspector_note: payload.inspector_note,
        }),
        ...(payload.udc_note && { udc_note: payload.udc_note }),
        ...(payload.ldc_note && { ldc_note: payload.ldc_note }),

        ...(payload.registration_date && {
          registration_date: payload.registration_date,
        }),
        ...(payload.all_doc_upload && {
          all_doc_upload: payload.all_doc_upload,
        }),
        ...(payload.all_appointment && {
          all_appointment: payload.all_appointment,
        }),
        ...(payload.necessary_payments && {
          necessary_payments: payload.necessary_payments,
        }),
      },
    });

    if (!annexure1response)
      return createResponse({
        message: "Annexure 1 update failed. Please try again.",
        functionname,
      });

    return createResponse({
      data: annexure1response,
      message: "Annexure 1 updated successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateRegistration;
