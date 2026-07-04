/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { onFormError } from "@/utils/methods";
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
import { Input, InputRef, Modal, Radio, RadioChangeEvent, Select } from "antd";
import CreateTinNumber from "@/action/tin_number/createtin";
import { DateSelect } from "../inputfields/dateselect";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { useRouter } from "next/navigation";

const DAILY_PURCHASE_ADD_MORE_LOCK_KEY = "dailyPurchaseAddMoreLock";
type PurchaseTaxType =
  | "NONE"
  | "CFORM"
  | "FFORM"
  | "HFORM"
  | "IFORM"
  | "E1FORM"
  | "EXPORT";

type DailyPurchaseProviderProps = {
  setAddBox: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};
export const DailyPurchaseMasterProvider = (
  props: DailyPurchaseProviderProps,
) => {
  const methods = useForm<DailyPurchaseMasterForm>({
    resolver: valibotResolver(DailyPurchaseMasterSchema),
  });

  return (
    <FormProvider {...methods}>
      <DailyPurchaseMaster setAddBox={props.setAddBox} init={props.init} />
    </FormProvider>
  );
};

const DailyPurchaseMaster = (props: DailyPurchaseProviderProps) => {
  const router = useRouter();

  const [purchaseTaxType, setPurchaseTaxType] =
    useState<PurchaseTaxType>("NONE");

  const getSelectedTaxRate = () => {
    // if (purchaseTaxType === "CFORM") return "2";
    if (
      purchaseTaxType === "CFORM" ||
      purchaseTaxType === "FFORM" ||
      purchaseTaxType === "HFORM" ||
      purchaseTaxType === "IFORM" ||
      purchaseTaxType === "E1FORM" ||
      purchaseTaxType === "EXPORT"
    ) {
      return "0";
    }

    // For MANUFACTURER and WHOLESALER, regular purchases (NONE) have 20% tax
    if (
      purchaseTaxType === "NONE" &&
      (davtdata?.commodity === "MANUFACTURER" ||
        davtdata?.commodity === "WHOLESALER")
    ) {
      return "20";
    }

    return commoditymaster?.taxable_at ?? "0";
  };

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
    [],
  );

  const filterCommodityOptions = (
    allCommodities: commodity_master[],
    userCommodity: dvat04["commodity"],
  ): commodity_master[] => {
    if (
      userCommodity == "OIDC" ||
      userCommodity == "WHOLESALER" ||
      userCommodity == "MANUFACTURER" ||
      userCommodity == "RESTAURANT"
    ) {
      return allCommodities.filter(
        (val: commodity_master) => val.product_type == "LIQUOR",
      );
    }

    return allCommodities.filter(
      (val: commodity_master) => val.product_type == userCommodity,
    );
  };

  const init = async () => {
    const response = await GetUserDvat04();

    if (response.status && response.data) {
      setDvatdata(response.data);

      setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");
      const commodity_resposen = await AllCommodityMaster({});
      if (commodity_resposen.status && commodity_resposen.data) {
        setCommodityMaster(
          filterCommodityOptions(
            commodity_resposen.data,
            response.data.commodity,
          ),
        );
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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      const response = await GetUserDvat04();

      if (response.status && response.data) {
        setDvatdata(response.data);

        setQuantityCount(response.data.commodity == "OIDC" ? "crate" : "pcs");
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          setCommodityMaster(
            filterCommodityOptions(
              commodity_resposen.data,
              response.data.commodity,
            ),
          );
        }
      }

      const lockData = sessionStorage.getItem(DAILY_PURCHASE_ADD_MORE_LOCK_KEY);
      if (lockData) {
        try {
          const parsed = JSON.parse(lockData) as {
            recipient_vat_no: string;
            invoice_number: string;
            invoice_date: string;
          };

          reset({
            recipient_vat_no: parsed.recipient_vat_no,
            invoice_number: parsed.invoice_number,
            invoice_date: parsed.invoice_date,
            amount_unit: "",
            description_of_goods: undefined,
            quantity: "",
          });

          setIsAddMoreMode(true);
        } catch {
          sessionStorage.removeItem(DAILY_PURCHASE_ADD_MORE_LOCK_KEY);
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
  const [fuelTotalInvoiceValue, setFuelTotalInvoiceValue] =
    useState<string>("");

  const isLocalTinNumber = (tin: string): boolean => {
    return (
      (tin ?? "").length > 2 &&
      ((tin ?? "").startsWith("25") || (tin ?? "").startsWith("26"))
    );
  };

  useEffect(() => {
    const init = async () => {
      if (
        recipient_vat_no &&
        (recipient_vat_no.startsWith("25") || recipient_vat_no.startsWith("26"))
      ) {
        setPurchaseTaxType("NONE");
      }
      if (recipient_vat_no && isLocalTinNumber(recipient_vat_no)) {
        if (recipient_vat_no.length >= 11) {
          toast.dismiss();
          toast.error(
            "Local purchase will auto reflect after sale entry from the seller.",
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
  }, [recipient_vat_no, purchaseTaxType]);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");
  const amount_unit = watch("amount_unit");

  useEffect(() => {
    if (davtdata?.commodity !== "FUEL") {
      if (fuelTotalInvoiceValue !== "") {
        setFuelTotalInvoiceValue("");
      }
      return;
    }

    const totalInvoiceNumeric = Number(fuelTotalInvoiceValue);
    const quantityNumeric = Number(quantity);

    if (
      !Number.isFinite(totalInvoiceNumeric) ||
      totalInvoiceNumeric <= 0 ||
      !Number.isFinite(quantityNumeric) ||
      quantityNumeric <= 0
    ) {
      setValue("amount_unit", "0");
      return;
    }

    setValue("amount_unit", (totalInvoiceNumeric / quantityNumeric).toFixed(2));
  }, [davtdata?.commodity, fuelTotalInvoiceValue, quantity, setValue]);

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
            commmaster.data.oidc_crate_purchase_price ?? "0",
          );
        }
      }
    };
    init();
  }, [description_of_goods, purchaseTaxType]);

  useEffect(() => {
    if (commoditymaster == null) {
      setTaxableValue("0");
      setVatAmount("0");
      return;
    }

    const totalInvoiceNumeric =
      davtdata?.commodity === "FUEL"
        ? Number(fuelTotalInvoiceValue)
        : Number(quantity) * Number(amount_unit);

    if (!Number.isFinite(totalInvoiceNumeric) || totalInvoiceNumeric <= 0) {
      setTaxableValue("0");
      setVatAmount("0");
      return;
    }

    const taxRate = parseFloat(getSelectedTaxRate());

    const temp_amount = totalInvoiceNumeric / (1 + taxRate / 100);

    setTaxableValue(isNaN(temp_amount) ? "0" : temp_amount.toFixed(2));

    const calculatedVatAmount = totalInvoiceNumeric - temp_amount;

    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2),
    );
  }, [
    quantity,
    amount_unit,
    commoditymaster,
    purchaseTaxType,
    fuelTotalInvoiceValue,
    davtdata?.commodity,
  ]);

  const resolveSellerTin = async (): Promise<tin_number_master | null> => {
    const currentTin = (getValues("recipient_vat_no") ?? "").trim();

    if (currentTin.length >= 11) {
      const tinResponse = await SearchTin({
        tinumber: currentTin,
      });

      if (tinResponse.status && tinResponse.data) {
        setTinData(tinResponse.data);
        return tinResponse.data;
      }
    }

    return tindata;
  };

  const onSubmit = async (data: DailyPurchaseMasterForm) => {
    if (isLocalTinNumber(data.recipient_vat_no ?? "")) {
      toast.dismiss();
      toast.error(
        "Local purchase will auto reflect after sale entry from the seller.",
      );
      return;
    }

    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");

    const sellerTin = await resolveSellerTin();

    if (sellerTin == null || sellerTin == undefined)
      return toast.error("Seller TIN Number not found.");

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
      new Date(data.invoice_date).toISOString().split("T")[0],
    );
    date.setDate(date.getDate() + 1);

    const stock_response = await CreateDailyPurchase({
      amount_unit: amount_unit,
      invoice_date: date,
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      quantity: quantityamount,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: getSelectedTaxRate(),
      seller_tin_id: sellerTin.id,
      amount: taxableValue,
      against_cfrom: purchaseTaxType === "CFORM",
      is_against_fform: purchaseTaxType === "FFORM",
      is_against_hform: purchaseTaxType === "HFORM",
      is_against_iform: purchaseTaxType === "IFORM",
      is_against_e1form: purchaseTaxType === "E1FORM",
      is_export: purchaseTaxType === "EXPORT",
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    props.setAddBox(false);

    sessionStorage.removeItem(DAILY_PURCHASE_ADD_MORE_LOCK_KEY);

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
    setPurchaseTaxType("NONE");
    setIsAddMoreMode(false);
    setTinBox(false);
    setCommodityMaster([]);
    setDvatdata(null);
    setFuelTotalInvoiceValue("");
    await props.init();
    await init();
  };

  const addNew = async (data: DailyPurchaseMasterForm) => {
    if (isLocalTinNumber(data.recipient_vat_no ?? "")) {
      toast.dismiss();
      toast.error(
        "Local purchase will auto reflect after sale entry from the seller.",
      );
      return;
    }

    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");

    const sellerTin = await resolveSellerTin();

    if (sellerTin == null || sellerTin == undefined)
      return toast.error("Seller TIN Number not found.");
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
      new Date(data.invoice_date).toISOString().split("T")[0],
    );
    date.setDate(date.getDate() + 1);
    const stock_response = await CreateDailyPurchase({
      amount_unit: amount_unit,
      invoice_date: date,
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      quantity: quantityamount,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: getSelectedTaxRate(),
      seller_tin_id: sellerTin.id,
      amount: taxableValue,
      against_cfrom: purchaseTaxType === "CFORM",
      is_against_fform: purchaseTaxType === "FFORM",
      is_against_hform: purchaseTaxType === "HFORM",
      is_against_iform: purchaseTaxType === "IFORM",
      is_against_e1form: purchaseTaxType === "E1FORM",
      is_export: purchaseTaxType === "EXPORT",
    });

    if (stock_response.status) {
      toast.success(stock_response.message);
    } else {
      return toast.error(stock_response.message);
    }

    const currentValues = getValues();

    const lockPayload = {
      recipient_vat_no: currentValues.recipient_vat_no ?? "",
      invoice_number: currentValues.invoice_number ?? "",
      invoice_date: currentValues.invoice_date ?? "",
    };

    sessionStorage.setItem(
      DAILY_PURCHASE_ADD_MORE_LOCK_KEY,
      JSON.stringify(lockPayload),
    );

    setIsAddMoreMode(true);

    // reset({
    //   ...currentValues,
    //   quantity: "",
    //   amount_unit: "",
    //   description_of_goods: undefined,
    // });
    // setVatAmount("0");
    // setTaxableValue("0");

    reset({
      invoice_number: lockPayload.invoice_number,
      invoice_date: lockPayload.invoice_date,
      recipient_vat_no: lockPayload.recipient_vat_no,
      amount_unit: "",
      description_of_goods: undefined,
      quantity: "",
    });

    // clear form fields
    setVatAmount("0");
    setTaxableValue("0");
    setTinBox(false);
    setCommodityMaster([]);
    setDvatdata(null);
    setFuelTotalInvoiceValue("");

    await props.init();
    await init();
    setIsAddMoreMode(true);
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

  const [isAddMoreMode, setIsAddMoreMode] = useState(false);

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const formatAmount = (value: string | number | null | undefined): string => {
    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
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
            placeholder="Seller TIN Number"
            name="recipient_vat_no"
            required={true}
            title="Seller TIN Number"
            disable={isAddMoreMode}
            maxlength={11}
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

            {!tindata?.tin_number.startsWith("25") &&
              !tindata?.tin_number.startsWith("26") && (
                <div className="min-w-80">
                  <p className="text-xs text-gray-600 mb-1">Purchase Type</p>
                  <Select
                    style={{ width: "100%" }}
                    value={purchaseTaxType}
                    onChange={(value: PurchaseTaxType) =>
                      setPurchaseTaxType(value)
                    }
                    size="middle"
                    options={[
                      { value: "NONE", label: "Regular" },
                      { value: "CFORM", label: "Against C Form" },
                      { value: "FFORM", label: "Against F Form" },
                      { value: "HFORM", label: "Against H Form" },
                      { value: "IFORM", label: "Against I Form" },
                      { value: "E1FORM", label: "Against E1 Form" },
                      { value: "EXPORT", label: "Import" },
                    ]}
                  />
                </div>
              )}
          </div>
        )}

        <div className="mt-2">
          <TaxtInput<DailyPurchaseMasterForm>
            name="invoice_number"
            required={true}
            title="Invoice no."
            placeholder="Invoice no."
            disable={isAddMoreMode}
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
            disable={isAddMoreMode}
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
                }),
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

        {davtdata?.commodity == "FUEL" && (
          <div className="mt-2 ">
            <p className="text-sm font-normal">Total Invoice Value</p>
            <Input
              value={fuelTotalInvoiceValue}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setFuelTotalInvoiceValue(value);
                }
              }}
              placeholder="Enter Total Invoice Value"
              inputMode="decimal"
            />
          </div>
        )}

        {davtdata?.commodity != "FUEL" && (
          <div className="mt-2">
            <TaxtInput<DailyPurchaseMasterForm>
              placeholder={
                quantityCount == "crate"
                  ? "Enter Crate amount (Purchase price including VAT)"
                  : "Enter Unit amount (Purchase price including VAT)"
              }
              name="amount_unit"
              required={true}
              title={
                quantityCount == "crate"
                  ? "Enter Crate amount (Purchase price including VAT)"
                  : "Enter Unit amount (Purchase price including VAT)"
              }
              numdes={true}
            />
          </div>
        )}
        <div className="flex gap-1 items-center">
          <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
            <p className="text-xs font-normal">Taxable (%)</p>
            <p className="text-sm font-semibold">
              {getSelectedTaxRate() + "%"}
            </p>
          </div>
          {davtdata?.commodity == "FUEL" ? (
            <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
              <p className="text-xs font-normal">Net amount/unit</p>
              <p className="text-sm font-semibold">
                {amount_unit ? formatAmount(amount_unit) : "0.00"}
              </p>
              {/* <TaxtInput<DailyPurchaseMasterForm>
                placeholder="Quantity and Total Invoice Value"
                name="amount_unit"
                required={true}
                title="Net amount/unit"
                disable={true}
                numdes={true}
              /> */}
            </div>
          ) : (
            <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
              <p className="text-xs font-normal">Taxable Value</p>
              <p className="text-sm font-semibold">
                {formatAmount(taxableValue)}
              </p>
            </div>
          )}
          {davtdata?.commodity == "FUEL" ? (
            <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
              <p className="text-xs font-normal">Taxable Value</p>
              <p className="text-sm font-semibold">
                {formatAmount(taxableValue)}
              </p>
            </div>
          ) : (
            <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
              <p className="text-xs font-normal">Invoice Value</p>
              <p className="text-sm font-semibold">
                {formatAmount(
                  (Number(quantity) || 0) * (Number(amount_unit) || 0),
                )}
              </p>
            </div>
          )}
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">VAT Amount</p>
            <p className="text-sm font-semibold">{formatAmount(vatamount)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              sessionStorage.removeItem(DAILY_PURCHASE_ADD_MORE_LOCK_KEY);
              setIsAddMoreMode(false);
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
              sessionStorage.removeItem(DAILY_PURCHASE_ADD_MORE_LOCK_KEY);
              reset({
                amount_unit: "",
                description_of_goods: undefined,
                invoice_date: "",
                invoice_number: undefined,
                quantity: "",
                recipient_vat_no: "",
              });
              setFuelTotalInvoiceValue("");
              setIsAddMoreMode(false);
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
