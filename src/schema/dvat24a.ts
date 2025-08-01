import { Dvat24Reason } from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  optional,
} from "valibot";

const CreateDvat24ASchema = object({
  dvat24_reason: enum_(Dvat24Reason, "Select Reason."),
  vat: pipe(
    string("VAT amount is required."),
    minLength(1, "VAT amount is required.")
  ),
  interest: pipe(
    string("Interest amount is required."),
    minLength(1, "Interest amount is required.")
  ),
  penalty: pipe(
    string("Penalty amount is required."),
    minLength(1, "Penalty amount is required.")
  ),
  due_date: pipe(string("Select Due Date."), minLength(1, "Select Due Date.")),
  remark: optional(string()),
});

type CreateDvat24AForm = InferInput<typeof CreateDvat24ASchema>;
export { CreateDvat24ASchema, type CreateDvat24AForm };
