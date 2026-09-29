/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import GetReturnByIdWithQuarterly from "@/action/return/getreturnbyidwithquarterly";
import {
  decryptURLData,
  formatDateTime,
  formateDate,
  getPrismaDatabaseDate,
} from "@/utils/methods";

import {
  dvat04,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { challan } from "@prisma/client";
import { CompositionCalculation } from "@/components/dvatreturn/vatcalculation";
import GetReturnChallans from "@/action/return/getreturnchallans";
import { getCurrentUserRole } from "@/lib/auth";
import ServerTime from "@/action/servertime";

const AdminDvat16ReturnPreview = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const returnid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );
  console.log(returnid);

  const [isDownload, setDownload] = useState<boolean>(false);

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [challans, setChallans] = useState<challan[]>([]);
  const [user, setUser] = useState<user | null>();
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");

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

      const userrole = await getCurrentUserRole();
      if (userrole == "USER" || userrole == null || userrole == undefined) {
        return router.back();
      }

      const user_response = await GetUser({
        id: authResponse.data,
      });
      if (user_response.status && user_response.data) {
        setUser(user_response.data);
      }

      // Fetch return data by returnId with quarterly entries
      const returnformsresponse = await GetReturnByIdWithQuarterly({
        returnId: returnid,
      });
      console.log(returnformsresponse);

      if (returnformsresponse.status && returnformsresponse.data) {
        const selectedReturn = returnformsresponse.data.returns_01;
        const mergedEntries = returnformsresponse.data.returns_entry;

        setReturn01(selectedReturn);
        serReturns_entryData(mergedEntries);

        const challans_response = await GetReturnChallans({
          returnId: selectedReturn.id,
        });

        if (challans_response.status && challans_response.data) {
          setChallans(challans_response.data);
        }
      } else {
        toast.error(
          returnformsresponse.message || "Failed to fetch return data",
        );
      }
    };
    init();
  }, [returnid]);

  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = ServerTime().data as Date;
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
  };

  const getTaxPeriod = (): string => {
    if (!return01) return "";
    const year: string = return01.year;
    if (return01?.dvat04.frequencyFilings == "QUARTERLY") {
      switch (return01.month ?? "") {
        case "June":
          return `April (${year}) - June (${year})`;
        case "September":
          return `July (${year}) - September (${year})`;
        case "December":
          return `October (${year}) - December (${year})`;
        case "March":
          return `January (${year}) - March (${year})`;
        default:
          return `April (${year}) - June (${year})`;
      }
    } else {
      return (return01.month ?? "") + " " + year;
    }
  };

  const generatePDF = async (path: string) => {
    setDownload(true);
    try {
      const printUrl = new URL(path, window.location.origin).toString();
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

      // Trigger print once the page is loaded.
      printWindow.onload = () => {
        setTimeout(openPrintDialog, 600);
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

  const showSubmit = (): boolean => {
    if (!return01) return false;
    const compositionCalculation = new CompositionCalculation(
      returns_entryData ?? [],
      challans ?? [],
      return01,
      return01.dvat04.compositionScheme ? true : false,
    );

    return compositionCalculation.total() <= 0;
  };

  return (
    <>
      {return01 && (
        <section className="px-5 relative mainpdf" id="mainpdf">
          <main className="bg-white mt-6 p-4 w-full xl:w-5/6 mx-auto">
            {/* page 1 start here */}

            {/* header 2 start from here */}
            <div className="border border-black py-2 mt-4 w-5/6 mx-auto leading-3">
              <p className="text-center font-semibold text-xs leading-3">
                DEPARTMENT OF VALUE ADDED TAX
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                UT Administration of Dadra & Nagar Haveli and Daman & Diu
              </p>
              <p className="text-center font-semibold text-lg my-2  leading-3">
                Form DVAT 17
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                (See Rule 28 of the Dadra & Nagar Haveli and Daman & Diu, Value
                Added Tax Rules, 2005)
              </p>
              <p className="text-center font-semibold text-xs  leading-3">
                Composition Tax Return Form under the Dadra & Nagar Haveli and
                Daman & Diu Value Added Tax Regulation 2005.
              </p>
            </div>
            {/* section 1 start here */}
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    Tax Period From {getTaxPeriod()}
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    RR No: {return01?.rr_number}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    Return Type: {return01?.return_type}
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    Return Date: {formateDate(new Date(return01?.createdAt!))}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* section 2 start here  */}
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    1. Tin No.
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.tinNumber}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    2.a Full Name
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.tradename}
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    2.b Address
                  </td>
                  <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
                    {return01?.dvat04.address}
                  </td>
                </tr>
              </tbody>
            </table>

            <ReturnTable
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              iscomp={return01.dvat04.compositionScheme ? true : false}
              challans={challans}
            />

            {challans && challans.length > 0 && (
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
                    {challans && challans.length > 0 ? (
                      <>
                        {challans.map((challan, index) => (
                          <tr key={index} className="w-full">
                            <td className="border border-black px-2 leading-4 text-[0.6rem]">
                              {challan.paymentmode || "-"}
                            </td>
                            <td className="border border-black px-2 leading-4 text-[0.6rem]">
                              {challan.track_id || challan.order_id || "-"}
                            </td>
                            <td className="border border-black px-2 leading-4 text-[0.6rem]">
                              {challan.transaction_date
                                ? formatDateTime(
                                    getPrismaDatabaseDate(
                                      new Date(challan.transaction_date),
                                    ),
                                  )
                                : "-"}
                            </td>
                            <td className="border border-black px-2 leading-4 text-[0.6rem]">
                              {challan.bank_name || "-"}
                            </td>
                            <td className="border border-black px-2 leading-4 text-[0.6rem]">
                              {challan.total_tax_amount || "0"}
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr className="w-full">
                        <td
                          colSpan={5}
                          className="border border-black px-2 leading-4 text-[0.6rem] text-center"
                        >
                          No payment details available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </main>
          <div className="h-20"></div>
        </section>
      )}
    </>
  );
};
export default AdminDvat16ReturnPreview;

interface ReturnTableProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
  iscomp: boolean;
  challans: challan[];
}

const ReturnTable = (props: ReturnTableProps) => {
  // const [lateFees, setLateFees] = useState<number>(0);
  // const searchparam = useSearchParams();

  const compositionCalculation = new CompositionCalculation(
    props.returnsentrys,
    props.challans ?? [],
    props.return01,
    props.iscomp,
  );

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            3. Total Sales in the period
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.getInvoicePercentage("1").increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            4. Composition rate of tax
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            1 %
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            5. Output tax
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.getInvoicePercentage("1").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            6. Tax Paid
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.tax_paid().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            7. Tax Deducted at Source
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            8. Balance Payable or Refundable (5-6-7)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.balance_payable().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            9. Add:Interest, penalty or other Govt. dues
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {/* {(getR6_2a() + lateFees).toFixed(2)} */}
            {(
              compositionCalculation.getInterest() +
              compositionCalculation.getPenalty()
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            10. Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.total().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            11. Details of payment of tax
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            -
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            12. Challan No. and Date
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {compositionCalculation.total() == 0
              ? "-"
              : props.return01.challan_number}{" "}
            -
            {compositionCalculation.total() == 0
              ? "-"
              : props.return01.challan_number
                ? formateDate(props.return01.filing_datetime)
                : "-"}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
