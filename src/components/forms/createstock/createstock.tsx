/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import dayjs from "dayjs";
import { commodity_master, dvat04 } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import CreateStock from "@/action/stock/createstock";
import { CreateStockForm, CreateStockSchema } from "@/schema/create_stock";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

type CreateStockProviderProps = {
  userid: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};

export const CreateStockProvider = (props: CreateStockProviderProps) => {
  const methods = useForm<CreateStockForm>({
    resolver: valibotResolver(CreateStockSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateStockData
        userid={props.userid}
        setAddBox={props.setAddBox}
        init={props.init}
      />
    </FormProvider>
  );
};

const CreateStockData = (props: CreateStockProviderProps) => {
  const router = useRouter();

  // const userid: number = parseFloat(getCookie("id") ?? "0");
  const [userid, setUserid] = useState<number>(0);

  const taxable_at: OptionValue[] = [
    0, 1, 2, 4, 5, 6, 12.5, 12.75, 13.5, 15, 20,
  ].map((val: number) => ({ value: `${val}`, label: `${val}%` }));

  const {
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    getValues,
  } = useFormContext<CreateStockForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [davtdata, setDvatdata] = useState<dvat04 | null>(null);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    [],
  );

  useEffect(() => {
    reset({
      crates: "",
      amount: "",
      description_of_goods: undefined,
    });
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const response = await GetUserDvat04();

      if (response.status && response.data) {
        setDvatdata(response.data);
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          const filterdata = commodity_resposen.data.filter(
            (val: commodity_master) => val.product_type == "LIQUOR",
          );
          setCommodityMaster(filterdata);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  interface GetMonthDateas {
    start: string;
    end: string;
  }

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

  const getMonthDateas = (): GetMonthDateas => {
    // Get the current month and year
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString("default", {
      month: "long",
    });

    const monthIndex = monthNames.indexOf(currentMonth);
    if (monthIndex === -1) {
      toast.error("Invalid month name");
      return { start: "", end: "" };
    }

    const yearNum = parseInt(`${currentYear}`, 10);
    // Start date of the month
    const start = new Date(yearNum, monthIndex, 1);

    // End date of the month
    const end = new Date(yearNum, monthIndex + 1, 0);
    // setting day 0 gets the last day of the month
    // Formatting dates to "YYYY-MM-DD"
    const formattedStart = dayjs(start).format(dateFormat);
    const formattedEnd = dayjs(end).format(dateFormat);

    return { start: formattedStart, end: formattedEnd };
  };

  const dateFormat = "YYYY-MM-DD";

  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");

  const description_of_goods = watch("description_of_goods");
  const crates = watch("crates");
  const amount = watch("amount");

  useEffect(() => {
    if (description_of_goods == null || description_of_goods == undefined)
      return;
    const init = async () => {
      const commmaster = await GetCommodityMaster({
        id: parseInt(description_of_goods),
      });
      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
      }
    };
    init();
  }, [description_of_goods]);

  useEffect(() => {
    if (commoditymaster == null || crates == null || amount == null) return;

    // Calculate pieces from amount using crate_size from commodity master
    const cratesNum = parseInt(crates) || 0;
    const amountNum = parseInt(amount) || 0;
    const piecesFromAmount = Math.floor(amountNum / commoditymaster.crate_size);
    const totalQuantity =
      cratesNum * commoditymaster.crate_size + piecesFromAmount;

    // Calculate taxableValue
    const calculatedTaxableValue = totalQuantity * commoditymaster.crate_size;
    setTaxableValue(
      isNaN(calculatedTaxableValue) ? "0" : calculatedTaxableValue.toFixed(2),
    );

    // Calculate VAT amount based on commodity master data
    const taxPercentage: number = parseInt(commoditymaster.taxable_at) || 0;
    const calculatedVatAmount = (calculatedTaxableValue * taxPercentage) / 100;
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2),
    );
  }, [crates, amount, commoditymaster]);

  const onSubmit = async (data: CreateStockForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");

    const cratesNum = parseInt(data.crates) || 0;
    const amountNum = parseInt(data.amount) || 0;
    const piecesFromAmount = Math.floor(amountNum / commoditymaster.crate_size);
    const totalQuantity =
      cratesNum * commoditymaster.crate_size + piecesFromAmount;

    const stock_response = await CreateStock({
      amount_unit: commoditymaster.crate_size.toString(),
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: totalQuantity,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: commoditymaster.taxable_at,
      amount: taxableValue,
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    await props.init();
    props.setAddBox(false);
  };

  const addNew = async (data: CreateStockForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");

    const cratesNum = parseInt(data.crates) || 0;
    const amountNum = parseInt(data.amount) || 0;
    const piecesFromAmount = Math.floor(amountNum / commoditymaster.crate_size);
    const totalQuantity =
      cratesNum * commoditymaster.crate_size + piecesFromAmount;

    const stock_response = await CreateStock({
      amount_unit: commoditymaster.crate_size.toString(),
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: totalQuantity,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: commoditymaster.taxable_at,
      amount: taxableValue,
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    const currentValues = getValues();

    reset({
      ...currentValues,
      crates: "",
      amount: "",
      description_of_goods: undefined,
    });
    setVatAmount("0");
    setTaxableValue("0");

    await props.init();
  };

  const [submitType, setSubmitType] = useState<string>("");

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (submitType === "submit") {
          onSubmit(data);
        } else if (submitType === "addNew") {
          addNew(data);
        }
      }, onFormError)}
    >
      <div className="mt-2">
        <div className="mt-2">
          <MultiSelect<CreateStockForm>
            placeholder="Select Items details"
            name="description_of_goods"
            required={true}
            title="Items details"
            options={commodityMaster.map(
              (val: commodity_master, index: number) => ({
                value: val.id.toString(),
                label: val.product_name,
              }),
            )}
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtInput<CreateStockForm>
          title="Crates"
          required={true}
          name="crates"
          placeholder="Enter number of crates"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CreateStockForm>
          placeholder="Enter amount (pieces will be calculated from commodity master crate size)"
          name="amount"
          required={true}
          title="Amount (pieces)"
          onlynumber={true}
        />
      </div>
      <div className="flex gap-1 items-center">
        <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
          <p className="text-xs font-normal">Taxable (%)</p>
          <p className="text-sm font-semibold">
            {commoditymaster != null ? commoditymaster.taxable_at + "%" : "0%"}
          </p>
        </div>
        <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
          <p className="text-xs font-normal">Taxable Value</p>
          <p className="text-sm font-semibold">{taxableValue}</p>
        </div>
        <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
          <p className="text-xs font-normal">VAT Amount</p>
          <p className="text-sm font-semibold">{vatamount}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            // props.setCommid(undefined);
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({
              crates: "",
              amount: "",
              description_of_goods: undefined,
            });
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => setSubmitType("submit")}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Submit"}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => setSubmitType("addNew")}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Add More"}
        </button>
      </div>
    </form>
  );
};
