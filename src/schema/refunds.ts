import { ChallanReason } from "@prisma/client";

import {
  enum_,
  InferInput,
  minLength,
  object,
  string,
  pipe,
  optional,
  nullish,
} from "valibot";

const CreateRefundSchema = object({
  reason: pipe(
    string("Reason is required."),
    minLength(1, "Reason is required.")
  ),
  old_grievance_number: nullish(string()),
  oldcpin: nullish(string()),
  vat: pipe(
    string("VAT amount is required."),
    minLength(1, "VAT amount is required.")
  ),
  cess: pipe(
    string("CESS amount is required."),
    minLength(1, "CESS amount is required.")
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

type CreateRefundForm = InferInput<typeof CreateRefundSchema>;
export { CreateRefundSchema, type CreateRefundForm };
