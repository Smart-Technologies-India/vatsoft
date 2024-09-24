import {
  CategoryOfEntry,
  DvatType,
  Quarter,
  ReturnType,
  SaleOfInterstate,
} from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  minValue,
  number,
  object,
  string,
  pipe,
  optional,
} from "valibot";

const record31ASchema = object({
  rr_number: optional(string()),
  return_type: enum_(ReturnType, "Return Type is required."),
  year: pipe(string(), minLength(1, "year is required.")),
  quarter: enum_(Quarter, "quarter Type is required."),
  month: pipe(string(), minLength(1, "Month is required.")),
  // filing_datetime: string([minLength(1, "Month is required.")]),
  // file_status: enum_(Status, "File Status is required."),
  total_tax_amount: pipe(
    string(),
    minLength(1, "Total tax amount is required.")
  ),

  dvat_type: enum_(DvatType, "Dvat Type is required."),
  urn_number: pipe(string(), minLength(1, "URN Number is required.")),
  invoice_number: pipe(string(), minLength(1, "Invoice Number is required.")),
  invoice_date: pipe(string(), minLength(1, "Invoice Date is required.")),
  total_invoice_number: pipe(
    string(),
    minLength(1, "Total Invoice Amount is required.")
  ),
  seller_tin_numberId: pipe(number(), minValue(0, "Seller id is required.")),
  category_of_entry: enum_(CategoryOfEntry, "Category of entry is required."),
  sale_of_interstate: enum_(
    SaleOfInterstate,
    "Sale Of Inter-state is required."
  ),
  place_of_supply: pipe(number(), minValue(0, "Place of Supply is required.")),
  tax_percent: pipe(string(), minLength(1, "Tax Percent is required.")),
  amount: pipe(string(), minLength(1, "Amount is required.")),
  description_of_goods: pipe(
    string(),
    minLength(1, "Description of goods is required.")
  ),
  // remarks: string([minLength(1, "Remarks is required.")]),
  vatamount: pipe(string(), minLength(1, "VAT Amount is required.")),
  // status: enum_(Status, "File Status is required."),
});

type record31AForm = InferInput<typeof record31ASchema>;
export { record31ASchema, type record31AForm };
