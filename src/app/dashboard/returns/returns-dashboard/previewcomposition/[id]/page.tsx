/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import getPdfReturn from "@/action/return/getpdfreturn";
import {
  decryptURLData,
  encryptURLData,
  formatDateTime,
  formateDate,
  getDaysBetweenDates,
  getPrismaDatabaseDate,
  isNegative,
} from "@/utils/methods";

import {
  CategoryOfEntry,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { toast } from "react-toastify";
import CheckPayment from "@/action/return/checkpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetUser from "@/action/user/getuser";
import AddPaymentSubmit from "@/action/return/addpaymentsubmit";
import GetReturnChallans from "@/action/return/getreturnchallans";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { challan } from "@prisma/client";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const Dvat16ReturnPreview = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const userid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  const [isDownload, setDownload] = useState<boolean>(false);

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [payment, setPayment] = useState<boolean>(false);
  const [paymentSubmitBox, setPaymentSubmitBox] = useState<boolean>(false);
  const [challans, setChallans] = useState<challan[]>([]);
  const searchparam = useSearchParams();
  const [user, setUser] = useState<user | null>();
  const [isAllNil, setAllNil] = useState<boolean>(false);
  const [lateFees, setLateFees] = useState<number>(0);
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");
  const [InterestDiffDays, setInterestDiffDays] = useState<number>(0);

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
      const yearParam: string = searchparam.get("year") ?? "";
      const monthParam: string = searchparam.get("month") ?? "";

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

      const returnformsresponse = await getPdfReturn({
        year: yearParam,
        month: monthParam,
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

        const isQuarterlyFiling =
          selectedReturn.dvat04?.frequencyFilings === "QUARTERLY";

        if (isQuarterlyFiling) {
          const effectiveQuarter = getQuarterForMonth(monthParam);
          const quarterMonths = effectiveQuarter
            ? getQuarterMonths(effectiveQuarter).filter(
                (quarterMonth) => quarterMonth !== monthParam,
              )
            : [];

          const quarterResponses = await Promise.all(
            quarterMonths.map((quarterMonth) =>
              getPdfReturn({
                year: getNewYear(yearParam, quarterMonth),
                month: quarterMonth,
              }),
            ),
          );

          quarterResponses.forEach((quarterResponse: any) => {
            if (quarterResponse.status && quarterResponse.data) {
              mergedEntries.push(...quarterResponse.data.returns_entry);
            }
          });
        }

        setReturn01(selectedReturn);
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

        setAllNil(dvat_30 && dvat_30a && dvat_31 && dvat_31a);

        const year: string = searchparam.get("year") ?? "";
        let targetYear = parseInt(year || selectedReturn.year);

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
        let monthIndex = monthNames.indexOf(selectedReturn.month!);

        if (selectedReturn.dvat04.compositionScheme) {
          if (
            ["January", "February", "March"].includes(selectedReturn.month!)
          ) {
            monthIndex = 3; // April
          } else if (["April", "May", "June"].includes(selectedReturn.month!)) {
            monthIndex = 6; // July
          } else if (
            ["July", "August", "September"].includes(selectedReturn.month!)
          ) {
            monthIndex = 9; // October
          } else {
            monthIndex = 0; // January
            targetYear += 1;
          }
        } else {
          // Check if it's December (index 11) and increment year if needed
          if (monthIndex === 11) {
            targetYear += 1;
            monthIndex = 0; // Set month to January
          } else {
            monthIndex += 1; // Otherwise, just increment the month
          }
        }

        const pdiff_days = getDaysBetweenDates(
          new Date(targetYear, monthIndex, 29),
          currentDate,
        );
        if (
          selectedReturn.rr_number == null ||
          selectedReturn.rr_number == undefined ||
          selectedReturn.rr_number == ""
        ) {
          setLateFees(
            Math.min(100 * (isNegative(pdiff_days) ? 0 : pdiff_days), 10000),
          );
        }

        const payment_response = await CheckPayment({
          id: selectedReturn.id,
        });

        if (payment_response.status && payment_response.data) {
          setPayment(payment_response.data);
        }

        // Fetch all challans for this return
        const challans_response = await GetReturnChallans({
          returnId: selectedReturn.id,
        });

        if (challans_response.status && challans_response.data) {
          setChallans(challans_response.data);
        }
      } else {
        setReturn01(null);
        serReturns_entryData([]);
        setAllNil(false);
      }

      const currentMonthIndex = monthNames.indexOf(monthParam);

      if (currentMonthIndex === -1) {
      } else {
        // Calculate the last month index and handle wrapping
        const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        // Get the last month's name
        const lastMonth: string = monthNames[lastMonthIndex];

        const lastmonthdata = await getPdfReturn({
          year:
            monthParam == "January"
              ? (parseInt(yearParam) - 1).toString()
              : yearParam,
          month: lastMonth,
        });

        if (lastmonthdata.status && lastmonthdata.data) {
          setLastMonthDue(lastmonthdata.data.returns_01.pending_payment ?? "0");
        }
      }
    };
    init();
  }, [searchparam, userid]);

  useEffect(() => {
    if (return01 == null) return;
    const year: string = searchparam.get("year") ?? "";

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
    let monthIndex = monthNames.indexOf(return01!.month!);
    let targetYear = parseInt(year);

    if (return01.dvat04?.compositionScheme) {
      if (["January", "February", "March"].includes(return01!.month!)) {
        monthIndex = 3; // April
      } else if (["April", "May", "June"].includes(return01!.month!)) {
        monthIndex = 6; // July
      } else if (["July", "August", "September"].includes(return01!.month!)) {
        monthIndex = 9; // October
      } else {
        monthIndex = 0; // January
        targetYear += 1;
      }
    } else {
      if (monthIndex === 11) {
        targetYear += 1;
        monthIndex = 0; // Set month to January
      } else {
        monthIndex += 1; // Otherwise, just increment the month
      }
    }

    const idiff_days = getDaysBetweenDates(
      new Date(targetYear, monthIndex, 16),
      currentDate,
    );
    setInterestDiffDays(idiff_days);

    // const pdiff_days = getDaysBetweenDates(
    //   new Date(targetYear, monthIndex, 29),
    //   currentDate,
    // );
    // setPenaltyDiffDays(pdiff_days);
  }, [return01]);

  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = new Date();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
  };

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
      return (searchparam.get("month") ?? "") + " " + year;
    }
  };

  const onSubmitPayment = async () => {
    if (return01 == null) return toast.error("There is not return from here");

    let submitReturnIds: number[] = [return01.id];

    // For composition scheme, get all three months of the quarter
    if (return01.dvat04?.compositionScheme) {
      const effectiveQuarter = getQuarterForMonth(return01.month!);
      const quarterMonths = effectiveQuarter
        ? getQuarterMonths(effectiveQuarter)
        : [];

      if (quarterMonths.length > 0) {
        const yearParam: string = searchparam.get("year") ?? return01.year;
        submitReturnIds = [];

        // Fetch return ID for each month in the quarter
        for (const quarterMonth of quarterMonths) {
          const quarterMonthReturnResponse = await getPdfReturn({
            year: getNewYear(yearParam, quarterMonth),
            month: quarterMonth,
          });

          if (
            quarterMonthReturnResponse.status &&
            quarterMonthReturnResponse.data?.returns_01
          ) {
            submitReturnIds.push(quarterMonthReturnResponse.data.returns_01.id);
          }
        }
      }
    }

    // Check last payment for the first return
    const lastPayment = await CheckLastPayment({
      id: submitReturnIds[0] ?? 0,
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

    // Prepare payment details
    const paymentDetails = {
      rr_number: get_rr_number(),
      penalty: isNegative(lateFees) ? "0" : lateFees.toString(),
      pending_payment: "0",
      vatamount: getInvoicePercentage("1").decrease,
      interestamount: isNegative(getR6_2a()) ? "0" : getR6_2a().toFixed(2),
      totaltaxamount: (
        parseFloat(getInvoicePercentage("1").decrease) +
        (isNegative(getR6_2a()) ? 0 : getR6_2a()) +
        (isNegative(lateFees) ? 0 : lateFees)
      ).toFixed(2),
    };

    // Submit payment to all months with same details
    let firstResponse: any = null;
    for (const returnId of submitReturnIds) {
      const response = await AddPaymentSubmit({
        id: returnId,
        ...paymentDetails,
      });

      if (!response.status) {
        toast.error(response.message);
        setPaymentSubmitBox(false);
        return;
      }

      if (!firstResponse) {
        firstResponse = response;
      }
    }

    if (firstResponse) {
      toast.success(firstResponse.message);
      setPaymentSubmitBox(false);
      router.push(`/dashboard/returns/returns-dashboard`);
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
  // net payable amount start form here
  const getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
  const get5_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = (returns_entryData ?? []).filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE,
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
    const output: returns_entry[] = (returns_entryData ?? []).filter(
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
      (parseFloat(getCreditNote().decrease) -
        parseFloat(getDebitNote().decrease) -
        parseFloat(getGoodsReturnsNote().decrease) -
        parseFloat(lastmonthdue)));

  const getR6_2a = (): number => {
    if (!return01?.month) return 0;

    const year: string = searchparam.get("year") ?? return01.year;
    const dueDate = getInterestDueDate(
      year,
      return01.month,
      return01.dvat04?.compositionScheme ? true : false,
    );
    const paidChallans = challans || [];
    const interest = calculateInterest(getR6_1(), dueDate, paidChallans, 15);
    return isNegative(interest) ? 0 : interest;
  };

  const getR7 = (): number =>
    getR6_1() + (isNegative(getR6_2a()) ? 0 : getR6_2a());

  const getNetPayable = (): number => {
    const outputTax = parseFloat(getInvoicePercentage("1").decrease);
    const taxPaid =
      challans && challans.length > 0
        ? challans.reduce(
            (sum, challan) => sum + parseFloat(challan.total_tax_amount || "0"),
            0,
          )
        : 0;
    const balancePayable = outputTax - taxPaid;
    const interestAmount = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const penalties = isNegative(lateFees) ? 0 : lateFees;

    return isNegative(balancePayable)
      ? penalties + interestAmount
      : balancePayable + penalties + interestAmount;
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
                              {challan.vat || "0"}
                            </td>
                          </tr>
                        ))}
                        {/* <tr className="w-full bg-gray-100">
                          <td
                            colSpan={4}
                            className="border border-black px-2 leading-4 text-[0.6rem] font-semibold text-right"
                          >
                            Total Tax Paid:
                          </td>
                          <td className="border border-black px-2 leading-4 text-[0.6rem] font-semibold">
                            {(
                              challans.reduce(
                                (sum, challan) =>
                                  sum + parseFloat(challan.vat || "0"),
                                0,
                              ) || 0
                            ).toFixed(2)}
                          </td>
                        </tr> */}
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
                  `/dashboard/returns/returns-dashboard/previewcomposition//${encryptURLData(
                    return01.dvat04Id.toString(),
                  )}?year=${year}&month=${month}&sidebar=no`,
                );
              }}
              disabled={isDownload}
            >
              {isDownload ? "Downloading..." : "Download"}
            </Button>

            {/* (isAllNil && lateFees == 0) ||
                (!isAllNil && getNetPayable() > 0 && lateFees == 0) */}

            {!payment && (
              <>
                {getNetPayable() < 1 ? (
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

interface ReturnTableProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
  iscomp: boolean;
  challans?: challan[];
}

const ReturnTable = (props: ReturnTableProps) => {
  const [lateFees, setLateFees] = useState<number>(0);
  const searchparam = useSearchParams();

  useEffect(() => {
    const year: string = searchparam.get("year") ?? "";
    let targetYear = parseInt(year || props.return01.year);

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
    let monthIndex = monthNames.indexOf(props.return01.month!);

    if (props.iscomp) {
      if (["January", "February", "March"].includes(props.return01.month!)) {
        monthIndex = 3; // April
      } else if (["April", "May", "June"].includes(props.return01.month!)) {
        monthIndex = 6; // July
      } else if (
        ["July", "August", "September"].includes(props.return01.month!)
      ) {
        monthIndex = 9; // October
      } else {
        monthIndex = 0; // January
        targetYear += 1;
      }
    } else {
      // Check if it's December (index 11) and increment year if needed
      if (monthIndex === 11) {
        targetYear += 1;
        monthIndex = 0; // Set month to January
      } else {
        monthIndex += 1; // Otherwise, just increment the month
      }
    }

    const pdiff_days = getDaysBetweenDates(
      new Date(targetYear, monthIndex, 29),
      currentDate,
    );

    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      setLateFees(
        Math.min(100 * (isNegative(pdiff_days) ? 0 : pdiff_days), 10000),
      );
    }
  }, []);

  const getInvoicePercentage1 = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
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
  const getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
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
  const getSaleOfPercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
    const output: returns_entry[] = props.returnsentrys.filter(
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
      (parseFloat(getCreditNote().decrease) -
        parseFloat(getDebitNote().decrease) -
        parseFloat(getGoodsReturnsNote().decrease) -
        parseFloat(props.lastMonthDue)));

  const getR6_2a = (): number => {
    if (!props.return01?.month) return 0;

    const year: string = searchparam.get("year") ?? props.return01.year;
    const dueDate = getInterestDueDate(
      year,
      props.return01.month,
      props.iscomp,
    );
    const paidChallans = props.challans || [];
    const interest = calculateInterest(getR6_1(), dueDate, paidChallans, 15);
    return isNegative(interest) ? 0 : interest;
  };

  const getR7 = (): number =>
    getR6_1() + (isNegative(getR6_2a()) ? 0 : getR6_2a());

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            3. Total Sales in the period
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getInvoicePercentage("1").increase}
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
            {getInvoicePercentage("1").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            6. Tax Paid
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {(props.challans && props.challans.length > 0
              ? props.challans.reduce(
                  (sum, challan) =>
                    sum + parseFloat(challan.total_tax_amount || "0"),
                  0,
                )
              : 0
            ).toFixed(2)}
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
            {(
              parseFloat(getInvoicePercentage("1").decrease) -
              (props.challans && props.challans.length > 0
                ? props.challans.reduce(
                    (sum, challan) =>
                      sum + parseFloat(challan.total_tax_amount || "0"),
                    0,
                  )
                : 0)
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            9. Add:Interest, penalty or other Govt. dues
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {(getR6_2a() + lateFees).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            10. Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {(
              parseFloat(getInvoicePercentage("1").decrease) -
              (props.challans && props.challans.length > 0
                ? props.challans.reduce(
                    (sum, challan) =>
                      sum + parseFloat(challan.total_tax_amount || "0"),
                    0,
                  )
                : 0) +
              (isNegative(lateFees) ? 0 : lateFees) +
              (isNegative(getR6_2a()) ? 0 : getR6_2a())
            ).toFixed(2)}
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
            {getR7() == 0 ? "-" : props.return01.challan_number} -
            {getR7() == 0
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
