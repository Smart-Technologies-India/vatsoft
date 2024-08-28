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
import { Dvat1Form, Dvat1Schema } from "@/schema/dvat1";
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

type Dvat01ProviderProps = {
  dvatid: number;
  userid: number;
};
export const Dvat01Provider = (props: Dvat01ProviderProps) => {
  const methods = useForm<Dvat1Form>({
    resolver: valibotResolver(Dvat1Schema),
  });

  return (
    <FormProvider {...methods}>
      <Dvat04 dvatid={props.dvatid} userid={props.userid} />
    </FormProvider>
  );
};

const Dvat04 = (props: Dvat01ProviderProps) => {
  const router = useRouter();

  const selectOffice: OptionValue[] = [
    { value: "Dadra_Nagar_Haveli", label: "Dept. of VAT - Dadra and Nagar" },
    { value: "Branch_Office", label: "Branch Office" },
    { value: "Head_Office", label: "Head Office" },
  ];

  const natureOfBusiness: OptionValue[] = [
    { value: "MANUFACTURING", label: "MANUFACTURING" },
    { value: "TRADING", label: "TRADING" },
    { value: "SERVICE", label: "SERVICE" },
    { value: "OTHER", label: "OTHER" },
  ];

  const constitutionOfBusiness: OptionValue[] = [
    { value: "PROPRIETORSHIP", label: "PROPRIETORSHIP" },
    { value: "LLP", label: "LLP" },
    { value: "PVT_LTD", label: "PVT_LTD" },
    { value: "PUBLIC_LTD", label: "PUBLIC_LTD" },
    { value: "OTHER", label: "OTHER" },
  ];

  const typeOfRegistration: OptionValue[] = [
    { value: "GST", label: "GST" },
    { value: "MSME", label: "MSME" },
    { value: "UDYAM", label: "UDYAM" },
    { value: "OTHER", label: "OTHER" },
  ];

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<Dvat1Form>();

  const onSubmit = async (data: Dvat1Form) => {
    const userrespone: ApiResponseType<dvat04 | null> = await DvatUpdate({
      id: props.dvatid,
      updatedby: props.userid,
      name: data.name,
      selectOffice: data.selectOffice as SelectOffice,
      tradename: data.tradename ?? undefined,
      natureOfBusiness: data.natureOfBusiness as NatureOfBusiness,
      constitutionOfBusiness: data.constitutionOfBusiness,
      typeOfRegistration: data.typeOfRegistration,
      compositionScheme: data.compositionScheme,
      annualTurnoverCategory: data.annualTurnoverCategory,
      turnoverLastFinancialYear: data.turnoverLastFinancialYear,
      turnoverCurrentFinancialYear: data.turnoverCurrentFinancialYear,
      vatLiableDate: new Date(data.vatLiableDate),
      pan: data.pan,
      gst: data.gst,
      buildingNumber: data.buildingNumber,
      area: data.area,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      contact_one: data.contact_one,
      contact_two: data.contact_two ?? undefined,
      email: data.email,
      faxNumber: data.faxNumber ?? undefined,
    });
    if (userrespone.status) {
      router.push(`/dashboard/new-registration/${props.dvatid}/dvat2`);
    } else {
      toast.error(userrespone.message);
    }

    reset({});
  };

  const onError = (error: FieldErrors<Dvat1Form>) => {
    console.log(error);
  };

  useEffect(() => {
    const init = async () => {
      const dvat = await GetDvat04({ id: props.dvatid });
      console.log(dvat);
      if (dvat.status && dvat.data) {
        reset({
          name: dvat.data.name!,
          tradename: dvat.data.tradename!,
          natureOfBusiness: dvat.data.natureOfBusiness!,
          constitutionOfBusiness: dvat.data.constitutionOfBusiness!,
          selectOffice: dvat.data.selectOffice!,
          typeOfRegistration: dvat.data.typeOfRegistration!,
          compositionScheme: dvat.data.compositionScheme!,
          annualTurnoverCategory: dvat.data.annualTurnoverCategory!,
          turnoverLastFinancialYear: dvat.data.turnoverLastFinancialYear!,
          turnoverCurrentFinancialYear: dvat.data.turnoverCurrentFinancialYear!,
          vatLiableDate: new Date(dvat.data.vatLiableDate!).toLocaleString(),
          pan: dvat.data.pan!,
          gst: dvat.data.gst!,
          buildingNumber: dvat.data.buildingNumber!,
          area: dvat.data.area!,
          address: dvat.data.address!,
          city: dvat.data.city!,
          pincode: dvat.data.pincode!,
          contact_one: dvat.data.contact_one!,
          contact_two: dvat.data.contact_two!,
          email: dvat.data.email!,
          faxNumber: dvat.data.faxNumber!,
        });
      }
    };
    init();
  }, [props.dvatid, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)}>
      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <MultiSelect<Dvat1Form>
            name={"selectOffice"}
            options={selectOffice}
            placeholder="Select office"
            title="Select Office"
            required={true}
          />
        </div>
        <div className="flex-1"></div>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <TaxtInput<Dvat1Form>
            placeholder="Enter name of dealer"
            name="name"
            required={true}
            title="1. Full Name of Applicant Dealer"
          />
        </div>
        <div className="flex-1">
          <TaxtInput<Dvat1Form>
            placeholder="Enter Trade name"
            name="tradename"
            required={true}
            title="2. Trade Name (if any)"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <MultiSelect<Dvat1Form>
            name={"natureOfBusiness"}
            options={natureOfBusiness}
            placeholder="Select Nature of Business"
            title="3. Nature of Business"
            required={true}
          />
        </div>
        <div className="flex-1">
          <MultiSelect<Dvat1Form>
            name={"constitutionOfBusiness"}
            options={constitutionOfBusiness}
            placeholder="Select Constitution Of Business"
            title="4. Constitution Of Business"
            required={true}
          />
        </div>
      </div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          5. Registration
        </span>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <MultiSelect<Dvat1Form>
              name={"typeOfRegistration"}
              options={typeOfRegistration}
              placeholder="Select Composition Scheme"
              title="a) Type of Registration"
              required={true}
            />
          </div>
          <div className="flex-1">
            <YesNoRabioInput<Dvat1Form>
              title="b) Opting for composition scheme under section 16(2) for the Regulation ? "
              required={true}
              name="compositionScheme"
            />
          </div>
        </div>
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          6. Turnover
        </span>
        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <YesNoRabioInput<Dvat1Form>
              title="a). Annual Turnover Category"
              required={true}
              name="annualTurnoverCategory"
              valueOne={"Less then Rs. 5 Lacs"}
              valueTwo={"Rs. 5 Lacs or above"}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2 items-end">
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Last finacial year turnover"
              name="turnoverLastFinancialYear"
              required={true}
              title="b). Turnover of the last financial year"
              onlynumber={true}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Last finacial year expected turnover"
              name="turnoverCurrentFinancialYear"
              required={true}
              title="c). Expected turnover of the current financial year"
              onlynumber={true}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <DateSelect<Dvat1Form>
            placeholder="Select Date"
            name="vatLiableDate"
            required={true}
            title="7. Date from which liable for registration under Dadra and Nagar
                Haveli Value Added Tax regulation, 2005 (DD/MM/YYYY)"
          />
        </div>
        <div className="flex-1"></div>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <TaxtInput<Dvat1Form>
            placeholder="Enter Pan Number"
            name="pan"
            required={true}
            title="8. Pan Number "
          />
        </div>
        <div className="flex-1">
          <TaxtInput<Dvat1Form>
            placeholder="Enter GST Number"
            name="gst"
            required={true}
            title="9. GST Number"
          />
        </div>
      </div>

      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          10 Principle place of Business
        </span>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Building number"
              name="buildingNumber"
              required={true}
              title="Building Number "
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Area"
              name="area"
              required={true}
              title="Area"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter city"
              name="city"
              required={true}
              title="City"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Pincode"
              name="pincode"
              required={true}
              title="Pincode"
            />
          </div>
        </div>
        <div className="mt-2">
          <TaxtAreaInput<Dvat1Form>
            placeholder="Enter Address"
            name="address"
            required={true}
            title="Address"
          />
        </div>
        <p className="text-xs bg-rose-500 bg-opacity-10 shadow px-2 py-1 rounded-sm mt-2 text-rose-500">
          Note: If you have more then one place of
          business/factory/godown/warehourse, fill up form Additional Business
          Plaes
        </p>
      </div>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          11 Contact Details
        </span>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Mobile Number"
              name="contact_one"
              required={true}
              title="Mobile Number"
              onlynumber={true}
              maxlength={10}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Enter Alternate Number"
              name="contact_two"
              required={true}
              title="Alternate Number"
              onlynumber={true}
              maxlength={10}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Email"
              name="email"
              required={true}
              title="Email"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat1Form>
              placeholder="Fax Numer"
              name="faxNumber"
              required={true}
              title="Fax Number"
            />
          </div>
        </div>

        <p className="text-xs bg-rose-500 bg-opacity-10 shadow px-2 py-1 rounded-sm mt-2 text-rose-500">
          Note: Please enter details of contact person in Form Partner Details
        </p>
      </div>

      <div className="flex gap-2">
        <div className="grow"></div>
        <input
          type="reset"
          onClick={() => {
            reset({});
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/new-registration/registeruser`);
          }}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Previous
        </button>
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
