"use client";

import { TablerRefresh } from "@/components/icons";

import { RowData } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import {
  dvat04,
  DvatType,
  Quarter,
  returns_01,
  returns_entry,
} from "@prisma/client";
import getPdfReturn from "@/action/return/getpdfreturn";
import AddNil from "@/action/return/addnil";
import { toast } from "react-toastify";
import { Modal } from "antd";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { formateDate } from "@/utils/methods";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const GSTR = () => {
  const route = useRouter();

  const [open, setOpen] = useState(false);
  const userid: number = parseInt(getCookie("id") ?? "0");
  const [dvatdata, setDvatData] = useState<dvat04>();

  const getdvatname = (): string => {
    switch (searchParams.get("form")!) {
      case "30":
        return "DVAT 30";
      case "30A":
        return "DVAT 30-A";
      case "31":
        return "DVAT 31";
      case "31A":
        return "DVAT 31-A";
      default:
        return "DVAT 30";
    }
  };

  const getdvattype = (): DvatType => {
    switch (searchParams.get("form")!) {
      case "30":
        return DvatType.DVAT_30;
      case "30A":
        return DvatType.DVAT_30_A;
      case "31":
        return DvatType.DVAT_31;
      case "31A":
        return DvatType.DVAT_31_A;
      default:
        return DvatType.DVAT_30;
    }
  };

  const getquarter = (): Quarter => {
    switch (searchParams.get("quarter")!) {
      case "QUARTER1":
        return Quarter.QUARTER1;
      case "QUARTER2":
        return Quarter.QUARTER2;
      case "QUARTER3":
        return Quarter.QUARTER3;
      case "QUARTER4":
        return Quarter.QUARTER4;
      default:
        return Quarter.QUARTER1;
    }
  };

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();

  const searchParams = useSearchParams();

  const init = async () => {
    const year: string = searchParams.get("year") ?? "";
    const month: string = searchParams.get("month") ?? "";

    const returnformsresponse = await getPdfReturn({
      year: year,
      month: month,
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

  useEffect(() => {
    const init = async () => {
      const dvat_response = await GetUserDvat04({
        userid: userid,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }
      const year: string = searchParams.get("year") ?? "";
      const month: string = searchParams.get("month") ?? "";

      const returnformsresponse = await getPdfReturn({
        year: year,
        month: month,
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
    init();
  }, [searchParams, userid]);

  interface DvatData {
    entry: number;
    amount: number;
    tax: number;
  }

  const getTaxPerios = (): string => {
    if (dvatdata?.compositionScheme) {
      switch (searchParams.get("month") ?? "") {
        case "June":
          return "April - June";
        case "September":
          return "July - September";
        case "December":
          return "October - December";
        case "March":
          return "January - March";
        default:
          return "April - June";
      }
    } else {
      return searchParams.get("month") ?? "";
    }
  };

  const getDvatData = (dvatType: DvatType, percent: string): DvatData => {
    let entry: number = 0;
    let amount: string = "0";
    let tax: string = "0";

    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) =>
        val.dvat_type == dvatType && val.tax_percent == percent
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

  const getAllDvatData = (dvatType: DvatType): DvatData => {
    let entry: number = 0;
    let amount: string = "0";
    let tax: string = "0";

    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) => val.dvat_type == dvatType && val.isnil == false
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

  const is_empty = (): boolean => {
    const dvattype =
      searchParams.get("form") == "31" ? DvatType.DVAT_31 : DvatType.DVAT_31_A;
    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) => val.dvat_type == dvattype
    );
    return output.length <= 0;
  };
  const isnil = (): boolean => {
    const dvattype =
      searchParams.get("form") == "31" ? DvatType.DVAT_31 : DvatType.DVAT_31_A;

    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) => val.dvat_type == dvattype && val.isnil == true
    );
    return output.length > 0;
  };
  const payment_complted = () => {
    return (
      return01 != null &&
      return01.rr_number != "" &&
      return01.rr_number != undefined &&
      return01.rr_number != null
    );
  };
  const getDueDate = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const year: number = parseInt(searchParams.get("year")!);
    const month: string = searchParams.get("month")!;
    const day = 11;

    return formateDate(new Date(year, monthNames.indexOf(month) + 1, day));
  };

  return (
    <>
      <main className="w-full p-4">
        <div>
          <div className="bg-emerald-500 w-full mt-2 px-2 text-white flex gap-2 py-1">
            <p>
              VAT {searchParams.get("form")} Details of outward supplied of
              goods or services
            </p>
            <div className="grow"></div>
            <button>
              <TablerRefresh />
            </button>
          </div>
          <div className="bg-white p-4 flex text-xs justify-between">
            <div>
              <p>VAT No. - {dvatdata?.tinNumber}</p>
              <p>FY - {searchParams.get("year")}</p>
            </div>
            <div>
              <p>Legal Name - {dvatdata?.name}</p>
              <p>Tax Period - {getTaxPerios()}</p>
            </div>
            <div>
              <p>Trade Name - {dvatdata?.tradename}</p>
              <p>Status - {payment_complted() ? "Filed" : "Not Filed"} </p>
            </div>
            <div>
              <p>Indicates Mandatory Fields</p>
              <p>Due Date - {getDueDate()}</p>
            </div>
          </div>
        </div>
        {isnil() && (
          <div className="my-2 bg-green-500 bg-opacity-10 text-center border border-green-500  px-2 text-green-500 py-1">
            <p>Nil filing successful for this form.</p>
          </div>
        )}

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
              {[
                "0",
                "1",
                "2",
                "4",
                "5",
                "6",
                "12.5",
                "12.75",
                "13.5",
                "15",
                "20",
              ].map((val: string, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="p-2 border text-center">
                      {val}% Tax Invoice
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {
                        getDvatData(
                          searchParams.get("form") == "31"
                            ? DvatType.DVAT_31
                            : DvatType.DVAT_31_A,
                          val
                        ).entry
                      }
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {
                        getDvatData(
                          searchParams.get("form") == "31"
                            ? DvatType.DVAT_31
                            : DvatType.DVAT_31_A,
                          val
                        ).amount
                      }
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {
                        getDvatData(
                          searchParams.get("form") == "31"
                            ? DvatType.DVAT_31
                            : DvatType.DVAT_31_A,
                          val
                        ).tax
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="p-2 border text-center">Total</TableCell>
                <TableCell className="p-2 border text-center">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "31"
                        ? DvatType.DVAT_31
                        : DvatType.DVAT_31_A
                    ).entry
                  }
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "31"
                        ? DvatType.DVAT_31
                        : DvatType.DVAT_31_A
                    ).amount
                  }
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "31"
                        ? DvatType.DVAT_31
                        : DvatType.DVAT_31_A
                    ).tax
                  }
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            {is_empty() && payment_complted() == false ? (
              <button
                className="text-sm text-white bg-[#172e57] py-1 px-4"
                onClick={() => setOpen(true)}
              >
                Declare Nil Invoice
              </button>
            ) : null}

            {!isnil() && (
              <button
                className="text-sm text-white bg-[#172e57] py-1 px-4"
                onClick={() => {
                  route.push(
                    `/dashboard/returns/returns-dashboard/invoices?form=${searchParams.get(
                      "form"
                    )}&year=${searchParams.get(
                      "year"
                    )}&quarter=${searchParams.get(
                      "quarter"
                    )}&month=${searchParams.get("month")}`
                  );
                }}
              >
                View All
              </button>
            )}
            <button
              className="text-sm border hover:border-blue-500 hover:text-blue-500 bg-white text-[#172e57] py-1 px-4"
              onClick={() => route.back()}
            >
              BACK
            </button>
          </div>
        </div>
      </main>
      <Modal
        title="Nil Filing"
        open={open}
        onOk={async () => {
          setOpen(false);
          const response = await AddNil({
            createdById: userid,
            dvat_type: getdvattype(),
            month: searchParams.get("month")!,
            quarter: getquarter(),
            seller_tin_numberId: 1,
            year: searchParams.get("year")!,
          });

          if (response.status) {
            toast.success(response.message);
            await init();
          } else {
            toast.error(response.message);
          }
        }}
        onCancel={() => setOpen(false)}
      >
        <p>Do you want to submit Nil details for {getdvatname()}</p>
      </Modal>
    </>
  );
};
export default GSTR;
