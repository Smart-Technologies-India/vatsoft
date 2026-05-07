"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateChallanForm, CreateChallanSchema } from "@/schema/challan";
import { ToWords } from "to-words";
import {
  capitalcase,
  decryptURLData,
  encryptURLData,
  onFormError,
} from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { Separator } from "@/components/ui/separator";
import CreateChallan from "@/action/challan/createchallan";
import { dvat04 } from "@prisma/client";
import GetReturn01 from "@/action/return/getreturn";

type DepartmentPayChallanProviderProps = {
  userid: number;
  returnId: number;
};

export const DepartmentPayChallanProvider = (
  props: DepartmentPayChallanProviderProps,
) => {
  const methods = useForm<CreateChallanForm>({
    resolver: valibotResolver(CreateChallanSchema),
    defaultValues: {
      reason: "MONTHLYPAYMENT",
    },
  });

  return (
    <FormProvider {...methods}>
      <PayChallanPage userid={props.userid} returnId={props.returnId} />
    </FormProvider>
  );
};

const PayChallanPage = (props: DepartmentPayChallanProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [returnPeriod, setReturnPeriod] = useState<string>("-");

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useFormContext<CreateChallanForm>();

  useEffect(() => {
    const loadReturn = async () => {
      const returnResponse = await GetReturn01({
        id: props.returnId,
      });

      if (!returnResponse.status || !returnResponse.data) {
        toast.error(returnResponse.message);
        return;
      }

      setDvatData(returnResponse.data.dvat04);

      const period = returnResponse.data.month
        ? `${returnResponse.data.month} ${returnResponse.data.year}`
        : `${returnResponse.data.quarter} ${returnResponse.data.year}`;
      setReturnPeriod(period);
    };

    loadReturn();
  }, [props.returnId]);

  const onSubmit = async (data: CreateChallanForm) => {
    if (dvatdata == null) {
      return toast.error("Return DVAT not found.");
    }

    const challan_response = await CreateChallan({
      dvatid: dvatdata.id,
      returnid: props.returnId,
      createdby: props.userid,
      latefees: data.latefees.toString(),
      vat: data.vat.toString(),
      interest: data.interest.toString(),
      others: data.others ?? "0",
      reason: "MONTHLYPAYMENT",
      total_tax_amount: getTotalAmount().toString(),
      penalty: data.penalty.toString(),
      remark: data.remark,
    });

    if (challan_response.status && challan_response.data) {
      toast.success("Challan generated successfully");
      reset({ reason: "MONTHLYPAYMENT" });
      router.push(
        `/dashboard/payments/saved-challan/${encryptURLData(challan_response.data.id.toString())}`,
      );
    } else {
      toast.error(challan_response.message);
    }
  };

  const getTotalAmount = (): number => {
    const vat = parseFloat(watch("vat"));
    const interest = parseFloat(watch("interest"));
    const latefees = parseFloat(watch("latefees"));
    const penalty = parseFloat(watch("penalty"));
    const others = parseFloat(watch("others") ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) +
      (isNaN(interest) ? 0 : interest) +
      (isNaN(latefees) ? 0 : latefees) +
      (isNaN(penalty) ? 0 : penalty) +
      (isNaN(others) ? 0 : others);

    return total;
  };

  return (
    <>
      <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
        Details Of Taxpayer
      </div>
      <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
        <div>
          <p className="text-sm">User TIN Number</p>
          <p className="text-sm font-medium">{dvatdata?.tinNumber}</p>
        </div>
        <div>
          <p className="text-sm">Name</p>
          <p className="text-sm font-medium">{dvatdata?.tradename}</p>
        </div>
        <div>
          <p className="text-sm">Email</p>
          <p className="text-sm font-medium">{dvatdata?.email}</p>
        </div>
        <div>
          <p className="text-sm">Mobile</p>
          <p className="text-sm font-medium">{dvatdata?.contact_one}</p>
        </div>
        <div>
          <p className="text-sm">Address</p>
          <p className="text-sm font-medium">{dvatdata?.address}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="p-2 bg-gray-50 mt-2 flex gap-4 items-end">
          <div className="w-72">
            <p className="text-sm font-normal">Reason For Challan</p>
            <p className="text-sm font-medium">MONTHLYPAYMENT</p>
          </div>
          <div>
            <p className="text-sm font-normal">Return Period</p>
            <p className="text-sm font-medium">{returnPeriod}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment on account of
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Tax (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">VAT</TableCell>
                <TableCell className="text-center p-2 border ">
                  <TaxtInput<CreateChallanForm>
                    name="vat"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Interest</TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<CreateChallanForm>
                    name="interest"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Late Fees
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<CreateChallanForm>
                    name="latefees"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Penalty</TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<CreateChallanForm>
                    name="penalty"
                    numdes={true}
                    required={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Others</TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<CreateChallanForm>
                    name="others"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total Challan Amount:
                </TableCell>
                <TableCell className="text-left p-2 border">
                  {getTotalAmount()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total amount paid (in words): Rupees
                </TableCell>
                <TableCell className="text-left p-2 border">
                  {capitalcase(toWords.convert(getTotalAmount()))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="w-96 shrink-0 p-2">
            <p className="text-center text-xl font-semibold">Form DVAT 20</p>
            <p className="mt-2 text-sm">
              (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu Value
              Added Tax Rules, 2021)
            </p>
            <p className="mt-3 text-sm">
              Challan for the Dadra and Nagar Haveli and Daman and Diu Value
              Added Regulation, 2005
            </p>
            <p className="mt-3 text-sm">Credited: Consolidated Fund of India</p>
            <p className="mt-3 text-sm">
              Head: 0040, Value Added Tax Receipt - Value Added Tax Receipt
            </p>
            <Separator />
            <div className="mt-2"></div>

            <TaxtAreaInput<CreateChallanForm>
              name="remark"
              title="Remark"
              required={false}
              placeholder="Enter remark"
            />
            <div className="w-full flex gap-2 mt-2">
              <div className="grow"></div>
              <input
                type="reset"
                onClick={(e) => {
                  e.preventDefault();
                  reset({ reason: "MONTHLYPAYMENT" });
                }}
                value={"Reset"}
                className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
              >
                {isSubmitting ? "Loading...." : "Generate Challan"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
