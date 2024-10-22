import { Dvat04Commodity, NatureOfBusiness } from "@prisma/client";
import {
  InferInput,
  minLength,
  object,
  string,
  pipe,
  optional,
  enum_,
  boolean,
  nullable,
} from "valibot";

const RegistrationSchema = object({
  date_of_visit: pipe(
    string("Date of visit is required"),
    minLength(1, "Date of visit is required.")
  ),
  natureOfBusiness: enum_(NatureOfBusiness, "Nature of Business is required."),
  date_of_purchases: pipe(
    string("Date of purchases is required."),
    minLength(1, "Date of purchases is required.")
  ),
  amount_of_purchases: pipe(
    string("Amount of purchases is required."),
    minLength(1, "Amount of purchases is required.")
  ),
  date_of_sales: pipe(
    string("Date of sales is required."),
    minLength(1, "Date of sales is required.")
  ),
  amount_of_sales: pipe(
    string("Amount of sales is required."),
    minLength(1, "Amount of sales is required.")
  ),
  capital_proposed: pipe(
    string("Capital proposed is required."),
    minLength(1, "Capital proposed is required.")
  ),
  amount_of_stock: pipe(
    string("Amount of stock is required."),
    minLength(1, "Amount of stock is required.")
  ),
  books_of_account: pipe(
    string("Books of account is required."),
    minLength(1, "Books of account is required.")
  ),
  verification_of_originals: pipe(
    string("Verification of originals is required."),
    minLength(1, "Verification of originals is required.")
  ),
  verification_of_title: pipe(
    string("Verification of title is required."),
    minLength(1, "Verification of title is required.")
  ),
  other_information: pipe(
    string("Other information is required."),
    minLength(1, "Other information is required.")
  ),

  security_deposit: boolean("Security deposit is required."),
  security_deposit_amount: pipe(
    string("Security deposite amount is required."),
    minLength(1, "Security deposite amount is required.")
  ),
  security_deposit_date: pipe(
    string("Security deposit is required."),
    minLength(1, "Security deposit is required.")
  ),
  date_of_expiry_security_deposit: pipe(
    string("Date of expiry security deposit is required."),
    minLength(1, "Date of expiry security deposit is required.")
  ),

  bank: pipe(
    string("Bank Name is required."),
    minLength(1, "Bank Name is required.")
  ),
  name_of_person: pipe(
    string("Nane of person is required."),
    minLength(1, "Name of person is required.")
  ),
  address: pipe(
    string("Address is required."),
    minLength(1, "Address is required.")
  ),
  plant_and_machinery: pipe(
    string("Plant and machinery is required."),
    minLength(1, "Plant and machinery is required.")
  ),
  raw_materials: pipe(
    string("Raw materials is required."),
    minLength(1, "Raw materials is required.")
  ),
  packing_materials: pipe(
    string("Packing materials is required."),
    minLength(1, "Packing materials is required.")
  ),

  commissioner_note: optional(string()),
  joint_commissioner_note: optional(string()),
  dy_commissioner: optional(string()),
  vat_officer_note: optional(string()),
  asst_vat_officer_note: optional(string()),
  inspector_note: optional(string()),
  udc_note: optional(string()),
  ldc_note: optional(string()),

  registration_date: optional(string()),
  all_doc_upload: optional(boolean()),
  all_appointment: optional(boolean()),
  necessary_payments: optional(boolean()),
  commodity: enum_(Dvat04Commodity, "Select Commodity"),
});

type RegistrationForm = InferInput<typeof RegistrationSchema>;
export { RegistrationSchema, type RegistrationForm };
