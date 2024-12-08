import { InferInput, minLength, object, string, pipe } from "valibot";

const DailySaleSchema = object({
  recipient_vat_no: pipe(
    string("Recipient VAT NO is required."),
    minLength(1, "Recipient VAT NO is required.")
  ),
  description_of_goods: pipe(
    string("Select Description of goods."),
    minLength(1, "Select Description of goods.")
  ),
  invoice_number: pipe(
    string("Invoice Number is required."),
    minLength(1, "Invoice Number is required.")
  ),
  invoice_date: pipe(
    string("Invoice Date is required."),
    minLength(1, "Invoice Date is required.")
  ),

  quantity: pipe(
    string("Quantity is required."),
    minLength(1, "Quantity is required.")
  ),
  amount_unit: pipe(
    string("Amount Unit is required."),
    minLength(1, "Amount Unit is required.")
  ),
});

type DailySaleForm = InferInput<typeof DailySaleSchema>;
export { DailySaleSchema, type DailySaleForm };
