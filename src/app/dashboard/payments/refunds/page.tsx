"use client";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@radix-ui/react-select";
import { Button, Input, Radio } from "antd";
import { useRef, useState } from "react";

const Refunds = () => {
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

  return (
    <main className="p-4">
      <div className="p-2 bg-white shadow">
        <div className="bg-blue-500 p-2 text-white">Refunds</div>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <p className="text-sm font-normal">Payment Type</p>
            <p className="text-sm font-medium">Refund Against ITC</p>
          </div>
          <div className="flex-1">
            <Label htmlFor="lastname" className="text-sm font-normal">
              Previous Grievance Number <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="lastname"
              name="firstName"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Previous Grievance Number"
            />
          </div>
        </div>

        {/* <p className="mt-4 text-blue-400 text-sm">
          Details of Taxpayer (Person)
        </p>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <Label htmlFor="firstname" className="text-sm font-normal">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={firstnameRef}
              type="text"
              id="firstname"
              name="firstName"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="First name"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="lastname" className="text-sm font-normal">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={lastnameRef}
              type="text"
              id="lastname"
              name="firstName"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Last name"
            />
          </div>
        </div>
        <div className="mt-2">
          <Label htmlFor="address" className="text-sm font-normal">
            Address <span className="text-red-500">*</span>
          </Label>

          <Textarea
            ref={addressRef}
            name="address"
            id="address"
            className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
            placeholder="Address"
          />
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="mobileOne" className="text-sm font-normal">
              Mobile Number <span className="text-red-500">*</span>
            </Label>

            <Input
              ref={mobileRef}
              disabled={true}
              type="text"
              id="mobileOne"
              name="mobileOne"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Mobile Number"
              onChange={handleNumberChange}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="email" className="text-sm font-normal">
              Email <span className="text-red-500">*</span>
            </Label>

            <Input
              ref={emailRef}
              type="email"
              name="email"
              id="email"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Email"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <Label htmlFor="pan" className="text-sm font-normal">
              Pan Card <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={panRef}
              type="text"
              name="pan"
              id="pan"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Pan Card"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="aadhar" className="text-sm font-normal">
              Aadhar Card <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={aadharRef}
              type="text"
              name="aadhar"
              id="aadhar"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Aadhar Card"
              onChange={handleNumberChange}
            />
          </div>
        </div> */}

        <p className="mt-4 text-blue-400 text-sm">Discrepancy In Payments</p>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <Label htmlFor="cpin" className="text-sm font-normal">
              CPIN <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="cpin"
              name="cpin"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Enter CPIN"
            />
            <p className="text-xs">Select grievanc Related to field first</p>
          </div>
          <div className="flex-1"></div>
        </div>
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
                Tax paid on an intra-State supply which is subsequently held to
                be inter-State supply and vice versa
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
                On Account of Assessment/Provisional Assessment/Appeal/Any other
                order
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center w-40">
                <Radio />
              </TableCell>
              <TableCell className="p-2 border text-left text-xs">
                Refund ofn tax paid on Inward Supplies of goods by canteen store
                Department (CSD)
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
              <TableCell className="font-medium p-2 border">Vat Tax</TableCell>
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
              <TableCell className="font-medium p-2 border">Vat Tax</TableCell>
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
          Please note that the recoverable dues shall be deducted from the gross
          amount to be paid from the Retund Amount dalmed in the refund
          application recelved, by the Refund Processing tAlker anille
          processing the Kefund.
        </p>
        <Separator />
        <p className="text-left text-black text-lg mt-2">
          Upload Supporting Documents
        </p>
        <p className="text-xs border p-2 bg-[#e2e2e2]">
          Note: In case you seek to chance the preferance of the bank account
          wnich is not aocearing in the droo down list, olease add bank accounti
          by filing non-core amendment of registration form. Disbursement of a
          oe advised to keep the merioned bank account ocerational call
          sanctioned retund is successtully disbursed. &quot;disbursement tail
          due to
        </p>
        <p className="text-xs border p-2 bg-[#e2e2e2] mt-2">
          Note: Taxpayers are expected to upload supporting documents while
          filing refund application, You may upload up to 10 supporting
          documents, 5 Mr each (total 50 MO). There is no limit to the number of
          documents. You can scan and upload, tili size of the scanned document
          containing multipie pages is less than er equal to 5 MB. For detailed
          tips on the process, dick here.
        </p>

        <div className="flex gap-2 mt-2">
          <div className="grow"></div>
          <Button>BACK</Button>
          <Button type="primary">SAVE</Button>
          <Button type="primary">PREVIEW</Button>
          <Button type="primary">PROCEED</Button>

          {isSubmit ? (
            <Button
              disabled={true}
              className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm h-8 "
            >
              Loading...
            </Button>
          ) : (
            <Button className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm h-8 ">
              Submit
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default Refunds;
