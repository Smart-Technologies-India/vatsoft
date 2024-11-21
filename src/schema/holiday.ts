import { InferInput, minLength, object, string, pipe } from "valibot";

const HolidaySchema = object({
  state: pipe(string(), minLength(1, "State is required.")),
  description: pipe(
    string("Description is required."),
    minLength(1, "Description is required.")
  ),
  date: pipe(
    string("Past Date is required."),
    minLength(1, "Post Date is required.")
  ),
});

type HolidayForm = InferInput<typeof HolidaySchema>;
export { HolidaySchema, type HolidayForm };
