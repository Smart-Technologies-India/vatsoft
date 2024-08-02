import { Input, minLength, object, string } from "valibot";

const SubmitPaymentSchema = object({
  bank_name: string([minLength(1, "Bank Name is required.")]),
  transaction_id: string([minLength(1, "Transaction Id is required.")]),
  track_id: string([minLength(1, "Track Id is required.")]),
});

type SubmitPaymentForm = Input<typeof SubmitPaymentSchema>;
export { SubmitPaymentSchema, type SubmitPaymentForm };
