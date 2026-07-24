/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import getPdfReturn from "@/action/return/getpdfreturn";
import {
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
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { toast } from "react-toastify";
import CheckPayment from "@/action/return/checkpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetUser from "@/action/user/getuser";
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
import AddPaymentSubmit from "@/action/return/addpaymentsubmit";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const Dvat16ReturnPreview = () => {
  const router = useRouter();

  const { id } = useParams<{ id: string | string[] }>();

  const [isDownload, setDownload] = useState<boolean>(false);

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [quarterlyReturns, setQuarterlyReturns] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } })[]
  >([]);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);
  const [payment, setPayment] = useState<boolean>(false);
  const [paymentSubmitBox, setPaymentSubmitBox] = useState<boolean>(false);
  const searchparam = useSearchParams();
  const [user, setUser] = useState<user | null>();
  const [lateFees, setLateFees] = useState<number>(0);
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

  const getLateFees = (
    year: string,
    month: string,
    rr_number: string,
    isComp: boolean = false,
    filing_date: Date,
  ) => {
    const currentDate = new Date();

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

    let monthIndex = monthNames.indexOf(month);
    let newYear = parseInt(year);

    if (isComp) {
      if (["January", "February", "March"].includes(month)) {
        monthIndex = 3;
      } else if (["April", "May", "June"].includes(month)) {
        monthIndex = 6;
      } else if (["July", "August", "September"].includes(month)) {
        monthIndex = 9;
      } else {
        monthIndex = 0;
        newYear += 1;
      }
    } else {
      if (monthIndex === 11) {
        newYear += 1;
        monthIndex = 0;
      } else {
        monthIndex += 1;
      }
    }

    const idiff_days = getDaysBetweenDates(
      new Date(newYear, monthIndex, 16),
      currentDate,
    );
    // setInterestDiffDays(idiff_days);

    let pdiff_days = 0;

    if (rr_number == null || rr_number == undefined || rr_number == "") {
      pdiff_days = getDaysBetweenDates(
        new Date(newYear, monthIndex, 29),
        currentDate,
      );

      // setPenaltyDiffDays(pdiff_days);
      setLateFees(Math.max(0, Math.min(100 * pdiff_days, 10000)));
    } else {
      pdiff_days = getDaysBetweenDates(
        new Date(newYear, monthIndex, 29),
        filing_date,
      );

      // setPenaltyDiffDays(pdiff_days);
      setLateFees(Math.max(0, Math.min(100 * pdiff_days, 10000)));
    }
  };

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      // setCurrentUserId(authResponse.data);
      const user_response = await GetUser({
        id: authResponse.data,
      });
      if (user_response.status && user_response.data) {
        setUser(user_response.data);
      }
      const year: string = searchparam.get("year") ?? "";
      const month: string = searchparam.get("month") ?? "";

      const returnformsresponse = await getPdfReturn({
        year: year,
        month: month,
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
        let mergedEntries: returns_entry[] = [
          ...returnformsresponse.data.returns_entry,
        ];

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

        let allQuarterlyReturns: (returns_01 & {
          dvat04: dvat04 & { registration: registration[] };
        })[] = [selectedReturn];

        if (isQuarterlyFiling) {
          const effectiveQuarter = getQuarterForMonth(month);
          const quarterMonths = effectiveQuarter
            ? getQuarterMonths(effectiveQuarter).filter(
                (quarterMonth) => quarterMonth !== month,
              )
            : [];

          const quarterResponses = await Promise.all(
            quarterMonths.map((quarterMonth) =>
              getPdfReturn({
                year: getNewYear(year, quarterMonth),
                month: quarterMonth,
              }),
            ),
          );

          quarterResponses.forEach((quarterResponse: any) => {
            if (quarterResponse.status && quarterResponse.data) {
              mergedEntries.push(...quarterResponse.data.returns_entry);
              allQuarterlyReturns.push(quarterResponse.data.returns_01);
            }
          });
        }

        setReturn01(selectedReturn);
        setQuarterlyReturns(allQuarterlyReturns);
        serReturns_entryData(mergedEntries);

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

        // setAllNil(dvat_30 && dvat_30a && dvat_31 && dvat_31a);

        getLateFees(
          selectedReturn.year,
          selectedReturn.month ?? "",
          selectedReturn.rr_number ?? "",
          selectedReturn.dvat04?.frequencyFilings === "QUARTERLY",
          new Date(selectedReturn.filing_datetime),
        );

        const payment_response = await CheckPayment({
          id: selectedReturn.id,
        });
        if (payment_response.status && payment_response.data) {
          setPayment(payment_response.data);
        }
      } else {
        setReturn01(null);
        setQuarterlyReturns([]);
        serReturns_entryData([]);
        // setAllNil(false);
        setPaidChallans([]);
      }

      const currentMonthIndex = monthNames.indexOf(month);

      if (currentMonthIndex === -1) {
      } else {
        // Calculate the last month index and handle wrapping
        const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        // Get the last month's name
        const lastMonth: string = monthNames[lastMonthIndex];

        const lastmonthdata = await getPdfReturn({
          year: month == "January" ? (parseInt(year) - 1).toString() : year,
          month: lastMonth,
        });

        if (lastmonthdata.status && lastmonthdata.data) {
          setLastMonthDue(lastmonthdata.data.returns_01.pending_payment ?? "0");
          setLastMonthCash(lastmonthdata.data.returns_01.cash_payment ?? "0");
        }
      }
    };
    init();
  }, [searchparam]);

  useEffect(() => {
    if (return01 == null) return;

    getLateFees(
      return01.year,
      return01.month ?? "",
      return01.rr_number ?? "",
      return01.dvat04?.frequencyFilings === "QUARTERLY",
      new Date(return01.filing_datetime),
    );
  }, [return01]);

  const getTaxPeriod = (): string => {
    const year: string = searchparam.get("year") ?? "";
    if (return01?.dvat04.frequencyFilings == "QUARTERLY") {
      switch (searchparam.get("month") ?? "") {
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
      return searchparam.get("month") ?? "";
    }
  };

  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = new Date();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
  };

  const onSubmitPayment = async () => {
    if (return01 == null) return toast.error("There is not return from here");

    const lastPayment = await CheckLastPayment({
      id: return01.id,
    });

    if (!lastPayment.status) {
      toast.error(lastPayment.message);
      setPaymentSubmitBox(false);
      return;
    }

    if (lastPayment.data == false) {
      toast.error(lastPayment.message);
      setPaymentSubmitBox(false);
      return;
    }

    const thebalance = new TheBalance(
      returns_entryData ?? [],
      paidChallans,
      return01,
      parseFloat(lastmonthdue),
      parseFloat(lastmonthcash),
      return01.dvat04.frequencyFilings === "QUARTERLY",
    );
    const netTaxCalculation = new NetTaxCalculation(
      returns_entryData ?? [],
      paidChallans,
      return01,
      parseFloat(lastmonthdue),
      parseFloat(lastmonthcash),
      return01.dvat04.frequencyFilings === "QUARTERLY",
    );

    const pending_cash = thebalance.excess_cash_payment();
    const pending_payment = thebalance.balance_carried_forward();

    // const penalty = isNegative(lateFees) ? 0 : lateFees;
    // const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    // const vat = getR6_1();
    const penalty = netTaxCalculation.getPenalty();
    const interest = netTaxCalculation.getInterest();
    const vat = netTaxCalculation.getR6_1();
    // Generate RR number once to use for all returns
    const rrNumber = get_rr_number();

    // For quarterly filing, update all 3 returns; for monthly, update only the selected return
    const returnsToUpdate =
      return01.dvat04?.frequencyFilings === "QUARTERLY"
        ? quarterlyReturns
        : [return01];

    try {
      // Determine the last month of the quarter
      const effectiveQuarter = getQuarterForMonth(return01.month ?? "");
      const quarterlyFilingMonths = return01.dvat04?.frequencyFilings === "QUARTERLY" && effectiveQuarter
        ? getQuarterMonths(effectiveQuarter)
        : [];
      const lastMonthOfQuarter = quarterlyFilingMonths[quarterlyFilingMonths.length - 1];

      for (let i = 0; i < returnsToUpdate.length; i++) {
        const returnToUpdate = returnsToUpdate[i];
        // Check if this return's month is the actual last month of the quarter
        const isLastReturn = return01.dvat04?.frequencyFilings === "QUARTERLY"
          ? returnToUpdate.month === lastMonthOfQuarter
          : true;

        // For quarterly: use 0 values for first two returns, actual values for last return
        // For monthly: always use actual values
        const submitPenalty =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : penalty.toFixed(2);
        const submitInterest =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : interest.toFixed(2);
        const submitVat =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : vat.toFixed(2);
        const submitTotal =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : (vat + interest + penalty).toFixed(2);

        // Only create challan for the last return; for first 2 returns, only update with zero values
        if (isLastReturn || return01.dvat04?.frequencyFilings !== "QUARTERLY") {
          console.log({
            id: returnToUpdate.id ?? 0,
            rr_number: rrNumber,
            pending_payment: pending_payment.toFixed(2),
            pending_cash: pending_cash.toFixed(2),
            penalty: submitPenalty,
            vatamount: submitVat,
            interestamount: submitInterest,
            totaltaxamount: submitTotal,
          });
          const response = await AddPaymentSubmit({
            id: returnToUpdate.id ?? 0,
            rr_number: rrNumber,
            pending_payment: pending_payment.toFixed(2),
            pending_cash: pending_cash.toFixed(2),
            penalty: submitPenalty,
            vatamount: submitVat,
            interestamount: submitInterest,
            totaltaxamount: submitTotal,
          });

          if (!response.status) {
            toast.error(response.message);
            setPaymentSubmitBox(false);
            return;
          }
        }else{
           const response = await AddPaymentSubmit({
            id: returnToUpdate.id,
            rr_number: rrNumber,
            pending_payment: "0",
            pending_cash: "0",
            penalty: "0",
            vatamount: "0",
            interestamount: "0",
            totaltaxamount: "0",
          });

          if (!response.status) {
            toast.error(response.message);
            setPaymentSubmitBox(false);
            return;
          }
        }
      }

      toast.success("Return(s) submitted successfully");
      setPaymentSubmitBox(false);
      router.push(`/dashboard/returns/returns-dashboard`);
    } catch (error) {
      toast.error("Error submitting return(s)");
      setPaymentSubmitBox(false);
    }
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
  // net payable amount start form here
  // const getInvoicePercentage = (value: string): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE &&
  //       val.tax_percent == value,
  //   );

  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].total_invoice_number ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const getSaleOfPercentage = (value: string): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of == SaleOf.WORKS_CONTRACT &&
  //       val.tax_percent == value,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const get4_6 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS),
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const get4_7 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of == SaleOf.PROCESSED_GOODS,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const get4_9 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
  //         val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const get5_1 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const get5_2 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.nature_purchase == NaturePurchase.OTHER_GOODS &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const get5_3 = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
  //         val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
  //       val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const getCreditNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       // val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
  //       (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
  //         val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const getDebitNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       // val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
  //       (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
  //         val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const getGoodsReturnsNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
  //       (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
  //         val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const getSalesDebitNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const getGoodsReturns = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const getSaleCanceled = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.SALE_CANCELLED &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const getSalesCreditNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = (returns_entryData ?? []).filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31 &&
  //       val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
  //       val.sale_of == SaleOf.GOODS_TAXABLE,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const getR6_1 = (): number =>
  //   parseFloat(getInvoicePercentage("0").decrease) +
  //   parseFloat(getInvoicePercentage("1").decrease) +
  //   parseFloat(getInvoicePercentage("2").decrease) +
  //   parseFloat(getInvoicePercentage("3").decrease) +
  //   parseFloat(getInvoicePercentage("4").decrease) +
  //   parseFloat(getInvoicePercentage("5").decrease) +
  //   parseFloat(getInvoicePercentage("6").decrease) +
  //   parseFloat(getInvoicePercentage("12.5").decrease) +
  //   parseFloat(getInvoicePercentage("12.75").decrease) +
  //   parseFloat(getInvoicePercentage("13.5").decrease) +
  //   parseFloat(getInvoicePercentage("15").decrease) +
  //   parseFloat(getInvoicePercentage("20").decrease) +
  //   parseFloat(getSaleOfPercentage("4").decrease) +
  //   parseFloat(getSaleOfPercentage("5").decrease) +
  //   parseFloat(getSaleOfPercentage("12.5").decrease) +
  //   parseFloat(get4_6().decrease) +
  //   parseFloat(get4_7().decrease) -
  //   parseFloat(get4_9().decrease) -
  //   (parseFloat(get5_1().decrease) +
  //     parseFloat(get5_2().decrease) +
  //     (parseFloat(getDebitNote().decrease) -
  //       parseFloat(getCreditNote().decrease) -
  //       parseFloat(getGoodsReturnsNote().decrease) +
  //       parseFloat(lastmonthdue) +
  //       parseFloat(lastmonthcash))) +
  //   (parseFloat(getSalesDebitNote().decrease) -
  //     (parseFloat(getGoodsReturns().decrease) +
  //       parseFloat(getSaleCanceled().decrease) +
  //       parseFloat(lastmonthcash) +
  //       parseFloat(getSalesCreditNote().decrease)));

  // const calculateInterest = (
  //   totalDue: number,
  //   dueDate: Date,
  //   payments: challan[],
  //   annualRate = 15,
  //   asOfDate: Date = new Date(),
  // ): number => {
  //   if (!Number.isFinite(totalDue) || totalDue <= 0) return 0;

  //   const dayMs = 24 * 60 * 60 * 1000;

  //   const normalizeDate = (dateInput: Date | string): Date => {
  //     const date = new Date(dateInput);
  //     return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  //   };

  //   const getDaysDiff = (fromDate: Date, toDate: Date): number => {
  //     const startUtc = Date.UTC(
  //       fromDate.getFullYear(),
  //       fromDate.getMonth(),
  //       fromDate.getDate(),
  //     );
  //     const endUtc = Date.UTC(
  //       toDate.getFullYear(),
  //       toDate.getMonth(),
  //       toDate.getDate(),
  //     );
  //     return Math.max(0, Math.floor((endUtc - startUtc) / dayMs));
  //   };

  //   const sortedPayments = payments
  //     .map((payment) => {
  //       const paymentDateRaw = payment.transaction_date ?? payment.createdAt;
  //       const paymentAmount =
  //         parseFloat(payment.vat ?? "0") +
  //         parseFloat(payment.penalty ?? "0") +
  //         parseFloat(payment.interest ?? "0");

  //       if (
  //         !paymentDateRaw ||
  //         !Number.isFinite(paymentAmount) ||
  //         paymentAmount <= 0
  //       )
  //         return null;
  //       return { amount: paymentAmount, date: normalizeDate(paymentDateRaw) };
  //     })
  //     .filter((p): p is { amount: number; date: Date } => p !== null)
  //     .sort((a, b) => a.date.getTime() - b.date.getTime());

  //   const effectiveAsOfDate = normalizeDate(asOfDate);
  //   let outstanding = totalDue;
  //   let anchorDate = normalizeDate(dueDate);
  //   let interest = 0;

  //   for (let i = 0; i < sortedPayments.length; i++) {
  //     const payment = sortedPayments[i];
  //     if (payment.date > effectiveAsOfDate) {
  //       break;
  //     }

  //     // Payments made on/before due date reduce principal only.
  //     if (payment.date <= anchorDate) {
  //       outstanding = Math.max(0, outstanding - payment.amount);

  //       if (outstanding <= 0) {
  //         break;
  //       }
  //       continue;
  //     }

  //     if (payment.date > anchorDate && outstanding > 0) {
  //       const days = getDaysDiff(anchorDate, payment.date);
  //       const intervalInterest =
  //         (outstanding * annualRate * days) / (100 * 365);
  //       interest += intervalInterest;
  //     }

  //     outstanding = Math.max(0, outstanding - payment.amount);

  //     anchorDate = payment.date;

  //     if (outstanding <= 0) {
  //       break;
  //     }
  //   }

  //   if (outstanding > 0 && effectiveAsOfDate > anchorDate) {
  //     const days = getDaysDiff(anchorDate, effectiveAsOfDate);
  //     const finalInterest = (outstanding * annualRate * days) / (100 * 365);
  //     interest += finalInterest;
  //   }

  //   return interest;
  // };

  // const getInterestDueDate = (): Date => {
  //   if (!return01) return new Date();
  //   const monthNames = [
  //     "January",
  //     "February",
  //     "March",
  //     "April",
  //     "May",
  //     "June",
  //     "July",
  //     "August",
  //     "September",
  //     "October",
  //     "November",
  //     "December",
  //   ];
  //   const month = return01.month ?? "";
  //   const isComp = return01.dvat04?.frequencyFilings === "QUARTERLY";
  //   let monthIndex = monthNames.indexOf(month);
  //   let computedYear = parseInt(return01.year);

  //   if (isComp) {
  //     if (["January", "February", "March"].includes(month)) {
  //       monthIndex = 3;
  //     } else if (["April", "May", "June"].includes(month)) {
  //       monthIndex = 6;
  //     } else if (["July", "August", "September"].includes(month)) {
  //       monthIndex = 9;
  //     } else {
  //       monthIndex = 0;
  //       computedYear += 1;
  //     }
  //   } else {
  //     if (monthIndex === 11) {
  //       computedYear += 1;
  //       monthIndex = 0;
  //     } else {
  //       monthIndex += 1;
  //     }
  //   }
  //   return new Date(computedYear, monthIndex, 15);
  // };

  // const getR6_2a = (): number => {
  //   const totalDue = getR6_1();
  //   const dueDate = getInterestDueDate();
  //   const interest = calculateInterest(totalDue, dueDate, paidChallans, 15);
  //   return isNegative(interest) ? 0 : interest;
  // };

  // const paidvatamount = paidChallans.reduce((total, challan) => {
  //   return total + parseFloat(challan.vat ?? "0");
  // }, 0);

  // const paidinterestamount = paidChallans.reduce((total, challan) => {
  //   return total + parseFloat(challan.interest ?? "0");
  // }, 0);

  // const paidpenaltyamount = paidChallans.reduce((total, challan) => {
  //   return total + parseFloat(challan.penalty ?? "0");
  // }, 0);

  // const getNetPayable = (): number => {
  //   const penalty = isNegative(lateFees) ? 0 : lateFees;
  //   const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
  //   const vat = getR6_1();

  //   const vatBalance = vat - paidvatamount;
  //   const penaltyBalance = penalty - paidpenaltyamount;
  //   const interestBalance = interest - paidinterestamount;

  //   if (vatBalance <= 0) {
  //     return Math.max(0, penaltyBalance) + Math.max(0, interestBalance);
  //   }

  //   const excessPenalty = penaltyBalance < 0 ? Math.abs(penaltyBalance) : 0;
  //   const excessInterest = interestBalance < 0 ? Math.abs(interestBalance) : 0;
  //   const adjustedVatBalance = Math.max(
  //     0,
  //     vatBalance - excessPenalty - excessInterest,
  //   );

  //   return (
  //     adjustedVatBalance +
  //     Math.max(0, penaltyBalance) +
  //     Math.max(0, interestBalance)
  //   );
  // };
  // // net payable amount end here

  // const getPercentageValue = (value: string): PercentageOutput => {
  //   if (!returns_entryData) return { increase: "0", decrease: "0" };

  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = returns_entryData.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31_A &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
  //       val.tax_percent == value,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const getProcessedGoods = (): PercentageOutput => {
  //   if (!returns_entryData) return { increase: "0", decrease: "0" };
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = returns_entryData.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31_A &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.PROCESSED_GOODS,
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };
  // const get10_2_6_2 = (): PercentageOutput => {
  //   if (!returns_entryData) return { increase: "0", decrease: "0" };

  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = returns_entryData.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_31_A &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       (val.sale_of_interstate == SaleOfInterstate.FORMC ||
  //         val.purchase_type == PurchaseType.FORMC_CONCESSION),
  //   );
  //   for (let i = 0; i < output.length; i++) {
  //     increase = (
  //       parseFloat(increase) + parseFloat(output[i].amount ?? "0")
  //     ).toFixed(2);
  //     decrease = (
  //       parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
  //     ).toFixed(2);
  //   }
  //   return {
  //     increase,
  //     decrease,
  //   };
  // };

  // const adjustAmount = (): number => {
  //   const amount = isNegative(getR6_1()) ? Math.abs(getR6_1()) : 0;

  //   const total =
  //     parseFloat(get10_2_6_2().decrease) +
  //     parseFloat(getPercentageValue("0").decrease) +
  //     parseFloat(getPercentageValue("1").decrease) +
  //     parseFloat(getPercentageValue("2").decrease) +
  //     parseFloat(getPercentageValue("4").decrease) +
  //     parseFloat(getPercentageValue("5").decrease) +
  //     parseFloat(getPercentageValue("6").decrease) +
  //     parseFloat(getPercentageValue("12.5").decrease) +
  //     parseFloat(getPercentageValue("12.75").decrease) +
  //     parseFloat(getPercentageValue("13.5").decrease) +
  //     parseFloat(getPercentageValue("15").decrease) +
  //     parseFloat(getPercentageValue("20").decrease) +
  //     parseFloat(getProcessedGoods().decrease);

  //   return Math.min(amount, total);
  // };

  // const otherPayments = paidChallans.reduce((total, challan) => {
  //   return total + parseFloat(challan.others);
  // }, 0);

  // // 4 number
  // const pendingcashone = (): number => {
  //   const penalty = isNegative(lateFees) ? 0 : lateFees;
  //   const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
  //   const vat = getR6_1();

  //   const totalpaid = paidvatamount + paidinterestamount + paidpenaltyamount;

  //   const val = isNegative(interest + vat)
  //     ? penalty - totalpaid
  //     : interest + vat + penalty - totalpaid;

  //   return val;
  // };

  // // 9 number
  // const pendingcashtwo = (): number => {
  //   const total =
  //     parseFloat(get10_2_6_2().decrease) +
  //     parseFloat(getPercentageValue("0").decrease) +
  //     parseFloat(getPercentageValue("1").decrease) +
  //     parseFloat(getPercentageValue("2").decrease) +
  //     parseFloat(getPercentageValue("4").decrease) +
  //     parseFloat(getPercentageValue("5").decrease) +
  //     parseFloat(getPercentageValue("6").decrease) +
  //     parseFloat(getPercentageValue("12.5").decrease) +
  //     parseFloat(getPercentageValue("12.75").decrease) +
  //     parseFloat(getPercentageValue("13.5").decrease) +
  //     parseFloat(getPercentageValue("15").decrease) +
  //     parseFloat(getPercentageValue("20").decrease) +
  //     parseFloat(getProcessedGoods().decrease);

  //   const val = total - adjustAmount() - otherPayments;
  //   return val;
  // };

  // const showSubmitButton = (): boolean => {
  //   if (
  //     (Math.round(pendingcashone()) == 0 || isNegative(pendingcashone())) &&
  //     (Math.round(pendingcashtwo()) == 0 || isNegative(pendingcashtwo()))
  //   ) {
  //     return true;
  //   }
  //   return false;
  // };

  // const pendingpayment = (): number => {
  //   const penalty = isNegative(lateFees) ? 0 : lateFees;
  //   const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
  //   const vat = getR6_1();

  //   const val =
  //     (isNegative(interest + vat) ? interest + vat : 0) + adjustAmount();

  //   return val;
  // };

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
    // const value1 =
    //   thebalance.netpayable() > 0 && thebalance.netpayable() < 1
    //     ? 1
    //     : thebalance.netpayable();
    // const value2 =
    //   thebalance.excessCash() > 0 && thebalance.excessCash() < 1
    //     ? 1
    //     : thebalance.excessCash();
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
      {/* <DevTool control={control} /> */}

      <Modal
        title="Confirmation"
        open={paymentSubmitBox}
        footer={null}
        closeIcon={false}
      >
        <p>Are you sure you want to submit the return?</p>
        <div className="flex  gap-2 mt-2">
          <div className="grow"></div>
          <button
            className="py-1 rounded-md border px-4 text-sm text-gray-600"
            onClick={() => {
              setPaymentSubmitBox(false);
            }}
          >
            Close
          </button>
          <button
            onClick={onSubmitPayment}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          >
            Submit
          </button>
        </div>
      </Modal>
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
            <Button
              type="primary"
              onClick={async (e) => {
                e.preventDefault();

                const year: string = searchparam.get("year") ?? "";
                const month: string = searchparam.get("month") ?? "";

                if (!year || !month) {
                  toast.error("Year and Month are required to generate PDF.");
                  return;
                }
                await generatePDF(
                  `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                    "1",
                  )}/${encryptURLData(
                    return01.dvat04Id.toString(),
                  )}?year=${year}&month=${month}&sidebar=no`,
                );
              }}
              disabled={isDownload}
            >
              {isDownload ? "Downloading..." : "Download"}
            </Button>

            {!payment && (
              <>
                {showSubmitButton() ? (
                  <>
                    <Button
                      type="primary"
                      onClick={() => {
                        setPaymentSubmitBox(true);
                      }}
                    >
                      Submit
                    </Button>
                  </>
                ) : (
                  <Button
                    type="primary"
                    onClick={async () => {
                      const lastPayment = await CheckLastPayment({
                        id: return01.id ?? 0,
                      });
                      if (!lastPayment.status) {
                        toast.error(lastPayment.message);
                        return;
                      }

                      if (lastPayment.data == false) {
                        toast.error(lastPayment.message);
                        return;
                      }
                      router.push(
                        `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                          return01.id.toString(),
                        )}/challan-payment?year=${searchparam.get("year")}&month=${searchparam.get(
                          "month",
                        )}`,
                      );
                    }}
                  >
                    Proceed to Pay
                  </Button>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};
export default Dvat16ReturnPreview;
