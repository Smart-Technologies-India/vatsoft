import { isContainSpace } from "@/utils/methods";
import { Input, custom, minLength, object, string } from "valibot";

const LoginSchema = object({
  mobile: string([
    minLength(10, "Mobile number should be 10 digits."),
    custom(isContainSpace, "Mobile number cannot contain space."),
  ]),
  password: string([
    minLength(1, "Please enter your password."),
    custom(isContainSpace, "Password cannot contain space."),
  ]),
});

type LoginForm = Input<typeof LoginSchema>;
export { LoginSchema, type LoginForm };
