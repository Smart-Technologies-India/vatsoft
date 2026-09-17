/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Barcode from "react-barcode";

import { fform, dvat04, returns_entry } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  decryptURLData,
  formateDate,
  formatDateDDMMYY,
  generatePDF,
} from "@/utils/methods";
import { Button } from "antd";

import GetFformById from "@/action/fform/getfformbyid";
import GetDvat04 from "@/action/register/getdvat04";
import GetFformEntry from "@/action/fform/getfformenrty";
import Image from "next/image";
import { nanoid } from "nanoid";

const formateDatecus = (date: Date): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().substring(2); // Get last two digits of the year

  if (month < 10 && day < 10) {
    return `0${day}-0${month}-${year}`;
  } else if (month < 10) {
    return `${day}-0${month}-${year}`;
  } else if (day < 10) {
    return `0${day}-${month}-${year}`;
  } else {
    return `${day}-${month}-${year}`;
  }
};

const FFROM = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const idString = Array.isArray(id) ? id[0] : id;
  const fformid: number = parseInt(decryptURLData(idString, router));

  const [fformdata, setFformdata] = useState<fform | null>(null);

  // const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);

  // const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    [],
  );
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const fform_response = await GetFformById({
        id: fformid,
      });

      if (fform_response.data && fform_response.status) {
        setFformdata(fform_response.data);
        const dvat_response = await GetDvat04({
          id: fform_response.data.dvat04Id,
        });

        if (dvat_response.data && dvat_response.status) {
          setDvatData(dvat_response.data);
        }

        const fform_entry_respone = await GetFformEntry({
          id: fform_response.data.id,
        });

        if (fform_entry_respone.data && fform_entry_respone.status) {
          const grouped: Record<string, returns_entry> = {};

          for (const entry of fform_entry_respone.data) {
            // const key = entry.invoice_number;
            const key = nanoid(); // Generate a unique key for each entry to avoid overwriting

            if (!grouped[key]) {
              grouped[key] = { ...entry }; // shallow copy
            } else {
              const existing = grouped[key];

              // Merge comma-separated strings (avoid duplicates if needed)
              existing.description_of_goods += `, ${entry.description_of_goods}`;

              const total_invoice_numberSum =
                parseFloat(existing.total_invoice_number || "0") +
                parseFloat(entry.total_invoice_number || "0");

              existing.total_invoice_number =
                total_invoice_numberSum.toFixed(2); // assuming you want quantity as string
            }
          }

          // Post-processing step: Update description_of_goods for all grouped entries
          for (const key in grouped) {
            const entry = grouped[key];
            const desc = (entry.description_of_goods ?? "PNG").toLowerCase();

            if (
              desc.includes("diesel") ||
              desc.includes("high speed petrol") ||
              desc.includes("petrol") ||
              desc.includes("high speed diesel")
            ) {
              entry.description_of_goods = "MS/HSD";
            } else if (desc.includes("additives") || desc.includes("oil")) {
              entry.description_of_goods = "Lubricant";
            } else if (desc.includes("cng") || desc.includes("png")) {
              entry.description_of_goods = "NG";
            } else if (desc.includes("aviation turbine fuel")) {
              entry.description_of_goods = "ATF";
            } else {
              entry.description_of_goods = "IMFL/BEER";
            }
          }

          serReturns_entryData(Object.values(grouped));
          // serReturns_entryData(fform_entry_respone.data);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const PAGE_SIZE = 20;

  // Helper function to chunk the data
  function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  const pages = chunkArray(returns_entryData ?? [], PAGE_SIZE);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <style>
        {`
          @page {
            margin: 5mm 5mm 5mm 5mm;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            .hidden-print {
              display: none !important;
            }
            * {
              box-shadow: none !important;
              border-shadow: none !important;
            }
            table {
              page-break-inside: avoid;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
            }
            tbody tr {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                F-Form Declaration
              </h1>
              <p className="text-sm text-gray-500 mt-2 ml-4">
                Central Form F Declaration
              </p>
            </div>
            <div className="grow"></div>
            <Button
              className="hidden-print bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white px-8 py-2 h-auto rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              type="primary"
              onClick={async (e) => {
                await generatePDF(`dashboard/fform/${idString}?sidebar=no`);
              }}
            >
              Download F-Form
            </Button>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="mainpdf">
            {/* part one start here */}

            <div
              className="bg-white p-8 shadow print:shadow-none h-290.75 w-198.5 mx-auto relative font-bold"
              id="mainpdf"
            >
              <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                <Image
                  src="/cform_bg.png"
                  alt="logo"
                  fill={true}
                  className="p-8"
                />
              </div>
              <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                (Continued...)
              </div>
              <div className="border border-black p-2 h-full w-full relative">
                <div className="scale-[0.3] absolute top-5 -right-10">
                  <Barcode
                    value={fformdata ? fformdata.sr_no : ""}
                    fontSize={30}
                  />
                </div>
                <div className="p-4 text-center text-xs">Original</div>
                <div className="text-center text-sm font-medium">
                  THE CENTRAL SALES TAX
                </div>
                <div className="text-center text-sm font-medium">
                  (Registration & Turnover) Rules, 1957
                </div>
                <div className="text-center text-sm font-medium">
                  FORM &lsquo;F&lsquo;
                </div>
                <div className="text-center text-xs font-medium mt-4">
                  (FORM OF DECLARATION TO BE ISSUED BY THE TRANSFEREE) [See Rule
                  12(5)]
                </div>

                <table border={1} className="w-5/6 mx-auto mt-6">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Serial No
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata ? fformdata.sr_no : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of the issuing state:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Office of Issue:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        Dept. of VAT -{" "}
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date of Issue :
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {formateDate(
                          new Date(fformdata?.createdAt!),
                        ).replaceAll("-", "/")}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quarter & Year :{" "}
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.to_period.toLocaleString("default", {
                          month: "short",
                        })}
                        ,{fformdata?.from_period.getFullYear()}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2  text-xs leading-6 w-[50%]">
                        Name of the purchasing dealer
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata ? dvatdata.tradename : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        to whom issued along with his RC NO
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata && dvatdata.tinNumber}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date from which registration is valid
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata
                          ? formateDate(
                              new Date(fformdata.valid_date),
                            ).replaceAll("-", "/")
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  To
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  {fformdata ? fformdata.seller_name : ""} (#Seller)
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  Registration Certificate No. of the Transferor{" "}
                  {fformdata ? fformdata.seller_tin_no : ""}
                </p>
                <br />

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6 tracking-tighter">
                  Certified that the goods transferred to me/us as per details
                  below have been received and duly accounted for:-
                </p>

                <table border={1} className="w-5/6 mx-auto">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Description of the goods sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quantity or weight
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Value of the goods
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[80%]">
                        Number and date of invoice [or challan or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document under which goods were sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of Railway, Steamer or Ferry Station or Airport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        or Post Office from where the goods were dispatched
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        No. and date of Railway Receipt or Postal Receipt or
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Goods Receipt with Trip sheet of lorry or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document indicating the means of transport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date on which delivery was taken by the transferee
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">Amount</td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.amount}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        The above statements are true to the best of my
                        knowledge and belief.
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-right mt-4 text-xs leading-6">
                  (Signature)...................................................
                </p>
                <p className="text-right text-xs leading-6">
                  (Name of the person signing the declaration)
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferee)].
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferor)].
                </p>

                <p className="text-left text-xs leading-6">
                  **Strike out whichever is not applicable.
                </p>
                <p className="text-left text-xs leading-6">
                  Note 1. To be furnished to the assessing authority in
                  accordance with rules framed under Section 13(4)(e).)
                </p>
              </div>
            </div>

            {pages.map((pageData, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white p-8 shadow h-290.75 w-198.5 mx-auto relative font-bold"
                style={{
                  pageBreakAfter:
                    pageIndex === pages.length - 1 ? "auto" : "always",
                }}
              >
                <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                  <Image
                    src="/cform_bg.png"
                    alt="logo"
                    fill={true}
                    className="p-8"
                  />
                </div>
                <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                  (Continued...)
                </div>
                <div className="border border-black p-2 h-full w-full relative">
                  <div className="scale-[0.3] absolute top-10 -right-10">
                    <Barcode
                      value={fformdata ? fformdata.sr_no : ""}
                      fontSize={30}
                    />
                  </div>
                  <div className="flex">
                    <div className="grow"></div>
                    <div className="text-xs leading-6">
                      <h1>Form &lsquo;F&lsquo;</h1>
                      <h1>Annexure </h1>
                    </div>
                  </div>
                  <table border={1} className="w-5/6 mx-auto mt-6">
                    <tbody className="w-full">
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Office of Issue
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Dept. of VAT -{" "}
                          {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                            ? "Dadra and Nagar Haveli"
                            : fformdata?.office_of_issue}
                        </td>
                      </tr>
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Date of Issue :
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          {formateDate(new Date()).replaceAll("-", "/")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border={1}
                    className="mx-4 mt-6"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <thead style={{ display: "table-header-group" }}>
                      <tr>
                        <td
                          className="border border-black text-xs leading-6 text-center"
                          colSpan={7}
                        >
                          INVOICE DETAILS
                        </td>
                      </tr>
                    </thead>
                    <tbody className="w-full">
                      <tr
                        className="w-full"
                        style={{ pageBreakInside: "avoid" }}
                      >
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                          No.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Inv. No
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Inv.Date
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Commodity Desc.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                          Inv. Value(Rs)
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Purpose
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Pur. Ord. No./Date
                        </td>
                      </tr>
                      {pageData.map((val: returns_entry, index) => (
                        <tr
                          key={index}
                          className="w-full"
                          style={{ pageBreakInside: "avoid" }}
                        >
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                            {pageIndex * PAGE_SIZE + index + 1}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.description_of_goods}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                            {val.total_invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                            Branch Transfer
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {/* part one end here */}

            {/* part two start here */}
            {/* <div className="p-4 text-center text-sm">Duplicate</div> */}
            <div
              className="bg-white p-8 shadow h-290.75 w-198.5 mx-auto relative font-bold"
              id="mainpdf"
            >
              <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                <Image
                  src="/cform_bg.png"
                  alt="logo"
                  fill={true}
                  className="p-8"
                />
              </div>
              <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                (Continued...)
              </div>
              <div className="border border-black p-2 h-full w-full relative">
                <div className="scale-[0.3] absolute top-5 -right-10">
                  <Barcode
                    value={fformdata ? fformdata.sr_no : ""}
                    fontSize={30}
                  />
                </div>
                <div className="p-4 text-center text-xs">Duplicate</div>
                <div className="text-center text-sm font-medium">
                  THE CENTRAL SALES TAX
                </div>
                <div className="text-center text-sm font-medium">
                  (Registration & Turnover) Rules, 1957
                </div>
                <div className="text-center text-sm font-medium">
                  FORM &lsquo;F&lsquo;
                </div>
                <div className="text-center text-xs font-medium mt-4">
                  (FORM OF DECLARATION TO BE ISSUED BY THE TRANSFEREE) [See Rule
                  12(5)]
                </div>

                <table border={1} className="w-5/6 mx-auto mt-6">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Serial No
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata ? fformdata.sr_no : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of the issuing state:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Office of Issue:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        Dept. of VAT -{" "}
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date of Issue :
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {formateDate(
                          new Date(fformdata?.createdAt!),
                        ).replaceAll("-", "/")}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quarter & Year :{" "}
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.to_period.toLocaleString("default", {
                          month: "short",
                        })}
                        ,{fformdata?.from_period.getFullYear()}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2  text-xs leading-6 w-[50%]">
                        Name of the purchasing dealer
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata ? dvatdata.tradename : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        to whom issued along with his RC NO
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata && dvatdata.tinNumber}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date from which registration is valid
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata
                          ? formateDate(
                              new Date(fformdata.valid_date),
                            ).replaceAll("-", "/")
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  To
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  {fformdata ? fformdata.seller_name : ""} (#Seller)
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  Registration Certificate No. of the Transferor{" "}
                  {fformdata ? fformdata.seller_tin_no : ""}
                </p>
                <br />

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6 tracking-tighter">
                  Certified that the goods transferred to me/us as per details
                  below have been received and duly accounted for:-
                </p>

                <table border={1} className="w-5/6 mx-auto">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Description of the goods sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quantity or weight
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Value of the goods
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[80%]">
                        Number and date of invoice [or challan or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document under which goods were sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of Railway, Steamer or Ferry Station or Airport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        or Post Office from where the goods were dispatched
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        No. and date of Railway Receipt or Postal Receipt or
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Goods Receipt with Trip sheet of lorry or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document indicating the means of transport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date on which delivery was taken by the transferee
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">Amount</td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.amount}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        The above statements are true to the best of my
                        knowledge and belief.
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-right mt-4 text-xs leading-6">
                  (Signature)...................................................
                </p>
                <p className="text-right text-xs leading-6">
                  (Name of the person signing the declaration)
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferee)].
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferor)].
                </p>

                <p className="text-left text-xs leading-6">
                  **Strike out whichever is not applicable.
                </p>
                <p className="text-left text-xs leading-6">
                  Note 1. To be furnished to the assessing authority in
                  accordance with rules framed under Section 13(4)(e).)
                </p>
              </div>
            </div>

            {pages.map((pageData, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white p-8 shadow h-290.75 w-198.5 mx-auto relative font-bold"
                style={{
                  pageBreakAfter:
                    pageIndex === pages.length - 1 ? "auto" : "always",
                }}
              >
                <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                  <Image
                    src="/cform_bg.png"
                    alt="logo"
                    fill={true}
                    className="p-8"
                  />
                </div>
                <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                  (Continued...)
                </div>
                <div className="border border-black p-2 h-full w-full relative">
                  <div className="scale-[0.3] absolute top-10 -right-10">
                    <Barcode
                      value={fformdata ? fformdata.sr_no : ""}
                      fontSize={30}
                    />
                  </div>
                  <div className="flex">
                    <div className="grow"></div>
                    <div className="text-xs leading-6">
                      <h1>Form &lsquo;F&lsquo;</h1>
                      <h1>Annexure </h1>
                    </div>
                  </div>
                  <table border={1} className="w-5/6 mx-auto mt-6">
                    <tbody className="w-full">
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Office of Issue
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Dept. of VAT -{" "}
                          {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                            ? "Dadra and Nagar Haveli"
                            : fformdata?.office_of_issue}
                        </td>
                      </tr>
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Date of Issue :
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          {formateDate(new Date()).replaceAll("-", "/")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border={1}
                    className="mx-4 mt-6"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <thead style={{ display: "table-header-group" }}>
                      <tr>
                        <td
                          className="border border-black text-xs leading-6 text-center"
                          colSpan={7}
                        >
                          INVOICE DETAILS
                        </td>
                      </tr>
                    </thead>
                    <tbody className="w-full">
                      <tr
                        className="w-full"
                        style={{ pageBreakInside: "avoid" }}
                      >
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                          No.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Inv. No
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Inv.Date
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Commodity Desc.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                          Inv. Value(Rs)
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Purpose
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Pur. Ord. No./Date
                        </td>
                      </tr>
                      {pageData.map((val: returns_entry, index) => (
                        <tr
                          key={index}
                          className="w-full"
                          style={{ pageBreakInside: "avoid" }}
                        >
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                            {pageIndex * PAGE_SIZE + index + 1}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.description_of_goods}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                            {val.total_invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                            Branch Transfer
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {/* part two end here */}

            {/* part three start here */}
            <div
              className="bg-white p-8 shadow h-290.75 w-198.5 mx-auto relative font-bold"
              id="mainpdf"
            >
              <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                <Image
                  src="/cform_bg.png"
                  alt="logo"
                  fill={true}
                  className="p-8"
                />
              </div>
              <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                (Continued...)
              </div>
              <div className="border border-black p-2 h-full w-full relative">
                <div className="scale-[0.3] absolute top-5 -right-10">
                  <Barcode
                    value={fformdata ? fformdata.sr_no : ""}
                    fontSize={30}
                  />
                </div>
                <div className="p-4 text-center text-xs">Counterfoil</div>
                <div className="text-center text-sm font-medium">
                  THE CENTRAL SALES TAX
                </div>
                <div className="text-center text-sm font-medium">
                  (Registration & Turnover) Rules, 1957
                </div>
                <div className="text-center text-sm font-medium">
                  FORM &lsquo;F&lsquo;
                </div>
                <div className="text-center text-xs font-medium mt-4">
                  (FORM OF DECLARATION TO BE ISSUED BY THE TRANSFEREE) [See Rule
                  12(5)]
                </div>

                <table border={1} className="w-5/6 mx-auto mt-6">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Serial No
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata ? fformdata.sr_no : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of the issuing state:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Office of Issue:
                      </td>
                      <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                        Dept. of VAT -{" "}
                        {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra and Nagar Haveli"
                          : fformdata?.office_of_issue}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date of Issue :
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {formateDate(
                          new Date(fformdata?.createdAt!),
                        ).replaceAll("-", "/")}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quarter & Year :{" "}
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.to_period.toLocaleString("default", {
                          month: "short",
                        })}
                        ,{fformdata?.from_period.getFullYear()}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2  text-xs leading-6 w-[50%]">
                        Name of the purchasing dealer
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata ? dvatdata.tradename : ""}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        to whom issued along with his RC NO
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {dvatdata && dvatdata.tinNumber}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date from which registration is valid
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata
                          ? formateDate(
                              new Date(fformdata.valid_date),
                            ).replaceAll("-", "/")
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  To
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  {fformdata ? fformdata.seller_name : ""} (#Seller)
                </p>
                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6">
                  Registration Certificate No. of the Transferor{" "}
                  {fformdata ? fformdata.seller_tin_no : ""}
                </p>
                <br />

                <p className="px-2 w-5/6 mx-auto text-xs text-justify leading-6 tracking-tighter">
                  Certified that the goods transferred to me/us as per details
                  below have been received and duly accounted for:-
                </p>

                <table border={1} className="w-5/6 mx-auto">
                  <tbody className="w-full">
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Description of the goods sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Quantity or weight
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Value of the goods
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[80%]">
                        Number and date of invoice [or challan or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document under which goods were sent
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        (see table below)
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Name of Railway, Steamer or Ferry Station or Airport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        or Post Office from where the goods were dispatched
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        No. and date of Railway Receipt or Postal Receipt or
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Goods Receipt with Trip sheet of lorry or any other
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        document indicating the means of transport
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        Date on which delivery was taken by the transferee
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">Amount</td>
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        {fformdata?.amount}
                      </td>
                    </tr>
                    <tr className="w-full">
                      <td className="px-2 text-xs leading-6 w-[50%]">
                        The above statements are true to the best of my
                        knowledge and belief.
                      </td>
                      <td className="px-2 text-xs leading-6 w-[50%]"></td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-right mt-4 text-xs leading-6">
                  (Signature)...................................................
                </p>
                <p className="text-right text-xs leading-6">
                  (Name of the person signing the declaration)
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferee)].
                </p>
                <p className="text-right text-xs leading-6">
                  (Status of the person signing the declaration in relation to
                  the transferor)].
                </p>

                <p className="text-left text-xs leading-6">
                  **Strike out whichever is not applicable.
                </p>
                <p className="text-left text-xs leading-6">
                  Note 1. To be furnished to the assessing authority in
                  accordance with rules framed under Section 13(4)(e).)
                </p>
              </div>
            </div>

            {pages.map((pageData, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white p-8 shadow h-290.75 w-198.5 mx-auto relative font-bold"
                style={{
                  pageBreakAfter:
                    pageIndex === pages.length - 1 ? "auto" : "always",
                }}
              >
                <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
                  <Image
                    src="/cform_bg.png"
                    alt="logo"
                    fill={true}
                    className="p-8"
                  />
                </div>
                <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
                  (Continued...)
                </div>
                <div className="border border-black p-2 h-full w-full relative">
                  <div className="scale-[0.3] absolute top-10 -right-10">
                    <Barcode
                      value={fformdata ? fformdata.sr_no : ""}
                      fontSize={30}
                    />
                  </div>
                  <div className="flex">
                    <div className="grow"></div>
                    <div className="text-xs leading-6">
                      <h1>Form &lsquo;F&lsquo;</h1>
                      <h1>Annexure </h1>
                    </div>
                  </div>
                  <table border={1} className="w-5/6 mx-auto mt-6">
                    <tbody className="w-full">
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Office of Issue
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Dept. of VAT -{" "}
                          {fformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                            ? "Dadra and Nagar Haveli"
                            : fformdata?.office_of_issue}
                        </td>
                      </tr>
                      <tr className="w-full">
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          Date of Issue :
                        </td>
                        <td className="px-2 py-1 text-xs leading-6 w-[50%] -translate-y-4">
                          {formateDate(new Date()).replaceAll("-", "/")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border={1}
                    className="mx-4 mt-6"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <thead style={{ display: "table-header-group" }}>
                      <tr>
                        <td
                          className="border border-black text-xs leading-6 text-center"
                          colSpan={7}
                        >
                          INVOICE DETAILS
                        </td>
                      </tr>
                    </thead>
                    <tbody className="w-full">
                      <tr
                        className="w-full"
                        style={{ pageBreakInside: "avoid" }}
                      >
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                          No.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Inv. No
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Inv.Date
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Commodity Desc.
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                          Inv. Value(Rs)
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                          Purpose
                        </td>
                        <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                          Pur. Ord. No./Date
                        </td>
                      </tr>
                      {pageData.map((val: returns_entry, index) => (
                        <tr
                          key={index}
                          className="w-full"
                          style={{ pageBreakInside: "avoid" }}
                        >
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[4%]">
                            {pageIndex * PAGE_SIZE + index + 1}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[22%]">
                            {val.description_of_goods}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                            {val.total_invoice_number}
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[20%]">
                            Branch Transfer
                          </td>
                          <td className="px-2 py-1 border border-black text-xs leading-6 w-[10%]">
                            {formateDatecus(
                              new Date(val.invoice_date),
                            ).replaceAll("-", "/")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* part three end here */}
          </div>
        </div>
      </div>
    </>
  );
};

export default FFROM;
