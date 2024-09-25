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
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import { Button, Input, InputRef } from "antd";
import { ToWords } from "to-words";
import { capitalcase, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { dvat04, user } from "@prisma/client";
import SearchTinNumber from "@/action/dvat/searchtin";
import { CreateDvat24Form, CreateDvat24Schema } from "@/schema/dvat24";

type DepartmentCreateDvat24ProviderProps = {
  userid: number;
};
export const DepartmentCreateDvat24Provider = (
  props: DepartmentCreateDvat24ProviderProps
) => {
  const methods = useForm<CreateDvat24Form>({
    resolver: valibotResolver(CreateDvat24Schema),
  });

  return (
    <FormProvider {...methods}>
      <CreateDVAT24Page userid={props.userid} />
    </FormProvider>
  );
};

const CreateDVAT24Page = (props: DepartmentCreateDvat24ProviderProps) => {
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

  const dvat24_reason: OptionValue[] = [
    { value: "NOTFURNISHED", label: "NOTFURNISHED" },
    { value: "INCOMPLETEFURNISHED", label: "INCOMPLETEFURNISHED" },
    { value: "INCORRECTRETURN", label: "INCORRECTRETURN" },
    { value: "NOTCOMPLYRETURN", label: "NOTCOMPLYRETURN" },
  ];

  const {
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<CreateDvat24Form>();

  const onSubmit = async (data: CreateDvat24Form) => {
    // const challan_response = await CreateChallan({
    //   dvatid: dvatdata?.id ?? 0,
    //   createdby: props.userid,
    //   cess: data.cess.toString(),
    //   vat: data.vat.toString(),
    //   interest: data.interest.toString(),
    //   others: data.others ?? "0",
    //   reason: data.reason,
    //   total_tax_amount: getTotalAmount().toString(),
    //   penalty: data.penalty.toString(),
    //   remark: data.remark,
    // });

    // if (challan_response.status) {
    //   toast.success("Challan generated successfully");
    //   reset({});
    //   router.push("/dashboard/payments/department-challan-history");
    // } else {
    //   toast.error(challan_response.message);
    // }

    reset({});
  };

  const getTotalAmount = (): number => {
    const vat = parseFloat(watch("vat"));
    const interest = parseFloat(watch("interest"));

    const total: number =
      (isNaN(vat) ? 0 : vat) + (isNaN(interest) ? 0 : interest);

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
              <p className="text-sm  font-medium">{user?.address}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
            <div className="p-2 bg-gray-50 mt-2 grid grid-cols-4 gap-4">
              <div>
                <MultiSelect<CreateDvat24Form>
                  placeholder="Select Reason"
                  name="dvat24_reason"
                  required={true}
                  title="Reason For Notice"
                  options={dvat24_reason}
                />
              </div>
              <div>
                <DateSelect<CreateDvat24Form>
                  placeholder="Select Date"
                  name="due_date"
                  required={true}
                  title="Due Date"
                />
              </div>
              <div>
                <p className="text-sm font-normal">Tax Period From Date</p>
                <p className="text-sm font-medium">2024 May</p>
              </div>
              <div>
                <p className="text-sm font-normal">Tax Period To Date</p>
                <p className="text-sm font-medium">2024 May</p>
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
                    <TableCell className="text-left p-2 border">Tax</TableCell>
                    <TableCell className="text-center p-2 border ">
                      <TaxtInput<CreateDvat24Form>
                        name="vat"
                        required={true}
                        numdes={true}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Interest
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      <TaxtInput<CreateDvat24Form>
                        name="interest"
                        required={true}
                        numdes={true}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Total Tax Amount:
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
                  Form DVAT 24
                </p>
                <p className="mt-2 text-sm">
                  (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                  Value Added Tax Rules, 2021)
                </p>
                <p className="mt-3 text-sm">
                  Notice of default assessment of tax and interest under section
                  32.
                </p>

                <TaxtAreaInput<CreateDvat24Form>
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
                    {isSubmitting ? "Loading...." : "Generate Notice"}
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
