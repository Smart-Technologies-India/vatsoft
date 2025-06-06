"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { TaxtInput } from "../inputfields/textinput";
import { MultiSelect } from "../inputfields/multiselect";
import { OptionValue } from "@/models/main";
import { DateSelect } from "../inputfields/dateselect";
import { TaxtAreaInput } from "../inputfields/textareainput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import SearchTin from "@/action/tin_number/searchtin";
import {
  CategoryOfEntry,
  commodity_master,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  Quarter,
  ReturnType,
  SaleOf,
  SaleOfInterstate,
  state,
  tin_number_master,
} from "@prisma/client";
import { Button } from "antd";
import { onFormError } from "@/utils/methods";
import { getCookie } from "cookies-next";
import { customAlphabet } from "nanoid";
import dayjs from "dayjs";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllState from "@/action/state/getallstate";
import { record30AForm, record30ASchema } from "@/schema/record30A";
import AddMultiReturnInvoice from "@/action/return/addmultireturninvoice";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";

type AddDvat30AEntryProviderProps = {};
export const AddDvat30AEntryProvider = (
  props: AddDvat30AEntryProviderProps
) => {
  const methods = useForm<record30AForm>({
    resolver: valibotResolver(record30ASchema),
  });

  return (
    <FormProvider {...methods}>
      <AddDvat30AEntry />
    </FormProvider>
  );
};

const AddDvat30AEntry = (props: AddDvat30AEntryProviderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id: number = parseInt(getCookie("id") ?? "0");

  const categoryOfEntry: OptionValue[] = [
    { value: "INVOICE", label: "Invoice" },
    { value: "CREDIT_NOTE", label: "Credit Note" },
    { value: "DEBIT_NOTE", label: "Debit Note" },
    { value: "GOODS_RETURNED", label: "Goods Returned" },
    { value: "CASH_MEMO", label: "Cash Memo" },
    { value: "FREIGHT_CHARGES", label: "Freight charges" },
    { value: "SALE_CANCELLED", label: "Sale Cancelled" },
  ];
  const purchase_type: OptionValue[] = [
    {
      value: "TAXABLE_RATE",
      label: "Taxable at - rate specified",
    },
    {
      value: "UNREGISTERED_DEALER",
      label: "Purchase From Unregistered Dealer",
    },
    // {
    //   value: "FORMC_CONCESSION",
    //   label: "Against Form C at concession rate",
    // },
    {
      value: "FORMC_WITHOUT_TAX",
      label: "Against Form C without tax - exempted goods",
    },
    {
      value: "FORM_H",
      label: "Against Form H",
    },
    {
      value: "LABOUR_CHARGE",
      label: "Labour Charges Paid",
    },
    {
      value: "STOCK_TRANSFER",
      label: "Stock or consignment tranfer",
    },
    {
      value: "TAXABLE_OTHER",
      label: "Taxable at - other rate ",
    },
    {
      value: "OUTSIDE_INDIA",
      label: "Import from outside India",
    },
  ];

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
  const dateFormat = "YYYY-MM-DD";

  const [state, setState] = useState<state[]>([]);

  const getMonthDateas = (month: string, year: string): GetMonthDateas => {
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) {
      toast.error("Invalid month name");
    }

    const yearNum = parseInt(year, 10);
    // Start date of the month
    const start = new Date(yearNum, monthIndex, 1);

    // End date of the month
    const end = new Date(yearNum, monthIndex + 1, 0); // setting day 0 gets the last day of the month
    // Formatting dates to "YYYY-MM-DD"
    const formattedStart = dayjs(start).format(dateFormat);
    const formattedEnd = dayjs(end).format(dateFormat);

    return { start: formattedStart, end: formattedEnd };
  };

  const [davtdata, setDvatdata] = useState<dvat04>();

  const {
    reset,
    handleSubmit,
    watch,
    getValues,
    formState: { isSubmitting },
  } = useFormContext<record30AForm>();

  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );

  useEffect(() => {
    reset({
      category_of_entry: "INVOICE",
    });

    const init = async () => {
      const response = await GetUserDvat04({
        userid: id,
      });

      if (response.status && response.data) {
        setDvatdata(response.data);
        const commodity_resposen = await AllCommodityMaster({});
        if (commodity_resposen.status && commodity_resposen.data) {
          const filterdata = commodity_resposen.data.filter(
            (val: commodity_master) =>
              val.product_type == response.data!.commodity
          );
          setCommodityMaster(filterdata);
        }
      }

      const stateresponse = await GetAllState({});
      if (stateresponse.status && stateresponse.data) {
        setState(stateresponse.data);
      }

      if ((searchParams.get("tin") ?? "").length > 0) {
        const tin_number: string = searchParams.get("tin") ?? "";
        reset({
          recipient_vat_no: tin_number,
        });
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipient_vat_no = watch("recipient_vat_no");

  const [tindata, setTinData] = useState<tin_number_master | null>(null);

  useEffect(() => {
    const init = async () => {
      if (recipient_vat_no.length > 11) return toast.error("Invalid DVAT no.");

      if (
        (recipient_vat_no ?? "").length > 2 &&
        (recipient_vat_no ?? "").startsWith("26")
      ) {
        return toast.error("Invalid VAT No.");
      }

      const tinresponse = await SearchTin({
        tinumber: recipient_vat_no,
      });

      if (tinresponse.status && tinresponse.data) {
        setTinData(tinresponse.data);
      }
    };
    init();
  }, [recipient_vat_no]);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");

  const [commodityMasterData, setCommodityMasterData] =
    useState<commodity_master | null>(null);

  useEffect(() => {
    if (!description_of_goods || commodityMaster.length === 0) return;
    const result = commodityMaster.find(
      (val: commodity_master) =>
        val.id.toString() == description_of_goods ||
        val.product_name.toString().toLowerCase() ==
          description_of_goods.toLowerCase()
    );
    if (!result) return;
    setCommodityMasterData(result);
  }, [description_of_goods, commodityMaster, commodityMasterData]);

  // Calculating VAT amount
  const vatAmount = useMemo(() => {
    if (!commodityMasterData || !quantity) return "0.00";

    const taxable_rate: number = parseInt(
      commodityMasterData.taxable_at ?? "0"
    );
    const taxable_value: number =
      parseInt(commodityMasterData.sale_price ?? "0") *
      (isNaN(parseInt(quantity)) ? 0 : parseInt(quantity));

    return ((taxable_value * taxable_rate) / 100).toFixed(2);
  }, [commodityMasterData, quantity]); // Only recalculate when commodityMasterData or quantity changes

  // Calculating taxable value
  const taxableValue = useMemo(() => {
    if (!commodityMasterData || !quantity) return "0";

    return (
      parseInt(commodityMasterData.sale_price ?? "0") *
      (isNaN(parseInt(quantity)) ? 0 : parseInt(quantity))
    );
  }, [commodityMasterData, quantity]);

  const onSubmit = async (data: record30AForm) => {
    if (!tindata) return toast.error("Enter Recipient VAT NO.");
    if (!commodityMasterData)
      return toast.error("Select Description of Goods.");

    const date = new Date(
      new Date(data.invoice_date).toISOString().split("T")[0]
    );
    date.setDate(date.getDate() + 1);

    addReturnData({
      invoice_number: data.invoice_number,
      total_invoice_number: data.total_invoice_number,
      invoice_date: date,
      seller_tin_numberId: tindata.id,
      category_of_entry: data.category_of_entry,
      purchase_type: data.purchase_type,
      place_of_supply: parseInt(data.place_of_supply),
      tax_percent: data.taxable_at,
      amount: taxableValue.toString(),
      vatamount: vatAmount,
      description_of_goods: commodityMasterData.product_name,
      quantity: parseInt(data.quantity),
      remarks: data.remarks ?? "",
    });

    const values = getValues();
    reset({
      ...values,
      description_of_goods: "",
      quantity: "",
    });
    // setLock(true);
    setCommodityMasterData(null);
  };

  // const [isLock, setLock] = useState<boolean>(false);

  interface DvatDataType {
    invoice_number: string;
    total_invoice_number: string;
    invoice_date: Date;
    seller_tin_numberId: number;
    category_of_entry?: CategoryOfEntry;
    sale_of?: SaleOf;
    sale_of_interstate?: SaleOfInterstate;
    input_tax_credit?: InputTaxCredit;
    nature_purchase?: NaturePurchase;
    nature_purchase_option?: NaturePurchaseOption;
    purchase_type?: PurchaseType;
    place_of_supply?: number;
    tax_percent?: string;
    amount?: string;
    vatamount?: string;
    remarks?: string;
    description_of_goods?: string;
    quantity: number;
  }

  const [returnData, setReturnData] = useState<DvatDataType[]>([]);

  // Add a new return data entry
  const addReturnData = (data: DvatDataType) => {
    setReturnData((prevData) => [...prevData, data]); // Append new data to the existing array
  };

  // Remove a return data entry by index
  const removeReturnData = (index: number) => {
    setReturnData((prevData) => prevData.filter((_, i) => i !== index)); // Remove data at the specified index
  };

  const submitAll = async () => {
    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);
    const response = await AddMultiReturnInvoice({
      createdById: id,
      returnType: ReturnType.ORIGINAL,
      year: searchParams.get("year")!.toString(),
      quarter: searchParams.get("quarter") as Quarter,
      month: searchParams.get("month")!.toString(),
      rr_number: "",
      total_tax_amount: vatAmount,
      dvat_type: DvatType.DVAT_30_A,
      urn_number: nanoid(),
      dvat_data: returnData,
    });
    if (response.status) {
      toast.success("Record 30-A added successfully");
      router.back();
    } else {
      toast.error(response.message);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <TaxtInput<record30AForm>
              name="recipient_vat_no"
              required={true}
              numdes={true}
              title="Recipient VAT NO."
              placeholder="Recipient VAT NO."
              // disable={isLock}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-normal">Name as in Master</p>
            <p className="font-medium text-lg">
              {tindata?.name_of_dealer ?? ""}
            </p>
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <MultiSelect<record30AForm>
              placeholder="Select Category of Entry"
              name="category_of_entry"
              required={true}
              title="Category of Entry"
              options={categoryOfEntry}
              // disable={isLock}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<record30AForm>
              name="invoice_number"
              required={true}
              title="Invoice no."
              placeholder="Invoice no."
              // disable={isLock}
            />
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <DateSelect<record30AForm>
              name="invoice_date"
              required={true}
              title="Invoice Date"
              format={"DD/MM/YYYY"}
              placeholder="Select Invoice Date"
              mindate={
                davtdata?.compositionScheme
                  ? dayjs(
                      getMonthDateas(
                        searchParams.get("month")?.toString()!,
                        searchParams.get("year")?.toString()!
                      ).start,
                      dateFormat
                    ).subtract(2, "month")
                  : dayjs(
                      getMonthDateas(
                        searchParams.get("month")?.toString()!,
                        searchParams.get("year")?.toString()!
                      ).start,
                      dateFormat
                    )
              }
              maxdate={dayjs(
                getMonthDateas(
                  searchParams.get("month")?.toString()!,
                  searchParams.get("year")?.toString()!
                ).end,
                dateFormat
              )}
              // disable={isLock}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<record30AForm>
              name="total_invoice_number"
              required={true}
              numdes={true}
              title="Total invoice value"
              placeholder="Total invoice value"
              // disable={isLock}
            />
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <MultiSelect<record30AForm>
              placeholder="Select nature of sale transaction"
              name="place_of_supply"
              required={true}
              title="Place of supply"
              options={state.map((value: state) => ({
                value: value.id.toString(),
                label: `${value.code} - ${value.name}`,
              }))}
              // disable={isLock}
            />
          </div>
          <div className="flex-1">
            <MultiSelect<record30AForm>
              placeholder="Select purchase Type"
              name="purchase_type"
              required={true}
              title="Purchase Type"
              options={purchase_type}
              // disable={isLock}
            />
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <TaxtAreaInput<record30AForm>
              name="remarks"
              required={true}
              title="Remarks"
              placeholder="Remarks"
              // disable={isLock}
            />
          </div>
        </div>

        <p className="text-[#162e57] text-sm mt-2">Item Details</p>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap border text-center p-1 h-8  min-w-80">
                Description of Goods
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center p-1 h-8  w-64">
                Quantity
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center p-1 h-8 w-64">
                Taxable Rate (%)
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center  w-40 p-1 h-8">
                Taxable value (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center w-40 p-1 h-8">
                VAT Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-left">
                <p className=""></p>
                <MultiSelect<record30AForm>
                  placeholder="Description of Goods"
                  name="description_of_goods"
                  required={true}
                  options={commodityMaster.map(
                    (val: commodity_master, index: number) => ({
                      value: val.id.toString(),
                      label: val.product_name,
                    })
                  )}
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <TaxtInput<record30AForm>
                  name="quantity"
                  required={true}
                  numdes={true}
                  placeholder="Enter Quantity"
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                {/* {commodityMasterData?.taxable_at ?? "0"}% */}
                <MultiSelect<record30AForm>
                  placeholder="Taxable Rate"
                  name="taxable_at"
                  required={true}
                  options={[
                    "0",
                    "1",
                    "2",
                    "4",
                    "5",
                    "6",
                    "12.5",
                    "12.75",
                    "13.5",
                    "15",
                    "20",
                  ].map((val: string, index: number) => ({
                    value: val,
                    label: val + "%",
                  }))}
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                {taxableValue}
              </TableCell>
              <TableCell className="p-2 border text-center">
                {vatAmount}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="w-full flex gap-2 mt-2">
          <div className="grow"></div>
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
            {isSubmitting ? "Loading...." : "Add"}
          </button>
        </div>
      </form>
      <div className="mt-2">
        <p className="text-[#162e57] text-lg font-medium mt-2">Item</p>
        {returnData.length == 0 ? (
          <>
            <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
              <p className="flex-1">There is no item added yet.</p>
            </div>
          </>
        ) : (
          <>
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap border text-center p-1 h-8  min-w-80">
                    Description of Goods
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center p-1 h-8  w-64">
                    Quantity
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center p-1 h-8 w-64">
                    Taxable Rate (%)
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center  w-40 p-1 h-8">
                    Taxable value (&#x20b9;)
                    <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center w-40 p-1 h-8">
                    VAT Amount
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center w-40 p-1 h-8">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnData.map((val: DvatDataType, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="p-2 border text-left">
                      {val.description_of_goods}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {val.quantity}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {val.tax_percent}%
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {val.amount}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {val.vatamount}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      <Button
                        onClick={() => {
                          removeReturnData(index);
                        }}
                        type="primary"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {returnData.length != 0 && (
          <>
            <div className="mt-2"></div>
            <Button onClick={submitAll} size="small" type="primary">
              Submit
            </Button>
          </>
        )}
      </div>
    </>
  );
};
