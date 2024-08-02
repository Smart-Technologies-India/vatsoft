import { isContainSpace } from "@/utils/methods";
import {
  check,
  email,
  InferInput,
  maxLength,
  minLength,
  object,
  regex,
  string,
  pipe,
} from "valibot";

const UserDataSchema = object({
  firstName: pipe(
    string(),
    minLength(1, "Please enter your first name."),
    check(isContainSpace, "Frist name cannot contain space.")
  ),
  lastName: pipe(
    string(),
    minLength(1, "Please enter your last name."),
    check(isContainSpace, "Last name cannot contain space.")
  ),
  address: pipe(string(), minLength(1, "Please enter your full address.")),
  mobileOne: pipe(
    string(),
    minLength(1, "Please enter your mobile number."),
    maxLength(10, "Mobile number must be 10 digits."),
    check(isContainSpace, "Mobile number cannot contain space.")
  ),
  email: pipe(
    string(),
    minLength(1, "Please enter your email address."),
    email("Please enter a valid email address."),
    check(isContainSpace, "Email cannot contain space.")
  ),
  pan: pipe(
    string(),
    minLength(1, "Please enter your PAN number."),
    check(isContainSpace, "PAN number cannot contain space.")
  ),
  aadhar: pipe(
    string(),
    minLength(1, "Please enter your Aadhar number."),
    check(isContainSpace, "Aadhar number cannot contain space.")
  ),
});

type UserDataForm = InferInput<typeof UserDataSchema>;
export { UserDataSchema, type UserDataForm };
