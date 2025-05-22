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
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import { DailySaleForm, DailySaleSchema } from "@/schema/daily_sale";
import CreateDailySale from "@/action/stock/createdailysale";
import GetUserCommodity from "@/action/stock/usercommodity";
import SearchTin from "@/action/tin_number/searchtin";
import {
  Checkbox,
  Input,
  InputRef,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
import CreateTinNumber from "@/action/tin_number/createtin";
import dayjs from "dayjs";

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

  // against c form
  const [isAgainstCForm, setIsAgainstCForm] = useState(false);

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

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master & { quantity: number }>
  >([]);

  const init = async () => {
    const tin_response = await SearchTin({
      tinumber: "26000000000",
    });

    // setValue("recipient_vat_no", "26000000000");

    if (tin_response.status && tin_response.data) {
      setTinData(tin_response.data);
    }

    const response = await GetUserDvat04({
      userid: userid,
    });

    if (response.status && response.data) {
      setDvatdata(response.data);
      setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");

      const commodity_resposen = await GetUserCommodity({
        dvatid: response.data.id,
      });
      if (commodity_resposen.status && commodity_resposen.data) {
        setCommodityMaster(commodity_resposen.data);
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
    });
    const init = async () => {
      const tin_response = await SearchTin({
        tinumber: "26000000000",
      });

      // setValue("recipient_vat_no", "26000000000");

      if (tin_response.status && tin_response.data) {
        setTinData(tin_response.data);
      }

      const response = await GetUserDvat04({
        userid: userid,
      });

      if (response.status && response.data) {
        setDvatdata(response.data);
        setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");

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
  const [liquoreOIDCAmount, setLiquoreOIDCAmount] = useState<number>(0);
  const [liquoreDealerAmount, setLiquoreDealerAmount] = useState<number>(0);

  const recipient_vat_no: string = watch("recipient_vat_no") ?? "";
  useEffect(() => {
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
          setValue("amount_unit", commmaster.data.oidc_crate_sale_price ?? "0");
        }

        if (commmaster.data.product_type == "LIQUOR") {
          setLiquore(true);
          setLiquoreDealerAmount(parseInt(commmaster.data.sale_price));
          setLiquoreOIDCAmount(parseInt(commmaster.data.oidc_price));
          // setValue("amount_unit", commmaster.data.sale_price);
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

    const calculatedVatAmount =
      (calculatedTaxableValue *
        parseFloat(isAgainstCForm ? "2" : commoditymaster.taxable_at)) /
      100;
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2)
    );

    const temp_amount = calculatedTaxableValue + calculatedVatAmount;

    setTaxableValue(isNaN(temp_amount) ? "0" : temp_amount.toFixed(2));
  }, [quantity, amount_unit, commoditymaster, isAgainstCForm]);

  const onSubmit = async (data: DailySaleForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller VAT Number not found.");

    if (quantityCount == "pcs") {
      // pcs

      if (
        davtdata?.commodity == "OIDC" ||
        davtdata?.commodity == "MANUFACTURER"
      ) {
        if (
          isLiquore &&
          (parseFloat(data.amount_unit) *
            (100 +
              parseFloat(isAgainstCForm ? "2" : commoditymaster.taxable_at))) /
            100 <
            liquoreOIDCAmount * 0.7
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      } else {
        if (
          isLiquore &&
          (parseFloat(data.amount_unit) *
            (100 +
              parseFloat(isAgainstCForm ? "2" : commoditymaster.taxable_at))) /
            100 <
            liquoreDealerAmount * 0.7
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      }
    } else {
    }

    const quantityamount =
      davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
        ? quantityCount == "crate"
          ? parseInt(data.quantity) * commoditymaster.crate_size
          : parseInt(data.quantity)
        : parseInt(data.quantity);

    const amount_unit: string =
      davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
        ? quantityCount == "crate"
          ? (parseFloat(data.amount_unit) / commoditymaster.crate_size).toFixed(
              2
            )
          : data.amount_unit
        : data.amount_unit;

    const date = new Date(
      new Date(data.invoice_date).toISOString().split("T")[0]
    );
    date.setDate(date.getDate() + 1);

    const stock_response = await CreateDailySale({
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

    await props.init();
    props.setAddBox(false);
    const currentValues = getValues();

    // reset({
    //   ...currentValues,
    //   quantity: "",
    //   amount_unit: "",
    //   description_of_goods: undefined,
    // });
    // setVatAmount("0");
    // setTaxableValue("0");

    // clear all from values
    reset({
      amount_unit: "",
      description_of_goods: undefined,
      invoice_date: "",
      invoice_number: undefined,
      quantity: "",
      recipient_vat_no: "",
    });

    setTinData(null);
    setDvatdata(null);
    setVatAmount("0");
    setTaxableValue("0");
    setIsAgainstCForm(false);
    setLiquore(false);
    setLiquoreOIDCAmount(0);
    setLiquoreDealerAmount(0);
    setTinBox(false);

    await init();
  };

  const addNew = async (data: DailySaleForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller VAT Number not found.");

    if (quantityCount == "pcs") {
      // pcs

      if (
        davtdata?.commodity == "OIDC" ||
        davtdata?.commodity == "MANUFACTURER"
      ) {
        if (
          isLiquore &&
          (parseFloat(data.amount_unit) *
            (100 +
              parseFloat(isAgainstCForm ? "2" : commoditymaster.taxable_at))) /
            100 <
            liquoreOIDCAmount
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      } else {
        if (
          isLiquore &&
          (parseFloat(data.amount_unit) *
            (100 +
              parseFloat(isAgainstCForm ? "2" : commoditymaster.taxable_at))) /
            100 <
            liquoreDealerAmount
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      }
    } else {
      if (
        davtdata?.commodity == "OIDC" ||
        davtdata?.commodity == "MANUFACTURER"
      ) {
        if (
          isLiquore &&
          parseFloat(data.amount_unit) <
            liquoreOIDCAmount * commoditymaster.crate_size
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      } else {
        if (
          isLiquore &&
          parseFloat(data.amount_unit) <
            liquoreDealerAmount * commoditymaster.crate_size
        ) {
          return toast.error("Sale amount can not be less than MRP.");
        }
      }
    }

    const quantityamount =
      davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
        ? quantityCount == "crate"
          ? parseInt(data.quantity) * commoditymaster.crate_size
          : parseInt(data.quantity)
        : parseInt(data.quantity);

    const amount_unit: string =
      davtdata?.commodity == "OIDC" || davtdata?.commodity == "MANUFACTURER"
        ? quantityCount == "crate"
          ? (parseFloat(data.amount_unit) / commoditymaster.crate_size).toFixed(
              2
            )
          : data.amount_unit
        : data.amount_unit;

    const date = new Date(
      new Date(data.invoice_date).toISOString().split("T")[0]
    );
    date.setDate(date.getDate() + 1);

    const stock_response = await CreateDailySale({
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
      invoice_date: "",
      invoice_number: undefined,
      quantity: "",
      recipient_vat_no: "",
    });

    setTinData(null);
    setDvatdata(null);

    setVatAmount("0");
    setTaxableValue("0");
    setIsAgainstCForm(false);
    setLiquore(false);
    setLiquoreOIDCAmount(0);
    setLiquoreDealerAmount(0);
    setTinBox(false);
    setCommodityMaster([]);
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
          <TaxtInput<DailySaleForm>
            placeholder="Purchaser VAT Number. (26000000000 for B2C)"
            name="recipient_vat_no"
            required={true}
            title="Purchaser VAT Number"
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
          <TaxtInput<DailySaleForm>
            name="invoice_number"
            required={true}
            title="Invoice no."
            placeholder="Invoice no."
          />
        </div>
        <div className="mt-2">
          <DateSelect<DailySaleForm>
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
        <div className="mt-2">
          <div className="mt-2">
            <MultiSelect<DailySaleForm>
              placeholder="Select Items details"
              name="description_of_goods"
              required={true}
              title="Items details"
              options={commodityMaster.map(
                (
                  val: commodity_master & { quantity: number },
                  index: number
                ) => ({
                  value: val.id.toString(),
                  label:
                    val.product_name +
                    ` [${val.quantity} ${
                      val.product_type == "FUEL" ? "Litre" : "PCS"
                    }]`,
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

        {(davtdata?.commodity == "OIDC" ||
          davtdata?.commodity == "MANUFACTURER") &&
          commoditymaster != null && (
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
          )}
        <div className="mt-2">
          <TaxtInput<DailySaleForm>
            placeholder={
              (davtdata?.commodity == "OIDC" ||
                davtdata?.commodity == "MANUFACTURER") &&
              quantityCount == "crate"
                ? "Enter Crate amount (Sale price excluding VAT)"
                : "Enter Net amount/unit (Sale price excluding VAT)"
            }
            name="amount_unit"
            required={true}
            title={
              (davtdata?.commodity == "OIDC" ||
                davtdata?.commodity == "MANUFACTURER") &&
              quantityCount == "crate"
                ? "Enter Crate amount (Sale price excluding VAT)"
                : "Enter Net amount/unit (Sale price excluding VAT)"
            }
            // onlynumber={true}
            numdes={true}
          />
        </div>

        <div className="flex gap-1 items-center">
          <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
            <p className="text-xs font-normal">Taxable (%)</p>
            <p className="text-sm font-semibold">
              {isAgainstCForm
                ? "2%"
                : commoditymaster != null
                ? commoditymaster.taxable_at + "%"
                : "0%"}
            </p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Total Invoice Value</p>
            <p className="text-sm font-semibold">{taxableValue}</p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Total Taxable Value</p>
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
