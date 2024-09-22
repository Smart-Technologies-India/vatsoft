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
import GetDvat04 from "@/action/register/getdvat04";
import { Dvat3Form, Dvat3Schema } from "@/schema/dvat3";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import Dvat3Update from "@/action/user/register/dvat3";
import { dvat04 } from "@prisma/client";
import { ApiResponseType } from "@/models/response";
import { onFormError } from "@/utils/methods";

type Dvat03ProviderProps = {
  dvatid: number;
  userid: number;
};
export const Dvat03Provider = (props: Dvat03ProviderProps) => {
  const methods = useForm<Dvat3Form>({
    resolver: valibotResolver(Dvat3Schema),
  });

  return (
    <FormProvider {...methods}>
      <Dvat04 dvatid={props.dvatid} userid={props.userid} />
    </FormProvider>
  );
};

const Dvat04 = (props: Dvat03ProviderProps) => {
  const router = useRouter();

  const depositType: OptionValue[] = [
    { value: "FIXED", label: "FIXED DEPOSIT" },
    { value: "RECURRING", label: "RECURRING DEPOSIT" },
    { value: "SAVINGS", label: "SAVINGS DEPOSIT" },
  ];

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<Dvat3Form>();

  const onSubmit = async (data: Dvat3Form) => {
    const userrespone: ApiResponseType<dvat04 | null> = await Dvat3Update({
      id: props.dvatid,
      updatedby: props.userid,
      securityDepositAmount: data.securityDepositAmount,
      depositType: data.depositType,
      dateOfExpiry: new Date(data.dateOfExpiry),
      nameOfBank: data.nameOfBank,
      branchName: data.branchName,
      transactionId: data.transactionId,
      numberOfOwners: parseInt(data.numberOfOwners),
      numberOfManagers: parseInt(data.numberOfManagers),
      numberOfSignatory: parseInt(data.numberOfSignatory),
      nameOfManager: data.nameOfManager,
      nameOfSignatory: data.nameOfSignatory,
    });
    if (userrespone.status) {
      router.push(`/dashboard/new-registration/${props.dvatid}/anx1`);
    } else {
      toast.error(userrespone.message);
    }

    reset({});
  };

  useEffect(() => {
    const init = async () => {
      const dvat = await GetDvat04({ id: props.dvatid });

      if (dvat.status && dvat.data) {
        reset({
          transactionId: dvat.data.transactionId!,
          securityDepositAmount: dvat.data.securityDepositAmount!,
          nameOfBank: dvat.data.nameOfBank!,
          branchName: dvat.data.branchName!,
          depositType: dvat.data.depositType!,
          dateOfExpiry: dvat.data.dateOfExpiry?.toLocaleString(),
          ...(dvat.data.numberOfOwners && {
            numberOfOwners: dvat.data.numberOfOwners.toString(),
          }),
          ...(dvat.data.numberOfManagers && {
            numberOfManagers: dvat.data.numberOfManagers.toString(),
          }),
          ...(dvat.data.numberOfSignatory && {
            numberOfSignatory: dvat.data.numberOfSignatory.toString(),
          }),
          nameOfManager: dvat.data.nameOfManager!,
          nameOfSignatory: dvat.data.nameOfSignatory!,
        });
      }
    };
    init();
  }, [props.dvatid, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="rounded-sm p-4 border border-black mt-6 relative">
        <span className="-translate-y-7 bg-white px-1 -translate-x-2 inline-block absolute text-sm">
          18 Security
        </span>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat3Form>
              placeholder="Enter Transaction Id"
              name="transactionId"
              required={true}
              title="Transaction Id"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat3Form>
              placeholder="Enter Security Amount"
              name="securityDepositAmount"
              required={true}
              title="Amount Of Security (Rs)"
              onlynumber={true}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <TaxtInput<Dvat3Form>
              placeholder="Enter Bank Name"
              name="nameOfBank"
              required={true}
              title="Name Of Bank"
            />
          </div>
          <div className="flex-1">
            <TaxtInput<Dvat3Form>
              placeholder="Enter Branch Name"
              name="branchName"
              required={true}
              title="Branch Name"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <MultiSelect<Dvat3Form>
              placeholder="Enter Deposit type"
              name="depositType"
              required={true}
              title="Type Of Security"
              options={depositType}
            />
          </div>
          <div className="flex-1">
            <DateSelect<Dvat3Form>
              placeholder="Enter Security Expirty Date"
              name="dateOfExpiry"
              required={true}
              title="Date Of Expiry Of Security"
            />
          </div>
        </div>
      </div>
      <div className="mt-2">
        <TaxtInput<Dvat3Form>
          placeholder="Enter Authorised signatory name"
          name="numberOfOwners"
          required={true}
          title="19. Number of person having interest in business"
          extratax="(also place complete Annexure I for each such person)"
          onlynumber={true}
        />
      </div>

      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <TaxtInput<Dvat3Form>
            placeholder="Enter Managers count"
            name="numberOfManagers"
            required={true}
            title="20 Number of Managers"
            onlynumber={true}
          />
        </div>
        <div className="flex-1">
          <TaxtInput<Dvat3Form>
            placeholder="Enter authorised signatory count"
            name="numberOfSignatory"
            required={true}
            title="21. Number of authorised signatory"
            onlynumber={true}
          />
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <TaxtInput<Dvat3Form>
            placeholder="Enter Manager Name"
            name="nameOfManager"
            required={true}
            title="22. Name of Manager"
          />
        </div>
        <div className="flex-1">
          <TaxtInput<Dvat3Form>
            placeholder="Enter Authorised signatory name"
            name="nameOfSignatory"
            required={true}
            title="23. Name of authorised signatory"
            extratax="(Please Complete Annexure III)"
          />
        </div>
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
            router.push(`/dashboard/new-registration/${props.dvatid}/dvat2`);
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
