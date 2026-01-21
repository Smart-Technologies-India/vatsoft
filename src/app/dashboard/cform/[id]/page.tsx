/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Barcode from "react-barcode";

import { cform, dvat04, returns_entry } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import { Button } from "antd";

import GetCformById from "@/action/cform/getcfrombyid";
import GetDvat04 from "@/action/register/getdvat04";
import GetCformEntry from "@/action/cform/getcfromenrty";
import Image from "next/image";

const CFROM = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const idString = Array.isArray(id) ? id[0] : id;
  const cformid: number = parseInt(decryptURLData(idString, router));

  const [cformdata, setCformdata] = useState<cform | null>(null);

  // const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);

  // const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    []
  );
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const cform_response = await GetCformById({
        id: cformid,
      });

      if (cform_response.data && cform_response.status) {
        setCformdata(cform_response.data);
        const dvat_response = await GetDvat04({
          id: cform_response.data.dvat04Id,
        });

        if (dvat_response.data && dvat_response.status) {
          setDvatData(dvat_response.data);
        }

        const cform_entry_respone = await GetCformEntry({
          id: cform_response.data.id,
        });

        if (cform_entry_respone.data && cform_entry_respone.status) {
          const grouped: Record<string, returns_entry> = {};

          for (const entry of cform_entry_respone.data) {
            const key = entry.invoice_number;

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
            const desc = entry.description_of_goods!.toLowerCase();

            if (
              desc.includes("diesel") ||
              desc.includes("high speed petrol") ||
              desc.includes("petrol") ||
              desc.includes("high speed diesel")
            ) {
              entry.description_of_goods = "MS HSD";
            } else if (desc.includes("additives") || desc.includes("oil")) {
              entry.description_of_goods = "Lubricant";
            } else if (desc.includes("cng") || desc.includes("png")) {
              entry.description_of_goods = "NG";
            } else {
              entry.description_of_goods = "IMFL";
            }
          }

          serReturns_entryData(Object.values(grouped));
          // serReturns_entryData(cform_entry_respone.data);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const PAGE_SIZE = 35;

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
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                C-Form Declaration
              </h1>
              <p className="text-sm text-gray-500 mt-2 ml-4">
                Central Sales Tax Declaration Form
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="mainpdf">
        {/* part one start here */}

        <div
          className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
          id="mainpdf"
        >
          <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
            <Image src="/cform_bg.png" alt="logo" fill={true} className="p-8" />
          </div>
          <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
            (Continued...)
          </div>
          <div className="border border-black p-2 h-full w-full relative">
            <div className="scale-[0.3] absolute top-20 -right-10">
              <Barcode value={cformdata ? cformdata.sr_no : ""} />
            </div>
            <div className="p-4 text-center text-xs">Original</div>
            <div className="text-center text-sm font-medium">
              THE CENTRAL SALES TAX
            </div>
            <div className="text-center text-sm font-medium">
              (REGISTRATION AND TURN OVER) RULES 1957
            </div>
            <div className="text-center text-sm font-medium">
              FORM &lsquo;C&lsquo;
            </div>
            <div className="text-center text-xs font-medium mt-4">
              Form of declaration
            </div>
            <div className="text-center text-xs font-normal mt-2">
              ________________[See Rule 12(1)]________________
            </div>

            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Office of Issue:
                  </td>
                  <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                    Dept. of VAT -{" "}
                    {cformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                      ? "Dadra and Nagar Haveli"
                      : cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!)).replaceAll(
                      "-",
                      "/"
                    )}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Quarter & Year :{" "}
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata?.from_period.toLocaleString("default", {
                      month: "short",
                    })}
                    -
                    {cformdata?.to_period.toLocaleString("default", {
                      month: "short",
                    })}
                    ,{cformdata?.from_period.getFullYear()}
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
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date)).replaceAll(
                          "-",
                          "/"
                        )
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">Serial No</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">To</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.seller_name : ""} (#Seller)
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    Seller TIN No
                  </td>
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-xs text-justify leading-6">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale.....................use in manufacture/processing of
              goods for sale .........in the telecommunication network.... use
              in mining .....................................use in
              generation/distribution of
              power..................................................... packing
              of goods for sale/resale
              .............................................and are covered by
              my/our registration certificate
              No....................dated...................issued under the
              Central Sales Tax Act,1956.[It is further certified that I/We
              am/are not registered under section 7 of the said Act,in the State
              of.................................... in which the goods covered
              by this Form are/will be delivered.]
            </p>

            <p className="text-left w-5/6 mx-auto mt-4 text-xs leading-6">
              Name and address of the purchasing dealer in full:{" "}
              {dvatdata ? dvatdata.tradename : ""},
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-xs leading-6">
              (Signature)...................................................
            </p>
            <p className="text-right text-xs leading-6">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-xs leading-6">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-xs leading-6">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-xs leading-6">
              Date...............No..................Amount: Rs.
              {cformdata?.amount}
            </p>
            <p className="text-left text-xs leading-6">
              Name and Address of the seller with name of the State:{" "}
              {cformdata ? cformdata.seller_name : ""},{" "}
              {cformdata ? cformdata.seller_address : ""}
            </p>
            <p className="text-left text-xs leading-6">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs leading-6">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
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
                <Barcode value={cformdata ? cformdata.sr_no : ""} />
              </div>
              <div className="flex">
                <div className="grow"></div>
                <div className="text-xs leading-6">
                  <h1>Form &lsquo;C&lsquo;</h1>
                  <h1>Annexure </h1>
                </div>
              </div>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Office of Issue
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Dept. of VAT – Dadra and Nagar Haveli
                    </td>
                  </tr>
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Date of Issue :
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      {formateDate(new Date()).replaceAll("-", "/")}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <thead>
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
                  <tr className="w-full">
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      SI.No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv.Date
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Commodity Desc.
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {formateDate(new Date(val.invoice_date)).replaceAll(
                          "-",
                          "/"
                        )}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {val.description_of_goods}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.total_invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {/* {val.remarks} */}
                        For Resale
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {formateDate(new Date(val.createdAt)).replaceAll(
                          "-",
                          "/"
                        )}
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
          className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
          id="mainpdf"
        >
          <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
            <Image src="/cform_bg.png" alt="logo" fill={true} className="p-8" />
          </div>
          <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
            (Continued...)
          </div>
          <div className="border border-black p-2 h-full w-full relative">
            <div className="scale-[0.3] absolute top-20 -right-10">
              <Barcode value={cformdata ? cformdata.sr_no : ""} />
            </div>
            <div className="p-4 text-center text-xs">Duplicate</div>
            <div className="text-center text-sm font-medium">
              THE CENTRAL SALES TAX
            </div>
            <div className="text-center text-sm font-medium">
              (REGISTRATION AND TURN OVER) RULES 1957
            </div>
            <div className="text-center text-sm font-medium">
              FORM &lsquo;C&lsquo;
            </div>
            <div className="text-center text-xs font-medium mt-4">
              Form of declaration
            </div>
            <div className="text-center text-xs font-normal mt-2">
              ________________[See Rule 12(1)]________________
            </div>

            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Office of Issue:
                  </td>
                  <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                    Dept. of VAT -{" "}
                    {cformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                      ? "Dadra and Nagar Haveli"
                      : cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!)).replaceAll(
                      "-",
                      "/"
                    )}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Quarter & Year :{" "}
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata?.from_period.toLocaleString("default", {
                      month: "short",
                    })}
                    -
                    {cformdata?.to_period.toLocaleString("default", {
                      month: "short",
                    })}
                    ,{cformdata?.from_period.getFullYear()}
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
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date)).replaceAll(
                          "-",
                          "/"
                        )
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">Serial No</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">To</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.seller_name : ""} (#Seller)
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    Seller TIN No
                  </td>
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-xs text-justify leading-6">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale.....................use in manufacture/processing of
              goods for sale .........in the telecommunication network.... use
              in mining .....................................use in
              generation/distribution of
              power..................................................... packing
              of goods for sale/resale
              .............................................and are covered by
              my/our registration certificate
              No....................dated...................issued under the
              Central Sales Tax Act,1956.[It is further certified that I/We
              am/are not registered under section 7 of the said Act,in the State
              of.................................... in which the goods covered
              by this Form are/will be delivered.]
            </p>

            <p className="text-left w-5/6 mx-auto mt-4 text-xs leading-6">
              Name and address of the purchasing dealer in full:{" "}
              {dvatdata ? dvatdata.tradename : ""},
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-xs leading-6">
              (Signature)...................................................
            </p>
            <p className="text-right text-xs leading-6">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-xs leading-6">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-xs leading-6">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-xs leading-6">
              Date...............No..................Amount: Rs.
              {cformdata?.amount}
            </p>
            <p className="text-left text-xs leading-6">
              Name and Address of the seller with name of the State:{" "}
              {cformdata ? cformdata.seller_name : ""},{" "}
              {cformdata ? cformdata.seller_address : ""}
            </p>
            <p className="text-left text-xs leading-6">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs leading-6">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>
        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
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
                <Barcode value={cformdata ? cformdata.sr_no : ""} />
              </div>
              <div className="flex">
                <div className="grow"></div>
                <div className="text-xs leading-6">
                  <h1>Form &lsquo;C&lsquo;</h1>
                  <h1>Annexure </h1>
                </div>
              </div>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Office of Issue
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Dept. of VAT – Dadra and Nagar Haveli
                    </td>
                  </tr>
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Date of Issue :
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      {formateDate(new Date()).replaceAll("-", "/")}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <thead>
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
                  <tr className="w-full">
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      SI.No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv.Date
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Commodity Desc.
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {formateDate(new Date(val.invoice_date)).replaceAll(
                          "-",
                          "/"
                        )}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {val.description_of_goods}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.total_invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {/* {val.remarks} */}
                        For Resale
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {formateDate(new Date(val.createdAt)).replaceAll(
                          "-",
                          "/"
                        )}
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
          className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
          id="mainpdf"
        >
          <div className="top-0 left-0 h-full w-full absolute p-8 opacity-80">
            <Image src="/cform_bg.png" alt="logo" fill={true} className="p-8" />
          </div>
          <div className="absolute bottom-28 right-12 text-xs font-normal text-black ">
            (Continued...)
          </div>
          <div className="border border-black p-2 h-full w-full relative">
            <div className="scale-[0.3] absolute top-20 -right-10">
              <Barcode value={cformdata ? cformdata.sr_no : ""} />
            </div>
            <div className="p-4 text-center text-xs">Counterfoil</div>
            <div className="text-center text-sm font-medium">
              THE CENTRAL SALES TAX
            </div>
            <div className="text-center text-sm font-medium">
              (REGISTRATION AND TURN OVER) RULES 1957
            </div>
            <div className="text-center text-sm font-medium">
              FORM &lsquo;C&lsquo;
            </div>
            <div className="text-center text-xs font-medium mt-4">
              Form of declaration
            </div>
            <div className="text-center text-xs font-normal mt-2">
              ________________[See Rule 12(1)]________________
            </div>

            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Office of Issue:
                  </td>
                  <td className="px-2 text-xs text-nowrap leading-6 w-[50%]">
                    Dept. of VAT -{" "}
                    {cformdata?.office_of_issue == "Dadra_Nagar_Haveli"
                      ? "Dadra and Nagar Haveli"
                      : cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!)).replaceAll(
                      "-",
                      "/"
                    )}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    Quarter & Year :{" "}
                  </td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata?.from_period.toLocaleString("default", {
                      month: "short",
                    })}
                    -
                    {cformdata?.to_period.toLocaleString("default", {
                      month: "short",
                    })}
                    ,{cformdata?.from_period.getFullYear()}
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
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date)).replaceAll(
                          "-",
                          "/"
                        )
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">Serial No</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6 w-[50%]">To</td>
                  <td className="px-2 text-xs leading-6 w-[50%]">
                    {cformdata ? cformdata.seller_name : ""} (#Seller)
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    Seller TIN No
                  </td>
                  <td className="px-2 text-xs leading-6  w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-xs text-justify leading-6">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale.....................use in manufacture/processing of
              goods for sale .........in the telecommunication network.... use
              in mining .....................................use in
              generation/distribution of
              power..................................................... packing
              of goods for sale/resale
              .............................................and are covered by
              my/our registration certificate
              No....................dated...................issued under the
              Central Sales Tax Act,1956.[It is further certified that I/We
              am/are not registered under section 7 of the said Act,in the State
              of.................................... in which the goods covered
              by this Form are/will be delivered.]
            </p>

            <p className="text-left w-5/6 mx-auto mt-4 text-xs leading-6">
              Name and address of the purchasing dealer in full:{" "}
              {dvatdata ? dvatdata.tradename : ""},
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-xs leading-6">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-xs leading-6">
              (Signature)...................................................
            </p>
            <p className="text-right text-xs leading-6">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-xs leading-6">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-xs leading-6">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-xs leading-6">
              Date...............No..................Amount: Rs.
              {cformdata?.amount}
            </p>
            <p className="text-left text-xs leading-6">
              Name and Address of the seller with name of the State:{" "}
              {cformdata ? cformdata.seller_name : ""},{" "}
              {cformdata ? cformdata.seller_address : ""}
            </p>
            <p className="text-left text-xs leading-6">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs leading-6">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-280.75 w-198.5 mx-auto relative font-bold"
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
            <div className="border border-black p-2 h-full w-full relative">
              <div className="scale-[0.3] absolute top-10 -right-10">
                <Barcode value={cformdata ? cformdata.sr_no : ""} />
              </div>
              <div className="flex">
                <div className="grow"></div>
                <div className="text-xs leading-6">
                  <h1>Form &lsquo;C&lsquo;</h1>
                  <h1>Annexure </h1>
                </div>
              </div>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Office of Issue
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Dept. of VAT – Dadra and Nagar Haveli
                    </td>
                  </tr>
                  <tr className="w-full">
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      Date of Issue :
                    </td>
                    <td className="px-2 py-1 text-xs leading-6 w-[50%]">
                      {formateDate(new Date()).replaceAll("-", "/")}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table border={1} className="w-5/6 mx-auto mt-6">
                <thead>
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
                  <tr className="w-full">
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      SI.No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. No
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv.Date
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Commodity Desc.
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {formateDate(new Date(val.invoice_date)).replaceAll(
                          "-",
                          "/"
                        )}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {val.description_of_goods}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {val.total_invoice_number}
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[14%]">
                        {/* {val.remarks} */}
                        For Resale
                      </td>
                      <td className="px-2 py-1 border border-black text-xs leading-6 w-[15%]">
                        {formateDate(new Date(val.createdAt)).replaceAll(
                          "-",
                          "/"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* part three end here */}

        {/* <div className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto">
          <div className="border border-black p-2 h-full w-full">
            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Dept. of VAT – Dadra and Nagar Haveli
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {formateDate(new Date(return01?.createdAt!))}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-6">
              <thead>
                <tr>
                  <td
                    className="border border-black text-sm text-center"
                    colSpan={7}
                  >
                    INVOICE DETAILS
                  </td>
                </tr>
              </thead>
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 border border-black  text-sm w-[14%]">
                    SI.No
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv. No
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv.Date
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                    Commodity Desc.
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv. Valuse(Rs)
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Purpose
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                    Pur.Ord.No./Date
                  </td>
                </tr>
                {(returns_entryData ?? []).map(
                  (val: returns_entry, index: number) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 leading-4 py-1 border border-black  text-sm w-[14%]">
                        {index + 1}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {val.invoice_number}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {formateDate(new Date(val.invoice_date))}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                        {val.description_of_goods}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {val.total_invoice_number}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {val.remarks}
                      </td>
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                        {formateDate(new Date(val.createdAt))}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div> */}
        <div className="flex justify-center mt-6">
          <Button
            className="hidden-print bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white px-8 py-2 h-auto rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            type="primary"
            onClick={async (e) => {
              await generatePDF(`dashboard/cform/${idString}?sidebar=no`);
            }}
          >
            Download C-Form
          </Button>
        </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CFROM;
