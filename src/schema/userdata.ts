import { isContainSpace } from "@/utils/methods";
import {
  Input,
  custom,
  email,
  maxLength,
  minLength,
  object,
  regex,
  string,
} from "valibot";

const UserDataSchema = object({
  firstName: string([
    minLength(1, "Please enter your first name."),
    custom(isContainSpace, "Frist name cannot contain space."),
  ]),
  lastName: string([
    minLength(1, "Please enter your last name."),
    custom(isContainSpace, "Last name cannot contain space."),
  ]),
  address: string([minLength(1, "Please enter your full address.")]),
  mobileOne: string([
    minLength(1, "Please enter your mobile number."),
    maxLength(10, "Mobile number must be 10 digits."),
    custom(isContainSpace, "Mobile number cannot contain space."),
  ]),
  email: string([
    minLength(1, "Please enter your email address."),
    email("Please enter a valid email address."),
    custom(isContainSpace, "Email cannot contain space."),
  ]),
  pan: string([
    minLength(1, "Please enter your PAN number."),
    custom(isContainSpace, "PAN number cannot contain space."),
  ]),
  aadhar: string([
    minLength(1, "Please enter your Aadhar number."),
    custom(isContainSpace, "Aadhar number cannot contain space."),
  ]),
});

type UserDataForm = Input<typeof UserDataSchema>;
export { UserDataSchema, type UserDataForm };
