/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import { HSNCodeForm, HSNCodeSchema } from "@/schema/hsncode";
import { Label } from "@/components/ui/label";
import GetHSNCode from "@/action/hsncode/gethsncode";
import CreateHSNCode from "@/action/hsncode/createhsncode";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

type HSNCodeProviderProps = {
  userid: number;
  id?: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  setHSNCodeid: Dispatch<SetStateAction<number | undefined>>;
  init: () => Promise<void>;
};

export const HSNCodeMasterProvider = (props: HSNCodeProviderProps) => {
  const methods = useForm<HSNCodeForm>({
    resolver: valibotResolver(HSNCodeSchema),
  });

  return (
    <FormProvider {...methods}>
      <HSNCodeMaster
        userid={props.userid}
        id={props.id}
        setAddBox={props.setAddBox}
        setHSNCodeid={props.setHSNCodeid}
        init={props.init}
      />
    </FormProvider>
  );
};

const HSNCodeMaster = (props: HSNCodeProviderProps) => {
  const [userid, setUserid] = useState<number>(0);
  const router = useRouter();

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<HSNCodeForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reset({
      description: "",
      head: "",
      hsncode: "",
      tech_description: "",
      trade1: "",
      trade2: "",
      trade3: "",
    });
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      if (props.id) {
        const hsncode_response = await GetHSNCode({
          id: props.id,
        });
        if (hsncode_response.status && hsncode_response.data) {
          reset({
            description: hsncode_response.data.description,
            head: hsncode_response.data.head,
            hsncode: hsncode_response.data.hsncode,
            tech_description: hsncode_response.data.tech_description,
            trade1: hsncode_response.data.trade1,
            trade2: hsncode_response.data.trade2,
            trade3: hsncode_response.data.trade3,
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: HSNCodeForm) => {
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
      const hsncode_response = await CreateHSNCode({
        description: data.description,
        head: data.head,
        hsncode: data.hsncode,
        tech_description: data.tech_description,
        trade1: data.trade1,
        trade2: data.trade2,
        trade3: data.trade3,
        createdby: userid,
      });
      if (hsncode_response.status) {
        toast.success(hsncode_response.message);
      } else {
        toast.error(hsncode_response.message);
      }
    }
    await props.init();
    props.setAddBox(false);
    props.setHSNCodeid(undefined);
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
        <TaxtInput<HSNCodeForm>
          placeholder="Enter Chapter Head"
          name="head"
          required={true}
          title="Chapter Head"
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<HSNCodeForm>
          title="Description"
          required={true}
          name="description"
          placeholder="Enter Description"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<HSNCodeForm>
          title="HSN Code"
          required={true}
          name="hsncode"
          placeholder="Enter HSN Code"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<HSNCodeForm>
          title="Technical Description"
          required={true}
          name="tech_description"
          placeholder="Enter Technical Description"
        />
      </div>
      <div className="mt-4"></div>
      <Label className="text-sm font-normal">
        Commonly Used Trade Description(s)
        <span className="text-rose-500">*</span>
      </Label>

      <div className="mt-2">
        <TaxtInput<HSNCodeForm>
          title=""
          required={false}
          name="trade1"
          placeholder=""
        />
      </div>
      <div className="mt-2">
        <TaxtInput<HSNCodeForm>
          title=""
          required={false}
          name="trade2"
          placeholder=""
        />
      </div>
      <div className="mt-2">
        <TaxtInput<HSNCodeForm>
          title=""
          required={false}
          name="trade3"
          placeholder=""
        />
      </div>
      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            props.setHSNCodeid(undefined);
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
                description: "",
                head: "",
                hsncode: "",
                tech_description: "",
                trade1: "",
                trade2: "",
                trade3: "",
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
