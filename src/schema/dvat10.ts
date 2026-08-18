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
  // For MONTHLY: year and month; For QUARTERLY: year and quarter
  tax_period_year: pipe(string("Year is required."), minLength(1, "Year is required.")),
  tax_period_month: optional(pipe(string(), minLength(1, "Month is required."))),
  tax_period_quarter: optional(pipe(string(), minLength(1, "Quarter is required."))),
});

type CreateDvat10Form = InferInput<typeof CreateDvat10Schema>;
export { CreateDvat10Schema, type CreateDvat10Form };
