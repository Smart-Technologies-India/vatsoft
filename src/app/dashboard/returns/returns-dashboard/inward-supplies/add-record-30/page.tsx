"use client";

import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AddReturnInvoice from "@/action/return/addreturninvoice";
import SearchTin from "@/action/tin_number/searchtin";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { record30Schema } from "@/schema/record30";
import {
  CategoryOfEntry,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  Quarter,
  ReturnType,
} from "@prisma/client";
import {
  Button,
  DatePicker,
  Input,
  InputRef,
  Radio,
  RadioChangeEvent,
  Select,
} from "antd";
import { getCookie } from "cookies-next";
import dayjs, { Dayjs } from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { FocusEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";

const { TextArea } = Input;

const AddRecord = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");
  const [davtdata, setDvatdata] = useState<dvat04>();

  const dateFormat = "YYYY-MM-DD";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const id: number = parseInt(getCookie("id") ?? "0");

  const master_name_numberRef = useRef<InputRef>(null);
  const [tinId, setTinId] = useState<number>();
  const [category_of_entry, setCategoryOfEntry] = useState<CategoryOfEntry>();
  const invoice_numberRef = useRef<InputRef>(null);
  const [invoice_date, setInvoiceDate] = useState<Date>();
  const invoice_valueRef = useRef<InputRef>(null);

  const [input_tax_credit, setInputTaxCredit] = useState<InputTaxCredit>();
  const [nature_purchase, setNaturePurchase] = useState<NaturePurchase>();
  const [nature_purchase_option, setNaturePurchaseOption] =
    useState<NaturePurchaseOption>();

  const amount = useRef<InputRef>(null);
  const remarks = useRef<InputRef>(null);
  const [tax_percent, setTaxPercent] = useState<string | null>(null);

  const description_of_goods = useRef<InputRef>(null);
  const [vatAmount, setVatAmount] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const response = await GetUserDvat04({
        userid: userid,
      });
      if (response.status && response.data) {
        setDvatdata(response.data);
      }

      setIsLoading(false);
    };
    init();
  }, []);

  const handelDate = (dates: Dayjs | null, dateStrings: string | string[]) => {
    if (!dates) return;
    const date: Date = dates.toDate();
    setInvoiceDate(date);
  };

  const route = useRouter();

  const tin_user_search = async (value: string) => {
    if (!value.startsWith("26")) {
      return toast.error("Invalid VAT No.");
    }
    const tinresponse = await SearchTin({
      tinumber: value,
    });

    if (!tinresponse.status) {
      toast.error(tinresponse.message);
    } else {
      setTinId(tinresponse.data!.id);
      if (master_name_numberRef.current) {
        master_name_numberRef.current!.input!.value =
          tinresponse.data?.name_of_dealer ?? "";
      }
    }
  };

  const onlyNumbersRegex = /^[0-9]*$/;

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    if (!onlyNumbersRegex.test(value)) {
      event.target.value = event.target.value.slice(0, -1);
    }
    setVatAmount(
      (
        (parseFloat(event.target.value) * parseFloat(tax_percent ?? "0")) /
        100
      ).toFixed(2)
    );
  };

  const handlePercentChange = (value: string) => {
    setTaxPercent(value);

    const percent: string = (
      (parseFloat(amount.current!.input!.value.toString() ?? "0") *
        parseFloat(value ?? "0")) /
      100
    ).toFixed(2);
    setVatAmount(percent);
  };

  const addrecord = async () => {
    setIsSubmit(true);

    if (
      parseInt(invoice_valueRef.current?.input?.value!) <=
      parseInt(amount.current?.input?.value!) + parseInt(vatAmount)
    ) {
      setIsSubmit(false);
      return toast.error("Invoice value cannot be less than taxable value");
    }

    const result = safeParse(record30Schema, {
      rr_number: "",
      return_type: ReturnType.ORIGINAL,
      year: searchParams.get("year")?.toString(),
      quarter: searchParams.get("quarter") as Quarter,
      month: searchParams.get("month")?.toString(),
      total_tax_amount: vatAmount,
      dvat_type: DvatType.DVAT_30,
      urn_number: "",
      invoice_number: invoice_numberRef.current?.input?.value,
      total_invoice_number: invoice_valueRef.current?.input?.value,
      invoice_date: invoice_date?.toISOString(),
      seller_tin_numberId: tinId,
      category_of_entry: category_of_entry,
      input_tax_credit: input_tax_credit,
      nature_purchase: nature_purchase,
      nature_purchase_option: nature_purchase_option,
      place_of_supply: 25,
      tax_percent: tax_percent,
      amount: amount.current?.input?.value,
      vatamount: vatAmount,
      description_of_goods: description_of_goods.current?.input?.value,
    });

    if (result.success) {
      const recordresponse = await AddReturnInvoice({
        createdById: id,
        year: result.output.year,
        month: result.output.month,
        quarter: result.output.quarter,
        rr_number: result.output.rr_number,
        returnType: result.output.return_type,
        total_tax_amount: result.output.total_tax_amount,
        dvat_type: result.output.dvat_type,
        urn_number: result.output.urn_number,
        invoice_number: result.output.invoice_number,
        total_invoice_number: result.output.total_invoice_number,
        invoice_date: new Date(result.output.invoice_date),
        input_tax_credit: result.output.input_tax_credit,
        nature_purchase: result.output.nature_purchase,
        nature_purchase_option: result.output.nature_purchase_option,
        seller_tin_numberId: result.output.seller_tin_numberId,
        category_of_entry: result.output.category_of_entry,
        place_of_supply: result.output.place_of_supply,
        tax_percent: result.output.tax_percent,
        amount: result.output.amount,
        vatamount: result.output.vatamount,
        description_of_goods: result.output.description_of_goods,
        ...(remarks.current?.input?.value && {
          remarks: remarks.current?.input?.value,
        }),
      });
      if (recordresponse.status) {
        toast.success("Record 31-A added successfully");
        window.location.reload();
      } else {
        toast.error(recordresponse.message);
      }
    } else {
      let errorMessage = "";
      if (result.issues[0].input) {
        errorMessage = result.issues[0].message;
      } else {
        errorMessage = result.issues[0].path![0].key + " is required";
      }
      toast.error(errorMessage);
    }
    setIsSubmit(false);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-100">
        Loading...
      </div>
    );
  return (
    <div className="p-2 mt-2">
      <div className="bg-white p-2 shadow mt-2">
        <div className="flex gap-4 ">
          <div className="flex-1">
            <Label htmlFor="vatno" className="text-sm font-normal">
              Recipient VAT NO. <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="vatno"
              name="vatno"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Recipient VAT NO."
              onBlur={(e: FocusEvent<HTMLInputElement> | undefined) => {
                if (!e || !e.target.value) return;
                tin_user_search(e.target.value);
              }}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="master" className="text-sm font-normal">
              Name as in Master <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="master"
              name="master"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Name as in Master"
              ref={master_name_numberRef}
              disabled
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="sez" className="text-sm font-normal">
              Category of Entry <span className="text-red-500">*</span>
            </Label>
            <Select
              className="w-full block mt-1"
              placeholder="Select Category"
              onChange={(value: CategoryOfEntry) => setCategoryOfEntry(value)}
              options={[
                { value: "INVOICE", label: "Invoice" },
                { value: "CREDIT_NOTE", label: "Credit Note" },
                { value: "DEBIT_NOTE", label: "Debit Note" },
                { value: "GOODS_RETURNED", label: "Goods Returned" },
                { value: "CASH_MEMO", label: "Cash Memo" },
                { value: "FREIGHT_CHARGES", label: "Freight charges" },
                { value: "SALE_CANCELLED", label: "Sale Cancelled" },
              ]}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="vatno" className="text-sm font-normal">
              Invoice no. <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="invoice"
              name="invoice"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Invoice no."
              ref={invoice_numberRef}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="invoicedate" className="text-sm font-normal">
              Invoice Date <span className="text-red-500">*</span>
            </Label>

            <DatePicker
              onChange={handelDate}
              className="block mt-1"
              minDate={
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
              maxDate={dayjs(
                getMonthDateas(
                  searchParams.get("month")?.toString()!,
                  searchParams.get("year")?.toString()!
                ).end,
                dateFormat
              )}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="master" className="text-sm font-normal">
              Total invoice value (&#x20b9;)
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="invoicevaleu"
              name="invoicevaleu"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Total invoice value"
              ref={invoice_valueRef}
            />
          </div>
        </div>

        <Radio.Group
          onChange={(e: RadioChangeEvent) => setInputTaxCredit(e.target.value)}
          value={input_tax_credit}
          className="mt-2"
        >
          <Radio value={InputTaxCredit.ITC_NOT_ELIGIBLE} className="text-xs">
            Purchase not eligible for credit of input tax
          </Radio>
          <Radio value={InputTaxCredit.ITC_ELIGIBLE} className="text-xs">
            Purchase eligible for credit of input tax
          </Radio>
          <Radio value={InputTaxCredit.OTHER} className="text-xs">
            Any Other Purchase
          </Radio>
          <Radio value={InputTaxCredit.PURCHASE_TAXABLE} className="text-xs">
            Purchase Taxable At Concessional Rate
          </Radio>
        </Radio.Group>

        <div className="flex gap-4 mt-4 items-center">
          <div className="flex-1">
            <Label htmlFor="vatno" className="text-sm font-normal">
              Select nature of purchase transaction
              <span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="flex-1">
            <Select
              className="w-full block mt-1"
              placeholder="Select"
              onChange={(value: NaturePurchase) => setNaturePurchase(value)}
              options={[
                { value: "CAPITAL_GOODS", label: "Capital Goods" },
                { value: "OTHER_GOODS", label: "Other Goods" },
              ]}
            />
          </div>
          <div className="flex-1">
            <Select
              className="w-full block mt-1"
              placeholder="Select"
              onChange={(value: NaturePurchaseOption) =>
                setNaturePurchaseOption(value)
              }
              options={[
                {
                  value: "UNREGISTER_DEALERS",
                  label: "Purchases from unregistered dealers",
                },
                {
                  value: "REGISTER_DEALERS",
                  label: "Purchases from registered dealers",
                },
                { value: "OTHER", label: "Any Other Purchases" },
                { value: "UNITS", label: "Purchase from Exempted Untis" },
              ]}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="remark" className="text-sm font-normal mt-2">
            Remarks <span className="text-red-500">*</span>
          </Label>
          <TextArea
            rows={3}
            placeholder="Remark ..."
            style={{ resize: "none" }}
            className="mt-1 placeholder:text-xs resize-none"
            ref={remarks}
          />
        </div>

        <p className="text-[#162e57] text-sm mt-2">Item Details</p>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap border text-center p-1 h-8 w-64">
                Rate (%)
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center p-1 h-8  min-w-80">
                Description of Goods
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center  w-40 p-1 h-8">
                Taxable value (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center w-40 p-1 h-8">
                Vat Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-left flex items-center gap-4">
                <p className="">Goods taxable at</p>
                <Select
                  className="w-28 block mt-1"
                  placeholder="Select"
                  onChange={handlePercentChange}
                  options={[
                    {
                      value: "0",
                      label: "0%",
                    },
                    {
                      value: "1",
                      label: "1%",
                    },
                    {
                      value: "2",
                      label: "2%",
                    },
                    {
                      value: "4",
                      label: "4%",
                    },
                    {
                      value: "5",
                      label: "5%",
                    },
                    {
                      value: "6",
                      label: "6%",
                    },
                    {
                      value: "12.5",
                      label: "12.5%",
                    },
                    {
                      value: "12.75",
                      label: "12.75%",
                    },
                    {
                      value: "13.5",
                      label: "13.5%",
                    },
                    {
                      value: "15",
                      label: "15%",
                    },
                    {
                      value: "20",
                      label: "20%",
                    },
                  ]}
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input
                  type="text"
                  id="description_of_goods"
                  name="description_of_goods"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Description of Goods"
                  ref={description_of_goods}
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input
                  type="text"
                  id="invoicevaleu"
                  name="invoicevaleu"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Taxable value"
                  ref={amount}
                  onChange={handleAmountChange}
                />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input
                  disabled
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex mt-2 gap-2">
          <div className="grow"></div>
          {isSubmit ? (
            <Button
              disabled={true}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm px-4 rounded"
            >
              Loading...
            </Button>
          ) : (
            <button
              className="py-1 px-4 rounded bg-blue-500 text-sm text-white hover:bg-blue-600"
              onClick={addrecord}
            >
              SAVE
            </button>
          )}
          <Button type="default" onClick={() => route.back()}>
            BACK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;
