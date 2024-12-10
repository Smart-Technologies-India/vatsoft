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
  quantity: pipe(
    string("Quantity is required."),
    minLength(1, "Quantity is required.")
  ),
  amount_unit: pipe(
    string("Amount Unit is required."),
    minLength(1, "Amount Unit is required.")
  ),
});

type CreateStockForm = InferInput<typeof CreateStockSchema>;
export { CreateStockSchema, type CreateStockForm };
