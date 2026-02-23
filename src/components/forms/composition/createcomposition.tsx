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
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { YesNoRabioInput } from "../inputfields/yesnoradioinput";

import { DateSelect } from "../inputfields/dateselect";
import { TaxtAreaInput } from "../inputfields/textareainput";
import GetDvat04 from "@/action/register/getdvat04";
import { ApiResponseType } from "@/models/response";
import { dvat04, NatureOfBusiness, SelectOffice } from "@prisma/client";
import DvatUpdate from "@/action/user/register/dvat1";
import { toast } from "react-toastify";
import { CompositionForm, CompositionSchema } from "@/schema/composition";
import CreateComposition from "@/action/composition/createcomposition";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import IsUserComposition from "@/action/composition/isusercomposition";
import { onFormError } from "@/utils/methods";
import { Alert } from "antd";

type CompositionProviderProps = {
  userid: number;
  composition: boolean;
};
export const CompositionProvider = (props: CompositionProviderProps) => {
  const methods = useForm<CompositionForm>({
    resolver: valibotResolver(CompositionSchema),
  });

  return (
    <FormProvider {...methods}>
      <Composition userid={props.userid} composition={props.composition} />
    </FormProvider>
  );
};

const Composition = (props: CompositionProviderProps) => {
  const router = useRouter();

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<CompositionForm>();
  const [davtData, setDvatData] = useState<dvat04 | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const init = async () => {
    const dvat_response = await GetUserDvat04();
    if (dvat_response.status || dvat_response.data) {
      setDvatData(dvat_response.data);
    }

    const is_pending = await IsUserComposition({
      compositionScheme: props.composition,
      userid: props.userid,
    });

    if (is_pending.status) {
      setIsPending(is_pending.data ?? false);
    }
  };
  useEffect(() => {
    const init = async () => {
      const dvat_response = await GetUserDvat04();
      if (dvat_response.status || dvat_response.data) {
        setDvatData(dvat_response.data);
      }

      const is_pending = await IsUserComposition({
        compositionScheme: props.composition,
        userid: props.userid,
      });

      if (is_pending.status) {
        setIsPending(is_pending.data ?? false);
      }
    };
    init();
  }, [reset, props.userid, props.composition]);

  const onSubmit = async (data: CompositionForm) => {
    if (davtData == null) return toast.error("User Dvat not exist");

    const compositionresponse = await CreateComposition({
      dvatid: davtData.id,
      createdby: props.userid,
      compositionScheme: props.composition,
      turnoverCurrentFinancialYear: data.turnoverCurrentFinancialYear,
      turnoverLastFinancialYear: data.turnoverLastFinancialYear,
      remark: data.remark,
    });

    if (compositionresponse.status) {
      router.push(`/dashboard/register/track-application-status`);
    } else {
      toast.error(compositionresponse.message);
    }
    await init();

    reset({});
  };

  if (props.composition == davtData?.compositionScheme) {
    return (
      <div>
        <Alert
          style={{
            marginTop: "10px",
            padding: "8px",
          }}
          type="error"
          showIcon
          description={
            props.composition
              ? "The provided VAT Number already registered under compostion scheme"
              : "The provided VAT Number already registered under regular scheme"
          }
        />
      </div>
    );
  }

  if (isPending) {
    return (
      <div>
        <Alert
          style={{
            marginTop: "10px",
            padding: "8px",
          }}
          type="error"
          showIcon
          description="Your Application to Opt for Composition scheme is under process."
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="flex gap-4 mt-2 items-end">
        <div className="flex-1">
          <TaxtInput<CompositionForm>
            placeholder="Enter Last finacial year turnover"
            name="turnoverLastFinancialYear"
            required={true}
            title="Turnover of the last financial year"
            numdes={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<CompositionForm>
            placeholder="Enter Last finacial year expected turnover"
            name="turnoverCurrentFinancialYear"
            required={true}
            title="Expected turnover of the current financial year"
            numdes={true}
          />
        </div>
      </div>
      <div className="flex-1">
        <TaxtAreaInput<CompositionForm>
          title="Remark"
          required={true}
          name="remark"
          placeholder="Enter Remark"
        />
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
          {isSubmitting ? "Loading...." : "Submit"}
        </button>
      </div>
    </form>
  );
};
