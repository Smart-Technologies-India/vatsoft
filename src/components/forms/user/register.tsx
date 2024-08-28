"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { OptionValue } from "@/models/main";
import { TaxtInput } from "../inputfields/textinput";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { UserDataForm, UserDataSchema } from "@/schema/userdata";
import { useEffect, useState } from "react";
import GetUser from "@/action/user/getuser";
import { propagateServerField } from "next/dist/server/lib/render-server";
import { toast } from "react-toastify";
import { decrypt } from "@/utils/methods";
import GetUncompeltedDvat04 from "@/action/register/getuncomplteddvat04";
import { dvat04 } from "@prisma/client";
import registerUser from "@/action/user/register/registeruser";
import { useRouter } from "next/navigation";

type RegisterProviderProps = {
  userid: number;
};
export const RegisterProvider = (props: RegisterProviderProps) => {
  const methods = useForm<UserDataForm>({
    resolver: valibotResolver(UserDataSchema),
  });

  return (
    <FormProvider {...methods}>
      <Registration userid={props.userid} />
    </FormProvider>
  );
};

const Registration = (props: RegisterProviderProps) => {
  const router = useRouter();

  const [dvat, setDvat] = useState<dvat04 | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<UserDataForm>();

  const onSubmit = async (data: UserDataForm) => {
    const userrespone = await registerUser({
      id: props.userid,
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      email: data.email,
      mobileOne: data.mobileOne,
      mobileTwo: data.mobileTwo ? undefined : data.mobileTwo,
      pan: data.pan,
      aadhar: data.aadhar,
      isdavt04: dvat != null,
    });
    if (userrespone.status && userrespone.data) {
      router.push(
        `/dashboard/new-registration/${
          dvat != null ? dvat.id : userrespone.data.dvat04!.id
        }/dvat1`
      );
    } else {
      toast.error(userrespone.message);
    }
    reset({});
  };

  const onError = (error: FieldErrors<UserDataForm>) => {
    console.log(error);
  };

  useEffect(() => {
    const init = async () => {
      const user = await GetUser({ id: props.userid });

      if (user.status) {
        reset({
          firstName: decrypt(user.data?.firstName ?? ""),
          lastName: decrypt(user.data?.lastName ?? ""),
          address: user.data?.address ?? "",
          email: decrypt(user.data?.email ?? ""),
          mobileOne: decrypt(user.data?.mobileOne ?? ""),
          mobileTwo: decrypt(user.data?.mobileTwo ?? ""),
          pan: decrypt(user.data?.pan ?? ""),
          aadhar: decrypt(user.data?.aadhar ?? ""),
        });
      } else {
        toast.error(user.message);
      }

      const dvat04_response = await GetUncompeltedDvat04({
        userid: props.userid,
      });

      if (dvat04_response.status && dvat04_response.data)
        setDvat(dvat04_response.data);
    };
    init();
  }, [props.userid, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)}>
      <div className="flex gap-3">
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter first name"
            name="firstName"
            required={true}
            title="1. First Name"
          />
        </div>
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter last name"
            name="lastName"
            required={true}
            title="2. Last Name"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter Email"
            name="email"
            required={true}
            title="3. Email Address"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<UserDataForm>
            placeholder="Enter Address"
            name="address"
            required={true}
            title="4. Address"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter mobile number"
            name="mobileOne"
            required={true}
            title="5. Mobile number"
            onlynumber={true}
            disable={true}
            maxlength={10}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter Alternate Mobile Number"
            name="mobileTwo"
            title="6. Alternate Number "
            onlynumber={true}
            maxlength={10}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter Pan Card"
            name="pan"
            required={true}
            title="7. Pan Card"
          />
        </div>
        <div className="flex-1">
          <TaxtInput<UserDataForm>
            placeholder="Enter Aadhar Card Number"
            name="aadhar"
            required={true}
            title="8. Aadhar Card"
            onlynumber={true}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="grow"></div>
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({});
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Next"}
        </button>
      </div>
    </form>
  );
};
