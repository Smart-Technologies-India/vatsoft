"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@radix-ui/react-select";
import { Input, Radio } from "antd";

const Refund = () => {
  return (
    <>
      <main className="p-6">
        <div className="w-full bg-white p-4">
          <Table className="border mt-2">
            <TableBody>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Refund of Excess Balance in Electronic Cash Leadger
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  REfund of ITC on Export of Goods & Services without Payment of
                  Tax
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  On account of supplies made to SEZ unit/SEZ developer (without
                  payment of tax)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Refund on account of ITC accumulated due to Inverted Tax
                  Structure
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  On Account of Refund by Recipient of deemed export
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Refund on account of Supplies t SEZ unit/ SEZ Developer (with
                  payment of tax)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Export of service with payment of tax
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Tax paid on an intra-State supply which is subsequently held
                  to be inter-State supply and vice versa
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  On account of Refund by Supplider of deemed export
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Any other (specify)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  excess payment of tax
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  On Account of Assessment/Provisional Assessment/Appeal/Any
                  other order
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center w-40">
                  <Radio />
                </TableCell>
                <TableCell className="p-2 border text-left text-xs">
                  Refund ofn tax paid on Inward Supplies of goods by canteen
                  store Department (CSD)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="my-2">
            <button className="text-white bg-[#0c0c32] px-2 py-1">
              CREATE REFUND APPLICATION
            </button>
          </div>
          <p className="text-left text-black text-lg mt-2">
            Refund Amount Details
          </p>
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap w-64 border p-2"></TableHead>
                <TableHead className="whitespace-nowrap border p-2">
                  Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-2">
                  Interest (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-2">
                  Penalty (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-2">
                  Fee (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-2">
                  Others (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  Vat Tax
                </TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">Cess</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-left text-black text-lg mt-2">
            Refund Amount Details
          </p>
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100 p-1">
                <TableHead className="whitespace-nowrap w-40 border p-1"></TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Tax (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Interest (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Penalty (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Fee (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Others (&#x20b9;)
                </TableHead>
                <TableHead className="whitespace-nowrap border p-1">
                  Total (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium p-2 border">
                  Vat Tax
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
                <TableCell className="p-2 border">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">Cess</TableCell>
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
                <TableCell className="p-2 border">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium p-2 border">Total</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0.00</TableCell>
                <TableCell className="p-2 border">0</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="text-center text-blue-500 text-sm my-2">
            Click to view Electronic Liability Ledger
          </p>
          <p className="text-xs border p-2 bg-[#e2e2e2]">
            Note: You may view the Electronic Liability Register that displays
            your liabilities/ dues of Returns and other than Returns. Hence, you
            may save this Refund Application and navigate to the dashboard to
            settle the dues first, or may proceed here to file the application.
            Please note that the recoverable dues shall be deducted from the
            gross amount to be paid from the Retund Amount dalmed in the refund
            application recelved, by the Refund Processing tAlker anille
            processing the Kefund.
          </p>
          <Separator />
          <p className="text-left text-black text-lg mt-2">
            Upload Supporting Documents
          </p>
          <p className="text-xs border p-2 bg-[#e2e2e2]">
            Note: In case you seek to chance the preferance of the bank account
            wnich is not aocearing in the droo down list, olease add bank
            accounti by filing non-core amendment of registration form.
            Disbursement of a oe advised to keep the merioned bank account
            ocerational call sanctioned retund is successtully disbursed.
            &quot;disbursement tail due to
          </p>
          <p className="text-xs border p-2 bg-[#e2e2e2]">
            Note: Taxpayers are expected to upload supporting documents while
            filing refund application, You may upload up to 10 supporting
            documents, 5 Mr each (total 50 MO). There is no limit to the number
            of documents. You can scan and upload, tili size of the scanned
            document containing multipie pages is less than er equal to 5 MB.
            For detailed tips on the process, dick here.
          </p>
          <div className="my-2 flex gap-2">
            <button className=" border border-[#0c0c32] px-2 py-1 text-[#0c0c32]">
              BACK
            </button>
            <button className="text-white bg-[#0c0c32] px-2 py-1">SAVE</button>
            <button className="text-white bg-[#0c0c32] px-2 py-1">
              PREVIEW
            </button>
            <button className="text-white bg-[#0c0c32] px-2 py-1">
              PROCEED
            </button>
          </div>
        </div>
      </main>
    </>
  );
};
export default Refund;
