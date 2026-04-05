"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateSelect } from "../inputfields/dateselect";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { CompositionStatus, dvat04, FrequencyFilings } from "@prisma/client";
import { toast } from "react-toastify";
import {
  CompositionDeptForm,
  CompositionDeptSchema,
} from "@/schema/composition";
import GetDvat04 from "@/action/register/getdvat04";
import GetComposition from "@/action/composition/getcompositon";
import UpdateComposition from "@/action/composition/updatecomposition";
import { onFormError } from "@/utils/methods";

type CompositionProviderProps = {
  userid: number;
  compositonid: number;
  // composition: boolean;
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
        // composition={props.composition}
      />
    </FormProvider>
  );
};

const Composition = (props: CompositionProviderProps) => {
  const router = useRouter();
  const [dealerDvat, setDealerDvat] = useState<dvat04 | null>(null);
  const [compositionScheme, setCompositionScheme] = useState<boolean>(false);
  const [frequencyFilings, setFrequencyFilings] = useState<FrequencyFilings>(
    FrequencyFilings.MONTHLY,
  );

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = useFormContext<CompositionDeptForm>();

  useEffect(() => {
    const init = async () => {
      const compositionResponse = await GetComposition({
        id: props.compositonid,
      });

      if (!compositionResponse.status || !compositionResponse.data) {
        toast.error(
          compositionResponse.message || "Unable to load composition data.",
        );
        return;
      }

      const dvatResponse = await GetDvat04({
        id: compositionResponse.data.dvatid,
      });

      if (!dvatResponse.status || !dvatResponse.data) {
        toast.error(dvatResponse.message || "Unable to load dealer data.");
        return;
      }

      setDealerDvat(dvatResponse.data);
      setCompositionScheme(Boolean(dvatResponse.data.compositionScheme));
      setFrequencyFilings(dvatResponse.data.frequencyFilings);
    };

    init();
  }, [props.compositonid]);

  const onSubmit = async (
    data: CompositionDeptForm,
    status: CompositionStatus,
  ) => {
    if (!dealerDvat) {
      toast.error("Unable to load dealer details.");
      return;
    }

    const compositionresponse = await UpdateComposition({
      id: props.compositonid,
      userid: props.userid,
      officer_date: new Date(data.officer_date),
      officer_remark: data.officerremark,
      status: status,
      compositionScheme,
      frequencyFilings,
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
        onFormError,
      )}
    >
      <div className="flex gap-4 mt-2">
        <div className="col-span-2">
          <DateSelect<CompositionDeptForm>
            placeholder="Select Date"
            name="officer_date"
            required={true}
            format={"DD/MM/YYYY"}
            title="Due Date"
          />
        </div>
        <div className="mt-4 gap-8 col-span-3 flex">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Composition Scheme
            </p>
            <div className="inline-flex rounded-md border border-gray-300 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setCompositionScheme(true)}
                className={`px-3 py-1.5 rounded text-sm ${
                  compositionScheme
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700"
                }`}
              >
                Composition
              </button>
              <button
                type="button"
                onClick={() => setCompositionScheme(false)}
                className={`px-3 py-1.5 rounded text-sm ${
                  !compositionScheme
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700"
                }`}
              >
                Regular
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Frequency Filings
            </p>
            <div className="inline-flex rounded-md border border-gray-300 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setFrequencyFilings(FrequencyFilings.MONTHLY)}
                className={`px-3 py-1.5 rounded text-sm ${
                  frequencyFilings === FrequencyFilings.MONTHLY
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700"
                }`}
              >
                MONTHLY
              </button>
              <button
                type="button"
                onClick={() => setFrequencyFilings(FrequencyFilings.QUARTERLY)}
                className={`px-3 py-1.5 rounded text-sm ${
                  frequencyFilings === FrequencyFilings.QUARTERLY
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700"
                }`}
              >
                QUARTERLY
              </button>
            </div>
          </div>
        </div>
        <div className="grow">
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
        {/* <Button
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          Back
        </Button> */}
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
