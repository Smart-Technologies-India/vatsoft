/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  decryptURLData,
  encryptURLData,
  formatDateTime,
  formateDate,
  getDaysBetweenDates,
  getPrismaDatabaseDate,
} from "@/utils/methods";

import {
  challan,
  dvat04,
  DvatType,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  SelectOffice,
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import getDepartmentPdfReturn from "@/action/return/getdepartmentpdfreturn";
import getPdfReturnDownload from "@/action/return/getpdfreturndownload";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetPaidChallanByReturnId from "@/action/challan/getpaidchallanbyreturnid";

import TurnOver from "@/components/dvatreturn/1_turnver";
import R1TurnOverOfPurchase from "@/components/dvatreturn/2_turnoverofpurchase";
import NetTax from "@/components/dvatreturn/3_nettax";
import THEBALANCE1 from "@/components/dvatreturn/4_thebalance1";
import THEBALANCE2 from "@/components/dvatreturn/5_thebalance2";
import InterStateTrade from "@/components/dvatreturn/6_interstatetrade";
import S1_1Adjustment from "@/components/dvatreturn/7_s1adjustment";
import S2AdjustmentOfTax from "@/components/dvatreturn/8_s2adjustment";
import CentralSales from "@/components/dvatreturn/9_centralsales";
import FORM_DVAT_16 from "@/components/dvatreturn/10_fromdvat16";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const Dvat16ReturnPreview = () => {
  const router = useRouter();
  const { id, dvatid } = useParams<{
    id: string | string[];
    dvatid: string | string[];
  }>();
  const userid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );
  const dvat: number = parseInt(
    decryptURLData(Array.isArray(dvatid) ? dvatid[0] : dvatid, router),
  );

  const [isDownload, setDownload] = useState<boolean>(false);
  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);
  const searchparam = useSearchParams();
  const [user, setUser] = useState<user | null>();
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");
  const [lastmonthcash, setLastMonthCash] = useState<string>("0");

  const getQuarterForMonth = (month: string): Quarter | undefined => {
    const monthToQuarterMap: { [key: string]: Quarter } = {
      January: Quarter.QUARTER4,
      February: Quarter.QUARTER4,
      March: Quarter.QUARTER4,
      April: Quarter.QUARTER1,
      May: Quarter.QUARTER1,
      June: Quarter.QUARTER1,
      July: Quarter.QUARTER2,
      August: Quarter.QUARTER2,
      September: Quarter.QUARTER2,
      October: Quarter.QUARTER3,
      November: Quarter.QUARTER3,
      December: Quarter.QUARTER3,
    };

    return monthToQuarterMap[month] || undefined;
  };

  const getQuarterMonths = (selectedQuarter: Quarter): string[] => {
    const quarterMonthsMap: Record<Quarter, string[]> = {
      QUARTER1: ["April", "May", "June"],
      QUARTER2: ["July", "August", "September"],
      QUARTER3: ["October", "November", "December"],
      QUARTER4: ["January", "February", "March"],
    };

    return quarterMonthsMap[selectedQuarter] ?? [];
  };

  const getNewYear = (year: string, month: string): string => {
    if (["January", "February", "March"].includes(month)) {
      return (parseInt(year) + 1).toString();
    }
    return year;
  };

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      const user_response = await GetUser({
        id: authResponse.data,
      });
      if (user_response.status && user_response.data) {
        setUser(user_response.data);
      }
      const year: string = searchparam.get("year") ?? "";
      const month: string = searchparam.get("month") ?? "";

      const returnformsresponse = await getDepartmentPdfReturn({
        year: year,
        month: month,
        userid: userid,
        dvatid: dvat,
        selectOffice: user_response.data?.selectOffice as SelectOffice,
      });

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

      if (returnformsresponse.status && returnformsresponse.data) {
        const selectedReturn = returnformsresponse.data.returns_01;

        const challanResponse = await GetPaidChallanByReturnId({
          returnid: selectedReturn.id,
        });
        if (challanResponse.status && challanResponse.data) {
          setPaidChallans(challanResponse.data);
        } else {
          setPaidChallans([]);
        }

        const isQuarterlyFiling =
          selectedReturn.dvat04?.frequencyFilings === "QUARTERLY";

        let mergedEntries: returns_entry[] = [];

        if (isQuarterlyFiling) {
          const effectiveQuarter = getQuarterForMonth(month);
          const quarterMonths = effectiveQuarter
            ? getQuarterMonths(effectiveQuarter)
            : [];

          // Fetch all quarterly months
          const quarterResponses = await Promise.all(
            quarterMonths.map((quarterMonth) =>
              getDepartmentPdfReturn({
                year: getNewYear(year, quarterMonth),
                month: quarterMonth,
                userid: userid,
                dvatid: dvat,
                selectOffice: user_response.data?.selectOffice as SelectOffice,
              }),
            ),
          );

          // Collect all quarterly entries in order
          quarterResponses.forEach((quarterResponse: any) => {
            if (quarterResponse.status && quarterResponse.data) {
              // Add all entries from this quarter month
              mergedEntries.push(...quarterResponse.data.returns_entry);
            }
          });

          // If no quarterly data found, use only current month
          if (mergedEntries.length === 0) {
            mergedEntries = [...returnformsresponse.data.returns_entry];
          }
        } else {
          // For non-quarterly, use only current month data
          mergedEntries = [...returnformsresponse.data.returns_entry];
        }

        setReturn01(selectedReturn);
        serReturns_entryData(mergedEntries);
        // setUser(returnformsresponse.data.returns_01.createdBy);

        const dvat_30: boolean =
          mergedEntries.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30 && val.isnil == true,
          ).length > 0;
        const dvat_30a: boolean =
          mergedEntries.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30_A && val.isnil == true,
          ).length > 0;
        const dvat_31: boolean =
          mergedEntries.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_31 && val.isnil == true,
          ).length > 0;
        const dvat_31a: boolean =
          mergedEntries.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_31_A && val.isnil == true,
          ).length > 0;

        // if (dvat_30 && dvat_30a && dvat_31 && dvat_31a) {
        //   setAllNil(true);
        // }

        const currentDate = new Date();

        // Get the month index from the month name
        let monthIndex = monthNames.indexOf(
          returnformsresponse.data.returns_01.month!,
        );

        // Check if it's December (index 11) and increment year if needed
        let newYear = parseInt(year);
        if (monthIndex === 11) {
          newYear += 1;
          monthIndex = 0; // Set month to January
        } else {
          monthIndex += 1; // Otherwise, just increment the month
        }

        const diff_days = getDaysBetweenDates(
          new Date(
            parseInt(returnformsresponse.data.returns_01.year),
            monthIndex,
            11,
          ),
          currentDate,
        );
      } else {
        setReturn01(null);
        serReturns_entryData([]);
      }

      const currentMonthIndex = monthNames.indexOf(month);

      if (currentMonthIndex === -1) {
      } else {
        // Calculate the last month index and handle wrapping
        const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        // Get the last month's name
        const lastMonth: string = monthNames[lastMonthIndex];

        // const lastmonthdata = await getPdfReturn({
        //   year: month == "January" ? (parseInt(year) - 1).toString() : year,
        //   month: lastMonth,
        //   userid: userid,
        // });

        const lastmonthdata = await getPdfReturnDownload({
          year: month == "January" ? (parseInt(year) - 1).toString() : year,
          month: lastMonth,
          userid: userid,
          dvatid: dvat,
        });

        if (lastmonthdata.status && lastmonthdata.data) {
          setLastMonthDue(lastmonthdata.data.returns_01.pending_payment ?? "0");
          setLastMonthCash(lastmonthdata.data.returns_01.cash_payment ?? "0");
        }
      }
    };
    init();
  }, [searchparam, userid]);

  const generatePDF = async () => {
    setDownload(true);
    try {
      const printUrl = new URL(window.location.href);
      printUrl.searchParams.set("sidebar", "no");

      const printWindow = window.open(printUrl.toString(), "_blank");

      if (!printWindow) {
        setDownload(false);
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }

      let hasTriggered = false;
      const openPrintDialog = () => {
        if (hasTriggered) return;
        hasTriggered = true;
        try {
          printWindow.focus();
          printWindow.print();
        } finally {
          setDownload(false);
        }
      };

      // Trigger print once the page is loaded.
      printWindow.onload = () => {
        setTimeout(openPrintDialog, 1500);
      };

      // Fallback in case onload doesn't fire as expected.
      setTimeout(() => {
        if (!printWindow.closed) {
          openPrintDialog();
        }
      }, 3000);
    } catch (error) {
      setDownload(false);
      toast.error("Unable to download pdf try again.");
    }
  };

  return (
    <>
      <style>
        {`
          @page {
            margin: 5mm 5mm 5mm 5mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .mainpdf {
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
            .mainpdf main {
              margin: 0 !important;
              padding: 2mm !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box;
            }
            table {
              margin-left: auto !important;
              margin-right: auto !important;
            }
          }
        `}
      </style>

      {return01 && (
        <section className="px-5 relative mainpdf" id="mainpdf">
          <main
            className="bg-white p-4 w-full xl:w-5/6 mx-auto"
            style={{ marginTop: 0 }}
          >
            {/* page 1 start here */}

            {/* header 1 start from here */}
            <div className="border border-black py-2 w-full">
              <h1 className="text-center text-sm  leading-3">
                Company Name : {return01?.dvat04.tradename}
              </h1>
              <p className="text-center text-xs  leading-4">
                TIN Number : {return01?.dvat04.tinNumber} Period (
                {return01?.month} {return01?.year})
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
                    R1.1 Tax Period From {return01?.month}, {return01?.year} To{" "}
                    {return01?.month}, {return01?.year}
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R1.2 RR No: {return01?.rr_number}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R1.3 Return Type: {return01?.return_type}
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R1.4 Return Date:{" "}
                    {formateDate(new Date(return01?.filing_datetime!))}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* section 2 start here  */}
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R2.1 Registration Certificate No.
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.tinNumber}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R2.2.1 Name of Dealer
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.tradename}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R2.2.2 Address of Dealer
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.address}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R2.3 Dealer Status
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04
                      .constitutionOfBusiness!.split("_")
                      .join(" ")}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* section 3 start here  */}
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <th className="border border-black px-2 leading-4 text-[0.6rem] w-[50%] font-semibold text-left">
                    R3 Description of top 3 items you deal in (In order of
                    volume of sales for the tax period. 1-highest volume to
                    3-lowest volume)
                  </th>
                </tr>
                <tr className="">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {/* CABLE FILLING COMPUND CABLE FLOODING COMPOUND MINERAL OIL
                    BASE OIL WAXES POLYMERS AND ADDITIVES SPECIALITY COMPOUND
                    ORANIC TITANATESORGANIC ENANELS */}
                    {return01.dvat04.descriptionOne
                      ? `${return01.dvat04.descriptionOne},`
                      : ""}
                    {return01.dvat04.descriptionTwo
                      ? `${return01.dvat04.descriptionTwo},`
                      : ""}
                    {return01.dvat04.descriptionThree
                      ? `${return01.dvat04.descriptionThree}.`
                      : ""}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* section 4 start here */}
            <TurnOver
              returnsentrys={returns_entryData ?? []}
              lastMonthCash={lastmonthcash}
            />
            {/* section 5 start here */}
            <R1TurnOverOfPurchase
              returnsentrys={returns_entryData ?? []}
              lastMonthDue={lastmonthdue}
            />
            {/* section 6 start here */}
            <NetTax
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
              challan_amount={paidChallans.reduce(
                (acc, entry) => acc + parseFloat(entry.total_tax_amount ?? "0"),
                0,
              )}
            />
            {/* section 7 start here */}
            <THEBALANCE1
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
            />

            {/* section 8 start here */}
            <THEBALANCE2
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
            />

            {/* section 9 start here */}

            <InterStateTrade returnsentrys={returns_entryData ?? []} />
            {/* page 1 end here */}

            {/* page 2 start here */}
            {/* section 10 start here */}
            <S1_1Adjustment
              returnsentrys={returns_entryData ?? []}
              lastMonthCash={lastmonthcash}
            />
            <S2AdjustmentOfTax
              returnsentrys={returns_entryData ?? []}
              lastMonthDue={lastmonthdue}
            />
            {/* page 2 end here */}

            {/* page 3 start from here */}
            <CentralSales
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
              challan_amount={paidChallans.reduce(
                (acc, entry) => acc + parseFloat(entry.total_tax_amount ?? "0"),
                0,
              )}
            />

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
                    Bank Name
                  </th>
                  <th className="border border-black px-2 leading-4 text-[0.6rem] w-[20%] text-left">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {(paidChallans.length > 0 ? paidChallans : []).map(
                  (challan, index) => (
                    <tr className="w-full" key={challan.id ?? index}>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {challan.paymentmode ?? "-"}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {challan.track_id ??
                          challan.order_id ??
                          challan.cpin ??
                          "-"}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {formatDateTime(
                          getPrismaDatabaseDate(
                            new Date(
                              challan.transaction_date ?? challan.createdAt,
                            ),
                          ),
                        )}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {challan.bank_name ?? "-"}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {challan.total_tax_amount}
                      </td>
                    </tr>
                  ),
                )}
                {paidChallans.length === 0 && (
                  <tr className="w-full">
                    <td className="border border-black px-2 leading-4 text-[0.6rem]">
                      {return01?.paymentmode}
                    </td>
                    <td className="border border-black px-2 leading-4 text-[0.6rem]">
                      {return01?.transaction_id}
                    </td>
                    <td className="border border-black px-2 leading-4 text-[0.6rem]">
                      {formatDateTime(
                        getPrismaDatabaseDate(
                          new Date(return01?.transaction_date!),
                        ),
                      )}
                    </td>
                    <td className="border border-black px-2 leading-4 text-[0.6rem]">
                      {return01?.bank_name}
                    </td>
                    <td className="border border-black px-2 leading-4 text-[0.6rem]">
                      {return01?.total_tax_amount}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </main>
          <div className="h-20"></div>
          <div className="p-2 shadow bg-white fixed bottom-0 right-0 flex gap-4 items-center hidden-print">
            {!["USER"].includes(user?.role!) && (
              <>
                <Button
                  type="primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/returns/department-dvat24?returnid=${encryptURLData(
                        return01.id.toString(),
                      )}&tin=${encryptURLData(
                        return01.dvat04.tinNumber
                          ? return01.dvat04.tinNumber.toString()
                          : "",
                      )}`,
                    )
                  }
                >
                  DVAT24
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/returns/department-dvat24a?returnid=${encryptURLData(
                        return01.id.toString(),
                      )}&tin=${encryptURLData(
                        return01.dvat04.tinNumber
                          ? return01.dvat04.tinNumber.toString()
                          : "",
                      )}`,
                    )
                  }
                >
                  DVAT24A
                </Button>
              </>
            )}

            {/* <Button onClick={() => router.back()}>Back</Button> */}
            <Button type="primary" onClick={generatePDF} disabled={isDownload}>
              {isDownload ? "Downloading..." : "Download"}
            </Button>
          </div>
        </section>
      )}
    </>
  );
};
export default Dvat16ReturnPreview;
