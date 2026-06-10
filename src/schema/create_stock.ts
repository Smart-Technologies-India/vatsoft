import {
  InferInput,
  minLength,
  object,
  string,
  pipe,
} from "valibot";

const CreateStockSchema = object({
  description_of_goods: pipe(
    string("Select Description of goods."),
    minLength(1, "Select Description of goods.")
  ),
  crates: pipe(
    string("Crates is required."),
    minLength(1, "Crates is required.")
  ),
  amount: pipe(
    string("Amount is required."),
    minLength(1, "Amount is required.")
  ),
});

type CreateStockForm = InferInput<typeof CreateStockSchema>;
export { CreateStockSchema, type CreateStockForm };
