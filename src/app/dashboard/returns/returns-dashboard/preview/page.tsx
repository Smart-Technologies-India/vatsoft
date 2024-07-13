"use client";

import getPdfReturn from "@/action/return/getpdfreturn";
import { formateDate } from "@/utils/methods";
import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  returns_01,
  returns_entry,
  SaleOf,
} from "@prisma/client";
import { getCookie } from "cookies-next";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const Dvat16ReturnPreview = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();

  const searchparam = useSearchParams();
  useEffect(() => {
    const init = async () => {
      const year: string = searchparam.get("year") ?? "";
      const month: string = searchparam.get("month") ?? "";

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
  }, [searchparam, userid]);
  return (
    <>
      <section className="px-5">
        <main className="bg-white mt-6 p-4 w-full">
          {/* page 1 start here */}

          {/* header 1 start from here */}
          <div className="border border-black py-2 w-full">
            <h1 className="text-center text-sm  leading-3">
              Company Name : POLYGEL INDUSTRIES PVT. LTD
            </h1>
            <p className="text-center text-xs  leading-4">
              Tin Number : 26000002256 Period (December 2016)
            </p>
          </div>
          {/* header 2 start from here */}
          <div className="border border-black py-2 mt-4 w-5/6 mx-auto leading-3">
            <p className="text-center font-semibold text-xs leading-3">
              DEPARTMENT OF VALUE ADDED TAX
            </p>
            <p className="text-center font-semibold text-xs  leading-3">
              UT Administration of Dadra & Nagar Haveli
            </p>
            <p className="text-center font-semibold text-xs  leading-3">
              Form DVAT 16
            </p>
            <p className="text-center font-semibold text-xs  leading-3">
              (See Rule 28 and 29 of the Dadra & Nagar Haveli, Value Added Tax
              Rules, 2005)
            </p>
            <p className="text-center font-semibold text-xs  leading-3">
              Dadra & Nagar Haveli Value Added Tax Return
            </p>
          </div>
          {/* section 1 start here */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.1 Tax Period From December, 2016 To December, 2016
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.2 RR No: 2918693
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.3 Return Type: ORIGINAL
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.4 Return Date: 01/02/2017
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 2 start here  */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.1 Tax Period From December, 2016 To December, 2016
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.2 RR No: 2918693
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.3 Return Type: ORIGINAL
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R1.4 Return Date: 01/02/2017
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R2.1 Registration Certificate No.
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  26000002256
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R2.2.1 Name of Dealer
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  POLYGEL INDUSTRIES PVT. LTD
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R2.2.2 Address of Dealer
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  SRY.NO.358/1,BEHIND DADRA GARDEN DADRA-0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R2.3 Dealer Status
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  PRIVATE LIMITED COMPANY
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 3 start here  */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[50%] font-semibold text-left">
                  R3 Description of top 3 items you deal in (In order of volume
                  of sales for the tax period. 1-highest volume to 3-lowest
                  volume)
                </th>
              </tr>
              <tr className="">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  CABLE FILLING COMPUND CABLE FLOODING COMPOUND MINERAL OIL BASE
                  OIL WAXES POLYMERS AND ADDITIVES SPECIALITY COMPOUND ORANIC
                  TITANATESORGANIC ENANELS
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 4 start here */}
          <TurnOver returnsentrys={returns_entryData ?? []} />
          {/* section 5 start here */}
          <R1TurnOverOfPurchase returnsentrys={returns_entryData ?? []} />
          {/* section 6 start here */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[80%]">
                  R6.1 Net Tax (R4.10)-(R5.5)
                </td>

                <td className="border border-black px-2 leading-4 text-[0.6rem]  w-[20%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R6.2 Add:Intrest,penalty or other government dues
                </td>

                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R6.3 Less : Tax deducted at source
                </td>

                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R7 Balance (R6.1+R6.2-R6.3)
                </td>

                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 7 start here */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <thead>
              <tr className="w-full">
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem] w-[50%] font-semibold"
                  colSpan={2}
                >
                  THE BALANCE ON LINE 7 IS POSITIVE, PAY TAX PROVIDE DETAILS IN
                  THIS BOX
                </td>
              </tr>
            </thead>
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  Balanace brought forward from line R7
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R8.1 Challan number by which payment made
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R8.2 Date of payment
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 8 start here */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <thead>
              <tr className="w-full">
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem] w-[50%] font-semibold"
                  colSpan={2}
                >
                  THE BALANCE ON LINE 7 IS NEGATIVE,PROVIDE DETAILS IN THIS BOX
                </td>
              </tr>
            </thead>
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  Balanace brought forward from line R7
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R9.1 Adjusted against liability under Central Sales Tax
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R9.2 Refund Claimed
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  R9.3 Balance carried forward to next tax period
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                  0
                </td>
              </tr>
            </tbody>
          </table>
          {/* section 9 start here */}
          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[60%] text-left">
                  R10 Inter-state trade and exports and Imports
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Inter-state Sales/Exports
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Inter-state Purchase/Imports
                </th>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.1 Stock Transfer outside D&NH - Against F form
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.2 Against C Forms
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.3 Against I Forms
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.4 Against H Forms
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.5 Against any other Forms
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.6 Capital goods
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.7 Export to/Import from outside India
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Others, Please specify
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.8
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.9
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  R10.10 Total
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
            </tbody>
          </table>
          {/* page 1 end here */}

          {/* page 2 start here */}
          {/* section 10 start here */}
          <S1_1Adjustment returnsentrys={returns_entryData ?? []} />
          <S2AdjustmentOfTax returnsentrys={returns_entryData ?? []} />
          {/* page 2 end here */}

          {/* page 3 start from here */}

          <table border={1} className="w-5/6 mx-auto mt-4">
            <thead className="w-full">
              <tr className="w-full">
                <th
                  colSpan={4}
                  className="border border-black px-2 leading-4 text-[0.6rem] w-[100%] text-left"
                >
                  FORM I - Form of return under Rule 4 of the Central Sales Tax
                  (Dadra & Nagar Haveli) Rules, 198
                </th>
              </tr>
              <tr className="w-full">
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[2%] text-left  font-normal">
                  1
                </th>
                <th
                  className="border border-black px-2 leading-4 text-[0.6rem] w-[70%] text-left  font-normal"
                  colSpan={2}
                >
                  Gross amount received & receivable by the dealer during the
                  period in respect of sales of goods
                </th>

                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[15%] text-left font-normal">
                  0
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Deduct Including Labour job for Rs.
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (i)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Sales of goods outside the state (As defined in Section 4 of
                  the Act)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (ii)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Sales of goods in the course or Export outside or Import into
                  India (as defined in Section 5 of the Act)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  2
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Balance turnover of Inter State Sales and Sales within the
                  State
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Deduct turnover Sales within the State
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Balance-/turnover of Inter-State Sales
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Deduct
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (i)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Cost of freight or delivery or the cost of installation where
                  such cost is separately charged on Inter-State sales
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (ii)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Sums allowed as cash discount if the turnover is considered
                  inclusive of the same sums
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iii)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Sales price of goods returned by the purchaser within the
                  prescribed period
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  4
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Balance - Total turnover of Inter-State Sales
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Deduct
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (i)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Subsequent sales not taxable under Section 6(2) of the Act
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (ii)
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Sales not taxable under Section 8 (2A) of the Act
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Others
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  5
                </td>
                <td
                  className="border border-black px-2 leading-4 text-[0.6rem]"
                  colSpan={2}
                >
                  Balance -Total Taxable turnover of Inter-State Sales
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  6
                </td>

                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Goodswise break-up of the above taxable turnover and the tax
                  payable thereon
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[15%] font-semibold">
                  Amt. of taxable sales Rs.
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem] font-semibold">
                  Amt. of payable sales Rs.
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (i)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales of declared goods taxable at the rate of 4%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (ii)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to Registered Dealers on Form &apos;C&apos; taxable at
                  the rate of 2%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iii)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to Govt. other than registered dealer on certificate in
                  Form &apos;D&apos; taxable @ 4%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iv.a)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to persons other than registered dealers taxable @ 1%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iv.b)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to persons other than registered dealers taxable @ 4%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iv.b.a)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to persons other than registered dealers taxable @ 5%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iv.c)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to persons other than registered dealers taxable @ 12.5%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (iv.d)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales to persons other than registered dealers taxable @ 20%
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Others
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (v)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Sales of goods notified under Sub-Section (5) of Sub-section 8
                  of the Act
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (v.a)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Others INTEREST
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  (v.b)
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Others PENALTY
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Total
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Adjusted against VAT Input Credit as per./ TOTAL
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  Net Payable
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  0
                </td>
              </tr>
            </tbody>
          </table>

          <table border={1} className="w-5/6 mx-auto mt-4">
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[20%]">
                  Note
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem] w-[80%]"></td>
              </tr>
            </tbody>
          </table>

          <FORM_DVAT_16 returnsentrys={returns_entryData ?? []} />
          <h1 className="text-center font-semibold text-sm mt-4">
            Payment Details
          </h1>
          <table border={1} className="w-5/6 mx-auto mt-2">
            <thead className="w-full">
              <tr className="w-full">
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Payment Mode
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Ref. No
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Payment Date
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Payment Date
                </th>
                <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              <tr className="w-full">
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  e-Payment
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  2636061125
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  01/02/2017
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  BANK OF BARODA
                </td>
                <td className="border border-black px-2 leading-4 text-[0.6rem]">
                  548441
                </td>
              </tr>
            </tbody>
          </table>
        </main>
      </section>
    </>
  );
};
export default Dvat16ReturnPreview;

interface TurnOverProps {
  returnsentrys: returns_entry[];
}
const TurnOver = (props: TurnOverProps) => {
  const getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
        val.tax_percent == value
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getSaleOfPercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const get4_6 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const get4_7 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.PROCESSED_GOODS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get4_9 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
        val.sale_of == SaleOf.GOODS_TAXABLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[60%] text-left">
            R4 Turnover
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Turnover(Rs.)
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Output Tax(Rs.)
          </th>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.1 Goods taxable at 0%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("0").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("0").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.1 Goods taxable at 1%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("1").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("1").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2 Goods taxable at 4%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("4").decrease}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2.1 Goods taxable at 5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2 Goods taxable at 6%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("6").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("6").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3 Goods taxable at 12.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("12.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.1 Goods taxable at 15%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("15").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("15").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.4 Goods taxable at 20%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("20").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("20").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.1 Works contract taxable at 4%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("4").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.1.a Works contract taxable at 5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.2 Works contract taxable at 12.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleOfPercentage("12.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.3 Tax Deducted at Source (TDS)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.6 Exempt sales(Items in Ist Schedule, Labour Job and any other)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get4_6().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get4_6().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.7 Goods Manufactured, Processed and assembled by eligible Unit
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get4_7().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get4_7().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Others
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R4.8 Output tax before adjustments Sub Total(A)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(getInvoicePercentage("0").decrease) +
              parseInt(getInvoicePercentage("1").decrease) +
              parseInt(getInvoicePercentage("4").decrease) +
              parseInt(getInvoicePercentage("5").decrease) +
              parseInt(getInvoicePercentage("6").decrease) +
              parseInt(getInvoicePercentage("12.5").decrease) +
              parseInt(getInvoicePercentage("15").decrease) +
              parseInt(getInvoicePercentage("20").decrease) +
              parseInt(getSaleOfPercentage("4").decrease) +
              parseInt(getSaleOfPercentage("5").decrease) +
              parseInt(getSaleOfPercentage("12.5").decrease) +
              parseInt(get4_6().decrease) +
              parseInt(get4_7().decrease)}
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R4.9 Adjustment to Output tax(complete schedule 1 to get the Total
            s1.2 here) (B)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get4_9().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R4.10 Total Output tax (A+B)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(getInvoicePercentage("0").decrease) +
              parseInt(getInvoicePercentage("1").decrease) +
              parseInt(getInvoicePercentage("4").decrease) +
              parseInt(getInvoicePercentage("5").decrease) +
              parseInt(getInvoicePercentage("6").decrease) +
              parseInt(getInvoicePercentage("12.5").decrease) +
              parseInt(getInvoicePercentage("15").decrease) +
              parseInt(getInvoicePercentage("20").decrease) +
              parseInt(getSaleOfPercentage("4").decrease) +
              parseInt(getSaleOfPercentage("5").decrease) +
              parseInt(getSaleOfPercentage("12.5").decrease) +
              parseInt(get4_6().decrease) +
              parseInt(get4_7().decrease) -
              parseInt(get4_9().decrease)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface S1_1AdjustmentProps {
  returnsentrys: returns_entry[];
}

const S1_1Adjustment = (props: S1_1AdjustmentProps) => {
  const getGoodsReturns = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        val.sale_of == SaleOf.GOODS_TAXABLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getSaleCanceled = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.SALE_CANCELLED &&
        val.sale_of == SaleOf.GOODS_TAXABLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <th
            colSpan={3}
            className="border border-black px-2 leading-4 text-[0.6rem] w-[100%] text-left"
          >
            S1.1 Adjustment to Output Tax
          </th>
        </tr>
        <tr className="w-full">
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[60%] text-left">
            Nature of Adjustment
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Increase in Output Tax(A)
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Decrease in Output Tax(B)
          </th>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales Cancelled [Section 8(1)(a)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getGoodsReturns().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Nature of Sale Changed [Section 8(1)(b)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Change in agreed consideration [Section 8(1)(c)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Goods sold returned [Section 8(1)(d)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleCanceled().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Bad debts written off [Section 8(1)(e) and Rule 7A
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Bad debts recovered [Rule 7A(3)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax payable on goods held on the date of cancellation of
            registration [Section 23]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Other adjustments, if any(specify)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(getGoodsReturns().decrease) +
              parseInt(getSaleCanceled().decrease)}
          </td>
        </tr>
        <tr className="w-full">
          <td
            colSpan={2}
            className="border border-black px-2 leading-4 text-[0.6rem]"
          >
            S1.2 Total net Increase/(decrease)in Output Tax (A-B)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface R1TurnOverOfPurchaseProps {
  returnsentrys: returns_entry[];
}

const R1TurnOverOfPurchase = (props: R1TurnOverOfPurchaseProps) => {
  const get5_1 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_2 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[60%] text-left">
            R5 Turnover of purchase
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Purchase(Rs.)
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Tax Credits(Rs.)
          </th>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R5.1 Purchase of capital goods in D&NH
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get5_1().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get5_1().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R5.2 Purchase of other goods in D&NH
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get5_2().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get5_2().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Others
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R5.3 Purchase of non creditable goods in D&NH
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get5_3().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R5.4 Tax credit before adjustments Sub Total(A)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(get5_1().decrease) + parseInt(get5_2().decrease)}
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R5.5 Adjustment to tax credits(complete schedule 1 to get the Total
            s2.2 here) (B)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            R5.6 Total Tax Credits (A+B)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface S2AdjustmentOfTaxProps {
  returnsentrys: returns_entry[];
}

const S2AdjustmentOfTax = (props: S2AdjustmentOfTaxProps) => {
  const getCreditNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getDebitNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getGoodsReturnsNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseInt(increase) + parseInt(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseInt(decrease) + parseInt(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <th
            colSpan={3}
            className="border border-black px-2 leading-4 text-[0.6rem] w-[100%] text-left"
          >
            S2.1 Adjustment to Tax Credits
          </th>
        </tr>
        <tr className="w-full">
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[60%] text-left">
            Nature of Adjustment
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Increase in Output Tax(C)
          </th>
          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
            Decrease in Output Tax(D)
          </th>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit carried forward from previous tax period
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Receipt of debit notes from the seller [Section 10(1)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getCreditNote().decrease}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Receipt of credit notes from the seller [Section 10(1)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getDebitNote().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Goods purchased returned or rejected [Section 10(1)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getGoodsReturnsNote().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Change in use of goods, for purposes other than for which credit is
            allowed [Section 10(2)(a)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Change in use of goods, for purposes for which credit is allowed
            [Section 10(2)(b)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit disallowed in respect of stock transfer out of Dadra &
            Nagar Haveli [Section 10(3)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit for Transitional stock held on 1st April,2005 (Section
            14)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit for purchase of second-hand goods (Section 15)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit for goods held on the date of withdrawl from Composition
            Scheme [Section 16(2)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit for trading stock and raw materials held at the time of
            registration (Section 20)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Tax credit disallowed for goods lost or destroyed (Rule 7)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Balance tax credit on capital goods [Section 9(9)(a)]
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Other adjustments,if any (specify)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getCreditNote().decrease}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(getDebitNote().decrease) +
              parseInt(getGoodsReturnsNote().decrease)}
          </td>
        </tr>
        <tr className="w-full">
          <td
            colSpan={2}
            className="border border-black px-2 leading-4 text-[0.6rem]"
          >
            S2.2 Total net Increase/(decrease)in Output Tax (C-D)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {parseInt(getCreditNote().decrease) -
              parseInt(getDebitNote().decrease) -
              parseInt(getGoodsReturnsNote().decrease)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface FORM_DVAT_16Props {
  returnsentrys: returns_entry[];
}

const FORM_DVAT_16 = (props: FORM_DVAT_16Props) => {
  const getFormDvat16Data = (): returns_entry[] => {
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    return output;
  };

  return (
    <>
      <h1 className="text-center font-semibold text-sm mt-4">
        FORM DVAT 16 - Annexure II For VAT Credit : Purchase of Other Goods
      </h1>
      <table border={1} className="w-11/12 mx-auto mt-2">
        <thead className="w-full">
          <tr className="w-full">
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[2%] text-left">
              SI No
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Tax Invoice No
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Date of purchase
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[18%] text-left">
              Name of the Dealer Fro mwhom Goods Purchased
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[10%] text-left">
              Tin no of selling dealer
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[18%] text-left">
              Description of Goods
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Quantity (Ltr/Nos)
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Total Amount of tax Invoice
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Vat Charged
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Rate of Charged
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[19%] text-left">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody className="w-full">
          {getFormDvat16Data().map((val: any, index: number) => {
            return (
              <tr className="w-full" key={index}>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.id}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.invoice_number}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {formateDate(new Date(val.invoice_date))}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.seller_tin_number.name_of_dealer}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.seller_tin_number.tin_number}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  COMPRESSOR OIL COMPRESIR OIL
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.amount}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.vatamount}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.tax_percent}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.remarks}
                </td>
              </tr>
            );
          })}
          <tr className="w-full">
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              1
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              2636061125
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              25/11/2016
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              HIRAL CHEMICALS
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              26500429100
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              COMPRESSOR OIL COMPRESIR OIL
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              7760.00
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              970
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              12.50
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
          </tr>
          <tr className="w-full">
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              2
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              2588
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              05/12/2016
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              ANNPURNA ELECTRICALS PVTLIMITE
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              26001000875
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              MCB BOX 4 WAY
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              891.00
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              111
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              12.50
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
          </tr>
          <tr className="w-full">
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              3
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              2603
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              07/12/2016
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              ANNPURNA ELECTRICALS PVTLIMITE
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              26001000875
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              MCB 16A 1 POLE
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              7340.00
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              918
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]">
              12.50
            </td>
            <td className="border border-black px-1 leading-4 text-[0.6rem]"></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
