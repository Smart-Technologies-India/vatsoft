import { DepositType } from "@prisma/client";
import {
  Input,
  enum_,
  minLength,
  minValue,
  number,
  object,
  string,
} from "valibot";

const Dvat3Schema = object({
  securityDepositAmount: string([
    minLength(1, "Security Deposit Amount in required."),
  ]),
  depositType: enum_(DepositType, "Deposit Type is required."),
  dateOfExpiry: string([minLength(1, "Date of Expiry is required.")]),
  nameOfBank: string([minLength(1, "Name of Bank is required.")]),
  branchName: string([minLength(1, "Branch Name is required.")]),
  transactionId: string([minLength(1, "Transaction ID is required.")]),
  numberOfOwners: number([
    minValue(1, "Number of person intrested in business is required."),
  ]),
  nmberOfManagers: number([minValue(1, "Number of Managers is required.")]),
  numberOfSignatory: number([minValue(1, "Number of Signatory is required.")]),
  nameOfManager: string([minLength(1, "Name of Manager is required.")]),
  nameOfSignatory: string([minLength(1, "Name of Signatory is required.")]),
});

type Dvat3Form = Input<typeof Dvat3Schema>;
export { Dvat3Schema, type Dvat3Form };
