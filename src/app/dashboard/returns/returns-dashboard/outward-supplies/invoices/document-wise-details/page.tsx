"use client";

import { MdiPlusCircle } from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Popover } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DocumentWiseDetails = () => {
  const route = useRouter();

  const [open, setOpen] = useState(false);

  const hide = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <div className="p-2 mt-4">
      <div className="bg-white p-4 flex text-xs justify-between shadow">
        <div>
          <p>GSTIN - 27AFZPC4455K1ZU</p>
          <p>FY - 2024-2025</p>
        </div>
        <div>
          <p>Legal Name - FARZANA MOHAMMED SAYEED CHOUHAN</p>
          <p>Tax Period - May</p>
        </div>
        <div>
          <p>Trade Name - TRADER SHIPPING INDIA</p>
          <p>Status - Filed</p>
        </div>
      </div>
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">
          4A, 4B, 6B, 6C - B2B, SEZ DE Invoices
        </div>

        <p className="text-[#162e57] text-sm mt-2">Processed Records</p>
        <div className="flex gap-2 mt-2">
          <div className="bg-gray-200 text-sm text-black rounded-full px-2 py-1">
            27AFZPC4455K1ZU
          </div>
          <div className="bg-gray-200 text-sm text-black rounded-full px-2 py-1">
            TRADER SHIPPING INDIA
          </div>
        </div>

        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-64 border text-center">
                Invoice no.
              </TableHead>
              <TableHead className="border text-center">Invoice Date</TableHead>
              <TableHead className="border text-center">
                Total invoice value (&#x20b9;)
              </TableHead>
              <TableHead className="border text-center">
                Total taxable value
              </TableHead>
              <TableHead className="border text-center">
                Integrated Tax
              </TableHead>
              <TableHead className="w-28 border text-center">
                Central tax
              </TableHead>
              <TableHead className="w-28 border text-center">
                State/UT Tax (&#x20b9;)
              </TableHead>
              <TableHead className="w-28 border text-center">
                Cess (&#x20b9;)
              </TableHead>
              <TableHead className="w-28 border text-center">Source</TableHead>
              <TableHead className="w-28 border text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-center">278</TableCell>
              <TableCell className="p-2 border text-center">
                27/06/204
              </TableCell>
              <TableCell className="p-2 border text-center">
                1,25,000.00
              </TableCell>
              <TableCell className="p-2 border text-center">
                15,000.00
              </TableCell>
              <TableCell className="p-2 border text-center">150.00</TableCell>
              <TableCell className="p-2 border text-center">0.00</TableCell>
              <TableCell className="p-2 border text-center">0.00</TableCell>
              <TableCell className="p-2 border text-center">0.00</TableCell>
              <TableCell className="p-2 border text-center">0.00</TableCell>
              <TableCell className="p-2 border text-center">
                <Popover
                  content={
                    <div className="flex flex-col gap-2">
                      <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                        Delete
                      </button>
                      <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                        Update
                      </button>
                    </div>
                  }
                  title="Actions"
                  trigger="click"
                  open={open}
                  onOpenChange={handleOpenChange}
                >
                  <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                    Actions
                  </button>
                </Popover>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex mt-2 gap-2">
          <div className="grow"></div>
          <Button type="default" onClick={() => route.back()}>
            BACK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentWiseDetails;
