"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateSelect } from "../inputfields/dateselect";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { CompositionStatus, dvat04 } from "@prisma/client";
import { toast } from "react-toastify";
import {
  CompositionDeptForm,
  CompositionDeptSchema,
} from "@/schema/composition";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import IsUserComposition from "@/action/composition/isusercomposition";
import { Button } from "antd";
import UpdateComposition from "@/action/composition/updatecomposition";
import { onFormError } from "@/utils/methods";

type CompositionProviderProps = {
  userid: number;
  compositonid: number;
  composition: boolean;
};
export const CompositionDeptProvider = (props: CompositionProviderProps) => {
  const methods = useForm<CompositionDeptForm>({
    resolver: valibotResolver(CompositionDeptSchema),
  });

  return (
    <FormProvider {...methods}>
      <Composition
        userid={props.userid}
        compositonid={props.compositonid}
        composition={props.composition}
      />
    </FormProvider>
  );
};

const Composition = (props: CompositionProviderProps) => {
  const router = useRouter();

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<CompositionDeptForm>();

  const onSubmit = async (
    data: CompositionDeptForm,
    status: CompositionStatus
  ) => {
    const compositionresponse = await UpdateComposition({
      id: props.compositonid,
      userid: props.userid,
      officer_date: new Date(data.officer_date),
      officer_remark: data.officerremark,
      status: status,
      compositionScheme: props.composition,
    });

    if (compositionresponse.status) {
      router.back();
    } else {
      toast.error(compositionresponse.message);
    }

    reset({});
  };

  return (
    <form
      onSubmit={handleSubmit(
        (data) => onSubmit(data, CompositionStatus.COMPLETED),
        onFormError
      )}
    >
      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <DateSelect<CompositionDeptForm>
            placeholder="Select Date"
            name="officer_date"
            required={true}
            title="Officer Date"
          />
        </div>
        <div className="flex-1">
          <TaxtAreaInput<CompositionDeptForm>
            title="Officer Remark"
            required={true}
            name="officerremark"
            placeholder="Enter Officer Remark"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <div className="grow"></div>
        <Button
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          Back
        </Button>
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({});
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
        />

        <button
          disabled={isSubmitting}
          onClick={() =>
            handleSubmit((data) => onSubmit(data, CompositionStatus.REJECTED))()
          }
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white cursor-pointer"
        >
          Reject
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-emerald-500 px-4 text-sm text-white cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Accept"}
        </button>
      </div>
    </form>
  );
};
