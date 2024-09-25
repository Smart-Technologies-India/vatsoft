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

const CreateDvat10Schema = object({
  dvat24_reason: enum_(Dvat24Reason, "Select Reason."),
  due_date: pipe(string("Select Due Date."), minLength(1, "Select Due Date.")),
  remark: optional(string()),
});

type CreateDvat10Form = InferInput<typeof CreateDvat10Schema>;
export { CreateDvat10Schema, type CreateDvat10Form };
