import { InferInput, minLength, object, string, pipe } from "valibot";

const NewsSchema = object({
  topic: pipe(string("Topic is required."), minLength(1, "Topic is required.")),
  title: pipe(string("Title is required."), minLength(1, "Title is required.")),
  description: pipe(
    string("Description is required."),
    minLength(1, "Description is required.")
  ),
  postdate: pipe(
    string("Past Date is required."),
    minLength(1, "Post Date is required.")
  ),
});

type NewsForm = InferInput<typeof NewsSchema>;
export { NewsSchema, type NewsForm };
