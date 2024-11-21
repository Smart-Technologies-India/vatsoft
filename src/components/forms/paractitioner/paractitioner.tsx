/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import { getCookie } from "cookies-next";
import { ParactitionerForm, ParactitionerSchema } from "@/schema/paractitioner";
import GetParctitioner from "@/action/parctitioner/getparctitioner";
import CreateParctitioner from "@/action/parctitioner/createparctitioner";

type ParactitionerProviderProps = {
  userid: number;
  id?: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  setParactitionerid: Dispatch<SetStateAction<number | undefined>>;
  init: () => Promise<void>;
};

export const ParactitionerMasterProvider = (
  props: ParactitionerProviderProps
) => {
  const methods = useForm<ParactitionerForm>({
    resolver: valibotResolver(ParactitionerSchema),
  });

  return (
    <FormProvider {...methods}>
      <ParactitionerMaster
        userid={props.userid}
        id={props.id}
        setAddBox={props.setAddBox}
        setParactitionerid={props.setParactitionerid}
        init={props.init}
      />
    </FormProvider>
  );
};

const ParactitionerMaster = (props: ParactitionerProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<ParactitionerForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reset({
      address: "",
      business_spoc_name: "",
      email: "",
      gsp_name: "",
      mobile: "",
    });
    const init = async () => {
      if (props.id) {
        const paractitioner_response = await GetParctitioner({
          id: props.id,
        });
        if (paractitioner_response.status && paractitioner_response.data) {
          reset({
            address: paractitioner_response.data.address,
            business_spoc_name: paractitioner_response.data.business_spoc_name,
            email: paractitioner_response.data.email,
            gsp_name: paractitioner_response.data.gsp_name,
            mobile: paractitioner_response.data.mobile,
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: ParactitionerForm) => {
    if (props.id) {
      // const update_response = await UpdateNews({
      //   id: props.id,
      //   updatedby: userid,
      //   title: data.title,
      //   description: data.description,
      //   postdate: new Date(data.postdate),
      //   topic: data.topic,
      // });
      // if (update_response.status) {
      //   toast.success(update_response.message);
      // } else {
      //   toast.error(update_response.message);
      // }
    } else {
      const paractitioner_response = await CreateParctitioner({
        createdby: userid,
        address: data.address,
        business_spoc_name: data.business_spoc_name,
        email: data.email,
        gsp_name: data.gsp_name,
        mobile: data.mobile,
      });
      if (paractitioner_response.status) {
        toast.success(paractitioner_response.message);
      } else {
        toast.error(paractitioner_response.message);
      }
    }
    await props.init();
    props.setAddBox(false);
    props.setParactitionerid(undefined);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="mt-2">
        <TaxtInput<ParactitionerForm>
          placeholder="Enter GSP Name"
          name="gsp_name"
          required={true}
          title="GSP Name"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ParactitionerForm>
          title="Business SPOC Name"
          required={true}
          name="business_spoc_name"
          placeholder="Enter Business SPOC Name"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ParactitionerForm>
          title="Email"
          required={true}
          name="email"
          placeholder="Enter Email"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<ParactitionerForm>
          title="Mobile"
          required={true}
          name="mobile"
          placeholder="Enter Mobile Number"
          maxlength={10}
          onlynumber={true}
        />
      </div>

      <div className="mt-2">
        <TaxtAreaInput<ParactitionerForm>
          title="Address"
          required={true}
          name="address"
          placeholder="Enter Address"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            props.setParactitionerid(undefined);
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        {props.id ? (
          <></>
        ) : (
          <input
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              reset({
                address: "",
                business_spoc_name: "",
                email: "",
                gsp_name: "",
                mobile: "",
              });
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : props.id ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
};
