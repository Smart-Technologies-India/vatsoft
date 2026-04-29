import * as v from "valibot";

export const MissingInvoiceComplaintSchema = v.object({
  dvat04Id: v.pipe(
    v.number("DVAT id is required"),
    v.integer("DVAT id must be a whole number"),
    v.minValue(1, "DVAT id is invalid")
  ),
  invoice_type: v.union(
    [v.literal("MISSING_SALE"), v.literal("WRONG_SALE")],
    "Please select a valid invoice type"
  ),
  invoice_number: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Invoice number is required"),
    v.maxLength(100, "Invoice number must be less than 100 characters")
  ),
  taxable_amount: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Taxable amount is required"),
    v.maxLength(50, "Taxable amount is too long")
  ),
  vat_amount: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "VAT amount is required"),
    v.maxLength(50, "VAT amount is too long")
  ),
  invoice_date: v.optional(v.date("Invoice date is invalid")),
  supplier_tin: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(11, "Supplier TIN must be 11 digits"),
    v.maxLength(11, "Supplier TIN must be 11 digits")
  ),
  customer_tin_no: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(20, "Customer TIN is too long"))
  ),
  customer_name: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(255, "Customer name is too long"))
  ),
  complaint_message: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(3000, "Complaint details must be less than 3000 characters")
    )
  ),
});

export type MissingInvoiceComplaintForm = v.InferInput<
  typeof MissingInvoiceComplaintSchema
>;
