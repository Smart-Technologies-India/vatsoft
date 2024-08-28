import { DepositType } from "@prisma/client";
import { enum_, InferInput, minLength, object, string, pipe } from "valibot";

const Dvat3Schema = object({
  securityDepositAmount: pipe(
    string("Security Deposit Amount in required."),
    minLength(1, "Security Deposit Amount in required.")
  ),
  depositType: enum_(DepositType, "Deposit Type is required."),
  dateOfExpiry: pipe(
    string("Date of Expiry is required."),
    minLength(1, "Date of Expiry is required.")
  ),
  nameOfBank: pipe(
    string("Name of Bank is required."),
    minLength(1, "Name of Bank is required.")
  ),
  branchName: pipe(
    string("Branch Name is required."),
    minLength(1, "Branch Name is required.")
  ),
  transactionId: pipe(
    string("Transaction ID is required."),
    minLength(1, "Transaction ID is required.")
  ),
  numberOfOwners: pipe(
    string("Number of person interested in business is required."),
    minLength(1, "Number of person interested in business is required.")
  ),
  numberOfManagers: pipe(
    string("Number of Managers is required."),
    minLength(1, "Number of Managers is required.")
  ),
  numberOfSignatory: pipe(
    string("Number of Signatory is required."),
    minLength(1, "Number of Signatory is required.")
  ),
  nameOfManager: pipe(string(), minLength(1, "Name of Manager is required.")),
  nameOfSignatory: pipe(
    string(),
    minLength(1, "Name of Signatory is required.")
  ),
});

type Dvat3Form = InferInput<typeof Dvat3Schema>;
export { Dvat3Schema, type Dvat3Form };
