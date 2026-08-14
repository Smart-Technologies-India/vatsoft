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
  // tax period with year and month
  tax_period_from_year: pipe(string("Year is required."), minLength(1, "Year is required.")),
  tax_period_from_month: pipe(string("Month is required."), minLength(1, "Month is required.")),
  tax_period_to_year: pipe(string("Year is required."), minLength(1, "Year is required.")),
  tax_period_to_month: pipe(string("Month is required."), minLength(1, "Month is required.")),
});

type CreateDvat10Form = InferInput<typeof CreateDvat10Schema>;
export { CreateDvat10Schema, type CreateDvat10Form };
