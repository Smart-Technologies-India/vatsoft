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
import dayjs from "dayjs";
import { commodity_master, dvat04 } from "@prisma/client";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import CreateStock from "@/action/stock/createstock";
import {
  CreateFirstStockForm,
  CreateFirstStockSchema,
} from "@/schema/create_first_stock";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import { Checkbox, Radio, RadioChangeEvent } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import GetNilCommodity from "@/action/save_stock/getnilcomodity";

interface StockData {
  id: number | null;
  item: commodity_master;
  quantity: number;
}

type CreateFirstStockProviderProps = {
  setStock: Dispatch<SetStateAction<StockData[]>>;
  stock: StockData[];
  setAddBox: Dispatch<SetStateAction<boolean>>;
};

export const CreateFirstStockProvider = (
  props: CreateFirstStockProviderProps
) => {
  const methods = useForm<CreateFirstStockForm>({
    resolver: valibotResolver(CreateFirstStockSchema),
  });

  return (
    <FormProvider {...methods}>
      <CreateStockData
        setStock={props.setStock}
        stock={props.stock}
        setAddBox={props.setAddBox}
      />
    </FormProvider>
  );
};

const CreateStockData = (props: CreateFirstStockProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const {
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    getValues,
  } = useFormContext<CreateFirstStockForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );

  const [dvatdata, setDvatdata] = useState<dvat04 | null>(null);

  useEffect(() => {
    reset({
      description_of_goods: undefined,
      quantity: "",
    });
    const init = async () => {
      const userdvat = await GetUserDvat04FirstStock();

      if (userdvat.status && userdvat.data) {
        setDvatdata(userdvat.data);
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          if (userdvat.data.commodity == "FUEL") {
            setCommodityMaster(
              commodity_resposen.data.filter(
                (val) => val.product_type == "FUEL"
              )
            );
          } else {
            setCommodityMaster(
              commodity_resposen.data.filter(
                (val) => val.product_type != "FUEL"
              )
            );
          }
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

  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");

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

  const onSubmit = async (data: CreateFirstStockForm) => {
    if (isAccept) {
      props.setAddBox(false);
    } else {
      if (commoditymaster == null || commoditymaster == undefined)
        return toast.error("Commodity Master not found.");

      props.setStock([
        ...props.stock,
        {
          id: null,
          item: commoditymaster,
          quantity:
            quantityCount == "pcs"
              ? parseInt(data.quantity)
              : parseInt(data.quantity) * commoditymaster.crate_size,
        },
      ]);

      props.setAddBox(false);
    }
  };

  const addNew = async (data: CreateFirstStockForm) => {
    if (isAccept) {
      props.setAddBox(false);
    } else {
      if (commoditymaster == null || commoditymaster == undefined)
        return toast.error("Commodity Master not found.");
      props.setStock([
        ...props.stock,
        {
          id: null,
          item: commoditymaster,
          quantity:
            quantityCount == "pcs"
              ? parseInt(data.quantity)
              : parseInt(data.quantity) * commoditymaster.crate_size,
        },
      ]);

      const currentValues = getValues();

      reset({
        ...currentValues,
        quantity: "",
        description_of_goods: undefined,
      });
    }
  };

  const [submitType, setSubmitType] = useState<string>("");

  const [quantityCount, setQuantityCount] = useState("pcs");
  const [isAccept, setIsAccept] = useState<boolean>(false);

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

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
          <MultiSelect<CreateFirstStockForm>
            placeholder="Select Items details"
            name="description_of_goods"
            required={true}
            title="Items details"
            disable={isAccept}
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
        <TaxtInput<CreateFirstStockForm>
          title="Quantity"
          required={true}
          name="quantity"
          disable={isAccept}
          placeholder="Enter Quantity"
          onlynumber={true}
        />
      </div>
      {commoditymaster != null && (
        <div className="flex mt-2 gap-2 items-center">
          <div className="p-1 rounded grow text-center bg-gray-100">
            {commoditymaster.crate_size}{" "}
            {commoditymaster.product_type == "FUEL" ? "Litre" : "Pcs"}/Crate
          </div>
          <Radio.Group
            size="small"
            onChange={onChange}
            value={quantityCount}
            optionType="button"
          >
            <Radio.Button className="w-20 text-center" value="crate">
              Crate
            </Radio.Button>
            <Radio.Button className="w-20 text-center" value="pcs">
              {commoditymaster.product_type == "FUEL" ? "Litre" : "Pcs"}
            </Radio.Button>
          </Radio.Group>
        </div>
      )}

      {props.stock.filter((val) => val.id == 748).length <= 0 && (
        <div className="flex gap-2 mt-2">
          <Checkbox
            value={isAccept}
            onChange={async (value: CheckboxChangeEvent) => {
              setIsAccept(value.target.checked);

              if (value.target.checked) {
                const nil_commodity = await GetNilCommodity();
                if (nil_commodity.status && nil_commodity.data) {
                  reset({
                    description_of_goods: nil_commodity.data.product_name,
                    quantity: "0",
                  });
                  props.setStock([
                    {
                      id: null,
                      item: nil_commodity.data,
                      quantity: 0,
                    },
                  ]);
                }
              }
            }}
          />
          <p>NIL Stock</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
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
