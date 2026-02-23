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

const CreateDvat24Schema = object({
  dvat24_reason: enum_(Dvat24Reason, "Select Reason."),
  vat: pipe(
    string("VAT amount is required."),
    minLength(1, "VAT amount is required.")
  ),
  latefees: pipe(
    string("Late fees amount is required."),
    minLength(1, "Late fees amount is required.")
  ),
  interest: pipe(
    string("Interest amount is required."),
    minLength(1, "Interest amount is required.")
  ),
  penalty: pipe(
    string("Penalty amount is required."),
    minLength(1, "Penalty amount is required.")
  ),
  others: optional(string()),
  due_date: pipe(string("Select Due Date."), minLength(1, "Select Due Date.")),
  remark: optional(string()),
});

type CreateDvat24Form = InferInput<typeof CreateDvat24Schema>;
export { CreateDvat24Schema, type CreateDvat24Form };
