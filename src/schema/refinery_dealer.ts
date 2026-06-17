import { InferInput, minLength, object, pipe, string } from "valibot";

const RefineryDealerSchema = object({
  dealerId: pipe(
    string("Please select dealer."),
    minLength(1, "Please select dealer."),
  ),
  tanker_1: string(),
  tanker_2: string(),
  tanker_3: string(),
  tanker_4: string(),
  tanker_5: string(),
});

type RefineryDealerForm = InferInput<typeof RefineryDealerSchema>;

export { RefineryDealerSchema, type RefineryDealerForm };
