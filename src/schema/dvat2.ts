import {
  AccountingBasis,
  FrequencyFilings,
  TypeOfAccount,
} from "@prisma/client";
import { enum_, InferInput, minLength, object, string, pipe } from "valibot";

const Dvat2Schema = object({
  noticeServingBuildingName: pipe(
    string("Shop Number is required."),
    minLength(1, "Shop Number is required.")
  ),
  noticeServingArea: pipe(
    string("Area/Locality is required."),
    minLength(1, "Area/Locality is required.")
  ),
  noticeServingAddress: pipe(
    string("Address is required."),
    minLength(1, "Address is required.")
  ),
  noticeServingCity: pipe(
    string("City is required."),
    minLength(1, "City is required.")
  ),
  noticeServingPincode: pipe(
    string("Pincode is required."),
    minLength(1, "Pincode is required.")
  ),

  additionalGodown: pipe(
    string("Godowb is required."),
    minLength(1, "Godowb is required.")
  ),
  additionalFactory: pipe(
    string("Factory is required."),
    minLength(1, "Factory is required.")
  ),
  additionalShops: pipe(
    string("Shops is required."),
    minLength(1, "Shops is required.")
  ),
  otherPlaceOfBusiness: pipe(
    string("Other Place Of Business is required."),
    minLength(1, "Other Place Of Business is required.")
  ),

  ownCapital: pipe(
    string("Own Capital is required."),
    minLength(1, "Own Capital is required.")
  ),
  loanFromBank: pipe(
    string("Load From Bank is required."),
    minLength(1, "Load From Bank is required.")
  ),
  loanFromOther: pipe(
    string("Loan From Other is required."),
    minLength(1, "Loan From Other is required.")
  ),
  plantAndMachinery: pipe(
    string("Plant And Machinery is required."),
    minLength(1, "Plant And Machinery is required.")
  ),
  landAndBuilding: pipe(
    string("Land And Building is required."),
    minLength(1, "Land And Building is required.")
  ),
  otherAssetsInvestments: pipe(
    string("Other Assets Investments is required."),
    minLength(1, "Other Assets Investments is required.")
  ),

  accountnumber: pipe(
    string("Account Number is required."),
    minLength(1, "Account Number is required.")
  ),
  typeOfAccount: enum_(TypeOfAccount, "Select Type of account."),
  bankName: pipe(
    string("Bank Name is required."),
    minLength(1, "Bank Name is required.")
  ),
  ifscCode: pipe(
    string("IFSC Code is required."),
    minLength(1, "IFSC Code is required.")
  ),
  addressOfBank: pipe(
    string("Address of Bank is required."),
    minLength(1, "Address of Bank is required.")
  ),

  accountingBasis: enum_(AccountingBasis, "Select Accounting Basis."),
  frequencyFilings: enum_(FrequencyFilings, "Select Frequency filing."),
});

type Dvat2Form = InferInput<typeof Dvat2Schema>;
export { Dvat2Schema, type Dvat2Form };
