"use client";

import AddReturnInvoice from "@/action/return/addreturninvoice";
import GetAllState from "@/action/state/getallstate";
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
import { record30ASchema } from "@/schema/record30A";
import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  PurchaseType,
  Quarter,
  ReturnType,
  state,
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
import { Dayjs } from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { FocusEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";

const { TextArea } = Input;

const AddRecord = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [state, setState] = useState<state[]>([]);
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
  const [purchase_type, setPurchaseType] = useState<PurchaseType>();

  const [place_of_supply, SetPlaceOfSupply] = useState<number>();
  const amount = useRef<InputRef>(null);
  const remarks = useRef<InputRef>(null);
  const [tax_percent, setTaxPercent] = useState<string | null>(null);

  const [vatAmount, setVatAmount] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const stateresponse = await GetAllState({});
      if (stateresponse.status && stateresponse.data) {
        setState(stateresponse.data);
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
    if (value.startsWith("26")) {
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

      const code = value.slice(0, 2);
      const stateid = state.filter((val: state) => val.code == code)[0].id;
      SetPlaceOfSupply(stateid);
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

    const result = safeParse(record30ASchema, {
      rr_number: "0",
      return_type: ReturnType.ORIGNAL,
      year: searchParams.get("year")?.toString(),
      quarter: searchParams.get("quarter") as Quarter,
      month: searchParams.get("month")?.toString(),
      total_tax_amount: vatAmount,
      dvat_type: DvatType.DVAT_30_A,
      urn_number: "0",
      invoice_number: invoice_numberRef.current?.input?.value,
      total_invoice_number: invoice_numberRef.current?.input?.value,
      invoice_date: invoice_date?.toISOString(),
      input_tax_credit: input_tax_credit,
      seller_tin_numberId: tinId,
      category_of_entry: category_of_entry,
      place_of_supply: place_of_supply,
      tax_percent: tax_percent,
      amount: amount.current?.input?.value,
      vatamount: vatAmount,
      purchase_type: purchase_type,
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
        purchase_type: result.output.purchase_type,
        seller_tin_numberId: result.output.seller_tin_numberId,
        category_of_entry: result.output.category_of_entry,
        place_of_supply: result.output.place_of_supply,
        tax_percent: result.output.tax_percent,
        amount: result.output.amount,
        vatamount: result.output.vatamount,
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
              disabled
              ref={master_name_numberRef}
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
                { value: "WORKS_CONTRACT", label: "Works Contract" },
                { value: "FREIGHT_CHARGES", label: "Freight charges" },
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

            <DatePicker onChange={handelDate} className="block mt-1" />
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

        <div className="flex gap-4 mt-4 items-center">
          <div className="flex-1">
            <Label htmlFor="pos" className="text-sm font-normal">
              Place of Supply
              <span className="text-red-500">*</span>
            </Label>
            <Select
              className="w-full block mt-1"
              placeholder="Select Place of Supply"
              onChange={(value: number) => SetPlaceOfSupply(value)}
              options={state.map((value: state) => ({
                value: value.id,
                label: `${value.code} - ${value.name}`,
              }))}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="purchasetype" className="text-sm font-normal">
              Purchase Type
              <span className="text-red-500">*</span>
            </Label>
            <Select
              className="w-full block mt-1"
              placeholder="Select Purchase Type"
              onChange={(value: PurchaseType) => setPurchaseType(value)}
              options={[
                {
                  value: "OUTSIDE_INDIA",
                  label: "Import from outside India",
                },
                {
                  value: "STOCK_TRANSFER",
                  label: "Stock or consignment tranfer",
                },
                {
                  value: "FORMC_CONCESSION",
                  label: "Against Form C at concession rate",
                },
                {
                  value: "FORMC_WITHOUT_TAX",
                  label: "Against Form C without tax - exempted goods",
                },
                {
                  value: "TAXABLE_RATE",
                  label: "Taxable at - rate specified",
                },
                {
                  value: "TAXABLE_OTHER",
                  label: "Taxable at - other rate ",
                },
              ]}
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
              <TableHead className="whitespace-nowrap border text-center p-1 h-8">
                Rate (%)
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center  w-60 p-1 h-8">
                Taxable value (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center w-60 p-1 h-8">
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
                  id="invoicevaleu"
                  name="invoicevaleu"
                  className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                  placeholder="Total invoice value"
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
