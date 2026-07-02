/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button, Radio } from "antd";
import { ToWords } from "to-words";
import {
  capitalcase,
  formateDate,
  getDaysBetweenDates,
  isNegative,
} from "@/utils/methods";

import {
  CategoryOfEntry,
  challan,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  SaleOfInterstate,
  user,
} from "@prisma/client";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import {
  SubmitPaymentFormCopy,
  SubmitPaymentSchemaCopy,
} from "@/schema/subtmitpayment";
import AddPayment from "@/action/return/addpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetReturn01 from "@/action/return/getreturn";
import getReturnEntry from "@/action/return/getreturnentry";
import GetUser from "@/action/user/getuser";
import { CheckboxGroupProps } from "antd/es/checkbox";
import getPdfReturn from "@/action/return/getpdfreturn";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import AddPaymentOnline from "@/action/return/addpaymentonline";
import GetPaidChallanByReturnId from "@/action/challan/getpaidchallanbyreturnid";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

type DvatChallanPaymentProps = {
  returnid: string;
};

export const DvatChallanPayment = (props: DvatChallanPaymentProps) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [lateFees, setLateFees] = useState<number>(0);
  // const [PenaltyDiffDays, setPenaltyDiffDays] = useState<number>(0);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    [],
  );
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");
  const [lastmonthcash, setLastMonthCash] = useState<string>("0");
  const searchparam = useSearchParams();
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);

  const [user, setUser] = useState<user | null>(null);

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

  const paidvatamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.vat ?? "0");
  }, 0);

  const paidinterestamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.interest ?? "0");
  }, 0);

  const paidpenaltyamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.penalty ?? "0");
  }, 0);

  useEffect(() => {
    const init = async () => {
      const challan_response = await GetPaidChallanByReturnId({
        returnid: parseInt(props.returnid),
      });
      if (challan_response.status && challan_response.data) {
        setPaidChallans(challan_response.data);
      }

      const returns_response = await GetReturn01({
        id: parseInt(props.returnid),
      });

      if (returns_response.status && returns_response.data) {
        setReturn01(returns_response.data);

        const user_response = await GetUser({
          id: returns_response.data.dvat04.createdById,
        });
        if (user_response.status && user_response.data) {
          setUser(user_response.data);
        }

        const entry_response = await getReturnEntry({
          returnid: returns_response.data.id,
        });

        if (entry_response.status && entry_response.data) {
          let mergedEntries: returns_entry[] = [...entry_response.data];

          const isQuarterlyFiling =
            returns_response.data.dvat04?.frequencyFilings === "QUARTERLY";

          if (isQuarterlyFiling) {
            const createdById = returns_response.data.dvat04.createdById;
            const selectedYear =
              searchparam.get("year") ?? returns_response.data.year;
            const selectedMonth =
              searchparam.get("month") ?? returns_response.data.month ?? "";

            const effectiveQuarter = getQuarterForMonth(selectedMonth);
            const quarterMonths = effectiveQuarter
              ? getQuarterMonths(effectiveQuarter).filter(
                  (month) => month !== selectedMonth,
                )
              : [];

            const quarterResponses = await Promise.all(
              quarterMonths.map((month) =>
                getPdfReturn({
                  year: getNewYear(selectedYear, month),
                  month,
                }),
              ),
            );

            quarterResponses.forEach((quarterResponse: any) => {
              if (quarterResponse.status && quarterResponse.data) {
                mergedEntries.push(...quarterResponse.data.returns_entry);
              }
            });

            mergedEntries = Array.from(
              new Map(mergedEntries.map((entry) => [entry.id, entry])).values(),
            );
          }

          serReturns_entryData(mergedEntries);
        }

        getLateFees(
          returns_response.data.year,
          returns_response.data.month!,
          returns_response.data.rr_number,
          new Date(returns_response.data.filing_datetime),
          returns_response.data.dvat04?.frequencyFilings === "QUARTERLY",
        );
      }
    };
    init();
  }, []);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }

      const year: string = searchparam.get("year") ?? "";
      const month: string = searchparam.get("month") ?? "";

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

  const getLateFees = (
    year: string,
    month: string,
    rr_number: string,
    filing_date: Date,
    isComp: boolean = false,
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

    // Get the month index from the month name
    let monthIndex = monthNames.indexOf(month);
    let newYear = parseInt(year);

    if (isComp) {
      // Composition scheme: map to next quarter's first month
      if (["January", "February", "March"].includes(month)) {
        monthIndex = 3; // April
      } else if (["April", "May", "June"].includes(month)) {
        monthIndex = 6; // July
      } else if (["July", "August", "September"].includes(month)) {
        monthIndex = 9; // October
      } else {
        monthIndex = 0; // January
        newYear += 1;
      }
    } else {
      // Check if it's December (index 11) and increment year if needed
      if (monthIndex === 11) {
        newYear += 1;
        monthIndex = 0; // Set month to January
      } else {
        monthIndex += 1; // Otherwise, just increment the month
      }
    }

    let pdiff_days = 0;

    if (rr_number == null || rr_number == undefined || rr_number == "") {
      pdiff_days = getDaysBetweenDates(
        new Date(newYear, monthIndex, 29),
        currentDate,
      );

      setLateFees(Math.max(0, Math.min(100 * pdiff_days, 10000)));
    } else {
      pdiff_days = getDaysBetweenDates(
        new Date(newYear, monthIndex, 29),
        filing_date,
      );

      setLateFees(Math.max(0, Math.min(100 * pdiff_days, 10000)));
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

  const [isOnlineProcessing, setIsOnlineProcessing] = useState(false);
  const [isFileReturnProcessing, setIsFileReturnProcessing] = useState(false);

  const onFileReturn = async () => {
    if (return01 == null) return toast.error("No return exist");

    setIsFileReturnProcessing(true);
    try {
      const lastPayment = await CheckLastPayment({ id: return01.id ?? 0 });
      if (!lastPayment.status) {
        toast.error(lastPayment.message);
        return;
      }
      if (lastPayment.data == false) {
        toast.error(lastPayment.message);
        return;
      }

      const paymentBreakdown = getNetPayableBreakdown();

      const response = await AddPayment({
        id: return01.id,
        bank_name: "NIL",
        track_id: "NIL",
        transaction_id: "NIL",
        rr_number: get_rr_number(),
        pending_payment: Math.abs(pendingpayment()).toFixed(2),
        pending_cash: (
          Math.abs(pendingcashone()) + Math.abs(pendingcashtwo())
        ).toFixed(2),
        penalty: paymentBreakdown.penalty.toFixed(0),
        interestamount: paymentBreakdown.interestamount.toFixed(0),
        totaltaxamount: paymentBreakdown.totaltaxamount.toFixed(0),
        vatamount: paymentBreakdown.vatamount.toFixed(0),

        challan_vat: remaingVat.toFixed(0),
        challan_interest: remainingInterest.toFixed(0),
        challan_penalty: remainingPenalty.toFixed(0),
        challan_total_tax_amount: (
          remaingVat +
          remainingInterest +
          remainingPenalty
        ).toFixed(0),
      });

      if (!response.status) return toast.error(response.message);
      toast.success(response.message);
      router.push("/dashboard/returns/returns-dashboard");
    } finally {
      setIsFileReturnProcessing(false);
    }
  };

  const onOnlinePayment = async () => {
    if (return01 == null) return toast.error("No return exist");

    setIsOnlineProcessing(true);
    try {
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

      const paymentBreakdown = getNetPayableBreakdown();

      const response = await AddPaymentOnline({
        id: return01.id,
        // rr_number: get_rr_number(),
        penalty: paymentBreakdown.penalty.toFixed(0),
        pending_payment: Math.abs(pendingpayment()).toFixed(2),
        pending_cash: (
          Math.abs(pendingcashone()) + Math.abs(pendingcashtwo())
        ).toFixed(2),
        interestamount: paymentBreakdown.interestamount.toFixed(0),
        totaltaxamount: paymentBreakdown.totaltaxamount.toFixed(0),
        vatamount: paymentBreakdown.vatamount.toFixed(0),

        challan_vat: remaingVat.toFixed(0),
        challan_interest: remainingInterest.toFixed(0),
        challan_penalty: remainingPenalty.toFixed(0),
        challan_total_tax_amount: (
          remaingVat +
          remainingInterest +
          remainingPenalty
        ).toFixed(0),
      });

      if (!response.status) {
        toast.error(response.message);
        return;
      }
      if (!response.data?.order_id) {
        toast.error("Unable to initialize payment session.");
        return;
      }

      router.push(
        `/payamount?pi=${encodeURIComponent(response.data.order_id)}`,
      );
    } finally {
      setIsOnlineProcessing(false);
    }
  };

  // extra calcuation
  const getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].total_invoice_number ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS),
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.PROCESSED_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_1 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const getCreditNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        // val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        // val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
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
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const calculateInterest = (
    totalDue: number,
    dueDate: Date,
    payments: challan[],
    annualRate = 15,
    asOfDate: Date = new Date(),
  ): number => {
    if (!Number.isFinite(totalDue) || totalDue <= 0) return 0;

    const dayMs = 24 * 60 * 60 * 1000;

    const normalizeDate = (dateInput: Date | string): Date => {
      const date = new Date(dateInput);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const getDaysDiff = (fromDate: Date, toDate: Date): number => {
      const startUtc = Date.UTC(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate(),
      );
      const endUtc = Date.UTC(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
      );
      const diff = Math.floor((endUtc - startUtc) / dayMs);
      return Math.max(0, diff);
    };

    const sortedPayments = payments
      .map((payment) => {
        const paymentDateRaw = payment.transaction_date ?? payment.createdAt;
        const paymentAmount =
          parseFloat(payment.vat ?? "0") +
          parseFloat(payment.penalty ?? "0") +
          parseFloat(payment.interest ?? "0");

        if (
          !paymentDateRaw ||
          !Number.isFinite(paymentAmount) ||
          paymentAmount <= 0
        ) {
          return null;
        }

        return {
          amount: paymentAmount,
          date: normalizeDate(paymentDateRaw),
        };
      })
      .filter(
        (payment): payment is { amount: number; date: Date } =>
          payment !== null,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const effectiveAsOfDate = normalizeDate(asOfDate);
    let outstanding = totalDue;
    let anchorDate = normalizeDate(dueDate);
    let interest = 0;

    for (let i = 0; i < sortedPayments.length; i++) {
      const payment = sortedPayments[i];
      if (payment.date > effectiveAsOfDate) {
        break;
      }

      // Payments on/before due date reduce principal only.
      // Anchor date must stay at due date so interest starts from due date.
      if (payment.date <= anchorDate) {
        outstanding = Math.max(0, outstanding - payment.amount);

        if (outstanding <= 0) {
          break;
        }
        continue;
      }

      if (payment.date > anchorDate && outstanding > 0) {
        const days = getDaysDiff(anchorDate, payment.date);
        const intervalInterest =
          (outstanding * annualRate * days) / (100 * 365);
        interest += intervalInterest;
      }

      outstanding = Math.max(0, outstanding - payment.amount);

      anchorDate = payment.date;

      if (outstanding <= 0) {
        break;
      }
    }

    if (outstanding > 0 && effectiveAsOfDate > anchorDate) {
      const days = getDaysDiff(anchorDate, effectiveAsOfDate);
      const finalInterest = (outstanding * annualRate * days) / (100 * 365);
      interest += finalInterest;
    }

    return interest;
  };

  const getInterestDueDate = (
    year: string,
    month: string,
    isComp: boolean = false,
  ): Date => {
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
    let computedYear = parseInt(year);

    if (isComp) {
      if (["January", "February", "March"].includes(month)) {
        monthIndex = 3;
      } else if (["April", "May", "June"].includes(month)) {
        monthIndex = 6;
      } else if (["July", "August", "September"].includes(month)) {
        monthIndex = 9;
      } else {
        monthIndex = 0;
        computedYear += 1;
      }
    } else {
      if (monthIndex === 11) {
        computedYear += 1;
        monthIndex = 0;
      } else {
        monthIndex += 1;
      }
    }

    return new Date(computedYear, monthIndex, 15);
  };

  const getVatAmountcomp = (): number => {
    return parseFloat(getInvoicePercentage("1").decrease) - paidvatamount;
  };

  const getR6_2acomp = (): number => {
    if (!return01?.month) return 0;

    const dueDate = getInterestDueDate(
      return01.year,
      return01.month,
      return01.dvat04?.frequencyFilings === "QUARTERLY",
    );

    return calculateInterest(
      parseFloat(getInvoicePercentage("1").decrease),
      dueDate,
      paidChallans,
      15,
    );
  };

  const getR6_1 = (): number =>
    parseFloat(getInvoicePercentage("0").decrease) +
    parseFloat(getInvoicePercentage("1").decrease) +
    parseFloat(getInvoicePercentage("2").decrease) +
    parseFloat(getInvoicePercentage("3").decrease) +
    parseFloat(getInvoicePercentage("4").decrease) +
    parseFloat(getInvoicePercentage("5").decrease) +
    parseFloat(getInvoicePercentage("6").decrease) +
    parseFloat(getInvoicePercentage("12.5").decrease) +
    parseFloat(getInvoicePercentage("12.75").decrease) +
    parseFloat(getInvoicePercentage("13.5").decrease) +
    parseFloat(getInvoicePercentage("15").decrease) +
    parseFloat(getInvoicePercentage("20").decrease) +
    parseFloat(getSaleOfPercentage("4").decrease) +
    parseFloat(getSaleOfPercentage("5").decrease) +
    parseFloat(getSaleOfPercentage("12.5").decrease) +
    parseFloat(get4_6().decrease) +
    parseFloat(get4_7().decrease) -
    parseFloat(get4_9().decrease) -
    (parseFloat(get5_1().decrease) +
      parseFloat(get5_2().decrease) +
      (parseFloat(getDebitNote().decrease) -
        parseFloat(getCreditNote().decrease) -
        parseFloat(getGoodsReturnsNote().decrease) +
        parseFloat(lastmonthdue) +
        parseFloat(lastmonthcash)));

  const getR6_2a = (): number => {
    if (!return01?.month) return 0;

    const dueDate = getInterestDueDate(
      return01.year,
      return01.month,
      return01.dvat04?.frequencyFilings === "QUARTERLY",
    );

    const interest = calculateInterest(getR6_1(), dueDate, paidChallans, 15);
    return isNegative(interest) ? 0 : interest;
  };

  const getAdjustedBalances = () => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    const vatBalance = vat - paidvatamount;
    const penaltyBalance = penalty - paidpenaltyamount;
    const interestBalance = interest - paidinterestamount;

    if (vatBalance <= 0) {
      return {
        vat,
        penalty,
        interest,
        vatBalance: 0,
        penaltyBalance: Math.max(0, penaltyBalance),
        interestBalance: Math.max(0, interestBalance),
      };
    }

    const excessPenalty = penaltyBalance < 0 ? Math.abs(penaltyBalance) : 0;
    const excessInterest = interestBalance < 0 ? Math.abs(interestBalance) : 0;
    const adjustedVatBalance = Math.max(
      0,
      vatBalance - excessPenalty - excessInterest,
    );

    return {
      vat,
      penalty,
      interest,
      vatBalance: adjustedVatBalance,
      penaltyBalance: Math.max(0, penaltyBalance),
      interestBalance: Math.max(0, interestBalance),
    };
  };

  const getNetPayable = (): number => {
    const adjustedBalances = getAdjustedBalances();

    return (
      adjustedBalances.vatBalance +
      adjustedBalances.penaltyBalance +
      adjustedBalances.interestBalance
    );
  };

  const getNetPayableBreakdown = () => {
    const adjustedBalances = getAdjustedBalances();

    const vatBalanceRaw = adjustedBalances.vat - paidvatamount;
    const penaltyBalanceRaw = adjustedBalances.penalty - paidpenaltyamount;
    const interestBalanceRaw = adjustedBalances.interest - paidinterestamount;

    const pendingPaymentRaw =
      (vatBalanceRaw < 0 ? vatBalanceRaw : 0) +
      (penaltyBalanceRaw < 0 ? penaltyBalanceRaw : 0) +
      (interestBalanceRaw < 0 ? interestBalanceRaw : 0);
    const pendingPayment =
      pendingPaymentRaw < 0 ? Math.abs(pendingPaymentRaw) : 0;

    return {
      vatamount: adjustedBalances.vat,
      penalty: Math.max(0, adjustedBalances.penalty),
      interestamount: Math.max(0, adjustedBalances.interest),
      totaltaxamount:
        adjustedBalances.vatBalance +
        adjustedBalances.penaltyBalance +
        adjustedBalances.interestBalance,
      pendingPayment,
    };
  };

  const getTotalTaxAmount = (): number => {
    const pendingcasetwo = isNegative(pendingcashtwo()) ? 0 : pendingcashtwo();
    return Math.max(0, getNetPayable() + pendingcasetwo);
  };

  const adjustedBalances = getAdjustedBalances();
  const remaingVat = adjustedBalances.vatBalance;
  const remainingPenalty = adjustedBalances.penaltyBalance;
  const remainingInterest = adjustedBalances.interestBalance;

  const adjustAmount = (): number => {
    const amount = isNegative(getR6_1()) ? Math.abs(getR6_1()) : 0;

    const total =
      parseFloat(get10_2_6_2().decrease) +
      parseFloat(getPercentageValue("0").decrease) +
      parseFloat(getPercentageValue("1").decrease) +
      parseFloat(getPercentageValue("2").decrease) +
      parseFloat(getPercentageValue("4").decrease) +
      parseFloat(getPercentageValue("5").decrease) +
      parseFloat(getPercentageValue("6").decrease) +
      parseFloat(getPercentageValue("12.5").decrease) +
      parseFloat(getPercentageValue("12.75").decrease) +
      parseFloat(getPercentageValue("13.5").decrease) +
      parseFloat(getPercentageValue("15").decrease) +
      parseFloat(getPercentageValue("20").decrease) +
      parseFloat(getProcessedGoods().decrease);

    return Math.min(amount, total);
  };

  const otherPayments = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.others);
  }, 0);

  // 4 number
  const pendingcashone = (): number => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    const totalpaid = paidvatamount + paidinterestamount + paidpenaltyamount;

    const val = isNegative(interest + vat)
      ? penalty - totalpaid
      : interest + vat + penalty - totalpaid;

    return val;
  };

  const getPercentageValue = (value: string): PercentageOutput => {
    if (!returns_entryData) return { increase: "0", decrease: "0" };

    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const getProcessedGoods = (): PercentageOutput => {
    if (!returns_entryData) return { increase: "0", decrease: "0" };
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.PROCESSED_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get10_2_6_2 = (): PercentageOutput => {
    if (!returns_entryData) return { increase: "0", decrease: "0" };

    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION),
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  // 9 number
  const pendingcashtwo = (): number => {
    const total =
      parseFloat(get10_2_6_2().decrease) +
      parseFloat(getPercentageValue("0").decrease) +
      parseFloat(getPercentageValue("1").decrease) +
      parseFloat(getPercentageValue("2").decrease) +
      parseFloat(getPercentageValue("4").decrease) +
      parseFloat(getPercentageValue("5").decrease) +
      parseFloat(getPercentageValue("6").decrease) +
      parseFloat(getPercentageValue("12.5").decrease) +
      parseFloat(getPercentageValue("12.75").decrease) +
      parseFloat(getPercentageValue("13.5").decrease) +
      parseFloat(getPercentageValue("15").decrease) +
      parseFloat(getPercentageValue("20").decrease) +
      parseFloat(getProcessedGoods().decrease);

    const val = total - adjustAmount() - otherPayments;
    return val;
  };

  const pendingpayment = (): number => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    const val =
      (isNegative(interest + vat) ? interest + vat : 0) + adjustAmount();

    return val;
  };

  return (
    <>
      <main className="mainpdf" id="mainpdf">
        <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
          Details Of Taxpayer
        </div>
        <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
          <div>
            <p className="text-sm">Name</p>
            <p className="text-sm  font-medium">
              {return01?.dvat04?.tradename}
              {/* {user?.firstName} - {user?.lastName} */}
            </p>
          </div>
          <div>
            <p className="text-sm">Email</p>
            <p className="text-sm  font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm">Mobile</p>
            <p className="text-sm  font-medium">{user?.mobileOne}</p>
          </div>
          <div>
            <p className="text-sm">User TIN Number</p>
            <p className="text-sm  font-medium">
              {return01?.dvat04?.tinNumber}
            </p>
          </div>
          <div>
            <p className="text-sm">Address</p>
            <p className="text-sm  font-medium">{user?.address}</p>
          </div>
        </div>

        <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
          Reason for challan
        </div>
        <div className="p-1 bg-gray-50 grid grid-cols-4  gap-2  px-4">
          <div>
            <p className="text-sm">Reason for challan</p>
            <p className="text-sm font-medium">VATPAYMENT</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment on account of
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Tax (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">VAT</TableCell>
                <TableCell className="text-center p-2 border ">
                  {return01?.dvat04?.compositionScheme
                    ? getVatAmountcomp().toFixed(0)
                    : Math.ceil(remaingVat)}
                  {/* {getVatAmount().toFixed(0)}- {getVatAmountcomp().toFixed(0)}-{" "}
                  {return01?.dvat04?.compositionScheme?"1":"0"} */}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Interest</TableCell>
                <TableCell className="text-center p-2 border">
                  {return01?.dvat04.compositionScheme
                    ? getR6_2acomp().toFixed(0)
                    : remainingInterest.toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Late Penalty
                </TableCell>
                <TableCell className="text-center p-2 border">
                  {remainingPenalty.toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">CST</TableCell>
                <TableCell className="text-center p-2 border">
                  {isNegative(pendingcashtwo())
                    ? 0
                    : pendingcashtwo().toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total Challan Amount:
                </TableCell>
                <TableCell className="text-center p-2 border">
                  {getTotalTaxAmount().toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total amount paid (in words): Rupees
                </TableCell>
                <TableCell className="text-left p-2 border">
                  {capitalcase(
                    toWords.convert(parseFloat(getTotalTaxAmount().toFixed(0))),
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="w-96">
            {!(
              return01?.rr_number == null ||
              return01?.rr_number == undefined ||
              return01?.rr_number == ""
            ) ? (
              <>
                <div className="p-2 flex flex-col gap-2 border bg-gray-100 mt-2">
                  <div>
                    <p className="text-sm">Bank Name</p>
                    <p className="text-sm  font-medium">
                      {return01?.bank_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Track Id</p>
                    <p className="text-sm  font-medium">{return01?.track_id}</p>
                  </div>
                  <div>
                    <p className="text-sm">Transaction Id</p>
                    <p className="text-sm  font-medium">
                      {return01?.transaction_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Transaction Date</p>
                    <p className="text-sm  font-medium">
                      {formateDate(new Date(return01?.transaction_date!))}
                    </p>
                  </div>
                </div>
                <div className="mt-2"></div>
                <Button
                  onClick={() => {
                    router.push("/dashboard/returns/returns-dashboard");
                  }}
                  type="primary"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold">Payment Mode</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose online payment or submit offline payment details.
                  </p>

                  {/* <Radio.Group
                    block
                    options={options}
                    defaultValue="ONLINE"
                    optionType="button"
                    buttonStyle="solid"
                    className="mt-2"
                    onChange={(e) => {
                      setPaymentMode(e.target.value);
                      reset({
                        bank_name: "",
                        transaction_id: "",
                        track_id: "",
                      });
                    }}
                  /> */}

                  {/* {paymentMode == "ONLINE" ? ( */}
                  <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">
                      Online Payment
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      You will be redirected to the payment gateway. No bank,
                      transaction, or track details are required here.
                    </p>

                    <div className="mt-3 flex items-center justify-between rounded-md bg-white p-2 border border-blue-100">
                      <span className="text-sm text-gray-600">
                        Payable Amount
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {getTotalTaxAmount().toFixed(0)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3 justify-end">
                      {Math.round(getTotalTaxAmount()) == 0 ? (
                        <Button
                          type="primary"
                          disabled={isFileReturnProcessing}
                          onClick={onFileReturn}
                        >
                          {isFileReturnProcessing ? "Filing..." : "File Return"}
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          disabled={isOnlineProcessing}
                          onClick={onOnlinePayment}
                        >
                          {isOnlineProcessing ? "Redirecting..." : "Pay Online"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* ) : (
                    <form
                      className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"
                      onSubmit={handleSubmit(onSubmit, onFormError)}
                    >
                      <p className="text-sm font-medium text-amber-900">
                        Offline Payment Details
                      </p>
                      <p className="text-xs text-amber-800 mt-1">
                        Fill in bank and transaction details, then submit.
                      </p>

                      <div className="mt-3">
                        <p>Bank Name</p>
                        <input
                          className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                            errors.bank_name
                              ? "border-red-500"
                              : "hover:border-blue-500"
                          }`}
                          placeholder="Bank Name"
                          {...register("bank_name")}
                          type="text"
                        />
                        {errors.bank_name && (
                          <p className="text-xs text-red-500">
                            {errors.bank_name.message?.toString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-2">
                        <p>Transaction Id</p>
                        <input
                          className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500 ${
                            errors.transaction_id
                              ? "border-red-500"
                              : "hover:border-blue-500"
                          }`}
                          placeholder="Transaction id"
                          {...register("transaction_id")}
                        />
                        {errors.transaction_id && (
                          <p className="text-xs text-red-500">
                            {errors.transaction_id.message?.toString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-2">
                        <p>Track Id</p>
                        <input
                          className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                            errors.track_id
                              ? "border-red-500"
                              : "hover:border-blue-500"
                          }`}
                          placeholder="Track Id"
                          {...register("track_id")}
                        />
                        {errors.track_id && (
                          <p className="text-xs text-red-500">
                            {errors.track_id.message?.toString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <div className="grow"></div>

                        <Button
                          disabled={isSubmitting}
                          onClick={(e) => {
                            e.preventDefault();
                            reset({
                              bank_name: "",
                              transaction_id: "",
                              track_id: "",
                            });
                          }}
                        >
                          Reset
                        </Button>

                        <Button
                          disabled={isSubmitting}
                          onClick={async (e) => {
                            e.preventDefault();
                            await generatePDF(
                              `/dashboard/returns/returns-dashboard/preview/${props.returnid.toString()}/download-challan?sidebar=no`,
                            );
                          }}
                        >
                          Download Challan
                        </Button>

                        <input
                          type="submit"
                          disabled={isSubmitting}
                          value={isSubmitting ? "Processing..." : "Pay Challan"}
                          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
                        />
                      </div>
                    </form>
                  )} */}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};
