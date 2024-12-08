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
import { getCookie } from "cookies-next";
import { DateSelect } from "../inputfields/dateselect";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import { DailySaleForm, DailySaleSchema } from "@/schema/daily_sale";
import CreateDailySale from "@/action/stock/createdailysale";
import GetUserCommodity from "@/action/stock/usercommodity";
import SearchTin from "@/action/tin_number/searchtin";

type DailySaleProviderProps = {
  userid: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};
export const DailySaleProvider = (props: DailySaleProviderProps) => {
  const methods = useForm<DailySaleForm>({
    resolver: valibotResolver(DailySaleSchema),
  });

  return (
    <FormProvider {...methods}>
      <DailySale
        userid={props.userid}
        setAddBox={props.setAddBox}
        init={props.init}
      />
    </FormProvider>
  );
};

const DailySale = (props: DailySaleProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const taxable_at: OptionValue[] = [
    0, 1, 2, 4, 5, 6, 12.5, 12.75, 13.5, 15, 20,
  ].map((val: number) => ({ value: `${val}`, label: `${val}%` }));

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    getValues,
    setValue,
  } = useFormContext<DailySaleForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [davtdata, setDvatdata] = useState<dvat04 | null>(null);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );

  useEffect(() => {
    reset({
      amount_unit: "",
      description_of_goods: undefined,
      invoice_date: "",
      invoice_number: undefined,
      quantity: "",
    });
    const init = async () => {
      const tin_response = await SearchTin({
        tinumber: "26000000000",
      });

      setValue("recipient_vat_no", "26000000000");

      if (tin_response.status && tin_response.data) {
        setTinData(tin_response.data);
      }

      const response = await GetUserDvat04({
        userid: userid,
      });

      if (response.status && response.data) {
        setDvatdata(response.data);
        const commodity_resposen = await GetUserCommodity({
          dvatid: response.data.id,
        });
        if (commodity_resposen.status && commodity_resposen.data) {
          setCommodityMaster(commodity_resposen.data);
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

  const [tindata, setTinData] = useState<tin_number_master | null>(null);
  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");

  const [isLiquore, setLiquore] = useState<boolean>(false);

  const recipient_vat_no: string = watch("recipient_vat_no") ?? "";
  useEffect(() => {
    const init = async () => {
      if (recipient_vat_no && (recipient_vat_no ?? "").length < 2) {
        if (recipient_vat_no.length >= 11) {
          toast.dismiss();
          toast.error("Invalid DVAT no.");
        }
        setTinData(null);
        return;
      }

      const tinresponse = await SearchTin({
        tinumber: recipient_vat_no,
      });

      if (tinresponse.status && tinresponse.data) {
        setTinData(tinresponse.data);
      } else {
        if ((recipient_vat_no ?? "").length >= 11) {
          toast.error("Invalid DVAT no.");
        }
        setTinData(null);
      }
    };
    init();
  }, [recipient_vat_no]);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");
  const amount_unit = watch("amount_unit");

  useEffect(() => {
    if (description_of_goods == null || description_of_goods == undefined)
      return;
    const init = async () => {
      const commmaster = await GetCommodityMaster({
        id: parseInt(description_of_goods),
      });
      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
        if (commmaster.data.product_type == "LIQUOR") {
          setLiquore(true);
          setValue("amount_unit", commmaster.data.sale_price);
        }
      }
    };
    init();
  }, [description_of_goods]);

  useEffect(() => {
    if (commoditymaster == null || quantity == null || amount_unit == null)
      return;

    // Calculate taxableValue
    const calculatedTaxableValue =
      parseFloat(quantity) * parseFloat(amount_unit || "0");
    setTaxableValue(
      isNaN(calculatedTaxableValue) ? "0" : calculatedTaxableValue.toFixed(2)
    );

    // Calculate VAT amount based on commodity master data
    const taxPercentage: number = parseInt(commoditymaster.taxable_at) || 0; // Assuming `taxable_at` is a percentage
    const calculatedVatAmount = (calculatedTaxableValue * taxPercentage) / 100;
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2)
    );
  }, [quantity, amount_unit, commoditymaster]);

  const onSubmit = async (data: DailySaleForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller Vat Number not found.");

    const stock_response = await CreateDailySale({
      amount_unit: data.amount_unit,
      invoice_date: new Date(data.invoice_date),
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: parseInt(data.quantity),
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: commoditymaster.taxable_at,
      seller_tin_id: tindata.id,
      amount: (parseInt(data.quantity) * parseInt(data.amount_unit)).toFixed(0),
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    await props.init();
    props.setAddBox(false);
  };

  const addNew = async (data: DailySaleForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller Vat Number not found.");

    const stock_response = await CreateDailySale({
      amount_unit: data.amount_unit,
      invoice_date: new Date(data.invoice_date),
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: parseInt(data.quantity),
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: commoditymaster.taxable_at,
      seller_tin_id: tindata.id,
      amount: vatamount,
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    const currentValues = getValues();

    reset({
      ...currentValues,
      quantity: "",
      amount_unit: "",
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
        <TaxtInput<DailySaleForm>
          placeholder="Seller Vat Number"
          name="recipient_vat_no"
          required={true}
          title="Seller Vat Number"
        />
      </div>
      {tindata != null && (
        <div className="mt-2">
          <p className="text-sm font-normal">Name as in Master</p>
          <p className="font-semibold text-lg">
            {tindata?.name_of_dealer ?? ""}
          </p>
        </div>
      )}
      <div className="mt-2">
        <TaxtInput<DailySaleForm>
          name="invoice_number"
          required={true}
          numdes={true}
          title="Invoice no."
          placeholder="Invoice no."
        />
      </div>
      <div className="mt-2">
        <DateSelect<DailySaleForm>
          name="invoice_date"
          required={true}
          title="Invoice Date"
          placeholder="Select Invoice Date"
          // mindate={dayjs(getMonthDateas().start, dateFormat)}
          // maxdate={dayjs(getMonthDateas().end, dateFormat)}
        />
      </div>
      <div className="mt-2">
        <div className="mt-2">
          <MultiSelect<DailySaleForm>
            placeholder="Select Items details"
            name="description_of_goods"
            required={true}
            title="Items details"
            options={commodityMaster.map(
              (val: commodity_master, index: number) => ({
                value: val.id.toString(),
                label: val.product_name,
              })
            )}
          />
        </div>
      </div>
      <div className="mt-2">
        <TaxtInput<DailySaleForm>
          title="Quantity"
          required={true}
          name="quantity"
          placeholder="Enter Quantity"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<DailySaleForm>
          placeholder="Enter amount"
          name="amount_unit"
          required={true}
          title="Enter amount"
          disable={isLiquore}
          onlynumber={true}
        />
      </div>
      <div className="flex gap-1 items-center">
        <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
          <p className="text-xs font-normal">Taxable Rate (%)</p>
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
              amount_unit: "",
              description_of_goods: undefined,
              invoice_date: "",
              invoice_number: undefined,
              quantity: "",
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