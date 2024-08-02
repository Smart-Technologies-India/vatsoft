import { InferInput, minLength, object, string, pipe } from "valibot"

const SubmitPaymentSchema = object({
  bank_name: pipe(string(), minLength(1, "Bank Name is required.")),
  transaction_id: pipe(string(), minLength(1, "Transaction Id is required.")),
  track_id: pipe(string(), minLength(1, "Track Id is required.")),
});

type SubmitPaymentForm = InferInput<typeof SubmitPaymentSchema>;
export { SubmitPaymentSchema, type SubmitPaymentForm };
