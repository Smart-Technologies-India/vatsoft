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
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { toast } from "react-toastify";
import { ApiResponseType } from "@/models/response";
import { Button, Checkbox, Input, InputRef, Popover } from "antd";
import dayjs from "dayjs";
import { RabioInput } from "../inputfields/radioinput";
import { CreateChallanForm, CreateChallanSchema } from "@/schema/challan";
import { ToWords } from "to-words";
import { capitalcase, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { Separator } from "@/components/ui/separator";
import CreateChallan from "@/action/challan/createchallan";
import { dvat04, user } from "@prisma/client";
import SearchTinNumber from "@/action/dvat/searchtin";

type DepartmentCreateChallanProviderProps = {
  userid: number;
};
export const DepartmentCreateChallanProvider = (
  props: DepartmentCreateChallanProviderProps
) => {
  const methods = useForm<CreateChallanForm>({
    resolver: valibotResolver(CreateChallanSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateChallanPage userid={props.userid} />
    </FormProvider>
  );
};

const CreateChallanPage = (props: DepartmentCreateChallanProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [isSearch, setSearch] = useState<boolean>(false);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const tinnumberRef = useRef<InputRef>(null);

  const searchUser = async () => {
    if (
      tinnumberRef.current?.input?.value == null ||
      tinnumberRef.current?.input?.value == undefined ||
      tinnumberRef.current?.input?.value == ""
    ) {
      return toast.error("Enter TIN number in order to search");
    }

    const dvat_response = await SearchTinNumber({
      tinumber: tinnumberRef.current.input.value,
    });
    if (dvat_response.status && dvat_response.data) {
      setUser(dvat_response.data.createdBy);
      setDvatData(dvat_response.data);
      setSearch(true);
    }
  };

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
    formState: { errors, isSubmitting },
  } = useFormContext<CreateChallanForm>();

  const onSubmit = async (data: CreateChallanForm) => {
    const challan_response = await CreateChallan({
      dvatid: dvatdata?.id ?? 0,
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
      router.push("/dashboard/payments/department-challan-history");
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
      <div className="p-2 bg-gray-50 mt-2 flex gap-4">
        <div className="flex gap-4  items-center">
          <p className="shrink-0">Enter TIN Number : </p>
          <Input ref={tinnumberRef} placeholder="TIN Number" required={true} />
          <Button onClick={searchUser} type="primary">
            Search
          </Button>
        </div>
      </div>
      {isSearch && (
        <>
          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Taxpayer
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">User TIN Number</p>
              <p className="text-sm  font-medium">{dvatdata?.tinNumber}</p>
            </div>
            <div>
              <p className="text-sm">Name</p>
              <p className="text-sm  font-medium">
                {user?.firstName} - {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm">Email</p>
              <p className="text-sm  font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm">Mobile</p>
              <p className="text-sm  font-medium">{user?.mobileOne}</p>
            </div>
            <div>
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{dvatdata?.address}</p>
            </div>
          </div>
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
                    <TableCell className="text-left p-2 border">
                      Penalty
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      <TaxtInput<CreateChallanForm>
                        name="penalty"
                        numdes={true}
                        required={true}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Others
                    </TableCell>
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
                <p className="text-center text-xl font-semibold">
                  Form DVAT 20
                </p>
                <p className="mt-2 text-sm">
                  (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu
                  Value Added Tax Rules, 2021)
                </p>
                <p className="mt-3 text-sm">
                  Challan for the Dadra and Nagar Haveli and Daman and Diu Value
                  Added Regulation, 2005
                </p>
                <p className="mt-3 text-sm">
                  Credited: Consolidated Fund of India
                </p>
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
      )}
    </>
  );
};
