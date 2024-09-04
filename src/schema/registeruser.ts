import { isContainSpace } from "@/utils/methods";
import {
  check,
  forward,
  InferInput,
  minLength,
  object,
  regex,
  string,
  pipe,
} from "valibot";

const RegisterUserSchema = pipe(
  object({
    mobile: pipe(
      string("Please enter your mobile number."),
      minLength(1, "Please enter your mobile number."),
      check(isContainSpace, "Mobile number cannot contain space.")
    ),
    password: pipe(
      string("Please enter your password."),
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
      check(isContainSpace, "Password cannot contain space.")
    ),
    repassword: pipe(
      string("Please enter your re-password."),
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
      check(isContainSpace, "Re-password cannot contain space.")
    ),
    firstName: pipe(
      string("First Name is required."),
      minLength(1, "First Name is required.")
    ),
    lastName: pipe(
      string("Last Name is required."),
      minLength(1, "Last Name is required.")
    ),

    // role: pipe(string(), minLength(1, "Please elect your role.") , check(isContainSpace, "Role cannot contain space.") ,),
  }),
  forward(
    check(
      (input) => input.password === input.repassword,
      "Password and Re-Password should be same."
    ),
    ["repassword"]
  )
);

type RegisterUserForm = InferInput<typeof RegisterUserSchema>;
export { RegisterUserSchema, type RegisterUserForm };
