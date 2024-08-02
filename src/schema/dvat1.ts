import { isContainSpace } from "@/utils/methods";
import {
  ConstitutionOfBusiness,
  DepositType,
  NatureOfBusiness,
  SelectOffice,
  TypeOfRegistration,
} from "@prisma/client";
import { InferInput, boolean, check, email, enum_, maxLength, minLength, object, string, pipe } from "valibot"

const Dvat1Schema = object({
  name: pipe(string(), minLength(1, "Name is required.")),
  // tradename: string([minLength(1, "Trade Name is required.")]),
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
  turnoverLastFinancialYear: pipe(string(), minLength(1, "Turnover Last Financial Year is required.") ,),
  turnoverCurrentFinancialYear: pipe(string(), minLength(1, "Turnover Current Financial Year is required.") ,),
  vatLiableDate: pipe(string(), minLength(1, "VAT Liable Date is required.")),
  pan: pipe(string(), minLength(1, "PAN is required.")),
  gst: pipe(string(), minLength(1, "GST is required.")),
  buildingNumber: pipe(string(), minLength(1, "Building Number is required.")),
  area: pipe(string(), minLength(1, "Area is required.")),
  address: pipe(string(), minLength(1, "Address is required.")),
  city: pipe(string(), minLength(1, "City is required.")),
  pincode: pipe(string(), minLength(1, "Pincode is required.")),
  contact_one: pipe(string(), minLength(1, "Contact One is required.") , check(isContainSpace, "Contact One should not contain space.") , maxLength(10, "Contact One should not exceed 10 characters.") ,),
  // contact_two: string([
  //   minLength(1, "Contact Two is required."),
  //   custom(isContainSpace, "Contact Two should not contain space."),
  //   maxLength(10, "Contact Two should not exceed 10 characters."),
  // ]),
  email: pipe(string(), minLength(1, "Email is required.") , email("Enter a valid email.") , check(isContainSpace, "Email should not contain space.") ,),
  // faxNumber: string([minLength(1, "Fax Number is required.")]),
});

type Dvat1Form = InferInput<typeof Dvat1Schema>;
export { Dvat1Schema, type Dvat1Form };
