"use client";
import {
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

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
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import { ApiResponseType } from "@/models/response";
import { Button, Checkbox, Popover } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import { RabioInput } from "../inputfields/radioinput";
import { CreateChallanForm, CreateChallanSchema } from "@/schema/challan";
import { ToWords } from "to-words";
import { capitalcase, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { Separator } from "@/components/ui/separator";
import CreateChallan from "@/action/challan/createchallan";
import { dvat04 } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { set } from "date-fns";

type CreateChallanProviderProps = {
  userid: number;
};
export const CreateChallanProvider = (props: CreateChallanProviderProps) => {
  const methods = useForm<CreateChallanForm>({
    resolver: valibotResolver(CreateChallanSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateChallanPage userid={props.userid} />
    </FormProvider>
  );
};

const CreateChallanPage = (props: CreateChallanProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();

  const challanReason: OptionValue[] = [
    { value: "MONTHLYPAYMENT", label: "MONTHLYPAYMENT" },
    { value: "PASTDUES", label: "PASTDUES" },
    { value: "DEMAND", label: "DEMAND" },
    { value: "OTHERS", label: "OTHERS" },
  ];

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useFormContext<CreateChallanForm>();

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  useEffect(() => {
    const init = async () => {
      const dvat = await GetUserDvat04();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
      }
    };
    init();
  }, [props.userid]);

  const onSubmit = async (data: CreateChallanForm) => {
    if (dvatdata == null) return toast.error("User Dvat not exist");

    const challan_response = await CreateChallan({
      dvatid: dvatdata.id,
      createdby: props.userid,
      latefees: data.latefees.toString(),
      vat: data.vat.toString(),
      interest: data.interest.toString(),
      others: data.others ?? "0",
      reason: data.reason,
      total_tax_amount: getTotalAmount().toString(),
      penalty: data.penalty.toString(),
      remark: data.remark,
    });

    if (challan_response.status) {
      toast.success("Challan generated successfully");
      reset({});
      router.push("/dashboard/payments/challan-history");
    } else {
      toast.error(challan_response.message);
    }

    reset({});
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
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-3">
          <div>
            <MultiSelect<CreateChallanForm>
              placeholder="Select Reason"
              name="reason"
              required={true}
              title="Reason For Challan"
              options={challanReason}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-left p-2 font-medium text-gray-700 text-xs">
                    Payment of account of
                  </TableHead>
                  <TableHead className="text-center p-2 font-medium text-gray-700 text-xs w-60">
                    Tax (&#x20b9;)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b hover:bg-gray-50">
                  <TableCell className="text-left p-2 text-xs">
                    VAT
                  </TableCell>
                  <TableCell className="text-center p-2">
                  <TaxtInput<CreateChallanForm>
                    name="vat"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell className="text-left p-2 text-xs">
                  Interest
                </TableCell>
                <TableCell className="text-center p-2">
                  <TaxtInput<CreateChallanForm>
                    name="interest"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell className="text-left p-2 text-xs">
                  Late Fees
                </TableCell>
                <TableCell className="text-center p-2">
                  <TaxtInput<CreateChallanForm>
                    name="latefees"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell className="text-left p-2 text-xs">Penalty</TableCell>
                <TableCell className="text-center p-2">
                  <TaxtInput<CreateChallanForm>
                    name="penalty"
                    numdes={true}
                    required={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell className="text-left p-2 text-xs">Others</TableCell>
                <TableCell className="text-center p-2">
                  <TaxtInput<CreateChallanForm>
                    name="others"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-50 border-b font-medium">
                <TableCell className="text-left p-2 text-xs">
                  Total Challan Amount:
                </TableCell>
                <TableCell className="text-left p-2 text-xs">
                  {getTotalAmount()}
                </TableCell>
              </TableRow>
              <TableRow className="border-b">
                <TableCell className="text-left p-2 text-xs">
                  Total amount paid (in words): Rupees
                </TableCell>
                <TableCell className="text-left p-2 text-xs">
                  {capitalcase(toWords.convert(getTotalAmount()))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
          <div className="lg:w-96 shrink-0 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-center text-lg font-semibold text-gray-900">Form DVAT 20</p>
            <p className="mt-2 text-xs text-gray-700">
              (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu Value
              Added Tax Rules, 2021)
            </p>
            <p className="mt-2 text-xs text-gray-700">
              Challan for the Dadra and Nagar Haveli and Daman and Diu Value
              Added Regulation, 2005
            </p>
            <p className="mt-2 text-xs text-gray-700">Credited: Consolidated Fund of India</p>
            <p className="mt-2 text-xs text-gray-700">
              Head: 0040, Value Added Tax Receipt - Value Added Tax Receipt
            </p>
            {/* <p className="text-sm">
              <span className="font-semibold">Note:</span>
              For taxpayer filing VAT on quarterly basis:
            </p>
            <p className="text-sm mt-1">
              1. To make payment for the first (M1) and second (M2) months of
              the quarter, please select reason as &lsquo;Monthly Payment for
              Quarterly Return&lsquo; and the relevant period (financial year,
              month) and choose whether to pay through 35% challan or
              self-assessment challan.
            </p>
            <p className="text-sm mt-1">
              2. To make payment for the third month of the Quarter (M3), please
              use &apos;Create Challan&apos; option in payment Table-6 of Form
              VAT Quarterly. An auto- populated challan amounting to liabilities
              for the quarter net off credit utilization and existing cash
              balance can be generated and used to offset liabilities.
            </p> */}
            <Separator className="my-3" />

            <TaxtAreaInput<CreateChallanForm>
              name="remark"
              title="Remark"
              required={false}
              placeholder="Enter remark"
            />
            <div className="w-full flex gap-2 mt-3">
              <div className="grow"></div>
              <input
                type="reset"
                onClick={(e) => {
                  e.preventDefault();
                  reset({});
                }}
                value={"Reset"}
                className="py-1 rounded bg-gray-600 hover:bg-gray-700 px-4 text-xs text-white cursor-pointer"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-1 rounded bg-blue-600 hover:bg-blue-700 px-4 text-xs text-white cursor-pointer disabled:opacity-50"
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
