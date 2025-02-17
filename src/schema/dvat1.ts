import { isContainSpace, validatePanCard } from "@/utils/methods";
import {
  ConstitutionOfBusiness,
  DepositType,
  NatureOfBusiness,
  SelectOffice,
  TypeOfRegistration,
} from "@prisma/client";
import {
  InferInput,
  boolean,
  check,
  email,
  enum_,
  maxLength,
  minLength,
  object,
  string,
  pipe,
  optional,
  nullish,
} from "valibot";

const Dvat1Schema = object({
  name: pipe(string("Name is required."), minLength(1, "Name is required.")),
  tradename: nullish(string()),

  natureOfBusiness: enum_(NatureOfBusiness, "Nature of Business is required."),
  constitutionOfBusiness: enum_(
    ConstitutionOfBusiness,
    "Constitution of Business is required."
  ),
  selectOffice: enum_(SelectOffice, "Select Office is required."),
  typeOfRegistration: enum_(
    TypeOfRegistration,
    "Type of Registration is required."
  ),
  compositionScheme: boolean("Composition Scheme is required."),
  annualTurnoverCategory: boolean("Annual Turnover Category is required."),
  turnoverLastFinancialYear: pipe(
    string("Turnover Last Financial Year is required."),
    minLength(1, "Turnover Last Financial Year is required.")
  ),
  turnoverCurrentFinancialYear: pipe(
    string("Turnover Current Financial Year is required."),
    minLength(1, "Turnover Current Financial Year is required.")
  ),
  vatLiableDate: pipe(
    string("VAT Liable Date is required."),
    minLength(1, "VAT Liable Date is required.")
  ),
  pan: pipe(
    string("PAN is required."),
    minLength(1, "PAN is required."),
    check(validatePanCard, "Enter valid pan card number")
  ),
  gst: pipe(string("GST is required. NA if not available."), minLength(1, "GST is required. NA if not available.")),
  buildingNumber: pipe(
    string("Building Number is required."),
    minLength(1, "Building Number is required.")
  ),
  area: pipe(
    string("Area/Locality is required."),
    minLength(1, "Area/Locality is required.")
  ),
  address: pipe(
    string("Address is required."),
    minLength(1, "Address is required.")
  ),
  city: pipe(string("City is required."), minLength(1, "City is required.")),
  pincode: pipe(
    string("Pincode is required."),
    minLength(1, "Pincode is required.")
  ),
  contact_one: pipe(
    string("Contact One is required."),
    minLength(1, "Contact One is required."),
    check(isContainSpace, "Contact One should not contain space."),
    maxLength(10, "Contact One should not exceed 10 characters.")
  ),
  contact_two: nullish(string()),
  faxNumber: nullish(string()),
  email: pipe(
    string("Email is required."),
    minLength(1, "Email is required."),
    email("Enter a valid email."),
    check(isContainSpace, "Email should not contain space.")
  ),
  // faxNumber: string([minLength(1, "Fax Number is required.")]),
});

type Dvat1Form = InferInput<typeof Dvat1Schema>;
export { Dvat1Schema, type Dvat1Form };
