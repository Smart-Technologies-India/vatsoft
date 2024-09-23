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
      const dvat = await GetUserDvat04({
        userid: props.userid,
      });
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
      cess: data.cess.toString(),
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
    const cess = parseFloat(watch("cess"));
    const penalty = parseFloat(watch("penalty"));
    const others = parseFloat(watch("others") ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) +
      (isNaN(interest) ? 0 : interest) +
      (isNaN(cess) ? 0 : cess) +
      (isNaN(penalty) ? 0 : penalty) +
      (isNaN(others) ? 0 : others);

    return total;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="p-2 bg-gray-50 mt-2 flex gap-4">
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

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment of account of
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Tax (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  VAT(0005)
                </TableCell>
                <TableCell className="text-center p-2 border ">
                  <TaxtInput<CreateChallanForm>
                    name="vat"
                    required={true}
                    numdes={true}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Interest(0008)
                </TableCell>
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
                  CESS(0009)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<CreateChallanForm>
                    name="cess"
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
                  reset({});
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
