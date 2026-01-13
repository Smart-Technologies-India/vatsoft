/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import {
  commodity_master,
  dvat04,
  manufacturer_purchase,
} from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import { CreateStockForm, CreateStockSchema } from "@/schema/create_stock";
import { useRouter } from "next/navigation";
import EditManufacture from "@/action/stock/editmanufacture";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

type EditStockProviderProps = {
  userid: number;
  id: number;
  data: manufacturer_purchase & {
    commodity_master: commodity_master;
  };
};

export const EditStockProvider = (props: EditStockProviderProps) => {
  const methods = useForm<CreateStockForm>({
    resolver: valibotResolver(CreateStockSchema),
  });

  return (
    <FormProvider {...methods}>
      <EditStockData userid={props.userid} id={props.id} data={props.data} />
    </FormProvider>
  );
};

const EditStockData = (props: EditStockProviderProps) => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

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
    []
  );

  useEffect(() => {
    reset({
      amount_unit: props.data.amount_unit,
      description_of_goods: props.data.commodity_master.product_name,
      quantity: props.data.quantity.toString(),
    });
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const commmaster = await GetCommodityMaster({
        id: props.data.commodity_master.id,
      });
      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
      }
      const response = await GetUserDvat04({
        userid: authResponse.data,
      });

      if (response.status && response.data) {
        setDvatdata(response.data);
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          const filterdata = commodity_resposen.data.filter(
            (val: commodity_master) => val.product_type == "LIQUOR"
          );
          setCommodityMaster(filterdata);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");

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

  const onSubmit = async (data: CreateStockForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (parseInt(data.quantity) <= 0)
      return toast.error("Quantity must be greater than 0.");
    const stock_response = await EditManufacture({
      id: props.id,
      amount_unit: data.amount_unit,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: parseInt(data.quantity),
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: commoditymaster.taxable_at,
      amount: (parseInt(data.quantity) * parseInt(data.amount_unit)).toFixed(2),
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
      router.back();
    } else {
      toast.error(stock_response.message);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="mt-2">
        <div className="mt-2">
          <MultiSelect<CreateStockForm>
            placeholder="Select Items details"
            name="description_of_goods"
            required={true}
            disable={true}
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
        <TaxtInput<CreateStockForm>
          title="Quantity"
          required={true}
          name="quantity"
          placeholder="Enter Quantity"
          onlynumber={true}
        />
      </div>
      <div className="mt-2">
        <TaxtInput<CreateStockForm>
          placeholder="Enter amount"
          name="amount_unit"
          required={true}
          title="Enter amount"
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
        <input
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            reset({
              amount_unit: "",
              description_of_goods: undefined,
              quantity: "",
            });
          }}
          value={"Reset"}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : "Update"}
        </button>
      </div>
    </form>
  );
};
