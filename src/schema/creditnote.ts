import { check, InferInput, minLength, object, pipe, string } from "valibot";

const isNonNegativeNumber = (value: string): boolean => {
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0;
};

const isPositiveNumber = (value: string): boolean => {
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed > 0;
};

const CreditNoteSchema = object({
  credit_invoice_number: pipe(
    string("Credit invoice number is required."),
    minLength(1, "Credit invoice number is required."),
  ),
  credit_invoice_date: pipe(
    string("Credit invoice date is required."),
    minLength(1, "Credit invoice date is required."),
  ),
  taxable_amount: pipe(
    string("Taxable amount is required."),
    minLength(1, "Taxable amount is required."),
    check(isNonNegativeNumber, "Taxable amount must be a valid non-negative number."),
  ),
  vat_amount: pipe(
    string("VAT amount is required."),
    minLength(1, "VAT amount is required."),
    check(isNonNegativeNumber, "VAT amount must be a valid non-negative number."),
  ),
  total_invoice_value: pipe(
    string("Total invoice value is required."),
    minLength(1, "Total invoice value is required."),
    check(isPositiveNumber, "Total invoice value must be a valid number greater than 0."),
  ),
});

type CreditNoteForm = InferInput<typeof CreditNoteSchema>;

export { CreditNoteSchema, type CreditNoteForm };
