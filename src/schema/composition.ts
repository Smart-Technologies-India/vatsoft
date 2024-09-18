import { InferInput, boolean, minLength, object, string, pipe } from "valibot";

const CompositionSchema = object({
  // compositionScheme: boolean("Composition Scheme is required."),
  turnoverLastFinancialYear: pipe(
    string("Turnover Last Financial Year is required."),
    minLength(1, "Turnover Last Financial Year is required.")
  ),
  turnoverCurrentFinancialYear: pipe(
    string("Turnover Current Financial Year is required."),
    minLength(1, "Turnover Current Financial Year is required.")
  ),
  //   vatLiableDate: pipe(
  //     string("VAT Liable Date is required."),
  //     minLength(1, "VAT Liable Date is required.")
  //   ),
  remark: pipe(
    string("Remark is required."),
    minLength(1, "Remark is required.")
  ),
});

type CompositionForm = InferInput<typeof CompositionSchema>;
export { CompositionSchema, type CompositionForm };
