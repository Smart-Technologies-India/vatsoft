"use client";

import { Label } from "@/components/ui/label";
import { useState } from "react";
import Marquee from "react-fast-marquee";
import { default as MulSelect } from "react-select";

import { RowData } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const ReturnDashboard = () => {
  const [year, setYear] = useState<string>("");

  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <h1 className="text-xl font-bold text-gray-900">Annual Return</h1>
          </div>
          <Marquee className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            This is a banner can be used for official updates and notifications.
          </Marquee>

          <div className="flex w-full gap-4 items-end mt-4">
            <div className="grid items-center gap-1.5 w-80">
              <Label htmlFor="duedate">
                Financial Year <span className="text-rose-500">*</span>
              </Label>
              <MulSelect
                isMulti={false}
                options={[
                  {
                    value: "2024",
                    label: "2024-25",
                  },
                  {
                    value: "2023",
                    label: "2023-24",
                  },
                  {
                    value: "2022",
                    label: "2022-23",
                  },
                  {
                    value: "2021",
                    label: "2021-22",
                  },
                  {
                    value: "2020",
                    label: "2020-21",
                  },
                  {
                    value: "2019",
                    label: "2019-20",
                  },
                  {
                    value: "2018",
                    label: "2018-19",
                  },
                  {
                    value: "2017",
                    label: "2017-18",
                  },
                ]}
                className="w-full accent-slate-900"
                onChange={(val: any) => {
                  if (!val) return;
                  setYear(val.value.toString());
                }}
              />
            </div>

            <button className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-8 text-white py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
              Search
            </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-4 gap-4 mt-4">
          <Card
            title={"Details of outward supplies of goods or services"}
            subtitle={"VAT"}
            buttonone="Prepare Now"
            buttontwo="Download"
          />
          <Card
            title={"Details of inward supplies of goods or services"}
            subtitle={"VAT"}
            buttonone="View"
            buttontwo="Download"
          />
        </div>
      </main>
    </>
  );
};
export default ReturnDashboard;

interface CardProps {
  subtitle: string;
  title: string;
  buttonone: string;
  buttontwo: string;
}

const Card = (props: CardProps) => {
  const route = useRouter();
  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
      <div className="text-white text-sm font-semibold text-center bg-linear-to-r from-blue-600 to-indigo-700 p-3 rounded-lg h-20 grid place-items-center">
        <div>
          <p className="text-white text-xs font-normal mb-1">
            {props.subtitle}
          </p>
          <p>{props.title}</p>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Status: Submitted
        </span>
      </div>
      <div className="flex gap-2 justify-around mt-3">
        <button
          onClick={() => {
            route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="flex-1 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-sm py-2 font-medium transition-all shadow-md hover:shadow-lg"
        >
          {props.buttonone}
        </button>
        <button
          onClick={() => {
            route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="flex-1 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-sm py-2 font-medium transition-all shadow-md hover:shadow-lg"
        >
          {props.buttontwo}
        </button>
      </div>
    </div>
  );
};
