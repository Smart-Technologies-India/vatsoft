import {
  CategoryOfEntry,
  DvatType,
  Quarter,
  ReturnType,
  SaleOf,
  SaleOfInterstate,
} from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  nullish,
} from "valibot";

const record31Schema = object({
  // rr_number: optional(string()),
  // return_type: enum_(ReturnType, "Return Type is required."),
  // year: pipe(string(), minLength(1, "year is required.")),
  // quarter: enum_(Quarter, "quarter Type is required."),
  // month: pipe(string(), minLength(1, "Month is required.")),
  // filing_datetime: string([minLength(1, "Month is required.")]),
  // file_status: enum_(Status, "File Status is required."),
  // total_tax_amount: pipe(
  //   string(),
  //   minLength(1, "Total tax amount is required.")
  // ),

  // dvat_type: enum_(DvatType, "Dvat Type is required."),
  // urn_number: pipe(string(), minLength(1, "URN Number is required.")),

  // seller_tin_numberId: pipe(number(), minValue(0, "Seller id is required.")),
  // place_of_supply: pipe(number(), minValue(0, "Place of Supply is required.")),
  // tax_percent: pipe(string(), minLength(1, "Tax Percent is required.")),
  // amount: pipe(string(), minLength(1, "Amount is required.")),
  // vatamount: pipe(string(), minLength(1, "VAT Amount is required.")),

  recipient_vat_no: pipe(
    string("Recipient VAT NO is required."),
    minLength(1, "Recipient VAT NO is required.")
  ),

  invoice_number: pipe(
    string("Invoice Number is required."),
    minLength(1, "Invoice Number is required.")
  ),
  invoice_date: pipe(
    string("Invoice Date is required."),
    minLength(1, "Invoice Date is required.")
  ),
  total_invoice_number: pipe(
    string("Total Invoice Amount is required."),
    minLength(1, "Total Invoice Amount is required.")
  ),
  sale_of: enum_(SaleOf, "Sale Of is required."),
  category_of_entry: enum_(CategoryOfEntry, "Category of entry is required."),
  remarks: nullish(string()),
  description_of_goods: pipe(
    string("Description of goods is required."),
    minLength(1, "Description of goods is required.")
  ),
  taxable_at: pipe(
    string("Taxable at is required."),
    minLength(1, "Taxable at is required.")
  ),
  quantity: pipe(
    string("Quantity is required."),
    minLength(1, "Quantity is required.")
  ),
});

type record31Form = InferInput<typeof record31Schema>;
export { record31Schema, type record31Form };
