import { InferInput, minLength, object, string, pipe } from "valibot";

const HSNCodeSchema = object({
  head: pipe(
    string("Chapter Head is required."),
    minLength(1, "Chapter Head is required.")
  ),
  description: pipe(
    string("Description is required."),
    minLength(1, "Description is required.")
  ),
  hsncode: pipe(
    string("HSN Code required."),
    minLength(1, "HSN Code is required.")
  ),
  tech_description: pipe(
    string("Tech Description is required."),
    minLength(1, "Tech Description is required.")
  ),
  trade1: pipe(
    string("Fill all Descriptions."),
    minLength(1, "Fill all Descriptions.")
  ),
  trade2: pipe(
    string("Fill all Descriptions."),
    minLength(1, "Fill all Descriptions.")
  ),
  trade3: pipe(
    string("Fill all Descriptions."),
    minLength(1, "Fill all Descriptions.")
  ),
});

type HSNCodeForm = InferInput<typeof HSNCodeSchema>;
export { HSNCodeSchema, type HSNCodeForm };
