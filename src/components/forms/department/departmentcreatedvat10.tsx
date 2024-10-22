"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

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
import { CreateDvat10Schema, CreateDvat10Form } from "@/schema/dvat10";
import dayjs from "dayjs";
import GetReturn01 from "@/action/return/getreturn";

type DepartmentCreateDvat10ProviderProps = {
  userid: number;
};
export const DepartmentCreateDvat10Provider = (
  props: DepartmentCreateDvat10ProviderProps
) => {
  const methods = useForm<CreateDvat10Form>({
    resolver: valibotResolver(CreateDvat10Schema),
  });

  return (
    <FormProvider {...methods}>
      <CreateDVAT24Page userid={props.userid} />
    </FormProvider>
  );
};

const CreateDVAT24Page = (props: DepartmentCreateDvat10ProviderProps) => {
  const router = useRouter();
  const toWords = new ToWords();
  const searchParams = useSearchParams();

  const [isSearch, setSearch] = useState<boolean>(false);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const tinnumberRef = useRef<InputRef>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  interface Period {
    to: string;
    form: string;
  }

  const [periodData, setPeriodData] = useState<Period | null>(null);
  const [return01Data, setReturn01Data] = useState<
    (returns_01 & { dvat04: dvat04 }) | null
  >(null);

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
  } = useFormContext<CreateDvat10Form>();

  const onSubmit = async (data: CreateDvat10Form) => {
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

  useEffect(() => {
    const returnid: number = parseInt(searchParams.get("returnid") ?? "0");
    const tinNumber: string = searchParams.get("tin") ?? "";
    const init = async () => {
      setLoading(true);

      if (!(returnid == null || returnid == undefined)) {
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
      }

      if (!(tinNumber == null || tinNumber == undefined || tinNumber == "")) {
        reset({
          dvat24_reason: "NOTFURNISHED",
          due_date: dayjs(
            new Date().setDate(new Date().getDate() + 15)
          ).toISOString(),
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
                <MultiSelect<CreateDvat10Form>
                  placeholder="Select Reason"
                  name="dvat24_reason"
                  required={true}
                  title="Reason For Notice"
                  options={dvat24_reason}
                />
              </div>
              <div>
                <DateSelect<CreateDvat10Form>
                  placeholder="Select Date"
                  name="due_date"
                  required={true}
                  title="Due Date"
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
              <div className="shrink-0 p-2 w-96">
                <p className="text-center text-xl font-semibold">
                  Form DVAT 10
                </p>
                <p className="mt-2 text-sm">
                  (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                  Value Added Tax Rules, 2021)
                </p>
                <p className="mt-3 text-sm">
                  Notice to return defaulter u/s 32 for not filing return. Type
                  of Return: DVAT-16
                </p>

                <TaxtAreaInput<CreateDvat10Form>
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
              <div>
                <p className="mt-3 text-sm">
                  1. Being a registered Seller, you are required to furnish
                  return for the Sales made or received and to discharge
                  resultant tax liability for the aforesaid tax period by due
                  date. It has been noticed that you have not filed the said
                  return till date.
                </p>
                <p className="mt-3 text-sm">
                  2. You are, therefore, requested to furnish the said return
                  within 15 days failing which the tax liability may be assessed
                  u/s 32 of the regulation, based on the relevant material
                  available with this office. Please note that in addition to
                  tax so assessed, you will also be liable to pay interest and
                  penalty as per provisions of the regulation.
                </p>
                <p className="mt-3 text-sm">
                  3. Please note that no further communication will be issued
                  for assessing the liability.
                </p>
                <p className="mt-3 text-sm">
                  4. The notice shall be deemed to have been withdrawn in case
                  the return referred above, is filed by you before issue of the
                  assessment order.
                </p>
                <p className="mt-3 text-sm">
                  5. This is a system generated notice and will not require
                  signature.
                </p>
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
};
