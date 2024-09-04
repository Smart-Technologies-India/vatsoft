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
import { DvatType, Quarter, returns_01, returns_entry } from "@prisma/client";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import getPdfReturn from "@/action/return/getpdfreturn";
import AddNil from "@/action/return/addnil";
import { toast } from "react-toastify";
import { Modal } from "antd";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const InwardSupplies = () => {
  const route = useRouter();

  const [open, setOpen] = useState(false);

  const userid: number = parseInt(getCookie("id") ?? "0");

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();

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

  const searchParams = useSearchParams();
  useEffect(() => {
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
    init();
  }, [searchParams, userid]);

  interface DvatData {
    entry: number;
    amount: number;
    tax: number;
  }

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

  const is_empty = (): boolean => {
    const dvattype =
      searchParams.get("form") == "30" ? DvatType.DVAT_30 : DvatType.DVAT_30_A;
    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) => val.dvat_type == dvattype
    );
    return output.length <= 0;
  };
  const isnil = (): boolean => {
    const dvattype =
      searchParams.get("form") == "30" ? DvatType.DVAT_30 : DvatType.DVAT_30_A;

    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) => val.dvat_type == dvattype && val.isnil == true
    );
    return output.length > 0;
  };

  return (
    <>
      <main className="w-full p-4">
        <div>
          <div className="bg-emerald-500 w-full mt-2 px-2 text-white flex gap-2 py-1">
            <p>Details of Purchase of goods or services</p>
            <div className="grow"></div>
            <button>
              <TablerRefresh />
            </button>
          </div>
          <div className="bg-white p-4 flex text-xs justify-between">
            <div>
              <p>VAT No. - 9O2UI3HR92U3RH98</p>
              <p>FY - {searchParams.get("year")}</p>
            </div>
            <div>
              <p>Legal Name - Smart Technologies</p>
              <p>Tax Period - {searchParams.get("month")}</p>
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

        {isnil() && (
          <div className="my-2 bg-rose-500 bg-opacity-10 border border-rose-500  px-2 text-rose-500 py-1">
            <p>Nil file already field with for this form</p>
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
                          searchParams.get("form") == "30"
                            ? DvatType.DVAT_30
                            : DvatType.DVAT_30_A,
                          val
                        ).entry
                      }
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {
                        getDvatData(
                          searchParams.get("form") == "30"
                            ? DvatType.DVAT_30
                            : DvatType.DVAT_30_A,
                          val
                        ).amount
                      }
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {
                        getDvatData(
                          searchParams.get("form") == "30"
                            ? DvatType.DVAT_30
                            : DvatType.DVAT_30_A,
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
                      searchParams.get("form") == "30"
                        ? DvatType.DVAT_30
                        : DvatType.DVAT_30_A
                    ).entry
                  }
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "30"
                        ? DvatType.DVAT_30
                        : DvatType.DVAT_30_A
                    ).amount
                  }
                </TableCell>
                <TableCell className="p-2 border text-center">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "30"
                        ? DvatType.DVAT_30
                        : DvatType.DVAT_30_A
                    ).tax
                  }
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            {is_empty() ? (
              <button
                className="text-sm text-white bg-[#172e57] py-1 px-4"
                onClick={() => setOpen(true)}
              >
                Nil Filing
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
        title="Add Nil"
        open={open}
        onOk={async () => {
          setOpen(false);
          const response = await AddNil({
            createdById: userid,
            dvat_type: getdvattype(),
            month: searchParams.get("month")!,
            quarter: getquarter(),
            seller_tin_numberId: 2,
            year: searchParams.get("year")!,
          });

          if (response.status) {
            toast.success(response.message);
            init();
          } else {
            toast.error(response.message);
          }
        }}
        onCancel={() => setOpen(false)}
      >
        <p>Are you sure you want to add nil</p>
      </Modal>
    </>
  );
};
export default InwardSupplies;
