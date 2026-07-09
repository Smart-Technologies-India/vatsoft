import { ChallanReason } from "@prisma/client";

import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  optional,
} from "valibot";

const CreateChallanSchema = object({
  reason: enum_(ChallanReason, "Select the Challan Reason."),
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
  remark: optional(string()),
});

// Schema for Department Payment CST Form (only requires CST amount)
const CreateChallanCSTSchema = object({
  reason: enum_(ChallanReason, "Select the Challan Reason."),
  others: pipe(
    string("CST amount is required."),
    minLength(1, "CST amount is required.")
  ),
  remark: optional(string()),
});

type CreateChallanForm = InferInput<typeof CreateChallanSchema>;
type CreateChallanCSTForm = InferInput<typeof CreateChallanCSTSchema>;
export { CreateChallanSchema, CreateChallanCSTSchema, type CreateChallanForm, type CreateChallanCSTForm };
