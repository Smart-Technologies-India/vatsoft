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
      <main className="w-full p-4">
        <div className="bg-white w-full px-4 py-2 rounded-xl font-normal pb-4">
          <h1>Annual Return</h1>
          <Marquee className="bg-yellow-500/10 mt-2 text-sm">
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

            <button className="bg-blue-500 px-6  text-white py-2 rounded-md">
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
    <div className=" p-2 bg-white rounded-md">
      <div className="text-white text-sm font-semibold text-center bg-[#162e57] p-2 rounded-md h-20 grid place-items-center">
        <div>
          <p className="text-white text-xs font-normal text-center">
            {props.subtitle}
          </p>
          <p>{props.title}</p>
        </div>
      </div>

      <p className="text-[#162e57] mt-2 text-xs text-center">
        Status : Submitted
      </p>
      <div className="flex gap-2 justify-around mt-2">
        <button
          onClick={() => {
            route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="border flex-1 bg-[#162e57] text-white rounded-md text-sm py-1 text-center"
        >
          {props.buttonone}
        </button>
        <button
          onClick={() => {
            route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="border flex-1 bg-[#162e57]  text-white rounded-md text-sm py-1 text-center"
        >
          {props.buttontwo}
        </button>
      </div>
    </div>
  );
};
