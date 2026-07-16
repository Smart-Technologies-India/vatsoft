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
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "antd";
import { ToWords } from "to-words";
import { capitalcase, formateDate, isNegative } from "@/utils/methods";

import {
  challan,
  dvat04,
  Quarter,
  returns_01,
  returns_entry,
  user,
} from "@prisma/client";

import AddPayment from "@/action/return/addpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetReturn01 from "@/action/return/getreturn";
import getReturnEntry from "@/action/return/getreturnentry";
import GetUser from "@/action/user/getuser";
import getPdfReturn from "@/action/return/getpdfreturn";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import AddPaymentOnline from "@/action/return/addpaymentonline";
import {
  CentralSalesCalculation,
  CompositionCalculation,
  NetTaxCalculation,
} from "@/components/dvatreturn/vatcalculation";
import GetReturnChallans from "@/action/return/getreturnchallans";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

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

const DownloadChallan = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 }) | null
  >();

  const [quarterlyReturns, setQuarterlyReturns] = useState<
    (returns_01 & { dvat04: dvat04 })[]
  >([]);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    [],
  );
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");
  const [lastmonthcash, setLastMonthCash] = useState<string>("0");
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);

  const [user, setUser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const challan_response = await GetReturnChallans({
        returnId: parseInt(params.id),
      });

      if (challan_response.status && challan_response.data) {
        setPaidChallans(challan_response.data);
      }

      const returns_response = await GetReturn01({
        id: parseInt(params.id),
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
          let allQuarterlyReturns: (returns_01 & {
            dvat04: dvat04;
          })[] = [returns_response.data];

          const isQuarterlyFiling =
            returns_response.data.dvat04?.frequencyFilings === "QUARTERLY";

          if (isQuarterlyFiling) {
            const selectedYear = returns_response.data.year;
            const selectedMonth = returns_response.data.month ?? "";

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
                allQuarterlyReturns.push(quarterResponse.data.returns_01);
              }
            });
          }

          setQuarterlyReturns(allQuarterlyReturns);

          mergedEntries = Array.from(
            new Map(mergedEntries.map((entry) => [entry.id, entry])).values(),
          );

          serReturns_entryData(mergedEntries);
        }
      }
      setIsLoading(false);
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

      if (!return01?.month) return;

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

      const currentMonthIndex = monthNames.indexOf(return01.month);

      if (currentMonthIndex === -1) {
      } else {
        // Calculate the last month index and handle wrapping
        const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        // Get the last month's name
        const lastMonth: string = monthNames[lastMonthIndex];

        const lastmonthdata = await getPdfReturn({
          year:
            return01.month == "January"
              ? (parseInt(return01.year) - 1).toString()
              : return01.year,
          month: lastMonth,
        });

        if (lastmonthdata.status && lastmonthdata.data) {
          setLastMonthDue(lastmonthdata.data.returns_01.pending_payment ?? "0");
          setLastMonthCash(lastmonthdata.data.returns_01.cash_payment ?? "0");
        }
      }
    };
    init();
  }, [return01]);

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
      // Generate RR number once to use for all returns
      const rrNumber = get_rr_number();

      // For quarterly filing, update all 3 returns; for monthly, update only the selected return
      const returnsToUpdate =
        return01.dvat04?.frequencyFilings === "QUARTERLY"
          ? quarterlyReturns
          : [return01];

      for (let i = 0; i < returnsToUpdate.length; i++) {
        const returnToUpdate = returnsToUpdate[i];
        const isLastReturn = i === returnsToUpdate.length - 1;

        const submitPenalty =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.penalty.toFixed(0);
        const submitInterest =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.interestamount.toFixed(0);
        const submitVat =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.vatamount.toFixed(0);
        const submitTotal =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.totaltaxamount.toFixed(0);
        const submitChallanVat =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? getVatAmountcomp().toFixed(0)
              : remaingVat.toFixed(0);
        const submitChallanInterest =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? (compositionCalculation?.getInterest() ?? 0).toFixed(0)
              : remainingInterest.toFixed(0);
        const submitChallanPenalty =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? (compositionCalculation?.getPenalty() ?? 0).toFixed(0)
              : remainingPenalty.toFixed(0);
        const submitChallanOther =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? "0"
              : centralSales?.netpayable().toFixed(0) ?? "0";

        const submitPendingPayment =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : Math.abs(pendingpayment()).toFixed(2);
        const submitPendingCash =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : (isNegative(pendingcashone()) ? Math.abs(pendingcashone()) : 0) +
              (isNegative(pendingcashtwo())
                ? Math.abs(pendingcashtwo())
                : 0
              ).toFixed(2);

        if (isLastReturn || return01.dvat04?.frequencyFilings !== "QUARTERLY") {
          const response = await AddPayment({
            id: returnToUpdate.id,
            bank_name: "NIL",
            track_id: "NIL",
            transaction_id: "NIL",
            rr_number: rrNumber,
            pending_payment: submitPendingPayment,
            pending_cash: submitPendingCash,
            penalty: submitPenalty,
            interestamount: submitInterest,
            totaltaxamount: submitTotal,
            vatamount: submitVat,

            challan_vat: submitChallanVat,
            challan_interest: submitChallanInterest,
            challan_penalty: submitChallanPenalty,
            challan_other: submitChallanOther,
            challan_total_tax_amount: (
              parseFloat(submitChallanVat) +
              parseFloat(submitChallanInterest) +
              parseFloat(submitChallanPenalty) +
              parseFloat(submitChallanOther)
            ).toFixed(0),
          });

          if (!response.status) {
            toast.error(response.message);
            return;
          }
        }
      }

      toast.success("Return(s) submitted successfully");
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

      const returnsToUpdate =
        return01.dvat04?.frequencyFilings === "QUARTERLY"
          ? quarterlyReturns
          : [return01];

      let finalOrderId: string | undefined;

      for (let i = 0; i < returnsToUpdate.length; i++) {
        const returnToUpdate = returnsToUpdate[i];
        const isLastReturn = i === returnsToUpdate.length - 1;

        const submitPenalty =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.penalty.toFixed(0);
        const submitInterest =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.interestamount.toFixed(0);
        const submitVat =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.vatamount.toFixed(0);
        const submitTotal =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : paymentBreakdown.totaltaxamount.toFixed(0);
        const submitChallanVat =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? getVatAmountcomp().toFixed(0)
              : remaingVat.toFixed(0);
        const submitChallanInterest =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? (compositionCalculation?.getInterest() ?? 0).toFixed(0)
              : remainingInterest.toFixed(0);
        const submitChallanPenalty =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? (compositionCalculation?.getPenalty() ?? 0).toFixed(0)
              : remainingPenalty.toFixed(0);
        const submitChallanOther =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : return01.dvat04?.compositionScheme
              ? "0"
              : centralSales?.netpayable().toFixed(0) ?? "0";

        const submitPendingPayment =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : Math.abs(pendingpayment()).toFixed(2);
        const submitPendingCash =
          return01.dvat04?.frequencyFilings === "QUARTERLY" && !isLastReturn
            ? "0"
            : (
                (isNegative(pendingcashone())
                  ? Math.abs(pendingcashone())
                  : 0) +
                (isNegative(pendingcashtwo()) ? Math.abs(pendingcashtwo()) : 0)
              ).toFixed(2);

        if (isLastReturn || return01.dvat04?.frequencyFilings !== "QUARTERLY") {
          const response = await AddPaymentOnline({
            id: returnToUpdate.id,
            penalty: submitPenalty,
            pending_payment: submitPendingPayment,
            pending_cash: submitPendingCash,
            interestamount: submitInterest,
            totaltaxamount: submitTotal,
            vatamount: submitVat,

            challan_vat: submitChallanVat,
            challan_interest: submitChallanInterest,
            challan_penalty: submitChallanPenalty,
            challan_other: submitChallanOther,
            challan_total_tax_amount: (
              parseFloat(submitChallanVat) +
              parseFloat(submitChallanInterest) +
              parseFloat(submitChallanPenalty) +
              parseFloat(submitChallanOther)
            ).toFixed(0),
          });

          if (!response.status) {
            toast.error(response.message);
            return;
          }

          if (isLastReturn && response.data?.order_id) {
            finalOrderId = response.data.order_id;
          }
        }
      }

      if (!finalOrderId && return01.dvat04?.frequencyFilings === "QUARTERLY") {
        toast.error("Unable to initialize payment session.");
        return;
      }

      if (finalOrderId) {
        router.push(`/payamount?pi=${encodeURIComponent(finalOrderId)}`);
      }
    } finally {
      setIsOnlineProcessing(false);
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

  if (!return01)
    return (
      <div className="flex justify-center items-center h-screen">
        No return data available
      </div>
    );

  const compositionCalculation = return01
    ? new CompositionCalculation(
        returns_entryData ?? [],
        paidChallans ?? [],
        return01,
        return01.dvat04.compositionScheme ? true : false,
      )
    : null;
  const netTaxCalculation = return01
    ? new NetTaxCalculation(
        returns_entryData ?? [],
        paidChallans ?? [],
        return01!,
        parseFloat(lastmonthdue),
        parseFloat(lastmonthcash),
        return01.dvat04.frequencyFilings === "QUARTERLY",
      )
    : null;
  const centralSales = return01
    ? new CentralSalesCalculation(
        returns_entryData ?? [],
        paidChallans ?? [],
        return01,
        parseFloat(lastmonthdue),
        parseFloat(lastmonthcash),
        return01.dvat04.frequencyFilings === "QUARTERLY",
      )
    : null;

  const paidvatamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.vat ?? "0");
  }, 0);

  const paidinterestamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.interest ?? "0");
  }, 0);

  const paidpenaltyamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.penalty ?? "0");
  }, 0);

  const getVatAmountcomp = (): number => {
    if (!compositionCalculation) return 0;
    return (
      compositionCalculation.getInvoicePercentage("1").decrease - paidvatamount
    );
  };

  const getAdjustedBalances = () => {
    if (!netTaxCalculation)
      return {
        vat: 0,
        penalty: 0,
        interest: 0,
        vatBalance: 0,
        penaltyBalance: 0,
        interestBalance: 0,
      };

    const penalty = isNegative(netTaxCalculation.getPenalty())
      ? 0
      : netTaxCalculation.getPenalty();
    const interest = isNegative(netTaxCalculation.getInterest())
      ? 0
      : netTaxCalculation.getInterest();
    const vat = netTaxCalculation.getR6_1();

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

  const adjustedBalances = getAdjustedBalances();
  const remaingVat = adjustedBalances.vatBalance;
  const remainingPenalty = adjustedBalances.penaltyBalance;
  const remainingInterest = adjustedBalances.interestBalance;

  const getTotalTaxAmount = (): number => {
    if (return01?.dvat04?.compositionScheme && compositionCalculation) {
      const total: number =
        getVatAmountcomp() +
        compositionCalculation.getInterest() +
        compositionCalculation.getPenalty();
      return total;
    } else if (centralSales) {
      const total: number =
        remaingVat +
        remainingPenalty +
        remainingInterest +
        centralSales.netpayable();
      return total;
    }
    return 0;
  };

  const pendingcashone = (): number => {
    if (!netTaxCalculation) return 0;
    const penalty = isNegative(netTaxCalculation.getPenalty())
      ? 0
      : netTaxCalculation.getPenalty();
    const interest = isNegative(netTaxCalculation.getInterest())
      ? 0
      : netTaxCalculation.getInterest();
    const vat = netTaxCalculation.getR6_1();

    const totalpaid = paidvatamount + paidinterestamount + paidpenaltyamount;

    const val = isNegative(interest + vat)
      ? penalty - totalpaid
      : interest + vat + penalty - totalpaid;

    return val;
  };

  const pendingcashtwo = (): number => {
    if (!centralSales) return 0;
    return (
      centralSales.netpayable() -
      paidChallans.reduce((total, challan) => {
        return total + parseFloat(challan.others ?? "0");
      }, 0)
    );
  };

  const pendingpayment = (): number => {
    if (!netTaxCalculation) return 0;
    const interest = isNegative(netTaxCalculation.getInterest())
      ? 0
      : netTaxCalculation.getInterest();
    const vat = netTaxCalculation.getR6_1();

    const val = isNegative(interest + vat) ? interest + vat : 0;

    return val;
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      </div>
    );
  }
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
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Interest</TableCell>
                <TableCell className="text-center p-2 border">
                  {return01?.dvat04.compositionScheme
                    ? compositionCalculation?.getInterest().toFixed(0) ?? "0"
                    : remainingInterest.toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Late Penalty
                </TableCell>
                <TableCell className="text-center p-2 border">
                  {return01?.dvat04.compositionScheme
                    ? compositionCalculation?.getPenalty().toFixed(0) ?? "0"
                    : remainingPenalty.toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">CST</TableCell>
                <TableCell className="text-center p-2 border">
                  {return01?.dvat04.compositionScheme
                    ? "0"
                    : centralSales?.netpayable().toFixed(0) ?? "0"}
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
                          {isOnlineProcessing
                            ? "Redirecting..."
                            : "Pay Online"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default DownloadChallan;
