import { isContainSpace } from "@/utils/methods";
import {
  Input,
  custom,
  forward,
  minLength,
  object,
  regex,
  string,
} from "valibot";

const RegisterUserSchema = object(
  {
    mobile: string([
      minLength(1, "Please enter your mobile number."),
      custom(isContainSpace, "Mobile number cannot contain space."),
    ]),
    password: string([
      minLength(1, "Please enter your password."),
      minLength(8, "Your password must have 8 characters or more."),
      regex(/^(?=.*[0-9]).*$/, "Your password must have at least one number."),
      regex(
        /^(?=.*[!@#$%^&*]).*$/,
        "Your password must have at least one special character."
      ),
      regex(
        /^(?=.*[A-Z]).*$/,
        "Your password must have at least one uppercase."
      ),
      regex(
        /^(?=.*[a-z]).*$/,
        "Your password must have at least one lowercase."
      ),
      custom(isContainSpace, "Password cannot contain space."),
    ]),
    repassword: string([
      minLength(1, "Please enter your re-password."),
      minLength(8, "Your re-password must have 8 characters or more."),
      regex(
        /^(?=.*[0-9]).*$/,
        "Your re-password must have at least one number."
      ),
      regex(
        /^(?=.*[!@#$%^&*]).*$/,
        "Your re-password must have at least one special character."
      ),
      regex(
        /^(?=.*[A-Z]).*$/,
        "Your re-password must have at least one uppercase."
      ),
      regex(
        /^(?=.*[a-z]).*$/,
        "Your re-password must have at least one lowercase."
      ),
      custom(isContainSpace, "Re-password cannot contain space."),
    ]),
    role: string([
      minLength(1, "Please elect your role."),
      custom(isContainSpace, "Role cannot contain space."),
    ]),
  },
  [
    forward(
      custom(
        (input) => input.password === input.repassword,
        "Password and Re-Password should be same."
      ),
      ["repassword"]
    ),
  ]
);

type RegisterUserForm = Input<typeof RegisterUserSchema>;
export { RegisterUserSchema, type RegisterUserForm };
