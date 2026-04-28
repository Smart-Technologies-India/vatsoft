import * as v from "valibot";

export const MissingInvoiceComplaintSchema = v.object({
  dvat04Id: v.pipe(
    v.number("DVAT id is required"),
    v.integer("DVAT id must be a whole number"),
    v.minValue(1, "DVAT id is invalid")
  ),
  invoice_type: v.union(
    [v.literal("SALE"), v.literal("PURCHASE")],
    "Please select a valid invoice type"
  ),
  invoice_number: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Invoice number is required"),
    v.maxLength(100, "Invoice number must be less than 100 characters")
  ),
  invoice_date: v.optional(v.date("Invoice date is invalid")),
  supplier_tin: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(20, "Supplier TIN is too long"))
  ),
  customer_tin_no: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(20, "Customer TIN is too long"))
  ),
  customer_name: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(255, "Customer name is too long"))
  ),
  complaint_message: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(10, "Complaint details should be at least 10 characters"),
    v.maxLength(3000, "Complaint details must be less than 3000 characters")
  ),
});

export type MissingInvoiceComplaintForm = v.InferInput<
  typeof MissingInvoiceComplaintSchema
>;
