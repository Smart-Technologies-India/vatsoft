"use client";

import { MdiPlusCircle } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, DatePicker, Input, Select } from "antd";
import { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";

const AddRecord = () => {
  const onChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: string | string[]
  ) => {
    // setSearchDate(dates);
  };

  //   const onChange: DatePickerProps["onChange"] = (date, dateString) => {
  //     console.log(date, dateString);
  //   };
  const route = useRouter();

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };
  return (
    <div className="p-2 mt-4">
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">Add Invoices</div>

        <div className="flex mt-4 items-center justify-between">
          <div className="flex gap-1  items-center">
            <Checkbox id="terms1" />
            <Label htmlFor="terms1" className="text-xs font-normal">
              Purchase not eligible for credit of input tax
            </Label>
          </div>
          <div className="flex gap-1 items-center">
            <Checkbox id="terms2" />
            <Label htmlFor="terms2" className="text-xs font-normal">
              Purchase eligible for credit of input tax
            </Label>
          </div>
          <div className="flex gap-1 items-center">
            <Checkbox id="terms3" />
            <Label htmlFor="terms3" className="text-xs font-normal">
              Any Other Purchase
            </Label>
          </div>
          <div className="flex gap-1 items-center">
            <Checkbox id="terms3" />
            <Label htmlFor="terms3" className="text-xs font-normal">
              Purchase Taxable At Concessional Rate
            </Label>
          </div>
        </div>

        <div className="flex gap-4 mt-2">
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
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="sez" className="text-sm font-normal">
              Category of Entry <span className="text-red-500">*</span>
            </Label>
            <Select
              className="w-full block mt-1"
              placeholder="Select"
              onChange={handleChange}
              options={[
                { value: "1", label: "Invoice" },
                { value: "2", label: "Credit Note" },
                { value: "3", label: "Debit Note" },
                { value: "4", label: "Goods Returned" },
                { value: "4", label: "Cash Memo" },
                { value: "4", label: "Works Contract" },
                { value: "4", label: "Freight charges" },
              ]}
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
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
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
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="invoicedate" className="text-sm font-normal">
              Invoice Date <span className="text-red-500">*</span>
            </Label>

            <DatePicker onChange={onChange} className="block mt-1" />
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
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="vatno" className="text-sm font-normal">
              POS <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="pos"
              name="pos"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="POS"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="invoicedate" className="text-sm font-normal">
              Supply Type <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="supplytype"
              name="supplytype"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Supply Type"
            />
          </div>
          <div className="flex-1"></div>
        </div>

        <p className="text-[#162e57] text-sm mt-2">Item Details</p>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap border text-center">
                Rate (%)
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center  w-60">
                Taxable value (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center w-60">
                Vat Amount
              </TableHead>
            </TableRow>
            {/* <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap text-center"></TableHead>
              <TableHead className="whitespace-nowrap text-center"></TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Central tax (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                State/UT tax (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Cess (&#x20b9;)
              </TableHead>
            </TableRow> */}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 0%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 1%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 4%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 5%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 12.5%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 12.75%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 13.5%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 15%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-left">
                R4.1 Goods taxable at 20%
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex mt-2 gap-2">
          <div className="grow"></div>
          <Button type="primary">SAVE</Button>
          <Button type="default" onClick={() => route.back()}>
            BACK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;
