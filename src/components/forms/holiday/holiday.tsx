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
import { DateSelect } from "../inputfields/dateselect";
import { HolidayForm, HolidaySchema } from "@/schema/holiday";
import GetHoliday from "@/action/holiday/getholiday";
import UpdateHoliday from "@/action/holiday/updateholiday";
import CreateHoliday from "@/action/holiday/createholiday";
import { MultiSelect } from "../inputfields/multiselect";

type HolidayProviderProps = {
  userid: number;
  id?: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  setHolidayid: Dispatch<SetStateAction<number | undefined>>;
  init: () => Promise<void>;
};

export const HolidayMasterProvider = (props: HolidayProviderProps) => {
  const methods = useForm<HolidayForm>({
    resolver: valibotResolver(HolidaySchema),
  });

  return (
    <FormProvider {...methods}>
      <HolidayMaster
        userid={props.userid}
        id={props.id}
        setAddBox={props.setAddBox}
        setHolidayid={props.setHolidayid}
        init={props.init}
      />
    </FormProvider>
  );
};

const HolidayMaster = (props: HolidayProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<HolidayForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reset({
      state: "",
      description: "",
      date: "",
    });
    const init = async () => {
      if (props.id) {
        const state_response = await GetHoliday({
          id: props.id,
        });
        if (state_response.status && state_response.data) {
          reset({
            description: state_response.data.descrilption,
            date: state_response.data.date.toISOString(),
            state: state_response.data.state,
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: HolidayForm) => {
    if (props.id) {
      const update_response = await UpdateHoliday({
        id: props.id,
        updatedby: userid,
        state: data.state,
        description: data.description,
        date: new Date(data.date),
      });
      if (update_response.status) {
        toast.success(update_response.message);
      } else {
        toast.error(update_response.message);
      }
    } else {
      const holiday_response = await CreateHoliday({
        createdby: userid,
        state: data.state,
        description: data.description,
        date: new Date(data.date),
      });
      if (holiday_response.status) {
        toast.success(holiday_response.message);
      } else {
        toast.error(holiday_response.message);
      }
    }
    await props.init();
    props.setAddBox(false);
    props.setHolidayid(undefined);
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
        <MultiSelect<HolidayForm>
          placeholder="Enter State"
          name="state"
          required={true}
          title="State"
          options={[
            {
              label: "State",
              value: "State",
            },
            {
              label: "Central",
              value: "Central",
            },
            {
              label: "Central & State",
              value: "Central & State",
            },
          ]}
        />
      </div>

      <div className="mt-2">
        <DateSelect<HolidayForm>
          title="Date"
          required={true}
          name="date"
          placeholder="Selete Date"
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<HolidayForm>
          title="Description"
          required={true}
          name="description"
          placeholder="Enter Description"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            props.setHolidayid(undefined);
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
                state: "",
                description: "",
                date: "",
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
