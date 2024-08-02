import {
  AccountingBasis,
  FrequencyFilings,
  TypeOfAccount,
} from "@prisma/client";
import { enum_, InferInput, minLength, object, string, pipe } from "valibot"

const Dvat2Schema = object({
  noticeServingBuildingName: pipe(string(), minLength(1, "Building Number is required.") ,),
  noticeServingArea: pipe(string(), minLength(1, "Area is required.")),
  noticeServingAddress: pipe(string(), minLength(1, "Address is required.")),
  noticeServingCity: pipe(string(), minLength(1, "City is required.")),
  noticeServingPincode: pipe(string(), minLength(1, "Pincode is required.")),

  additionalGodown: pipe(string(), minLength(1, "Godowb is required.")),
  additionalFactory: pipe(string(), minLength(1, "Factory is required.")),
  additionalShops: pipe(string(), minLength(1, "Shops is required.")),
  otherPlaceOfBusiness: pipe(string(), minLength(1, "Other Place Of Business is required.") ,),

  ownCapital: pipe(string(), minLength(1, "Own Capital is required.")),
  loanFromBank: pipe(string(), minLength(1, "Load From Bank is required.")),
  loanFromOther: pipe(string(), minLength(1, "Loan From Other is required.")),
  plantAndMachinery: pipe(string(), minLength(1, "Plant And Machinery is required.")),
  landAndBuilding: pipe(string(), minLength(1, "Land And Building is required.")),
  otherAssetsInvestments: pipe(string(), minLength(1, "Other Assets Investments is required.") ,),

  accountnumber: pipe(string(), minLength(1, "Account Number is required.")),
  typeOfAccount: enum_(TypeOfAccount, "Select Type of account."),
  bankName: pipe(string(), minLength(1, "Bank Name is required.")),
  ifscCode: pipe(string(), minLength(1, "IFSC Code is required.")),
  addressOfBank: pipe(string(), minLength(1, "Address of Bank is required.")),

  accountingBasis: enum_(AccountingBasis, "Select Accounting Basis."),
  frequencyFilings: enum_(FrequencyFilings, "Select Frequency filing."),
});

type Dvat2Form = InferInput<typeof Dvat2Schema>;
export { Dvat2Schema, type Dvat2Form };
