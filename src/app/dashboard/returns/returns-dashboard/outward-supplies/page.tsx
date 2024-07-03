"use client";

import {
  MdiPlusCircle,
  TablerCheckbox,
  TablerRefresh,
} from "@/components/icons";
import { default as MulSelect } from "react-select";

import { RowData } from "@tanstack/react-table";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const GSTR = () => {
  const route = useRouter();
  return (
    <>
      <main className="w-full p-4">
        <div>
          <div className="bg-emerald-500 w-full mt-2 px-2 text-white flex gap-2 py-1">
            <p>GSTR-1 Details of outward supplied of goods or services</p>
            <div className="grow"></div>
            <button>
              <TablerRefresh />
            </button>
          </div>
          <div className="bg-white p-4 flex text-xs justify-between">
            <div>
              <p>VAT No. - 9O2UI3HR92U3RH98</p>
              <p>FY - 2024 - 9O2UI3HR92U3RH98</p>
            </div>
            <div>
              <p>Legal Name - Smart Technologies</p>
              <p>Tax Period - May</p>
            </div>
            <div>
              <p>Trade Name - Smart Technologies</p>
              <p>Status - Filed</p>
            </div>
            <div>
              <p>Indicates Mandatory Fields</p>
              <p>Due Date - 11/06/2024</p>
            </div>
          </div>
        </div>
        {/* 
        <div className="grid w-full grid-cols-4 gap-4 mt-4">
          <CardTwo title="0% Tax Invoice" count={3} />
          <CardTwo title="1% Tax Invoice" count={0} />
          <CardTwo title="4% Tax Invoice" count={33} />
          <CardTwo title="5% Tax Invoice" count={23} />
          <CardTwo title="12.5% Tax Invoice" count={0} />
          <CardTwo title="12.75% Tax Invoice" count={43} />
          <CardTwo title="13.5% Tax Invoice" count={6} />
          <CardTwo title="15% Tax Invoice" count={0} />
          <CardTwo title="20% Tax Invoice" count={0} />
        </div> */}

        <div className="bg-white p-2 shadow mt-2">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap w-64 border text-center">
                  Rate (%)
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center">
                  Number of Invoices
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center">
                  Taxable Amount
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center">
                  Tax Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  0% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">5</TableCell>
                <TableCell className="p-2 border text-center">2,344</TableCell>
                <TableCell className="p-2 border text-center">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  1% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">4</TableCell>
                <TableCell className="p-2 border text-center">5,324</TableCell>
                <TableCell className="p-2 border text-center">
                  {((5324 * 1) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  4% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">3</TableCell>
                <TableCell className="p-2 border text-center">6,234</TableCell>
                <TableCell className="p-2 border text-center">
                  {((5324 * 4) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  5% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">6</TableCell>
                <TableCell className="p-2 border text-center">3,985</TableCell>
                <TableCell className="p-2 border text-center">
                  {((3985 * 5) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  12.5% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">6</TableCell>
                <TableCell className="p-2 border text-center">7,234</TableCell>
                <TableCell className="p-2 border text-center">
                  {((7234 * 12.5) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  12.75% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">2</TableCell>
                <TableCell className="p-2 border text-center">9,269</TableCell>
                <TableCell className="p-2 border text-center">
                  {((9269 * 12.75) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  13.5% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">6</TableCell>
                <TableCell className="p-2 border text-center">3,295</TableCell>
                <TableCell className="p-2 border text-center">
                  {((3295 * 13.5) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  15% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">1</TableCell>
                <TableCell className="p-2 border text-center">2,342</TableCell>
                <TableCell className="p-2 border text-center">
                  {((2342 * 15) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2 border text-center">
                  20% Tax Invoice
                </TableCell>
                <TableCell className="p-2 border text-center">6</TableCell>
                <TableCell className="p-2 border text-center">8,274</TableCell>
                <TableCell className="p-2 border text-center">
                  {((8274 * 20) / 100).toFixed(2)}
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
                  "/dashboard/returns/returns-dashboard/outward-supplies/invoices"
                );
              }}
            >
              View All
            </button>
            <button
              className="text-sm border hover:border-blue-500 hover:text-blue-500 bg-white text-[#172e57] py-1 px-4"
              onClick={() => route.back()}
            >
              BACK
            </button>
          </div>
        </div>
      </main>
    </>
  );
};
export default GSTR;

interface CardTwoProps {
  title: string;
  count: number;
}

const CardTwo = (props: CardTwoProps) => {
  return (
    <Link
      className=" p-2 bg-white rounded-md"
      href={"/dashboard/returns/returns-dashboard/outward-supplies/invoices"}
    >
      <div className="text-white text-sm font-semibold text-center bg-[#162e57] p-2 rounded-md">
        <p>{props.title}</p>
      </div>

      <div className="text-center flex mt-2 justify-center gap-2">
        <TablerCheckbox className="text-green-500 text-2xl" /> {props.count}
      </div>
    </Link>
  );
};
