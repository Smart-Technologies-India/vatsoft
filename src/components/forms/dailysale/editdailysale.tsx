/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useRef, useState } from "react";
import { MultiSelect } from "../inputfields/multiselect";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
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
import GetUserCommodity from "@/action/stock/usercommodity";
import SearchTin from "@/action/tin_number/searchtin";
import { Input, InputRef, Modal, Select } from "antd";
import CreateTinNumber from "@/action/tin_number/createtin";
import { useRouter } from "next/navigation";
import EditSale from "@/action/stock/editsale";
import dayjs from "dayjs";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

type EditDailySaleProviderProps = {
  id: number;
  userid: number;
  data: (daily_sale & {
    commodity_master: commodity_master;
    seller_tin_number: tin_number_master;
  }) & {
    is_exempt?: boolean;
    is_against_iform?: boolean;
    is_h_export?: boolean;
    is_against_e1?: boolean;
  };
};
type AgainstType = "NONE" | "CFORM" | "FFORM" | "EXEMPT" | "IFORM" | "H_EXPORT" | "E1" | "EXPORT";
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
  const [userid, setUserid] = useState<number>(0);
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
    [],
  );
  const [againstType, setAgainstType] = useState<AgainstType>("NONE");
  const [isComp, setIsComp] = useState(false);

  const getSelectedTaxRate = () => {
    if (isComp) return "1";
    if (againstType === "CFORM") return "2";
    if (
      againstType === "FFORM" ||
      againstType === "EXEMPT" ||
      againstType === "IFORM" ||
      againstType === "H_EXPORT" ||
      againstType === "E1" ||
      againstType === "EXPORT"
    )
      return "0";
    return commoditymaster?.taxable_at ?? "0";
  };

  useEffect(() => {
    reset({
      recipient_vat_no: props.data.seller_tin_number.tin_number,
      amount_unit: (
        Number(props.data.amount) + Number(props.data.vatamount)
      ).toFixed(2),
      description_of_goods: props.data.commodity_master.id.toString(),
      invoice_date: props.data.invoice_date.toString(),
      invoice_number: props.data.invoice_number,
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
        if (commmaster.data.product_type == "LIQUOR") {
          setLiquore(true);
          setLiquoreAmount(parseInt(commmaster.data.sale_price));
          // setValue("amount_unit", commmaster.data.sale_price);
        }
      }

      const tin_response = await SearchTin({
        tinumber: props.data.seller_tin_number.tin_number,
      });

      // setValue("recipient_vat_no", "26000000000");

      if (tin_response.status && tin_response.data) {
        setTinData(tin_response.data);
      }

      const response = await GetUserDvat04();

      if (response.status && response.data) {
        setDvatdata(response.data);
        if (response.data.compositionScheme) {
          setIsComp(true);
        }
        const commodity_resposen = await GetUserCommodity({
          dvatid: response.data.id,
        });
        if (commodity_resposen.status && commodity_resposen.data) {
          setCommodityMaster(commodity_resposen.data);
        }
      }

      if (props.data.is_against_cform) {
        setAgainstType("CFORM");
      } else if (props.data.is_against_fform) {
        setAgainstType("FFORM");
      } else if (props.data.is_exempt) {
        setAgainstType("EXEMPT");
      } else if (props.data.is_against_iform) {
        setAgainstType("IFORM");
      } else if (props.data.is_h_export) {
        setAgainstType("H_EXPORT");
      } else if (props.data.is_against_e1) {
        setAgainstType("E1");
      } else if (props.data.is_export) {
        setAgainstType("EXPORT");
      } else {
        setAgainstType("NONE");
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

      if (
        recipient_vat_no &&
        (recipient_vat_no.startsWith("25") || recipient_vat_no.startsWith("26"))
      ) {
        setAgainstType("NONE");
      }

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

  const quantity = watch("quantity");
  const amount_unit = watch("amount_unit");

  useEffect(() => {
    if (commoditymaster == null || quantity == null || amount_unit == null)
      return;

    const totalInvoiceValue = Number(amount_unit) || 0;
    const taxPercentage = parseFloat(getSelectedTaxRate()) || 0;
    const calculatedTaxableValue =
      totalInvoiceValue / (1 + taxPercentage / 100);
    const calculatedVatAmount = totalInvoiceValue - calculatedTaxableValue;

    setTaxableValue(
      isNaN(calculatedTaxableValue) ? "0" : calculatedTaxableValue.toFixed(2),
    );
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2),
    );
  }, [quantity, amount_unit, commoditymaster, againstType, isComp]);

  const onSubmit = async (data: DailySaleForm) => {
    if (davtdata == null || davtdata == undefined)
      return toast.error("User Dvat not found.");
    if (commoditymaster == null || commoditymaster == undefined)
      return toast.error("Commodity Master not found.");
    if (tindata == null || tindata == undefined)
      return toast.error("Seller TIN Number not found.");

    const quantityNum = parseInt(data.quantity);
    if (quantityNum <= 0)
      return toast.error("Quantity must be greater than 0.");

    const totalInvoiceValue = parseFloat(data.amount_unit) || 0;
    const invoicePerUnit = totalInvoiceValue / quantityNum;

    if (
      isLiquore &&
      invoicePerUnit < (liquoreAmount / commoditymaster.crate_size) * 0.9
    ) {
      return toast.error("Sale amount can not be less than MRP.");
    }

    const isIsoDateString =
      typeof data.invoice_date === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(data.invoice_date);

    const normalizedDate = isIsoDateString
      ? data.invoice_date.slice(0, 10)
      : dayjs(data.invoice_date).format("YYYY-MM-DD");

    if (normalizedDate === "Invalid Date") {
      return toast.error("Invalid invoice date.");
    }

    const date = new Date(`${normalizedDate}T00:00:00.000Z`);

    const stock_response = await EditSale({
      id: props.id,
      amount_unit: invoicePerUnit.toFixed(2),
      invoice_date: date,
      invoice_number: data.invoice_number,
      dvatid: davtdata?.id,
      createdById: userid,
      quantity: quantityNum,
      vatamount: vatamount,
      commodityid: commoditymaster.id,
      tax_percent: getSelectedTaxRate(),
      seller_tin_id: tindata.id,
      amount: taxableValue,
      against_cfrom: againstType === "CFORM",
      is_against_fform: againstType === "FFORM",
      is_export: againstType === "EXPORT",
      is_exempt: againstType === "EXEMPT",
      is_against_iform: againstType === "IFORM",
      is_h_export: againstType === "H_EXPORT",
      is_against_e1: againstType === "E1",
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
        <p>This TIN Number not exist. Do you want to create it?</p>
        <Input ref={tinnname} placeholder="Enter The name of the dealer." />
      </Modal>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="mt-2">
          <TaxtInput<DailySaleForm>
            placeholder="Seller TIN Number"
            name="recipient_vat_no"
            required={true}
            title="Seller TIN Number"
            disable={true}
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
                  <p className="text-xs text-gray-600 mb-1">Sale Type</p>
                  <Select
                    style={{ width: "100%" }}
                    value={againstType}
                    onChange={(value: AgainstType) => setAgainstType(value)}
                    size="middle"
                    options={[
                      { value: "NONE", label: "Regular" },
                      { value: "CFORM", label: "Against C Form" },
                      { value: "FFORM", label: "Against F Form" },
                      { value: "EXEMPT", label: "Exempt against notification" },
                      { value: "IFORM", label: "Against I Form" },
                      { value: "H_EXPORT", label: "H Form Export" },
                      { value: "E1", label: "Against E1 Form" },
                      { value: "EXPORT", label: "Direct Export" },
                    ]}
                  />
                </div>
              )}
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
              disable={true}
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
            placeholder="Enter Total Invoice Value"
            name="amount_unit"
            required={true}
            title="Total Invoice Value"
            onlynumber={true}
          />
        </div>
        <div className="flex gap-1 items-center">
          <div className="mt-2 bg-gray-100 rounded p-2 flex-1">
            <p className="text-xs font-normal">Taxable (%)</p>
            <p className="text-sm font-semibold">{getSelectedTaxRate()}%</p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Total Invoice Value</p>
            <p className="text-sm font-semibold">
              {(Number(amount_unit) || 0).toFixed(2)}
            </p>
          </div>
          <div className="mt-2 bg-gray-100 rounded p-2  flex-1">
            <p className="text-xs font-normal">Total Taxable Value</p>
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
