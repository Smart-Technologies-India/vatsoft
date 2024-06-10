import {
  AccountingBasis,
  FrequencyFilings,
  TypeOfAccount,
} from "@prisma/client";
import { Input, enum_, minLength, object, string } from "valibot";

const Dvat2Schema = object({
  noticeServingBuildingName: string([
    minLength(1, "Building Number is required."),
  ]),
  noticeServingArea: string([minLength(1, "Area is required.")]),
  noticeServingAddress: string([minLength(1, "Address is required.")]),
  noticeServingCity: string([minLength(1, "City is required.")]),
  noticeServingPincode: string([minLength(1, "Pincode is required.")]),

  additionalGodown: string([minLength(1, "Godowb is required.")]),
  additionalFactory: string([minLength(1, "Factory is required.")]),
  additionalShops: string([minLength(1, "Shops is required.")]),
  otherPlaceOfBusiness: string([
    minLength(1, "Other Place Of Business is required."),
  ]),

  ownCapital: string([minLength(1, "Own Capital is required.")]),
  loanFromBank: string([minLength(1, "Load From Bank is required.")]),
  loanFromOther: string([minLength(1, "Loan From Other is required.")]),
  plantAndMachinery: string([minLength(1, "Plant And Machinery is required.")]),
  landAndBuilding: string([minLength(1, "Land And Building is required.")]),
  otherAssetsInvestments: string([
    minLength(1, "Other Assets Investments is required."),
  ]),

  accountnumber: string([minLength(1, "Account Number is required.")]),
  typeOfAccount: enum_(TypeOfAccount, "Select Type of account."),
  bankName: string([minLength(1, "Bank Name is required.")]),
  ifscCode: string([minLength(1, "IFSC Code is required.")]),
  addressOfBank: string([minLength(1, "Address of Bank is required.")]),

  accountingBasis: enum_(AccountingBasis, "Select Accounting Basis."),
  frequencyFilings: enum_(FrequencyFilings, "Select Frequency filing."),
});

type Dvat2Form = Input<typeof Dvat2Schema>;
export { Dvat2Schema, type Dvat2Form };
