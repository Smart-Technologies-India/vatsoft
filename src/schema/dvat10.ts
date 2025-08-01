import { Dvat24Reason } from "@prisma/client";
import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  optional,
  array,
} from "valibot";

const CreateDvat10Schema = object({
  dvat24_reason: enum_(Dvat24Reason, "Select Reason."),
  due_date: pipe(string("Select Due Date."), minLength(1, "Select Due Date.")),
  remark: optional(string()),
  // array of two strings date
  tax_period: array(
    pipe(
      string("Start Date is required."),
      minLength(1, "Start Date is required.")
    )
  ),
});

type CreateDvat10Form = InferInput<typeof CreateDvat10Schema>;
export { CreateDvat10Schema, type CreateDvat10Form };
