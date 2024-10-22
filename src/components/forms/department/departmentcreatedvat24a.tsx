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
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import { Button, Input, InputRef } from "antd";
import { ToWords } from "to-words";
import { capitalcase, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { dvat04, returns_01, user } from "@prisma/client";
import SearchTinNumber from "@/action/dvat/searchtin";
import { CreateDvat24Form, CreateDvat24Schema } from "@/schema/dvat24";
import CreateDvat24A from "@/action/notice_order/createdvat24a";
import GetReturn01 from "@/action/return/getreturn";
import dayjs from "dayjs";

type DepartmentCreateDvat24AProviderProps = {
  userid: number;
};
export const DepartmentCreateDvat24AProvider = (
  props: DepartmentCreateDvat24AProviderProps
) => {
  const methods = useForm<CreateDvat24Form>({
    resolver: valibotResolver(CreateDvat24Schema),
  });

  return (
    <FormProvider {...methods}>
      <CreateDVAT24APage userid={props.userid} />
    </FormProvider>
  );
};

const CreateDVAT24APage = (props: DepartmentCreateDvat24AProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();
  const searchParams = useSearchParams();

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
    } else {
      toast.error(dvat_response.message);
      setSearch(false);
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

  const [return01Data, setReturn01Data] = useState<
    (returns_01 & { dvat04: dvat04 }) | null
  >(null);

  const onSubmit = async (data: CreateDvat24Form) => {
    if (!return01Data) return toast.error("Return 01 not found");

    const dvat24_response = await CreateDvat24A({
      due_date: new Date(data.due_date),
      dvat24_reason: data.dvat24_reason,
      remark: data.remark,
      interest: data.interest,
      tax: data.vat,
      createdby: props.userid,
      issuedId: props.userid,
      officerId: props.userid,
      dvatid: return01Data.dvat04.id,
      returns_01Id: return01Data.id,
    });

    if (dvat24_response.status) {
      toast.success("DVAT 24 created successfully");
      reset({});
      router.push("/dashboard/returns/department-track-return-status");
    } else {
      toast.error(dvat24_response.message);
    }
    reset({});
  };

  const getTotalAmount = (): number => {
    const vat = parseFloat(watch("vat"));
    const interest = parseFloat(watch("interest"));

    const total: number =
      (isNaN(vat) ? 0 : vat) + (isNaN(interest) ? 0 : interest);

    return total;
  };
  useEffect(() => {
    const returnid: number = parseInt(searchParams.get("returnid") ?? "0");
    const tinNumber: string = searchParams.get("tin") ?? "";

    const init = async () => {
      const return01_response = await GetReturn01({
        id: returnid,
      });
      if (return01_response.status && return01_response.data) {
        setReturn01Data(return01_response.data);
      }
      if (!(tinNumber == null || tinNumber == undefined || tinNumber == "")) {
        const dvat_response = await SearchTinNumber({
          tinumber: tinNumber,
        });
        if (dvat_response.status && dvat_response.data) {
          setUser(dvat_response.data.createdBy);
          setDvatData(dvat_response.data);
          setSearch(true);
        } else {
          toast.error(dvat_response.message);
          setSearch(false);
        }
        reset({
          dvat24_reason: "NOTFURNISHED",
          due_date: dayjs(new Date().setDate(new Date().getDate() + 15)).format(
            "DD/MM/YYYY"
          ),
        });
      }
    };

    init();
  }, [searchParams, reset]);

  return (
    <>
      {!isSearch && (
        <div className="p-2 bg-gray-50 mt-2 flex gap-4">
          <div className="flex gap-4  items-center">
            <p className="shrink-0">Enter TIN Number : </p>
            <Input
              ref={tinnumberRef}
              placeholder="TIN Number"
              required={true}
            />
            <Button onClick={searchUser} type="primary">
              Search
            </Button>
          </div>
        </div>
      )}
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
                  mindate={dayjs(new Date())}
                  format="DD/MM/YYYY"
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
                      Penalty
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
                  Form DVAT 24A
                </p>
                <p className="mt-2 text-sm">
                  (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                  Value Added Tax Rules, 2021)
                </p>
                <p className="mt-3 text-sm">
                  Notice of assessment of penalty under section 33.
                </p>

                <TaxtAreaInput<CreateDvat24Form>
                  name="remark"
                  title="Remark"
                  required={false}
                  placeholder="Enter remark"
                />
                <div className="w-full flex gap-2 mt-2">
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
