/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { onFormError } from "@/utils/methods";
import { getCookie } from "cookies-next";
import {
  DailyPurchaseMasterForm,
  DailyPurchaseMasterSchema,
} from "@/schema/daily_purchase";
import SearchTin from "@/action/tin_number/searchtin";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import CreateDailyPurchase from "@/action/stock/createdailypuchase";
import {
  Checkbox,
  Input,
  InputRef,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
import CreateTinNumber from "@/action/tin_number/createtin";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import dayjs from "dayjs";

type DailyPurchaseProviderProps = {
  userid: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};
export const DailyPurchaseMasterProvider = (
  props: DailyPurchaseProviderProps
) => {
  const methods = useForm<DailyPurchaseMasterForm>({
    resolver: valibotResolver(DailyPurchaseMasterSchema),
  });

  return (
    <FormProvider {...methods}>
      <DailyPurchaseMaster
        userid={props.userid}
        setAddBox={props.setAddBox}
        init={props.init}
      />
    </FormProvider>
  );
};

const DailyPurchaseMaster = (props: DailyPurchaseProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const [isAgainstCForm, setIsAgainstCForm] = useState(true);

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    getValues,
    setValue,
  } = useFormContext<DailyPurchaseMasterForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [davtdata, setDvatdata] = useState<dvat04 | null>(null);

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );

  const init = async () => {
    const response = await GetUserDvat04({
      userid: userid,
    });

    if (response.status && response.data) {
      setDvatdata(response.data);

      setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");
      const commodity_resposen = await AllCommodityMaster({});
      if (commodity_resposen.status && commodity_resposen.data) {
        if (response.data.commodity == "OIDC") {
          const filterdata = commodity_resposen.data.filter(
            (val: commodity_master) => val.product_type == "LIQUOR"
          );
          setCommodityMaster(filterdata);
        } else {
          const filterdata = commodity_resposen.data.filter(
            (val: commodity_master) =>
              val.product_type == response.data!.commodity
          );
          setCommodityMaster(filterdata);
        }
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    reset({
      amount_unit: "",
      description_of_goods: undefined,
      invoice_date: "",
      invoice_number: undefined,
      quantity: "",
      recipient_vat_no: "",
    });
    const init = async () => {
      const response = await GetUserDvat04({
        userid: userid,
      });

      if (response.status && response.data) {
        setDvatdata(response.data);

        setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          if (response.data.commodity == "OIDC") {
            const filterdata = commodity_resposen.data.filter(
              (val: commodity_master) => val.product_type == "LIQUOR"
            );
            setCommodityMaster(filterdata);
          } else {
            const filterdata = commodity_resposen.data.filter(
              (val: commodity_master) =>
                val.product_type == response.data!.commodity
            );
            setCommodityMaster(filterdata);
          }
        }
      }

      setIsLoading(false);
    };
    init();
  }, []);

  const recipient_vat_no: string = watch("recipient_vat_no");

  const [tindata, setTinData] = useState<tin_number_master | null>(null);
  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");

  useEffect(() => {
    const init = async () => {
      if (
        recipient_vat_no &&
        (recipient_vat_no ?? "").length > 2 &&
        (recipient_vat_no.startsWith("25") == true ||
          recipient_vat_no.startsWith("26") == true)
      ) {
        if (recipient_vat_no.length >= 11) {
          toast.dismiss();
          toast.error(
            "Local purchase will auto reflect after sale entry from the seller."
          );
        }
        setTinData(null);
        return;
      }

      if (
        recipient_vat_no == undefined ||
        recipient_vat_no == null ||
        recipient_vat_no == "" ||
        recipient_vat_no.length < 11
      )
        return;

      const tinresponse = await SearchTin({
        tinumber: recipient_vat_no,
      });

      if (tinresponse.status && tinresponse.data) {
        setTinData(tinresponse.data);
      } else {
        setTinBox(true);
        setTinData(null);
      }
    };
    init();
  }, [recipient_vat_no, isAgainstCForm]);

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

        if (davtdata?.commodity == "OIDC") {
          setValue(
            "amount_unit",
            commmaster.data.oidc_crate_purchase_price ?? "0"
          );
        }
      }
    };
    init();
  }, [description_of_goods, isAgainstCForm]);

  useEffect(() => {
    if (commoditymaster == null || quantity == null || amount_unit == null)
      return;

    // Calculate taxableValue
    const calculatedTaxableValue =
      parseFloat(quantity) * parseFloat(amount_unit || "0");

    const temp_amount =
      (calculatedTaxableValue /
        (100 + parseInt(isAgainstCForm ? "2" : commoditymaster.taxable_at))) *
      100;
    setTaxableValue(isNaN(temp_amount) ? "0" : temp_amount.toFixed(2));

    const calculatedVatAmount = calculatedTaxableValue - temp_amount;
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2)
    );
  }, [quantity, amount_unit, commoditymaster, isAgainstCForm]);

  const onSubmit = async (data: DailyPurchaseMasterForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller VAT Number not found.");

    // const quantityamount =
    //   davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
    //     ? quantityCount == "crate"
    //       ? parseInt(data.quantity) * commoditymaster.crate_size
    //       : parseInt(data.quantity)
    //     : parseInt(data.quantity);
    const quantityamount =
      quantityCount == "crate"
        ? parseInt(data.quantity) * commoditymaster.crate_size
        : parseInt(data.quantity);
    // const amount_unit: string =
    //   davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
    //     ? quantityCount == "crate"
    //       ? (parseInt(data.amount_unit) / commoditymaster.crate_size).toFixed(2)
    //       : data.amount_unit
    //     : data.amount_unit;
    const amount_unit: string =
      quantityCount == "crate"
        ? (parseInt(data.amount_unit) / commoditymaster.crate_size).toFixed(2)
        : data.amount_unit;

    const date = new Date(
      new Date(data.invoice_date).toISOString().split("T")[0]
    );
    date.setDate(date.getDate() + 1);

    const stock_response = await CreateDailyPurchase({
      amount_unit: amount_unit,
      invoice_date: date,
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: quantityamount,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: isAgainstCForm ? "2" : commoditymaster.taxable_at,
      seller_tin_id: tindata.id,
      amount: taxableValue,
      against_cfrom: isAgainstCForm,
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    props.setAddBox(false);

    // reset({
    //   ...currentValues,
    //   quantity: "",
    //   amount_unit: "",
    //   description_of_goods: undefined,
    // });
    // setVatAmount("0");
    // setTaxableValue("0");

    // clear form fields
    reset({
      amount_unit: "",
      description_of_goods: undefined,
      invoice_date: "",
      invoice_number: undefined,
      quantity: "",
      recipient_vat_no: "",
    });
    setTinData(null);
    setVatAmount("0");
    setTaxableValue("0");
    setIsAgainstCForm(false);
    setTinBox(false);
    setCommodityMaster([]);
    setDvatdata(null);
    await props.init();
    await init();
  };

  const addNew = async (data: DailyPurchaseMasterForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller VAT Number not found.");
    // const quantityamount =
    //   davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
    //     ? quantityCount == "crate"
    //       ? parseInt(data.quantity) * commoditymaster.crate_size
    //       : parseInt(data.quantity)
    //     : parseInt(data.quantity);
    const quantityamount =
      quantityCount == "crate"
        ? parseInt(data.quantity) * commoditymaster.crate_size
        : parseInt(data.quantity);
    // const amount_unit: string =
    //   davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
    //     ? quantityCount == "crate"
    //       ? (parseInt(data.amount_unit) / commoditymaster.crate_size).toFixed(2)
    //       : data.amount_unit
    //     : data.amount_unit;
    const amount_unit: string =
      quantityCount == "crate"
        ? (parseInt(data.amount_unit) / commoditymaster.crate_size).toFixed(2)
        : data.amount_unit;

    const date = new Date(
      new Date(data.invoice_date).toISOString().split("T")[0]
    );
    date.setDate(date.getDate() + 1);
    const stock_response = await CreateDailyPurchase({
      amount_unit: amount_unit,
      invoice_date: date,
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: quantityamount,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: isAgainstCForm ? "2" : commoditymaster.taxable_at,
      seller_tin_id: tindata.id,
      amount: taxableValue,
      against_cfrom: isAgainstCForm,
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    const currentValues = getValues();

    // reset({
    //   ...currentValues,
    //   quantity: "",
    //   amount_unit: "",
    //   description_of_goods: undefined,
    // });
    // setVatAmount("0");
    // setTaxableValue("0");

    reset({
      amount_unit: "",
      description_of_goods: undefined,
      quantity: "",
    });

    // clear form fields
    setVatAmount("0");
    setTaxableValue("0");
    setIsAgainstCForm(false);
    setTinBox(false);
    setCommodityMaster([]);
    setDvatdata(null);

    await props.init();
    await init();
  };

  const [submitType, setSubmitType] = useState<string>("");

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

  const [quantityCount, setQuantityCount] = useState("pcs");

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
    <>
      <Modal
        title="Create New TIN Master"
        open={tinBox}
        onOk={createTin}
        onCancel={() => setTinBox(false)}
      >
        <p>This TIN Number not exist. Do you want to create it?</p>
        <Input ref={tinnname} placeholder="Enter The name of the dealer." />
      </Modal>
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
          <TaxtInput<DailyPurchaseMasterForm>
            placeholder="Seller VAT Number"
            name="recipient_vat_no"
            required={true}
            title="Seller VAT Number"
          />
        </div>
        {tindata != null && (
          <div className="mt-2 flex gap-2 items-center">
            <div>
              <p className="text-sm font-normal">Name as in Master</p>
              <p className="font-semibold text-lg">
                {tindata?.name_of_dealer ?? ""}
              </p>
            </div>
            <div className="grow"></div>

            {tindata?.tin_number.startsWith("25") ||
              (tindata?.tin_number.startsWith("26") ? (
                <></>
              ) : (
                <Checkbox
                  checked={isAgainstCForm}
                  onChange={(e) => {
                    setIsAgainstCForm(e.target.checked);
                  }}
                  className="text-lg font-normal"
                >
                  Against C Form
                </Checkbox>
              ))}
          </div>
        )}

        <div className="mt-2">
          <TaxtInput<DailyPurchaseMasterForm>
            name="invoice_number"
            required={true}
            title="Invoice no."
            placeholder="Invoice no."
          />
        </div>
        <div className="mt-2">
          <DateSelect<DailyPurchaseMasterForm>
            name="invoice_date"
            required={true}
            title="Invoice Date"
            format={"DD/MM/YYYY"}
            placeholder="Select Invoice Date"
            // mindate={dayjs(getMonthDateas().start, dateFormat)}
            // maxdate={dayjs(getMonthDateas().end, dateFormat)}
            maxdate={dayjs()}
          />
        </div>
        {
          // (davtdata?.commodity == "OIDC" ||
          //   davtdata?.commodity == "MANUFACTURER") &&
          davtdata?.commodity == "FUEL"
            ? null
            : commoditymaster != null && (
                <div className="flex mt-2 gap-2 items-center">
                  <div className="p-1 rounded grow text-center bg-gray-100">
                    {commoditymaster.crate_size} Pcs/Crate
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
                      Pcs
                    </Radio.Button>
                  </Radio.Group>
                </div>
              )
        }

        <div className="mt-2">
          <div className="mt-2">
            <MultiSelect<DailyPurchaseMasterForm>
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
          <TaxtInput<DailyPurchaseMasterForm>
            title={
              davtdata?.commodity == "FUEL" ? "Quantity (Litre)" : "Quantity"
            }
            required={true}
            name={"quantity"}
            placeholder="Enter Quantity"
            onlynumber={true}
          />
        </div>
        <div className="mt-2">
          <TaxtInput<DailyPurchaseMasterForm>
            placeholder={
              davtdata?.commodity == "FUEL"
                ? "Enter Amount/Litre (Purchase price including VAT)"
                : quantityCount == "crate"
                ? "Enter Crate amount (Purchase price including VAT)"
                : "Enter Unit amount (Purchase price including VAT)"
            }
            name="amount_unit"
            required={true}
            title={
              davtdata?.commodity == "FUEL"
                ? "Enter Amount/Litre (Purchase price including VAT)"
                : quantityCount == "crate"
                ? "Enter Crate amount (Purchase price including VAT)"
                : "Enter Unit amount (Purchase price including VAT)"
            }
            numdes={true}
          />
        </div>
        <div className="flex gap-1 items-center">
          <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
            <p className="text-xs font-normal">Taxable (%)</p>
            <p className="text-sm font-semibold">
              {isAgainstCForm
                ? "2"
                : commoditymaster != null
                ? commoditymaster.taxable_at + "%"
                : "0%"}
            </p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Taxable Value</p>
            <p className="text-sm font-semibold">{taxableValue}</p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Invoice Value</p>
            <p className="text-sm font-semibold">
              {(parseInt(quantity) * parseFloat(amount_unit)).toFixed(2)}
            </p>
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
                recipient_vat_no: "",
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
    </>
  );
};
