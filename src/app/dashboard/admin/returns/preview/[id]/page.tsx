/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import GetReturnByIdWithQuarterly from "@/action/return/getreturnbyidwithquarterly";
import GetReturnByDvatAndMonth from "@/action/return/getreturnbydvatandmonth";
import {
  decryptURLData,
  encryptURLData,
  formatDateTime,
  formateDate,
  getPrismaDatabaseDate,
} from "@/utils/methods";
import {
  challan,
  dvat04,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { toast } from "react-toastify";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

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
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";
import GetReturnChallans from "@/action/return/getreturnchallans";
import { getCurrentUserRole } from "@/lib/auth";
import ServerTime from "@/action/servertime";

const AdminDvat16ReturnPreview = () => {
  const router = useRouter();

  const { id } = useParams<{ id: string | string[] }>();
  const returnid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  const [isDownload, setDownload] = useState<boolean>(false);

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [quarterlyReturns, setQuarterlyReturns] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } })[]
  >([]);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);
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

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();

      const userrole = await getCurrentUserRole();
      if (userrole == "USER" || userrole == null || userrole == undefined) {
        return router.back();
      }

      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }

      const returnResponse = await GetReturnByIdWithQuarterly({
        returnId: returnid,
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

      if (returnResponse.status && returnResponse.data) {
        const selectedReturn = returnResponse.data.returns_01;
        let mergedEntries: returns_entry[] = [
          ...returnResponse.data.returns_entry,
        ];

        const challanResponse = await GetReturnChallans({
          returnId: selectedReturn.id,
        });

        if (challanResponse.status && challanResponse.data) {
          setPaidChallans(challanResponse.data);
        } else {
          setPaidChallans([]);
        }

        const isQuarterlyFiling =
          selectedReturn.dvat04?.frequencyFilings === "QUARTERLY";

        let allQuarterlyReturns: (returns_01 & {
          dvat04: dvat04 & { registration: registration[] };
        })[] = [selectedReturn];

        if (isQuarterlyFiling) {
          const effectiveQuarter = getQuarterForMonth(
            selectedReturn.month ?? "",
          );
          const quarterMonths = effectiveQuarter
            ? getQuarterMonths(effectiveQuarter)
            : [];

          // Fetch all quarterly returns by ID using quarterly months
          const quarterResponses = await Promise.all(
            quarterMonths.map(async (quarterMonth) => {
              // We need to find the return for this month by querying the same DVAT ID
              // Since we're on admin side, we can fetch directly by month and year
              try {
                const response = await GetReturnByIdWithQuarterly({
                  returnId: selectedReturn.id, // We use the same return as base
                });
                return response;
              } catch {
                return null;
              }
            }),
          );

          // For now, use the current return as the primary
          allQuarterlyReturns = [selectedReturn];
          mergedEntries = [...returnResponse.data.returns_entry];
        }

        setReturn01(selectedReturn);
        setQuarterlyReturns(allQuarterlyReturns);
        serReturns_entryData(mergedEntries);

        // Get last month due and cash
        const currentMonthIndex = monthNames.indexOf(
          selectedReturn.month ?? "",
        );
        if (currentMonthIndex !== -1) {
          const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;
          const lastMonth: string = monthNames[lastMonthIndex];

          // Calculate the last month's year
          const lastMonthYear =
            selectedReturn.month === "January"
              ? (parseInt(selectedReturn.year) - 1).toString()
              : selectedReturn.year;

          // Fetch last month's return for the same DVAT
          const lastMonthResponse = await GetReturnByDvatAndMonth({
            dvat04Id: selectedReturn.dvat04Id,
            month: lastMonth,
            year: lastMonthYear,
          });

          if (lastMonthResponse.status && lastMonthResponse.data) {
            setLastMonthDue(
              lastMonthResponse.data.returns_01.pending_payment ?? "0",
            );
            setLastMonthCash(
              lastMonthResponse.data.returns_01.cash_payment ?? "0",
            );
          } else {
            // If no previous month return exists, use zero
            setLastMonthDue("0");
            setLastMonthCash("0");
          }
        }
      } else {
        setReturn01(null);
        setQuarterlyReturns([]);
        serReturns_entryData([]);
        setPaidChallans([]);
      }
    };
    init();
  }, [returnid]);

  const getTaxPeriod = (): string => {
    if (return01?.dvat04.frequencyFilings == "QUARTERLY") {
      switch (return01?.month ?? "") {
        case "June":
          return `April (${return01?.year}) - June (${return01?.year})`;
        case "September":
          return `July (${return01?.year}) - September (${return01?.year})`;
        case "December":
          return `October (${return01?.year}) - December (${return01?.year})`;
        case "March":
          return `January (${return01?.year}) - March (${return01?.year})`;
        default:
          return `April (${return01?.year}) - June (${return01?.year})`;
      }
    } else {
      return return01?.month ?? "";
    }
  };

  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = ServerTime().data as Date;
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
  };

  const generatePDF = async (path: string) => {
    setDownload(true);
    try {
      const printUrlObject = new URL(path, window.location.origin);
      printUrlObject.searchParams.set("sidebar", "no");
      const printUrl = printUrlObject.toString();
      const printWindow = window.open(printUrl, "_blank");

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

      printWindow.onload = () => {
        setTimeout(openPrintDialog, 1500);
      };

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

  const showSubmitButton = (): boolean => {
    if (!return01) return false;

    const thebalance = new TheBalance(
      returns_entryData ?? [],
      paidChallans,
      return01,
      parseFloat(lastmonthdue),
      parseFloat(lastmonthcash),
      return01.dvat04.frequencyFilings === "QUARTERLY",
    );
    const centralSales = new CentralSalesCalculation(
      returns_entryData ?? [],
      paidChallans,
      return01,
      parseFloat(lastmonthdue),
      parseFloat(lastmonthcash),
      return01.dvat04.frequencyFilings === "QUARTERLY",
    );

    const value1 =
      thebalance.posivite() > 0 && thebalance.posivite() < 1
        ? 1
        : thebalance.posivite();
    const value2 =
      centralSales.netpayable() > 0 && centralSales.netpayable() < 1
        ? 1
        : centralSales.netpayable();

    if (value1 + value2 <= 0) {
      return true;
    }
    return false;
  };

  return (
    <>
      {return01 && (
        <section className="px-5 relative mainpdf" id="mainpdf">
          <main className="bg-white mt-6 p-4 w-full xl:w-5/6 mx-auto">
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
                UT Administration of Dadra & Nagar Haveli and Daman & Diu
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                Form DVAT 16
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                (See Rule 28 and 29 of the Dadra & Nagar Haveli and Daman & Diu,
                Value Added Tax Rules, 2005)
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                Dadra & Nagar Haveli and Daman & Diu Value Added Tax Return
              </p>
            </div>
            {/* section 1 start here */}
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    R1.1 Tax Period From {getTaxPeriod()}
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
              isComp={return01.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
              challan_amount={paidChallans.reduce(
                (acc, entry) => acc + parseFloat(entry.total_tax_amount ?? "0"),
                0,
              )}
              lastMonthCash={lastmonthcash}
            />
            {/* section 7 start here */}
            <THEBALANCE1
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
            />

            {/* section 8 start here */}
            <THEBALANCE2
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              lastMonthCash={lastmonthcash}
              isComp={return01.dvat04.frequencyFilings === "QUARTERLY"}
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
              isComp={return01.dvat04.frequencyFilings === "QUARTERLY"}
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
            {paidChallans.length > 0 && (
              <>
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
                    {paidChallans.map((entry: challan) => (
                      <tr className="w-full" key={entry.id}>
                        <td className="border border-black px-2 leading-4 text-[0.6rem]">
                          {entry.paymentmode ?? "-"}
                        </td>
                        <td className="border border-black px-2 leading-4 text-[0.6rem]">
                          {entry.track_id ??
                            entry.order_id ??
                            entry.cpin ??
                            "-"}
                        </td>
                        <td className="border border-black px-2 leading-4 text-[0.6rem]">
                          {entry.transaction_date
                            ? formatDateTime(
                                getPrismaDatabaseDate(
                                  new Date(entry.transaction_date),
                                ),
                              )
                            : "-"}
                        </td>
                        <td className="border border-black px-2 leading-4 text-[0.6rem]">
                          {entry.bank_name ?? "-"}
                        </td>
                        <td className="border border-black px-2 leading-4 text-[0.6rem]">
                          {entry.total_tax_amount ?? "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </main>
          <div className="h-20"></div>
          <div className="p-2 shadow bg-white fixed bottom-0 right-0 flex gap-4 items-center hidden-print">
            <Button onClick={() => router.back()}>Back</Button>

            <Button
              type="primary"
              onClick={async (e) => {
                e.preventDefault();

                if (!return01) {
                  toast.error("Return data not found.");
                  return;
                }

                await generatePDF(
                  `/dashboard/admin/returns/preview/${encryptURLData(
                    return01.id.toString(),
                  )}?sidebar=no`,
                );
              }}
              disabled={isDownload}
            >
              {isDownload ? "Downloading..." : "Download"}
            </Button>
          </div>
        </section>
      )}
    </>
  );
};
export default AdminDvat16ReturnPreview;
