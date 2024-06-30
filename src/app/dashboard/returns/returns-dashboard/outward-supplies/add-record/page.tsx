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
import { Button, DatePicker, Input } from "antd";
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
  return (
    <div className="p-2 mt-4">
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">
          B2B, 6EZ, DE - Add Invoices
        </div>

        <div className="flex mt-2 items-center">
          <div className="flex-1 flex gap-2  items-center">
            <Checkbox id="terms1" />
            <Label htmlFor="terms1" className="text-sm font-normal">
              Deenaed exports
            </Label>
          </div>
          <div className="flex-1 flex gap-2 items-center">
            <Checkbox id="terms2" />
            <Label htmlFor="terms2" className="text-sm font-normal">
              SEZ Suplies with payment
            </Label>
          </div>
          <div className="flex-1 flex gap-2 items-center">
            <Checkbox id="terms3" />
            <Label htmlFor="terms3" className="text-sm font-normal">
              SEZ Supplies withotu payment
            </Label>
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="gstin" className="text-sm font-normal">
              Recipient GSTIN/UIN <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="gstin"
              name="gstin"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Recipient GSTIN/UIN"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="sez" className="text-sm font-normal">
              SEZ Supplies with payment <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="sez"
              name="sez"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="SEZ Supplies with payment"
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
            <Label htmlFor="gstin" className="text-sm font-normal">
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
              Inovoice Date <span className="text-red-500">*</span>
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
            <Label htmlFor="gstin" className="text-sm font-normal">
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
              <TableHead className="whitespace-nowrap border text-center">
                Taxable value (&#x20b9;) <span className="text-red-500">*</span>
              </TableHead>
              <TableHead
                className="whitespace-nowrap border text-center"
                colSpan={3}
              >
                Amount of Tax
              </TableHead>
            </TableRow>
            <TableRow className="bg-gray-100">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-center">0%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">0.1%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">0.25%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">1%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">1.5%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">3%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">5%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">6%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">7.5%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">12%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">18%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">22%</TableCell>
              <TableCell className="p-2 border text-center">
                <Input />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Input disabled />
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
