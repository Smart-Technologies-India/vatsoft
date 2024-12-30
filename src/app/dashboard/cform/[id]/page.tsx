/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { cform, dvat04, returns_entry } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import { Button } from "antd";

import GetCformById from "@/action/cform/getcfrombyid";
import GetDvat04 from "@/action/register/getdvat04";
import GetCformEntry from "@/action/cform/getcfromenrty";

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

      console.log(cform_response);
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
          serReturns_entryData(cform_entry_respone.data);
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
      <div className="mainpdf">
        {/* part one start here */}

        <div
          className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto"
          id="mainpdf"
        >
          <div className="border border-black p-2 h-full w-full">
            <div className="p-4 text-center text-sm">Original</div>
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
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!))}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Name of the purchasing dealer
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata ? dvatdata.tradename : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    to whom issued along with his RC NO
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata && dvatdata.tinNumber}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date from which registration is valid
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date))
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Serial No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">To</td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_address : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Seller Tin No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-sm text-justify">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale......use in manufacture/processing of goods for sale
              .........in the telecommunication network.... use in mining
              .....................................use in
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

            <p className="text-left w-5/6 mx-auto mt-4 text-sm">
              Name and address of the purchasing dealer in full:
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-sm">
              (Signature)...................................................
            </p>
            <p className="text-right text-sm">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-sm">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-sm">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-sm">
              Date...............No..................Amount: Rs.296778491.84
            </p>
            <p className="text-left text-sm">
              Name and Address of the seller with name of the State:HINDUSTAN
              PETROLIUM CORPORATION LTD,VA
              <br />
              &nbsp;&nbsp;SHI,MAHARASTRA
            </p>
            <p className="text-left text-sm">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto"
            style={{
              pageBreakAfter:
                pageIndex === pages.length - 1 ? "auto" : "always",
            }}
          >
            <div className="border border-black p-2 h-full w-full">
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 leading-4 py-1 text-sm w-[50%]">
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
                      {formateDate(new Date())}
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
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
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
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {/* part one end here */}

        {/* part two start here */}
        {/* <div className="p-4 text-center text-sm">Duplicate</div> */}
        <div className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto">
          <div className="border border-black p-2 h-full w-full">
            <div className="p-4 text-center text-sm">Duplicate</div>
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
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!))}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Name of the purchasing dealer
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata ? dvatdata.tradename : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    to whom issued along with his RC NO
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata && dvatdata.tinNumber}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date from which registration is valid
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date))
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Serial No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">To</td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_address : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Seller Tin No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-sm text-justify">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale......use in manufacture/processing of goods for sale
              .........in the telecommunication network.... use in mining
              .....................................use in
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

            <p className="text-left w-5/6 mx-auto mt-4 text-sm">
              Name and address of the purchasing dealer in full:
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-sm">
              (Signature)...................................................
            </p>
            <p className="text-right text-sm">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-sm">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-sm">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-sm">
              Date...............No..................Amount: Rs.296778491.84
            </p>
            <p className="text-left text-sm">
              Name and Address of the seller with name of the State:HINDUSTAN
              PETROLIUM CORPORATION LTD,VA
              <br />
              &nbsp;&nbsp;SHI,MAHARASTRA
            </p>
            <p className="text-left text-sm">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto"
            style={{
              pageBreakAfter:
                pageIndex === pages.length - 1 ? "auto" : "always",
            }}
          >
            <div className="border border-black p-2 h-full w-full">
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 leading-4 py-1 text-sm w-[50%]">
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
                      {formateDate(new Date())}
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
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
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
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* part two end here */}

        {/* part three start here */}
        <div className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto">
          <div className="border border-black p-2 h-full w-full">
            <div className="p-4 text-center text-sm">Counterfoil</div>
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
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata?.office_of_issue}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {/* 24/11/2014 */}
                    {formateDate(new Date(cformdata?.createdAt!))}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Name of the purchasing dealer
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata ? dvatdata.tradename : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    to whom issued along with his RC NO
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {dvatdata && dvatdata.tinNumber}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date from which registration is valid
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata
                      ? formateDate(new Date(cformdata.valid_date))
                      : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Serial No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.sr_no : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">To</td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_address : ""}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Seller Tin No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    {cformdata ? cformdata.seller_tin_no : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-sm text-justify">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale......use in manufacture/processing of goods for sale
              .........in the telecommunication network.... use in mining
              .....................................use in
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

            <p className="text-left w-5/6 mx-auto mt-4 text-sm">
              Name and address of the purchasing dealer in full:
              {dvatdata ? dvatdata.address : ""}
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-sm">
              (Signature)...................................................
            </p>
            <p className="text-right text-sm">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-sm">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-sm">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-sm">
              Date...............No..................Amount: Rs.296778491.84
            </p>
            <p className="text-left text-sm">
              Name and Address of the seller with name of the State:HINDUSTAN
              PETROLIUM CORPORATION LTD,VA
              <br />
              &nbsp;&nbsp;SHI,MAHARASTRA
            </p>
            <p className="text-left text-sm">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        {pages.map((pageData, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto"
            style={{
              pageBreakAfter:
                pageIndex === pages.length - 1 ? "auto" : "always",
            }}
          >
            <div className="border border-black p-2 h-full w-full">
              <table border={1} className="w-5/6 mx-auto mt-6">
                <tbody className="w-full">
                  <tr className="w-full">
                    <td className="px-2 leading-4 py-1 text-sm w-[50%]">
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
                      {formateDate(new Date())}
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
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
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
                      Inv. Value(Rs)
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      Purpose
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                      Pur. Ord. No./Date
                    </td>
                  </tr>
                  {pageData.map((val: returns_entry, index) => (
                    <tr key={index} className="w-full">
                      <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                        {pageIndex * PAGE_SIZE + index + 1}
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
        <div className="grid place-items-center">
          <Button
            className="hidden-print mx-auto my-4"
            type="primary"
            onClick={async (e) => {
              await generatePDF(`dashboard/cform/${idString}?sidebar=no`);
            }}
          >
            Download Challan
          </Button>
        </div>
      </div>
    </>
  );
};

export default CFROM;
