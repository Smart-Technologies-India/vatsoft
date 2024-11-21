import { InferInput, minLength, object, string, pipe, email } from "valibot";

const ParactitionerSchema = object({
  gsp_name: pipe(
    string("GSP Name is required."),
    minLength(1, "GSP Name is required.")
  ),
  business_spoc_name: pipe(
    string("Business SPOC Name is required."),
    minLength(1, "Business SPOC Name is required.")
  ),
  email: pipe(
    string("Email is required."),
    email("Enter Valid email id"),
    minLength(1, "Email is required.")
  ),
  address: pipe(
    string("Address is required."),
    minLength(1, "Address is required.")
  ),
  mobile: pipe(
    string("mobile is required."),
    minLength(10, "Enter 10 Digit mobile number.")
  ),
});

type ParactitionerForm = InferInput<typeof ParactitionerSchema>;
export { ParactitionerSchema, type ParactitionerForm };
