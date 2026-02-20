"use client";
import { GgInfo, MaterialSymbolsClose } from "@/components/icons";
import { Button, Input } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReturnTable = () => {
  return (
    <>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow">
          <div className="bg-blue-500 p-2 text-white">
            3.1 Details of Outward Supplies and inward supplies and inward
            supplies liable to reverse change (other taan those covered by Table
            3.1.1)
          </div>
          <div className="text-blue-400 bg-blue-500/10 border border-blue-300 mt-2 text-sm p-2 flex gap-2 items-center">
            <GgInfo className="text-xl cursor-pointer" />
            <p className="flex-1">
              Table 3.1(a), (b), and (e) are auto-drafted based on value proved
              in VAT. Whereas Table 3.1 (d) is auto-drafted based on VAT.
            </p>

            <MaterialSymbolsClose className="text-xl cursor-pointer" />
          </div>

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap w-64 border">
                  Nature of Supplies
                </TableHead>
                <TableHead className="whitespace-nowrap border">
                  Total Taxable value (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border">
                  Integrated Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border">
                  Central Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border">
                  State/UT Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap w-28 border">
                  Late Fees (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  (a) Outward taxable supplies (other then zero rated, nil rated
                  and exempted)
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  (b) Outward taxable supplies (zero rated)
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  (c) Other outward supplies (Nil rated, exempted)
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  (d) Inward supplies (liable to rverse change)
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  (e) Non-VAT outward supplies
                </TableCell>
                <TableCell className="p-2 border">
                  <Input />
                </TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
                <TableCell className="p-2 border bg-gray-100"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button type="primary" danger={true}>
              CANCEL
            </Button>
            <Button type="primary" className="" disabled>
              CONFIRM
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnTable;
