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
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AddRecord = () => {
  const route = useRouter();
  return (
    <div className="p-2 mt-4">
      <div className="bg-white p-4 flex text-xs justify-between shadow">
        <div>
          <p>VAT NO. 26746574854</p>
          <p>FY - 2024-2025</p>
        </div>
        <div>
          <p>Legal Name - Smart Technologies</p>
          <p>Tax Period - May</p>
        </div>
        <div>
          <p>Trade Name - Smart Technologies</p>
          <p>Status - Filed</p>
        </div>
      </div>
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">Invoices</div>
        {/* <div className=" flex gap-2 items-center mt-2">
          <button
            className="text-sm text-white bg-[#172e57] py-1 px-4"
            onClick={() => {
              route.push(
                "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
              );
            }}
          >
            ADD RECORD
          </button>
          <div className="grow"></div>
          <button className="text-sm text-white bg-[#172e57] py-1 px-4">
            IMPORT EWB DATA
          </button>
        </div> */}
        <p className="text-[#162e57] text-sm mt-2">Record Details</p>

        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="whitespace-nowrap w-64 border text-center">
                Recipient Details
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Trade/Legal Name
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Taxpayer Type
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Processed Records
              </TableHead>
              <TableHead className="whitespace-nowrap border text-center">
                Pending/Errored Invoices
              </TableHead>
              <TableHead className="whitespace-nowrap w-28 border text-center">
                Add Invoice
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2456721984
              </TableCell>
              <TableCell className="p-2 border text-center">
                Raj Computers
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  3
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2678491239
              </TableCell>
              <TableCell className="p-2 border text-center">
                Tanish Electronics
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  5
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2795834210
              </TableCell>
              <TableCell className="p-2 border text-center">
                Chandan Designs
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  2
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2458327419
              </TableCell>
              <TableCell className="p-2 border text-center">
                Ravi Kumar Assosciate
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  6
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2694753821
              </TableCell>
              <TableCell className="p-2 border text-center">
                Purva Computers
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  8
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2745619283
              </TableCell>
              <TableCell className="p-2 border text-center">
                Rajesh Electronics
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  3
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                2461827395
              </TableCell>
              <TableCell className="p-2 border text-center">
                Manoj Techinicales
              </TableCell>
              <TableCell className="p-2 border text-center">
                Regular taxpayer
              </TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  className="text-blue-500"
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/invoices/document-wise-details"
                  }
                >
                  7
                </Link>
              </TableCell>
              <TableCell className="p-2 border text-center">0</TableCell>
              <TableCell className="p-2 border text-center">
                <Link
                  href={
                    "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
                  }
                >
                  <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                    <MdiPlusCircle className="text-white text-sm" />
                  </div>
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex mt-2 gap-2">
          <div className="grow"></div>
          <button
            className="text-sm text-white bg-[#172e57] py-1 px-4"
            onClick={() => {
              route.push(
                "/dashboard/returns/returns-dashboard/outward-supplies/add-record"
              );
            }}
          >
            ADD RECORD
          </button>
          <button
            className="text-sm border hover:border-blue-500 hover:text-blue-500 bg-white text-[#172e57] py-1 px-4"
            onClick={() => route.back()}
          >
            BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;
