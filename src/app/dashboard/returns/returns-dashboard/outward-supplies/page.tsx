"use client";

import { TablerCheckbox, TablerRefresh } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import Marquee from "react-fast-marquee";
import { default as MulSelect } from "react-select";

import { RowData } from "@tanstack/react-table";
import Link from "next/link";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const GSTR = () => {
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
              <p>Legal Name - F23RF243</p>
              <p>Tax Period - May</p>
            </div>
            <div>
              <p>Trade Name - TRADER SHIPPING INDIA</p>
              <p>Status - Filed</p>
            </div>
            <div>
              <p>Indicates Mandatory Fields</p>
              <p>Due Date - 11/06/2024</p>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-4 gap-4 mt-4">
          <CardTwo title="0% Tax Invoice" />
          <CardTwo title="10% Tax Invoice" />
          <CardTwo title="20% Tax Invoice" />
          <CardTwo title="40% Tax Invoice" />
        </div>
      </main>
    </>
  );
};
export default GSTR;

interface CardTwoProps {
  title: string;
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
        <TablerCheckbox className="text-green-500 text-2xl" /> 23
      </div>
    </Link>
  );
};
