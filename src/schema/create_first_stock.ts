import { InferInput, minLength, object, string, pipe } from "valibot";

const CreateFirstStockSchema = object({
  description_of_goods: pipe(
    string("Select Description of goods."),
    minLength(1, "Select Description of goods.")
  ),
  quantity: pipe(
    string("Quantity is required."),
    minLength(1, "Quantity is required.")
  ),
});

type CreateFirstStockForm = InferInput<typeof CreateFirstStockSchema>;
export { CreateFirstStockSchema, type CreateFirstStockForm };
