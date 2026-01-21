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
import {
  dvat04,
  DvatType,
  Quarter,
  returns_01,
  returns_entry,
} from "@prisma/client";
import { useEffect, useState } from "react";
import getPdfReturn from "@/action/return/getpdfreturn";
import AddNil from "@/action/return/addnil";
import { toast } from "react-toastify";
import { Button, Modal } from "antd";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { formateDate } from "@/utils/methods";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const InwardSupplies = () => {
  const router = useRouter();
  const [dvatdata, setDvatData] = useState<dvat04>();

  const [open, setOpen] = useState(false);

  const [userid, setUserId] = useState<number>(0);

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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }

      setUserId(authResponse.data);
      const dvat_response = await GetUserDvat04({
        userid: authResponse.data,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }

      const year: string = searchParams.get("year") ?? "";
      const month: string = searchParams.get("month") ?? "";

      const returnformsresponse = await getPdfReturn({
        year: year,
        month: month,
        userid: authResponse.data,
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
  const payment_complted = () => {
    return (
      return01 != null &&
      return01.rr_number != "" &&
      return01.rr_number != undefined &&
      return01.rr_number != null
    );
  };

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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex gap-2 items-center">
              <h1 className="text-lg font-medium text-gray-900">
                Details of Purchase of goods or services
              </h1>
              <div className="grow"></div>
              <button className="text-blue-600 hover:text-blue-700">
                <TablerRefresh />
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-600">VAT No.</p>
              <p className="font-medium text-gray-900">{dvatdata?.tinNumber}</p>
              <p className="text-gray-600 mt-2">FY</p>
              <p className="font-medium text-gray-900">{searchParams.get("year")}</p>
            </div>
            <div>
              <p className="text-gray-600">Legal Name</p>
              <p className="font-medium text-gray-900">{dvatdata?.name}</p>
              <p className="text-gray-600 mt-2">Tax Period</p>
              <p className="font-medium text-gray-900">{getTaxPerios()}</p>
            </div>
            <div>
              <p className="text-gray-600">Trade Name</p>
              <p className="font-medium text-gray-900">{dvatdata?.tradename}</p>
              <p className="text-gray-600 mt-2">Status</p>
              <p className="font-medium text-gray-900">{payment_complted() ? "Filed" : "Not Filed"}</p>
            </div>
            <div>
              <p className="text-gray-600">Mandatory Fields</p>
              <p className="font-medium text-gray-900">*</p>
              <p className="text-gray-600 mt-2">Due Date</p>
              <p className="font-medium text-gray-900">{getDueDate()}</p>
            </div>
          </div>
        </div>

        {isnil() && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-green-50 border border-green-200 text-center px-3 py-2 text-green-700 text-xs rounded">
              <p>Nil filing successful for this form.</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded shadow-sm border p-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Rate (%)
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Number of Entries
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Taxable Amount
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
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
                  <TableRow key={index} className="border-b hover:bg-gray-50">
                    <TableCell className="p-2 text-center text-xs">
                      {val}% Tax Rate
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      {
                        getDvatData(
                          searchParams.get("form") == "30"
                            ? DvatType.DVAT_30
                            : DvatType.DVAT_30_A,
                          val
                        ).entry
                      }
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      {
                        getDvatData(
                          searchParams.get("form") == "30"
                            ? DvatType.DVAT_30
                            : DvatType.DVAT_30_A,
                          val
                        ).amount
                      }
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
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

              <TableRow className="bg-gray-50 border-b font-medium">
                <TableCell className="p-2 text-center text-xs">Total</TableCell>
                <TableCell className="p-2 text-center text-xs">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "30"
                        ? DvatType.DVAT_30
                        : DvatType.DVAT_30_A
                    ).entry
                  }
                </TableCell>
                <TableCell className="p-2 text-center text-xs">
                  {
                    getAllDvatData(
                      searchParams.get("form") == "30"
                        ? DvatType.DVAT_30
                        : DvatType.DVAT_30_A
                    ).amount
                  }
                </TableCell>
                <TableCell className="p-2 text-center text-xs">
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
          </div>
          <div className="flex mt-3 gap-2">
            <div className="grow"></div>
            {is_empty() && payment_complted() == false ? (
              <Button
                type="primary"
                onClick={() => setOpen(true)}
                size="small"
              >
                Declare Nil Invoice
              </Button>
            ) : null}

            {!isnil() && (
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  router.push(
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
              </Button>
            )}
          </div>
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
        <p>Do you want to submit Nil details for {getdvatname()}</p>
      </Modal>
    </>
  );
};
export default InwardSupplies;
