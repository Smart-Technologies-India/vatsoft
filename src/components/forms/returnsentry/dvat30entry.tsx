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
  commodity_master,
  dvat04,
  DvatType,
  InputTaxCredit,
  Quarter,
  ReturnType,
  tin_number_master,
} from "@prisma/client";
import { Button } from "antd";
import GetAllCommodityMaster from "@/action/commoditymaster/getallcommoditymaster";
import { onFormError } from "@/utils/methods";
import AddReturnInvoice from "@/action/return/addreturninvoice";
import { getCookie } from "cookies-next";
import { customAlphabet } from "nanoid";
import dayjs from "dayjs";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { record30Form, record30Schema } from "@/schema/record30";
import { Label } from "@/components/ui/label";
import { RabioInput } from "../inputfields/radioinput";
import getReturnEntryById from "@/action/return/getreturnentrybyid";
import UpdateReturnEntry from "@/action/return/updatereturnentry";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";

type CreateDvat30EntryProviderProps = {};
export const CreateDvat30EntryProvider = (
  props: CreateDvat30EntryProviderProps
) => {
  const methods = useForm<record30Form>({
    resolver: valibotResolver(record30Schema),
  });

  return (
    <FormProvider {...methods}>
      <CreateDvat30Entry />
    </FormProvider>
  );
};

const CreateDvat30Entry = (props: CreateDvat30EntryProviderProps) => {
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
  const nature_purchase: OptionValue[] = [
    { value: "CAPITAL_GOODS", label: "Capital Goods" },
    { value: "OTHER_GOODS", label: "Other Goods" },
  ];
  const nature_purchase_option: OptionValue[] = [
    {
      value: "UNREGISTER_DEALERS",
      label: "Purchases from unregistered dealers",
    },
    // {
    //   value: "REGISTER_DEALERS",
    //   label: "Purchases from registered dealers",
    // },
    { value: "OTHER", label: "Any Other Purchases" },
    { value: "UNITS", label: "Purchase from Exempted Untis" },
  ];

  const input_tax_credit: OptionValue[] = [
    {
      value: InputTaxCredit.ITC_NOT_ELIGIBLE,
      label: "Purchase eligible for credit of input tax",
    },
    // {
    //   value: InputTaxCredit.ITC_ELIGIBLE,
    //   label: "Purchases from registered dealers",
    // },
    { value: InputTaxCredit.OTHER, label: "Any Other Purchase" },
    {
      value: InputTaxCredit.PURCHASE_TAXABLE,
      label: "Purchase Taxable At Concessional Rate",
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
    formState: { isSubmitting },
  } = useFormContext<record30Form>();

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

      if (searchParams.get("id")) {
        const return_entry_id: number = parseInt(searchParams.get("id") ?? "0");
        const return_entry = await getReturnEntryById({
          id: return_entry_id,
        });

        if (return_entry.status && return_entry.data) {
          reset({
            category_of_entry: return_entry.data.category_of_entry!,
            invoice_number: return_entry.data.invoice_number!,
            invoice_date: return_entry.data.invoice_date.toISOString(),
            total_invoice_number: return_entry.data.total_invoice_number,
            nature_purchase: return_entry.data.nature_purchase!,
            nature_purchase_option: return_entry.data.nature_purchase_option!,
            input_tax_credit: return_entry.data.input_tax_credit!,
            remarks: return_entry.data.remarks,
            quantity: return_entry.data.quantity!.toString(),
            description_of_goods: return_entry.data.description_of_goods!,
            recipient_vat_no: return_entry.data.seller_tin_number.tin_number,
          });
        }
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
        !(recipient_vat_no ?? "").startsWith("26")
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

  const onSubmit = async (data: record30Form) => {
    if (!tindata) return toast.error("Enter Recipient VAT NO.");
    if (!commodityMasterData)
      return toast.error("Select Description of Goods.");

    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);

    if (searchParams.get("id")) {
      const return_entry_id: number = parseInt(searchParams.get("id") ?? "0");

      const recordresponse = await UpdateReturnEntry({
        id: return_entry_id,
        updatedById: id,
        invoice_number: data.invoice_number,
        total_invoice_number: data.total_invoice_number,
        invoice_date: new Date(data.invoice_date),
        input_tax_credit: data.input_tax_credit,
        nature_purchase: data.nature_purchase,
        nature_purchase_option: data.nature_purchase_option,
        seller_tin_numberId: tindata.id,
        category_of_entry: data.category_of_entry,
        place_of_supply: 25,
        tax_percent: commodityMasterData.taxable_at,
        amount: taxableValue.toString(),
        vatamount: vatAmount,
        description_of_goods: commodityMasterData.product_name,
        quantity: parseInt(data.quantity),
        remark: data.remarks == null ? "" : data.remarks,
      });
      if (recordresponse.status) {
        toast.success("Record 30 updated successfully");
        router.back();
      } else {
        toast.error(recordresponse.message);
      }
    } else {
      const recordresponse = await AddReturnInvoice({
        createdById: id,
        returnType: ReturnType.ORIGINAL,
        year: searchParams.get("year")!.toString(),
        quarter: searchParams.get("quarter") as Quarter,
        month: searchParams.get("month")!.toString(),
        rr_number: "",
        total_tax_amount: vatAmount,
        dvat_type: DvatType.DVAT_30,
        urn_number: nanoid(),
        invoice_number: data.invoice_number,
        total_invoice_number: data.total_invoice_number,
        invoice_date: new Date(data.invoice_date),
        input_tax_credit: data.input_tax_credit,
        nature_purchase: data.nature_purchase,
        nature_purchase_option: data.nature_purchase_option,
        seller_tin_numberId: tindata.id,
        category_of_entry: data.category_of_entry,
        place_of_supply: 25,
        tax_percent: commodityMasterData.taxable_at,
        amount: taxableValue.toString(),
        vatamount: vatAmount,
        description_of_goods: commodityMasterData.product_name,
        quantity: parseInt(data.quantity),
        ...(data.remarks && { remark: data.remarks }),
      });

      if (recordresponse.status) {
        toast.success("Record 30 added successfully");
        router.back();
      } else {
        toast.error(recordresponse.message);
      }
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <TaxtInput<record30Form>
              name="recipient_vat_no"
              required={true}
              numdes={true}
              title="Recipient VAT NO."
              placeholder="Recipient VAT NO."
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-normal">Name as in Master</p>
            <p className="font-semibold text-lg">
              {tindata?.name_of_dealer ?? ""}
            </p>
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <MultiSelect<record30Form>
              placeholder="Select Category of Entry"
              name="category_of_entry"
              required={true}
              title="Category of Entry"
              options={categoryOfEntry}
            />
          </div>
          <div className="flex-1">
            <TaxtInput<record30Form>
              name="invoice_number"
              required={true}
              numdes={true}
              title="Invoice no."
              placeholder="Invoice no."
            />
          </div>
        </div>
        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <DateSelect<record30Form>
              name="invoice_date"
              required={true}
              title="Invoice Date"
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
            />
          </div>
          <div className="flex-1">
            <TaxtInput<record30Form>
              name="total_invoice_number"
              required={true}
              numdes={true}
              title="Total invoice value"
              placeholder="Total invoice value"
            />
          </div>
        </div>

        <div className="mt-4">
          <RabioInput<record30Form>
            name="input_tax_credit"
            title="Select Tax Input Credit"
            required={true}
            options={input_tax_credit}
          />
        </div>

        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row items-center">
          <div className="flex-1">
            <Label htmlFor="vatno" className="text-sm font-normal">
              Select nature of purchase transaction
              <span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="flex-1">
            <MultiSelect<record30Form>
              placeholder="Select nature of purchase"
              name="nature_purchase"
              required={true}
              options={nature_purchase}
            />
          </div>
          <div className="flex-1">
            <MultiSelect<record30Form>
              placeholder="Select nature of purchase option"
              name="nature_purchase_option"
              required={true}
              options={nature_purchase_option}
            />
          </div>
        </div>

        <div className="flex sm:gap-4 mt-1 flex-col sm:flex-row">
          <div className="flex-1">
            <TaxtAreaInput<record30Form>
              name="remarks"
              required={true}
              title="Remarks"
              placeholder="Remarks"
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
                <MultiSelect<record30Form>
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
                <TaxtInput<record30Form>
                  name="quantity"
                  required={true}
                  numdes={true}
                  placeholder="Enter Quantity"
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                {commodityMasterData?.taxable_at ?? "0"}%
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
            {isSubmitting
              ? "Loading...."
              : searchParams.get("id")
              ? "Update"
              : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};
