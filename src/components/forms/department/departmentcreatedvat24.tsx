/* eslint-disable react-hooks/exhaustive-deps */
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
import { capitalcase, decryptURLData, onFormError } from "@/utils/methods";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { dvat04, returns_01, user } from "@prisma/client";
import SearchTinNumber from "@/action/dvat/searchtin";
import { CreateDvat24Form, CreateDvat24Schema } from "@/schema/dvat24";
import CreateDvat24 from "@/action/notice_order/createdvat24";
import GetReturn01 from "@/action/return/getreturn";
import dayjs from "dayjs";

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
  const searchParams = useSearchParams();

  const [isSearch, setSearch] = useState<boolean>(false);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const tinnumberRef = useRef<InputRef>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

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
    { value: "NOTFURNISHED", label: "NOT FURNISHED" },
    { value: "INCOMPLETEFURNISHED", label: "IN-COMPLETE FURNISHED" },
    { value: "INCORRECTRETURN", label: "IN-CORRECT RETURN" },
    { value: "NOTCOMPLYRETURN", label: "NOT COMPLY RETURN" },
  ];

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useFormContext<CreateDvat24Form>();

  const [return01Data, setReturn01Data] = useState<
    (returns_01 & { dvat04: dvat04 }) | null
  >(null);

  interface Period {
    to: string;
    form: string;
  }
  const [periodData, setPeriodData] = useState<Period | null>(null);

  const getPeriod = (
    return_01data: returns_01 & { dvat04: dvat04 }
  ): {
    form: Date;
    to: Date;
  } => {
    const iscomp: boolean = return_01data.dvat04.compositionScheme ?? false;
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const from_year: string = return_01data.year;
    const from_month: string = return_01data.month!;
    // Get the index of the current month
    const currentMonthIndex = monthNames.indexOf(from_month);
    const currentYear = parseInt(from_year);

    // Calculate the 'to' date based on composition scheme
    let to_year: string;
    let to_month: string;

    if (iscomp) {
      // Get last month of the current quarter
      if (currentMonthIndex >= 9) {
        // If in Oct-Dec quarter, last month is December
        to_month = "December";
        to_year = from_year;
      } else {
        // Go to the last month of the previous quarter
        const lastQuarterMonth =
          currentMonthIndex - (currentMonthIndex % 3) + 2;
        to_month = monthNames[lastQuarterMonth];
        to_year = from_year;
      }
    } else {
      // Get the next month
      if (currentMonthIndex === 11) {
        to_month = monthNames[0]; // January of next year
        to_year = (currentYear + 1).toString();
      } else {
        to_month = monthNames[currentMonthIndex + 1];
        to_year = from_year;
      }
    }

    const from_date: Date = new Date(parseInt(from_year), currentMonthIndex, 1);
    const to_date: Date = new Date(
      parseInt(to_year),
      monthNames.indexOf(to_month),
      0
    );
    return {
      form: from_date,
      to: to_date,
    };
  };

  const onSubmit = async (data: CreateDvat24Form) => {
    if (!return01Data) return toast.error("Return 01 not found");

    const period_respone = getPeriod(return01Data);

    const dvat24_response = await CreateDvat24({
      due_date: new Date(data.due_date),
      dvat24_reason: data.dvat24_reason,
      remark: data.remark,
      interest: data.interest,
      tax: data.vat,
      createdby: props.userid,
      issuedId: props.userid,
      officerId: props.userid,
      dvatid: return01Data.dvat04.id,
      tax_period_from: period_respone.form,
      tax_period_to: period_respone.to,
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
    const returnid: number = parseInt(
      decryptURLData(searchParams.get("returnid") ?? "0", router)
    );
    const tinNumber: string = decryptURLData(
      searchParams.get("tin") ?? "",
      router
    );

    const init = async () => {
      setLoading(true);
      const return01_response = await GetReturn01({
        id: returnid,
      });
      if (return01_response.status && return01_response.data) {
        setReturn01Data(return01_response.data);
        const period_response = getPeriod(return01_response.data);
        setPeriodData({
          form: period_response.form.toDateString(),
          to: period_response.to.toDateString(),
        });
      }

      if (!(tinNumber == null || tinNumber == undefined || tinNumber == "")) {
        reset({
          dvat24_reason: "INCORRECTRETURN",
          due_date: dayjs(
            new Date().setDate(new Date().getDate() + 15)
          ).toString(),
        });
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
      }
      setLoading(false);
    };

    init();
  }, []);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

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
          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-2">
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
                  mindate={dayjs()}
                  format="DD/MM/YYYY"
                />
              </div>
              <div className="grow"></div>
              <div className=" mt-2">
                <p className="text-sm font-normal text-center">
                  Tax Period From - To
                </p>
                <p className="text-sm font-medium  text-center">
                  {dayjs(new Date(periodData?.form!)).format("DD/MM/YYYY")} -{" "}
                  {dayjs(new Date(periodData?.to!)).format("DD/MM/YYYY")}
                </p>
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
