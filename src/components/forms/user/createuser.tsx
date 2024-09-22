"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { toast } from "react-toastify";
import { dvat04, user } from "@prisma/client";
import { useRouter } from "next/navigation";
import { RegisterUserForm, RegisterUserSchema } from "@/schema/registeruser";
import { ApiResponseType } from "@/models/response";
import CreateUser from "@/action/user/createuser";
import { onFormError } from "@/utils/methods";

export const CreateUserProvider = () => {
  const methods = useForm<RegisterUserForm>({
    resolver: valibotResolver(RegisterUserSchema),
  });

  return (
    <FormProvider {...methods}>
      <Registration />
    </FormProvider>
  );
};

const Registration = () => {
  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<RegisterUserForm>();

  const onSubmit = async (data: RegisterUserForm) => {
    const registerrespone: ApiResponseType<user | null> = await CreateUser({
      password: data.password,
      mobile: data.mobile,
      firstname: data.firstName,
      lastname: data.lastName,
    });
    if (registerrespone.status) {
      toast.success(registerrespone.message);
    } else {
      toast.error(registerrespone.message);
    }
    reset({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="mt-2">
        <TaxtInput<RegisterUserForm>
          placeholder="Enter Mobile Number"
          name="mobile"
          required={true}
          title="Mobile Number"
          maxlength={10}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<RegisterUserForm>
          placeholder="Enter Password"
          name="password"
          required={true}
          title="Password"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<RegisterUserForm>
          placeholder="Enter Re-Password"
          name="repassword"
          required={true}
          title="Re-Password"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<RegisterUserForm>
          placeholder="Enter first name"
          name="firstName"
          required={true}
          title="First Name"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<RegisterUserForm>
          placeholder="Enter last name"
          name="lastName"
          required={true}
          title="Last Name"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({});
          }}
          value={"Reset"}
          className="py-1 flex-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md flex-1 bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Creating...." : "Create"}
        </button>
      </div>
    </form>
  );
};
