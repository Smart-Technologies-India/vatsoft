import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  Quarter,
  ReturnType,
  SaleOfInterstate,
} from "@prisma/client";
import {
  Input,
  enum_,
  minLength,
  minValue,
  number,
  object,
  string,
} from "valibot";

const record30Schema = object({
  rr_number: string([minLength(1, "RR Number is required.")]),
  return_type: enum_(ReturnType, "Return Type is required."),
  year: string([minLength(1, "year is required.")]),
  quarter: enum_(Quarter, "quarter Type is required."),
  month: string([minLength(1, "Month is required.")]),
  // filing_datetime: string([minLength(1, "Month is required.")]),
  // file_status: enum_(Status, "File Status is required."),
  total_tax_amount: string([minLength(1, "Total tax amount is required.")]),

  dvat_type: enum_(DvatType, "Dvat type is required."),
  urn_number: string([minLength(1, "URN Number is required.")]),
  invoice_number: string([minLength(1, "Invoice Number is required.")]),
  invoice_date: string([minLength(1, "Invoice Date is required.")]),
  total_invoice_number: string([
    minLength(1, "Total Invoice Amount is required."),
  ]),
  seller_tin_numberId: number([minValue(0, "Seller id is required.")]),
  category_of_entry: enum_(CategoryOfEntry, "Category of entry is required."),
  input_tax_credit: enum_(InputTaxCredit, "Input Tax Credit is required."),
  nature_purchase: enum_(NaturePurchase, "Nature Purchase is required."),
  nature_purchase_option: enum_(
    NaturePurchaseOption,
    "Nature Purchase option  is required."
  ),
  place_of_supply: number([minValue(0, "Place of Supply is required.")]),
  tax_percent: string([minLength(1, "Tax Percent is required.")]),
  amount: string([minLength(1, "Amount is required.")]),
  description_of_goods: string([
    minLength(1, "Description of goods is required."),
  ]),
  vatamount: string([minLength(1, "Vat Amount is required.")]),
  // status: enum_(Status, "File Status is required."),
});

type record30Form = Input<typeof record30Schema>;
export { record30Schema, type record30Form };
