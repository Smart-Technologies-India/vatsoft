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
  PurchaseType,
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  SaleOfInterstate,
  user,
} from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { toast } from "react-toastify";
import CheckPayment from "@/action/return/checkpayment";
import AddSubmitPayment from "@/action/return/addsubmitpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import AddPaymentSubmit from "@/action/return/addpaymentsubmit";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const Dvat16ReturnPreview = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const userid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router)
  );

  const [isDownload, setDownload] = useState<boolean>(false);
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>();
  const [payment, setPayment] = useState<boolean>(false);
  const [paymentSubmitBox, setPaymentSubmitBox] = useState<boolean>(false);
  const searchparam = useSearchParams();
  const [user, setUser] = useState<user | null>();
  const [isAllNil, setAllNil] = useState<boolean>(false);
  const [lateFees, setLateFees] = useState<number>(0);
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");

  useEffect(() => {
    const init = async () => {
      const user_response = await GetUser({
        id: current_user_id,
      });
      if (user_response.status && user_response.data) {
        setUser(user_response.data);
      }
      const year: string = searchparam.get("year") ?? "";
      const month: string = searchparam.get("month") ?? "";

      const returnformsresponse = await getPdfReturn({
        year: year,
        month: month,
        userid: userid,
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
        setReturn01(returnformsresponse.data.returns_01);
        serReturns_entryData(returnformsresponse.data.returns_entry);
        // setUser(returnformsresponse.data.returns_01.createdBy);

        const dvat_30: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30 && val.isnil == true
          ).length > 0;
        const dvat_30a: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30_A && val.isnil == true
          ).length > 0;
        const dvat_31: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_31 && val.isnil == true
          ).length > 0;
        const dvat_31a: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_31_A && val.isnil == true
          ).length > 0;

        if (dvat_30 && dvat_30a && dvat_31 && dvat_31a) {
          setAllNil(true);
        }

        const currentDate = new Date();

        // Get the month index from the month name
        let monthIndex = monthNames.indexOf(
          returnformsresponse.data.returns_01.month!
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
            11
          ),
          currentDate
        );
        if (
          returnformsresponse.data.returns_01.rr_number == null ||
          returnformsresponse.data.returns_01.rr_number == undefined ||
          returnformsresponse.data.returns_01.rr_number == ""
        ) {
          setLateFees(Math.min(100 * diff_days, 10000));
        }

        const payment_response = await CheckPayment({
          id: returnformsresponse.data.returns_01.id ?? 0,
        });
        if (payment_response.status && payment_response.data) {
          setPayment(payment_response.data);
        }
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

        const lastmonthdata = await getPdfReturn({
          year: month == "January" ? (parseInt(year) - 1).toString() : year,
          month: lastMonth,
          userid: userid,
        });


        if (lastmonthdata.status && lastmonthdata.data) {
          setLastMonthDue(lastmonthdata.data.returns_01.pending_payment ?? "0");
        }
      }
    };
    init();
  }, [searchparam, userid]);

  const [DiffDays, setDiffDays] = useState<number>(0);

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

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(parseInt(return01!.year), monthIndex, 15),
      currentDate
    );
    setDiffDays(diff_days);
  }, [return01]);

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
      id: return01.id ?? 0,
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

    // const response = await AddSubmitPayment({
    //   id: return01.id ?? 0,
    //   rr_number: get_rr_number(),
    //   penalty: lateFees.toString(),
    // });

    const pending_payment =
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
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
          parseFloat(getGoodsReturnsNote().decrease))) +
      (isNegative(
        (((parseFloat(getInvoicePercentage("0").decrease) +
          parseFloat(getInvoicePercentage("1").decrease) +
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
              parseFloat(getGoodsReturnsNote().decrease)))) *
          0.15) /
          365) *
          DiffDays
      )
        ? 0
        : (((parseFloat(getInvoicePercentage("0").decrease) +
            parseFloat(getInvoicePercentage("1").decrease) +
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
                parseFloat(getGoodsReturnsNote().decrease)))) *
            0.15) /
            365) *
          DiffDays) +
      (isNegative(lateFees) ? 0 : lateFees) +
      0 -
      0;

    const interestamount = isNegative(
      (((parseFloat(getInvoicePercentage("0").decrease) +
        parseFloat(getInvoicePercentage("1").decrease) +
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
            parseFloat(getGoodsReturnsNote().decrease)))) *
        0.15) /
        365) *
        DiffDays
    )
      ? 0
      : (((parseFloat(getInvoicePercentage("0").decrease) +
          parseFloat(getInvoicePercentage("1").decrease) +
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
              parseFloat(getGoodsReturnsNote().decrease)))) *
          0.15) /
          365) *
        DiffDays;

    const response = await AddPaymentSubmit({
      id: return01.id ?? 0,
      rr_number: get_rr_number(),
      penalty: lateFees.toString(),
      pending_payment: pending_payment.toFixed(2),
      vatamount: "0",
      interestamount: interestamount.toFixed(2),
      totaltaxamount: pending_payment.toFixed(2),
    });

    if (!response.status) return toast.error(response.message);
    toast.success(response.message);
    setPaymentSubmitBox(false);

    router.push(`/dashboard/returns/returns-dashboard`);
  };

  const generatePDF = async (path: string) => {
    setDownload(true);
    try {
      // Fetch the PDF from the server
      // const path = `${window.location.pathname}${window.location.search}?sidebar=no`;

      const response = await fetch("/api/getpdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: path }),
      });

      if (!response.ok) {
        setTimeout(() => {
          setDownload(false);
        }, 3600);

        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();

      // Create a link element for the download
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "output.pdf";

      // Programmatically click the link to trigger the download
      link.click();
      setTimeout(() => {
        setDownload(false);
      }, 3600);
    } catch (error) {
      setTimeout(() => {
        setDownload(false);
      }, 3600);

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
        val.tax_percent == value
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
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
  const getNetPayable = (): number => {
    const val: number =
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
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
          parseFloat(getGoodsReturnsNote().decrease))) +
      (isNegative(
        (((parseFloat(getInvoicePercentage("0").decrease) +
          parseFloat(getInvoicePercentage("1").decrease) +
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
              parseFloat(getGoodsReturnsNote().decrease)))) *
          0.15) /
          365) *
          DiffDays
      )
        ? 0
        : (((parseFloat(getInvoicePercentage("0").decrease) +
            parseFloat(getInvoicePercentage("1").decrease) +
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
                parseFloat(getGoodsReturnsNote().decrease)))) *
            0.15) /
            365) *
          DiffDays) +
      (isNegative(lateFees) ? 0 : lateFees) +
      0 -
      0;
    return val;
  };
  // net payable amount end here

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
                    {formateDate(new Date(return01?.createdAt!))}
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
            <TurnOver returnsentrys={returns_entryData ?? []} />
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
            />
            {/* section 7 start here */}
            <THEBALANCE1
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
            />

            {/* section 8 start here */}
            <THEBALANCE2
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
            />

            {/* section 9 start here */}

            <InterStateTrade returnsentrys={returns_entryData ?? []} />
            {/* page 1 end here */}

            {/* page 2 start here */}
            {/* section 10 start here */}
            <S1_1Adjustment returnsentrys={returns_entryData ?? []} />
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
            {payment && (
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
                            new Date(return01?.transaction_date!)
                          )
                        )}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {return01?.bank_name}
                      </td>
                      <td className="border border-black px-2 leading-4 text-[0.6rem]">
                        {return01?.total_tax_amount}
                      </td>
                    </tr>
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
                        return01.id.toString()
                      )}&tin=${encryptURLData(
                        return01.dvat04.tinNumber
                          ? return01.dvat04.tinNumber.toString()
                          : ""
                      )}`
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
                        return01.id.toString()
                      )}&tin=${encryptURLData(
                        return01.dvat04.tinNumber
                          ? return01.dvat04.tinNumber.toString()
                          : ""
                      )}`
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
                    "1"
                  )}/${encryptURLData(
                    return01.dvat04Id.toString()
                  )}?year=${year}&month=${month}&sidebar=no`
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
                {getNetPayable() < 0 ? (
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
                          return01.id.toString()
                        )}/challan-payment`
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

interface THEBALANCEProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
}

const THEBALANCE1 = (props: THEBALANCEProps) => {
  const [lateFees, setLateFees] = useState<number>(0);
  const [DiffDays, setDiffDays] = useState<number>(0);
  const searchparam = useSearchParams();

  useEffect(() => {
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
    let monthIndex = monthNames.indexOf(props.return01.month!);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(parseInt(props.return01.year), monthIndex, 15),
      currentDate
    );
    setDiffDays(diff_days);

    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      setLateFees(Math.min(100 * diff_days, 10000));
    }
  }, []);

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
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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

  const getValue = () => {
    return (
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
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
          parseFloat(getGoodsReturnsNote().decrease))) +
      (((parseFloat(getInvoicePercentage("0").decrease) +
        parseFloat(getInvoicePercentage("1").decrease) +
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
            parseFloat(getGoodsReturnsNote().decrease)))) *
        0.15) /
        365) *
        DiffDays +
      lateFees +
      0 -
      0
    );
  };

  const getR7 = (): number => {
    return isNegative(
      parseFloat(getInvoicePercentage("0").decrease) +
        parseFloat(getInvoicePercentage("1").decrease) +
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
            parseFloat(props.lastMonthDue))) +
        (isNegative(
          (((parseFloat(getInvoicePercentage("0").decrease) +
            parseFloat(getInvoicePercentage("1").decrease) +
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
                parseFloat(props.lastMonthDue)))) *
            0.15) /
            365) *
            DiffDays
        )
          ? 0
          : (((parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue)))) *
              0.15) /
              365) *
            DiffDays) +
        (isNegative(lateFees) ? 0 : lateFees) +
        0 -
        0
    )
      ? 0
      : parseFloat(getInvoicePercentage("0").decrease) +
          parseFloat(getInvoicePercentage("1").decrease) +
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
              parseFloat(props.lastMonthDue))) +
          (isNegative(
            (((parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue)))) *
              0.15) /
              365) *
              DiffDays
          )
            ? 0
            : (((parseFloat(getInvoicePercentage("0").decrease) +
                parseFloat(getInvoicePercentage("1").decrease) +
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
                    parseFloat(props.lastMonthDue)))) *
                0.15) /
                365) *
              DiffDays) +
          (isNegative(lateFees) ? 0 : lateFees) +
          0 -
          0;
  };

  const isPayment = (): boolean => {
    let res: boolean =
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == "";
    return res == false;
  };

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <thead>
        <tr className="w-full">
          <td
            className="border border-black px-2 leading-4 text-[0.6rem] w-[50%] font-semibold"
            colSpan={2}
          >
            THE BALANCE ON LINE 7 IS POSITIVE, PAY TAX PROVIDE DETAILS IN THIS
            BOX
          </td>
        </tr>
      </thead>
      <tbody className="w-full">
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            Balance brought forward from line R7
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getR7().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.1 Challan number by which payment made
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getR7() == 0 ? "-" : props.return01.challan_number}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.2 Date of payment
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getR7() == 0 ? "-" : formateDate(props.return01.filing_datetime)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const THEBALANCE2 = (props: THEBALANCEProps) => {
  const [lateFees, setLateFees] = useState<number>(0);
  const [DiffDays, setDiffDays] = useState<number>(0);
  const searchparam = useSearchParams();

  useEffect(() => {
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
    let monthIndex = monthNames.indexOf(props.return01.month!);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(parseInt(props.return01.year), monthIndex, 15),
      currentDate
    );
    setDiffDays(diff_days);

    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      setLateFees(Math.min(100 * diff_days, 10000));
    }
  }, []);

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
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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

  const getValue = () => {
    return (
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
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
          parseFloat(getGoodsReturnsNote().decrease))) +
      (((parseFloat(getInvoicePercentage("0").decrease) +
        parseFloat(getInvoicePercentage("1").decrease) +
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
            parseFloat(getGoodsReturnsNote().decrease)))) *
        0.15) /
        365) *
        DiffDays +
      lateFees +
      0 -
      0
    );
  };

  return (
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
            Balance brought forward from line R7
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {isNegative(
              parseFloat(getInvoicePercentage("0").decrease) +
                parseFloat(getInvoicePercentage("1").decrease) +
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
                    parseFloat(getGoodsReturnsNote().decrease))) +
                (isNegative(
                  (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(getGoodsReturnsNote().decrease)))) *
                    0.15) /
                    365) *
                    DiffDays
                )
                  ? 0
                  : (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
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
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                    DiffDays) +
                (isNegative(lateFees) ? 0 : lateFees) +
                0 -
                0
            )
              ? (
                  parseFloat(getInvoicePercentage("0").decrease) +
                  parseFloat(getInvoicePercentage("1").decrease) +
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
                      parseFloat(getGoodsReturnsNote().decrease))) +
                  (isNegative(
                    (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
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
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                      DiffDays
                  )
                    ? 0
                    : (((parseFloat(getInvoicePercentage("0").decrease) +
                        parseFloat(getInvoicePercentage("1").decrease) +
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
                            parseFloat(getGoodsReturnsNote().decrease)))) *
                        0.15) /
                        365) *
                      DiffDays) +
                  (isNegative(lateFees) ? 0 : lateFees) +
                  0 -
                  0
                ).toFixed(2)
              : "0"}
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
            {isNegative(
              parseFloat(getInvoicePercentage("0").decrease) +
                parseFloat(getInvoicePercentage("1").decrease) +
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
                    parseFloat(getGoodsReturnsNote().decrease))) +
                (isNegative(
                  (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(getGoodsReturnsNote().decrease)))) *
                    0.15) /
                    365) *
                    DiffDays
                )
                  ? 0
                  : (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
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
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                    DiffDays) +
                (isNegative(lateFees) ? 0 : lateFees) +
                0 -
                0
            )
              ? (
                  parseFloat(getInvoicePercentage("0").decrease) +
                  parseFloat(getInvoicePercentage("1").decrease) +
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
                      parseFloat(getGoodsReturnsNote().decrease))) +
                  (isNegative(
                    (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
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
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                      DiffDays
                  )
                    ? 0
                    : (((parseFloat(getInvoicePercentage("0").decrease) +
                        parseFloat(getInvoicePercentage("1").decrease) +
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
                            parseFloat(getGoodsReturnsNote().decrease)))) *
                        0.15) /
                        365) *
                      DiffDays) +
                  (isNegative(lateFees) ? 0 : lateFees) +
                  0 -
                  0
                ).toFixed(2)
              : "0"}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

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
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
            R4.1 Goods taxable at 2%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("2").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("2").decrease}
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
            R4.3.1 Goods taxable at 12.75%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("12.75").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("12.75").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.2 Goods taxable at 13.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("13.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("13.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.3 Goods taxable at 15%
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
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
              parseFloat(getInvoicePercentage("2").decrease) +
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
              parseFloat(get4_7().decrease)
            ).toFixed(2)}
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
            -({get4_9().decrease})
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
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
              parseFloat(get4_9().decrease)
            ).toFixed(2)}
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
            {(
              parseFloat(getGoodsReturns().decrease) +
              parseFloat(getSaleCanceled().decrease)
            ).toFixed(2)}
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
            {(
              0 -
              (parseFloat(getGoodsReturns().decrease) +
                parseFloat(getSaleCanceled().decrease))
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface R1TurnOverOfPurchaseProps {
  returnsentrys: returns_entry[];
  lastMonthDue: string;
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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

  const searchparam = useSearchParams();

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
            {(
              parseFloat(get5_1().decrease) + parseFloat(get5_2().decrease)
            ).toFixed(2)}
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
            {(
              parseFloat(getCreditNote().decrease) -
              parseFloat(getDebitNote().decrease) -
              parseFloat(getGoodsReturnsNote().decrease) -
              parseFloat(props.lastMonthDue)
            ).toFixed(2)}
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
            {(
              parseFloat(get5_1().decrease) +
              parseFloat(get5_2().decrease) +
              (parseFloat(getCreditNote().decrease) -
                parseFloat(getDebitNote().decrease) -
                parseFloat(getGoodsReturnsNote().decrease) -
                parseFloat(props.lastMonthDue))
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface S2AdjustmentOfTaxProps {
  returnsentrys: returns_entry[];
  lastMonthDue: string;
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
  const searchparam = useSearchParams();

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
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {searchparam.get("month") == "April" ? "0" : props.lastMonthDue}
          </td>
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
            {(
              parseFloat(getDebitNote().decrease) +
              parseFloat(getGoodsReturnsNote().decrease) +
              parseFloat(props.lastMonthDue)
            ).toFixed(2)}
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
            {(
              parseFloat(getCreditNote().decrease) -
              parseFloat(getDebitNote().decrease) -
              parseFloat(getGoodsReturnsNote().decrease) -
              parseFloat(props.lastMonthDue)
            ).toFixed(2)}
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
    const filtered: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );

    const grouped: Record<string, returns_entry> = {};

    for (const entry of filtered) {
      const key = entry.invoice_number;

      if (!grouped[key]) {
        grouped[key] = { ...entry }; // shallow copy
      } else {
        const existing = grouped[key];

        // Merge comma-separated strings (avoid duplicates if needed)
        existing.description_of_goods += `, ${entry.description_of_goods}`;
        existing.tax_percent += `, ${entry.tax_percent}`;
        // Sum numeric fields (after converting to float)
        const amountSum =
          parseFloat(existing.amount || "0") + parseFloat(entry.amount || "0");
        const vatSum =
          parseFloat(existing.vatamount || "0") +
          parseFloat(entry.vatamount || "0");
        const quantitySum = (existing.quantity || 0) + (entry.quantity || 0);

        existing.amount = amountSum.toFixed(2); // or keep as number if preferred
        existing.vatamount = vatSum.toFixed(2);
        existing.quantity = quantitySum; // assuming you want quantity as string
      }
    }
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

    return Object.values(grouped);
    // return output;
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
              Name of the Dealer From whom Goods Purchased
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[10%] text-left">
              TIN no of selling dealer
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
              VAT Charged
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
                  {index + 1}
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
                  {val.description_of_goods}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.quantity}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.total_invoice_number}
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
        </tbody>
      </table>
    </>
  );
};

interface NetTaxProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
}

const NetTax = (props: NetTaxProps) => {
  const [lateFees, setLateFees] = useState<number>(0);
  const [DiffDays, setDiffDays] = useState<number>(0);
  const searchparam = useSearchParams();

  useEffect(() => {
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
    let monthIndex = monthNames.indexOf(props.return01.month!);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(parseInt(props.return01.year), monthIndex, 15),
      currentDate
    );
    setDiffDays(diff_days);

    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      setLateFees(Math.min(100 * diff_days, 10000));
    }
  }, []);

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
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <tbody className="w-full">
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[80%]">
            R6.1 Net Tax (R4.10)-(R5.6)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[20%]">
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue)))
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2a :Interest
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {isNegative(
              (((parseFloat(getInvoicePercentage("0").decrease) +
                parseFloat(getInvoicePercentage("1").decrease) +
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
                    parseFloat(getGoodsReturnsNote().decrease)))) *
                0.15) /
                365) *
                DiffDays
            )
              ? "0"
              : (
                  (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(getGoodsReturnsNote().decrease)))) *
                    0.15) /
                    365) *
                  DiffDays
                ).toFixed(0)}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2b :Penalty
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {isNegative(lateFees) ? 0 : lateFees}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2c :Other
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
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue))) +
              (isNegative(
                (((parseFloat(getInvoicePercentage("0").decrease) +
                  parseFloat(getInvoicePercentage("1").decrease) +
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
                      parseFloat(props.lastMonthDue)))) *
                  0.15) /
                  365) *
                  DiffDays
              )
                ? 0
                : (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(props.lastMonthDue)))) *
                    0.15) /
                    365) *
                  DiffDays) +
              (isNegative(lateFees) ? 0 : lateFees) +
              0 -
              0
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface CentralSalesProps {
  return01: returns_01;
  returnsentrys: returns_entry[];
  lastMonthDue: string;
}

const CentralSales = (props: CentralSalesProps) => {
  const searchparam = useSearchParams();
  const [DiffDays, setDiffDays] = useState<number>(0);

  useEffect(() => {
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
    let monthIndex = monthNames.indexOf(props.return01.month!);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(parseInt(props.return01.year), monthIndex, 15),
      currentDate
    );
    setDiffDays(diff_days);
    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      setLateFees(Math.min(100 * diff_days, 10000));
    }
  }, [props.return01, props.returnsentrys]);

  const getLabour = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.LABOUR
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
  const getFormF = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMF
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

  const getExportIndia = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA
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

  const getInterStateSales = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE
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

  const getStateSales = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE
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
  const getStateSalesTaxable = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE
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
  const getFreightCharges = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.FREIGHT_CHARGES
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
  const getSaleCanceled = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED)
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

  const getUS6 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXEMPT_US6
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
  const getSch1 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.SCHI
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

  const get10_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMI
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
  const get10_2_6_2 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION)
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
  const get10_2 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION)
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

  const getPercentageValue = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
        val.tax_percent == value
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
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.PROCESSED_GOODS
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

  const getGoodsReturnsNoteTwo = (): PercentageOutput => {
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

  ///--------------------------------------
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
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value
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
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
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
        val.sale_of == SaleOf.PROCESSED_GOODS
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
        val.sale_of == SaleOf.GOODS_TAXABLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
  // const getGoodsReturnsNote = (): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == DvatType.DVAT_30 &&
  //       val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
  //       (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
  //         val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
  //       val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
  //       val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
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
  const getGoodsReturnsNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.GOODS_TAXABLE || val.sale_of == SaleOf.TAXABLE)
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
  const [lateFees, setLateFees] = useState<number>(0);

  return (
    <table border={1} className="w-5/6 mx-auto mt-4">
      <thead className="w-full">
        <tr className="w-full">
          <th
            colSpan={4}
            className="border border-black px-2 leading-4 text-[0.6rem] w-[100%] text-left"
          >
            FORM I - Form of return under Rule 4 of the Central Sales Tax (Dadra
            & Nagar Haveli) Rules, 198
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
            Gross amount received & receivable by the dealer during the period
            in respect of sales of goods
          </th>

          <th className="border border-black px-2 leading-4 text-[0.6rem] w-[15%] text-left font-normal">
            {/* {getGoodsReturnsNote().increase} */}
            {parseFloat(getStateSalesTaxable().increase) +
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)}
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
            {getLabour().increase}
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
            Sales of goods outside the state (As defined in Section 4 of the
            Act)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getFormF().increase}
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
            Sales of goods in the course or Export outside or Import into India
            (as defined in Section 5 of the Act)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getExportIndia().increase}
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
            Balance turnover of Inter State Sales and Sales within the State
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(getStateSalesTaxable().increase) +
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase) -
              (parseFloat(getGoodsReturnsNote().increase) -
                parseFloat(getLabour().increase) -
                parseFloat(getFormF().increase) -
                parseFloat(getExportIndia().increase))
            ).toFixed(2)}
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
            {parseFloat(getStateSalesTaxable().increase)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            3
          </td>
          <td
            className="border border-black px-2 leading-4 text-[0.6rem]"
            colSpan={2}
          >
            Balance-/turnover of Inter-State Sales
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)
            ).toFixed(2)}
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
            Cost of freight or delivery or the cost of installation where such
            cost is separately charged on Inter-State sales
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getFreightCharges().increase}
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
            Sales price of goods returned by the purchaser within the prescribed
            period
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getSaleCanceled().increase}
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
            {(
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)
            ).toFixed(2)}
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
            {getUS6().increase}
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
            {getSch1().increase}
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
            {get10_3().increase}
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
            {/* {(
              parseFloat(getGoodsReturnsNoteTwo().increase) -
              parseFloat(getLabour().increase) -
              parseFloat(getFormF().increase) -
              parseFloat(getExportIndia().increase) -
              parseFloat(getFreightCharges().increase) -
              parseFloat(getSaleCanceled().increase) -
              parseFloat(getUS6().increase) -
              parseFloat(getSch1().increase) -
              parseFloat(get10_3().increase) +
              (parseFloat(getStateSales().increase) +
                parseFloat(getInterStateSales().increase) +
                parseFloat(get10_2().increase) -
                (parseFloat(getStateSales().increase) +
                  parseFloat(getInterStateSales().increase) +
                  parseFloat(get10_2().increase)))
            ).toFixed(2)} */}
            {(
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            6
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Goodswise break-up of the above taxable turnover and the tax payable
            thereon
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
            Sales to Registered Dealers on Form &apos;C&apos; taxable at the
            rate of 2%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_2_6_2().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_2().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iii)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to Govt. other than registered dealer on certificate in Form
            &apos;D&apos; taxable @ 4%
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
            Sales to persons other than registered dealers taxable @ 0%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("0").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("0").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.b)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 1%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("1").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("1").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.c)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 2%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("2").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("2").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.d)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 4%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("4").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.e)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.f)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 6%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("6").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("6").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.g)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 12.5
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("12.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.h)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 12.75
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("12.75").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("12.75").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.i)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 13.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("13.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("13.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.j)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 15%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("15").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("15").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            (iv.k)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Sales to persons other than registered dealers taxable @ 20%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("20").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getPercentageValue("20").decrease}
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
            Sales of goods notified under Sub-Section (5) of Sub-section 8 of
            the Act
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getProcessedGoods().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getProcessedGoods().decrease}
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
            {isNegative(
              (((parseFloat(getInvoicePercentage("0").decrease) +
                parseFloat(getInvoicePercentage("1").decrease) +
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
                    parseFloat(getGoodsReturnsNote().decrease)))) *
                0.15) /
                365) *
                DiffDays
            )
              ? 0
              : (
                  (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(getGoodsReturnsNote().decrease)))) *
                    0.15) /
                    365) *
                  DiffDays
                ).toFixed(0)}
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
            {isNegative(lateFees) ? 0 : lateFees}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(get10_2_6_2().increase) +
              parseFloat(getPercentageValue("0").increase) +
              parseFloat(getPercentageValue("1").increase) +
              parseFloat(getPercentageValue("2").increase) +
              parseFloat(getPercentageValue("4").increase) +
              parseFloat(getPercentageValue("5").increase) +
              parseFloat(getPercentageValue("6").increase) +
              parseFloat(getPercentageValue("12.5").increase) +
              parseFloat(getPercentageValue("12.75").increase) +
              parseFloat(getPercentageValue("13.5").increase) +
              parseFloat(getPercentageValue("15").increase) +
              parseFloat(getPercentageValue("20").increase) +
              parseFloat(getProcessedGoods().increase)
            ).toFixed(2)}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
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
              parseFloat(getProcessedGoods().decrease)
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Adjusted against VAT Input Credit as per./ TOTAL
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue)))
            ).toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Net Payable
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(getInvoicePercentage("0").decrease) +
              parseFloat(getInvoicePercentage("1").decrease) +
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
                  parseFloat(props.lastMonthDue))) +
              (isNegative(
                (((parseFloat(getInvoicePercentage("0").decrease) +
                  parseFloat(getInvoicePercentage("1").decrease) +
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
                      parseFloat(props.lastMonthDue)))) *
                  0.15) /
                  365) *
                  DiffDays
              )
                ? 0
                : (((parseFloat(getInvoicePercentage("0").decrease) +
                    parseFloat(getInvoicePercentage("1").decrease) +
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
                        parseFloat(props.lastMonthDue)))) *
                    0.15) /
                    365) *
                  DiffDays) +
              (isNegative(lateFees) ? 0 : lateFees) +
              0 -
              0
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface InterStateTradeProps {
  returnsentrys: returns_entry[];
}

const InterStateTrade = (props: InterStateTradeProps) => {
  const get10_1 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMF
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
  const get10_2 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION)
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
  const get10_3 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMI
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
  const get10_4 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMH
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
  const get10_6_1 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.purchase_type == PurchaseType.TAXABLE_RATE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS
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
  const get10_6 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS
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
  const get10_7 = (dvattype: DvatType): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA
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
  return (
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
            {get10_1(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_1(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.2 Against C Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_2(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_2(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.3 Against I Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_3(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_3(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.4 Against H Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_4(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_3(DvatType.DVAT_31_A).increase}
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
            {get10_6(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_6(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.7 Export to/Import from outside India
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_7(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {get10_7(DvatType.DVAT_30_A).increase}
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
            {get10_6_1(DvatType.DVAT_30_A).increase}
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
            {(
              parseFloat(get10_1(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_2(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_3(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_4(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_6(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_7(DvatType.DVAT_31_A).increase)
            ).toFixed(2)}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {(
              parseFloat(get10_1(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_2(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_3(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_4(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_6(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_7(DvatType.DVAT_30_A).increase)
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
