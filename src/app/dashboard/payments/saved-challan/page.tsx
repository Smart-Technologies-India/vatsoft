"use client";

import { Button, Input, Select } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker } from "antd";
import { useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";

const CreateChallan = () => {
  const cpinRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Create Challan</div>
          <div className="p-2 bg-gray-50 mt-2">
            <p className="text-sm">Reason For Challan</p>
            <Select
              className="mt-1"
              showSearch
              style={{ width: 200 }}
              placeholder="Search to Select"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              options={[
                {
                  value: "1",
                  label: "Not Identified",
                },
                {
                  value: "2",
                  label: "Closed",
                },
                {
                  value: "3",
                  label: "Communicated",
                },
                {
                  value: "4",
                  label: "Identified",
                },
                {
                  value: "5",
                  label: "Resolved",
                },
                {
                  value: "6",
                  label: "Cancelled",
                },
              ]}
            />
          </div>

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border"></TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Interest (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Penalty (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Fees (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Other (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-32 border">
                  Total (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  CGST(0005)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  IGST(0008)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  CESS(0009)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Maharashtra
                  <br /> SGST(006)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <Input></Input>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-left p-2 border">
                  Total Challan Amount:
                </TableCell>
                <TableCell colSpan={5} className="text-left p-2 border">
                  0
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-left p-2 border">
                  Total Challan Amount (In Words):
                </TableCell>
                <TableCell colSpan={5} className="text-left p-2 border">
                  0
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>

            <Button type="primary" className="">
              GENERATE CHALLAN
            </Button>
          </div>
          <div className="mt-4"></div>
          <p className="text-xs">
            <span className="font-semibold">Note:</span>
            For taxpayer filing GSTR-3B on quarterly basis:
          </p>
          <p className="text-xs mt-1">
            1. To make payment for the first (M1) and second (M2) months of the
            quarter, please select reason as &lsquo;Monthly Payment for
            Quarterly Return&lsquo; and the relevant period (financial year,
            month) and choose whether to pay through 35% challan or
            self-assessment challan.
          </p>
          <p className="text-xs mt-1">
            2. To make payment for the third month of the Quarter (M3), please
            use &apos;Create Challan&apos; option in payment Table-6 of Form
            GSTR-3B Quarterly. An auto- populated challan amounting to
            liabilities for the quarter net off credit utilization and existing
            cash balance can be generated and used to offset liabilities.
          </p>
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
