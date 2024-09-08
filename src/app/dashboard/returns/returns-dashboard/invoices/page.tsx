"use client";

import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AddNil from "@/action/return/addnil";
import getPdfReturn from "@/action/return/getpdfreturn";
import { MdiPlusCircle } from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dvat04, DvatType, returns_01, returns_entry } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const AddRecord = () => {
  const route = useRouter();

  const userid: number = parseInt(getCookie("id") ?? "0");

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();

  const searchParams = useSearchParams();
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

  const getDvatData = (): returns_entry[] => {
    let output: any[] = [];
    switch (searchParams.get("form")) {
      case "30":
        output = (returns_entryData ?? []).filter(
          (val: returns_entry) => val.dvat_type == DvatType.DVAT_30
        );
        break;
      case "30A":
        output = (returns_entryData ?? []).filter(
          (val: returns_entry) => val.dvat_type == DvatType.DVAT_30_A
        );
        break;
      case "31":
        output = (returns_entryData ?? []).filter(
          (val: returns_entry) => val.dvat_type == DvatType.DVAT_31
        );
        break;
      case "31A":
        output = (returns_entryData ?? []).filter(
          (val: returns_entry) => val.dvat_type == DvatType.DVAT_31_A
        );
        break;
      default:
        output = [];
        break;
    }

    let result: (returns_entry & { count: number })[] = [];

    for (let i = 0; i < output.length; i++) {
      let tinNumber = output[i].seller_tin_number.tin_number;
      let index: number = result.findIndex(
        (val: any) => val.seller_tin_number.tin_number == tinNumber
      );

      if (index !== -1) {
        result[index].count++;
      } else {
        let outvalue: returns_entry & { count: number } = {
          ...output[i],
          count: 1,
        };

        result.push(outvalue);
      }
    }

    return result;
  };

  const getUrl = (): string => {
    const formType = searchParams.get("form");
    switch (formType) {
      case "30":
        return `/dashboard/returns/returns-dashboard/inward-supplies/add-record-30?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}`;

      case "30A":
        return `/dashboard/returns/returns-dashboard/inward-supplies/add-record-30A?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}`;

      case "31":
        return `/dashboard/returns/returns-dashboard/outward-supplies/add-record-31?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}`;

      case "31A":
        return `/dashboard/returns/returns-dashboard/outward-supplies/add-record-31A?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}`;

      default:
        return "";
    }
  };

  return (
    <div className="p-2 mt-4">
      <div className="bg-white p-4 flex text-xs justify-between shadow">
        <div>
          <p>VAT NO. {dvatdata?.tinNumber}</p>
          <p>FY - {searchParams.get("year")}</p>
        </div>
        <div>
          <p>Legal Name - {dvatdata?.name}</p>
          <p>Tax Period - {searchParams.get("month")}</p>
        </div>
        <div>
          <p>Trade Name - {dvatdata?.tradename}</p>
          <p>Status - Filed</p>
        </div>
      </div>
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">Record Details</div>

        {getDvatData().length == 0 ? (
          <>
            <p className="bg-rose-500 bg-opacity-10 rounded-md text-rose-500 mt-2 px-2 py-1 border border-rose-500">
              There is no record
            </p>
          </>
        ) : (
          <>
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
                {getDvatData().map((val: any, index: number) => {
                  return (
                    <TableRow key={index}>
                      <TableCell className="p-2 border text-center">
                        {val.seller_tin_number.tin_number}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.seller_tin_number.name_of_dealer}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        Regular
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        <Link
                          className="text-blue-500"
                          href={
                            "/dashboard/returns/returns-dashboard/invoices/document-wise-details"
                          }
                        >
                          {val.count}
                        </Link>
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        0
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        <Link href={getUrl()}>
                          <div className="mx-auto bg-green-500 w-5 h-5 grid place-items-center">
                            <MdiPlusCircle className="text-white text-sm" />
                          </div>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}

        <div className="flex mt-2 gap-2">
          <div className="grow"></div>

          {return01 != null &&
          return01.rr_number != "" &&
          return01.rr_number != undefined &&
          return01.rr_number != null ? (
            <></>
          ) : (
            <>
              <button
                className="text-sm text-white bg-[#172e57] py-1 px-4"
                onClick={() => {
                  route.push(
                    `/dashboard/returns/returns-dashboard/invoices/bluckupload?form=${searchParams.get(
                      "form"
                    )}&year=${searchParams.get(
                      "year"
                    )}&quarter=${searchParams.get(
                      "quarter"
                    )}&month=${searchParams.get("month")}`
                  );
                }}
              >
                Bulk Upload
              </button>
              <button
                className="text-sm text-white bg-[#172e57] py-1 px-4"
                onClick={() => {
                  route.push(getUrl());
                }}
              >
                ADD RECORD
              </button>
            </>
          )}

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
