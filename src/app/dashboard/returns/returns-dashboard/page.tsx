"use client";

import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";
// import { default as MulSelect } from "react-select";

import { RowData } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Select } from "antd";
import { DvatType, Quarter, returns_01, returns_entry } from "@prisma/client";

import { getCookie } from "cookies-next";
import getPdfReturn from "@/action/return/getpdfreturn";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const ReturnDashboard = () => {
  const [year, setYear] = useState<string>("2024");
  const [quarter, setQuarter] = useState<Quarter>(Quarter.QUATER1);
  const [period, setPeriod] = useState<string>("April");

  const userid: number = parseInt(getCookie("id") ?? "0");

  const [isSearch, setSearch] = useState<boolean>(false);

  const router = useRouter();

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    []
  );

  const search = async () => {
    setSearch(true);

    const returnformsresponse = await getPdfReturn({
      year: year,
      month: period,
      userid: userid,
    });

    if (returnformsresponse.status && returnformsresponse.data) {
      setReturn01(returnformsresponse.data.returns_01);
      serReturns_entryData(returnformsresponse.data.returns_entry);
    } else {
      setReturn01(null);
      serReturns_entryData([]);
    }
  };

  interface DvatData {
    entry: number;
    amount: number;
    tax: number;
  }

  const getDvatData = (dvatType: DvatType): DvatData => {
    let entry: number = 0;
    let amount: string = "0";
    let tax: string = "0";

    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) => val.dvat_type == dvatType
    );

    for (let i = 0; i < output.length; i++) {
      entry += 1;
      amount = (
        parseFloat(amount) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      tax = (parseFloat(tax) + parseFloat(output[i].vatamount ?? "0")).toFixed(
        2
      );
    }
    return {
      entry,
      amount: parseFloat(amount),
      tax: parseFloat(tax),
    };
  };

  return (
    <>
      <main className="w-full p-4 relative h-full grow xl:w-5/6 xl:mx-auto">
        <div className="bg-white w-full px-4 py-2 rounded-xl font-normal pb-4">
          <h1>File Returns</h1>
          <Marquee className="bg-yellow-500 bg-opacity-10 mt-2 text-sm">
            This is a banner can be used for official updates and notifications.
          </Marquee>

          <div className="flex w-full gap-4 items-end mt-4">
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Financial Year <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={year}
                placeholder="Select a year"
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
                onChange={(val: string) => {
                  if (!val) return;
                  setYear(val.toString());
                  setQuarter(Quarter.QUATER1);
                  setPeriod("April");
                }}
              />
            </div>
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Quarter <span className="text-rose-500">*</span>
              </Label>

              <Select
                value={quarter}
                placeholder="Select quarter"
                options={[
                  {
                    value: "QUATER1",
                    label: "Quarter 1 [Apr - Jun]",
                  },
                  {
                    value: "QUATER2",
                    label: "Quarter 2 [Jul - Sep]",
                  },
                  {
                    value: "QUATER3",
                    label: "Quarter 3 [Oct - Dec]",
                  },
                  {
                    value: "QUATER4",
                    label: "Quarter 4 [Jan - Mar]",
                  },
                ]}
                onChange={(val: Quarter) => {
                  if (!val) return;
                  setQuarter(val);

                  switch (val.toString()) {
                    case Quarter.QUATER1:
                      setPeriod("April");
                      break;
                    case Quarter.QUATER2:
                      setPeriod("July");
                      break;
                    case Quarter.QUATER3:
                      setPeriod("October");
                      break;
                    case Quarter.QUATER4:
                      setPeriod("January");
                      break;
                    default:
                      break;
                  }
                }}
              />
            </div>
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Period <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={period}
                placeholder="Select Period"
                options={
                  quarter == Quarter.QUATER1
                    ? [
                        {
                          value: "April",
                          label: "April",
                        },
                        {
                          value: "May",
                          label: "May",
                        },
                        {
                          value: "June",
                          label: "June",
                        },
                      ]
                    : quarter == Quarter.QUATER2
                    ? [
                        {
                          value: "July",
                          label: "July",
                        },
                        {
                          value: "Augest",
                          label: "Augest",
                        },
                        {
                          value: "September",
                          label: "September",
                        },
                      ]
                    : quarter == Quarter.QUATER3
                    ? [
                        {
                          value: "October",
                          label: "October",
                        },
                        {
                          value: "November",
                          label: "November",
                        },
                        {
                          value: "December",
                          label: "December",
                        },
                      ]
                    : [
                        {
                          value: "January",
                          label: "January",
                        },
                        {
                          value: "February",
                          label: "February",
                        },
                        {
                          value: "March",
                          label: "March",
                        },
                      ]
                }
                onChange={(val: string) => {
                  if (!val) return;
                  setPeriod(val.toString());
                }}
              />
            </div>
            <button
              className="bg-[#172e57] px-4  text-white py-1 rounded-md"
              onClick={search}
            >
              Search
            </button>
          </div>
        </div>
        {isSearch && (
          <div className="grid w-full grid-cols-4 gap-4 mt-4">
            <Card
              title={"Sales Local"}
              subtitle={"Form 31"}
              buttonone="View"
              buttontwo="Add"
              entry={getDvatData(DvatType.DVAT_31).entry}
              amount={getDvatData(DvatType.DVAT_31).amount.toFixed(2)}
              tax={getDvatData(DvatType.DVAT_31).tax.toFixed(2)}
              link={`/dashboard/returns/returns-dashboard/outward-supplies?form=31&year=${year}&quarter=${quarter}&month=${period}`}
            />
            <Card
              title={"Purchase Local"}
              subtitle={"Form 30"}
              buttonone="View"
              buttontwo="Add"
              entry={getDvatData(DvatType.DVAT_30).entry}
              amount={getDvatData(DvatType.DVAT_30).amount.toFixed(2)}
              tax={getDvatData(DvatType.DVAT_30).tax.toFixed(2)}
              link={`/dashboard/returns/returns-dashboard/inward-supplies?form=30&year=${year}&quarter=${quarter}&month=${period}`}
            />
            <Card
              title={"Sales Inter-State"}
              subtitle={"Form 31-A"}
              buttonone="View"
              buttontwo="Add"
              entry={getDvatData(DvatType.DVAT_31_A).entry}
              amount={getDvatData(DvatType.DVAT_31_A).amount.toFixed(2)}
              tax={getDvatData(DvatType.DVAT_31_A).tax.toFixed(2)}
              link={`/dashboard/returns/returns-dashboard/outward-supplies?form=31A&year=${year}&quarter=${quarter}&month=${period}`}
            />
            <Card
              title={"Purchase Inter-State"}
              subtitle={"Form 30-A"}
              buttonone="View"
              buttontwo="Add"
              entry={getDvatData(DvatType.DVAT_30_A).entry}
              amount={getDvatData(DvatType.DVAT_30_A).amount.toFixed(2)}
              tax={getDvatData(DvatType.DVAT_30_A).tax.toFixed(2)}
              link={`/dashboard/returns/returns-dashboard/inward-supplies?form=30A&year=${year}&quarter=${quarter}&month=${period}`}
            />
          </div>
        )}

        <div className="absolute bottom-2 right-2 rounded shadow bg-white p-1 flex gap-2">
          <button className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]">
            Back
          </button>
          <button className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]">
            Scroll to Top
          </button>
          {isSearch && (
            <>
              <button className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]">
                Save
              </button>
              <button
                onClick={() => {
                  router.push(
                    `/dashboard/returns/returns-dashboard/preview?form=30A&year=${year}&quarter=${quarter}&month=${period}`
                  );
                }}
                className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
              >
                Preview
              </button>
              <button className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]">
                Proceed to Payment
              </button>
            </>
          )}
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
  entry: number;
  amount: string;
  tax: string;
  link: string;
}

const Card = (props: CardProps) => {
  const route = useRouter();
  return (
    <div className=" p-2 bg-white rounded-md hover:shadow-md hover:-translate-y-2 transition-all duration-700">
      <div className="text-white text-sm font-semibold text-center bg-[#162e57] p-2 rounded-md grid place-items-center">
        <div>
          <p className="text-white text-xs font-normal text-center">
            {props.subtitle}
          </p>
          <p>{props.title}</p>
        </div>
      </div>

      <p className="text-[#162e57] mt-2 text-xs text-left">
        No Of Entries : {props.entry}
      </p>
      <p className="text-[#162e57] text-xs text-left">
        Taxable Amount : {props.amount}
      </p>
      <p className="text-[#162e57] text-xs text-left">Tax : {props.tax}</p>
      <div className="flex gap-2 justify-around mt-2">
        <button
          onClick={() => {
            route.push(props.link);
            // route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="border flex-1 bg-[#162e57] text-white rounded-md text-sm py-1 text-center"
        >
          {props.buttonone}
        </button>
        <button
          onClick={() => {
            route.push(props.link);
          }}
          className="border flex-1 bg-[#162e57]  text-white rounded-md text-sm py-1 text-center"
        >
          {props.buttontwo}
        </button>
      </div>
    </div>
  );
};
