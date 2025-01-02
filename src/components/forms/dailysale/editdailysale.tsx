/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import { getCookie } from "cookies-next";
import { DateSelect } from "../inputfields/dateselect";
import {
  commodity_master,
  daily_sale,
  dvat04,
  tin_number_master,
} from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import { DailySaleForm, DailySaleSchema } from "@/schema/daily_sale";
import CreateDailySale from "@/action/stock/createdailysale";
import GetUserCommodity from "@/action/stock/usercommodity";
import SearchTin from "@/action/tin_number/searchtin";
import { Input, InputRef, Modal } from "antd";
import CreateTinNumber from "@/action/tin_number/createtin";
import { useRouter } from "next/navigation";
import EditSale from "@/action/stock/editsale";

type EditDailySaleProviderProps = {
  id: number;
  userid: number;
  data: daily_sale & {
    commodity_master: commodity_master;
    seller_tin_number: tin_number_master;
  };
};
export const EditDailySaleProvider = (props: EditDailySaleProviderProps) => {
  const methods = useForm<DailySaleForm>({
    resolver: valibotResolver(DailySaleSchema),
  });

  return (
    <FormProvider {...methods}>
      <EditDailySale userid={props.userid} id={props.id} data={props.data} />
    </FormProvider>
  );
};

const EditDailySale = (props: EditDailySaleProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");
  const router = useRouter();

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
      amount_unit: props.data.amount_unit,
      description_of_goods: props.data.commodity_master.product_name,
      invoice_date: props.data.invoice_date.toISOString(),
      invoice_number: props.data.invoice_number,
      quantity: props.data.quantity.toString(),
    });
    const init = async () => {
      const commmaster = await GetCommodityMaster({
        id: props.data.commodity_master.id,
      });
      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
        if (commmaster.data.product_type == "LIQUOR") {
          setLiquore(true);
          setLiquoreAmount(parseInt(commmaster.data.sale_price));
          setValue("amount_unit", commmaster.data.sale_price);
        }
      }

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

  const [tindata, setTinData] = useState<tin_number_master | null>(null);
  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");

  const [isLiquore, setLiquore] = useState<boolean>(false);
  const [liquoreAmount, setLiquoreAmount] = useState<number>(0);

  const recipient_vat_no: string = watch("recipient_vat_no") ?? "";
  useEffect(() => {
    if (!recipient_vat_no) {
      return;
    }
    const init = async () => {
      if (recipient_vat_no.length > 11) return toast.error("Invalid DVAT no.");

      if (recipient_vat_no && (recipient_vat_no ?? "").length < 2) {
        if (recipient_vat_no.length >= 11) {
          toast.dismiss();
          // toast.error("Invalid DVAT no.");
          setTinBox(true);
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
          // toast.error("Invalid DVAT no.");
          setTinBox(true);
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
          setLiquoreAmount(parseInt(commmaster.data.sale_price));
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

    if (isLiquore && parseInt(data.amount_unit) < liquoreAmount) {
      return toast.error("Sale amount can not be less than MRP.");
    }

    if (parseInt(data.quantity) <= 0)
      return toast.error("Quantity must be greater than 0.");
    const stock_response = await EditSale({
      id: props.id,
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
      router.back();
    } else {
      toast.error(stock_response.message);
    }
  };

  const [tinBox, setTinBox] = useState(false);

  const tinnname = useRef<InputRef>(null);

  const createTin = async () => {
    if (
      tinnname.current?.input?.value == undefined ||
      tinnname.current?.input?.value == null ||
      tinnname.current?.input?.value == ""
    ) {
      return toast.error("Enter Dealer Name");
    }
    const response = await CreateTinNumber({
      name: tinnname.current.input.value,
      tinumber: getValues("recipient_vat_no"),
    });

    if (response.status && response.data) {
      toast.success(response.message);
      setTinData(response.data);
    } else {
      toast.error(response.message);
    }
    setTinBox(false);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <Modal
        title="Create New TIN Master"
        open={tinBox}
        onOk={createTin}
        onCancel={() => setTinBox(false)}
      >
        <p>This Tin Number not exist. Do you want to create it?</p>
        <Input ref={tinnname} placeholder="Enter The name of the dealer." />
      </Modal>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="mt-2">
          <TaxtInput<DailySaleForm>
            placeholder="Seller Vat Number"
            name="recipient_vat_no"
            required={true}
            title="Seller Vat Number"
            disable={true}
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
              disable={true}
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
            onlynumber={true}
          />
        </div>
        <div className="flex gap-1 items-center">
          <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
            <p className="text-xs font-normal">Taxable Rate (%)</p>
            <p className="text-sm font-semibold">
              {commoditymaster != null
                ? commoditymaster.taxable_at + "%"
                : "0%"}
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
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          >
            {isSubmitting ? "Loading...." : "Update"}
          </button>
        </div>
      </form>
    </>
  );
};
