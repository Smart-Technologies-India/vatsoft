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
  challan,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  SelectOffice,
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
  const [payment, setPayment] = useState<boolean>(false);
  const [paymentSubmitBox, setPaymentSubmitBox] = useState<boolean>(false);
  const searchparam = useSearchParams();
  const [user, setUser] = useState<user | null>();
  // const [isAllNil, setAllNil] = useState<boolean>(false);
  const [lateFees, setLateFees] = useState<number>(0);
  const [lastmonthdue, setLastMonthDue] = useState<string>("0");

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
        setReturn01(returnformsresponse.data.returns_01);
        serReturns_entryData(returnformsresponse.data.returns_entry);

        const challanResponse = await GetPaidChallanByReturnId({
          returnid: returnformsresponse.data.returns_01.id,
        });
        if (challanResponse.status && challanResponse.data) {
          setPaidChallans(challanResponse.data);
        } else {
          setPaidChallans([]);
        }
        // setUser(returnformsresponse.data.returns_01.createdBy);

        const dvat_30: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30 && val.isnil == true,
          ).length > 0;
        const dvat_30a: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_30_A && val.isnil == true,
          ).length > 0;
        const dvat_31: boolean =
          returnformsresponse.data.returns_entry.filter(
            (val: returns_entry) =>
              val.dvat_type == DvatType.DVAT_31 && val.isnil == true,
          ).length > 0;
        const dvat_31a: boolean =
          returnformsresponse.data.returns_entry.filter(
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
        // if (
        //   returnformsresponse.data.returns_01.rr_number == null ||
        //   returnformsresponse.data.returns_01.rr_number == undefined ||
        //   returnformsresponse.data.returns_01.rr_number == ""
        // ) {
        setLateFees(Math.min(100 * diff_days, 10000));
        // }

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
        }
      }
    };
    init();
  }, [searchparam, userid]);

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

    const response = await AddSubmitPayment({
      id: return01.id ?? 0,
      rr_number: get_rr_number(),
      penalty: lateFees.toString(),
    });

    if (!response.status) return toast.error(response.message);
    toast.success(response.message);
    setPaymentSubmitBox(false);
  };

  const generatePDF = async () => {
    setDownload(true);
    try {
      // Fetch the PDF from the server
      const path = `${window.location.pathname}${window.location.search}?sidebar=no`;

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
  const getNetPayable = (): number => {
    const val: number =
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
      parseFloat(getInvoicePercentage("4").decrease) +
      parseFloat(getInvoicePercentage("5").decrease) +
      parseFloat(getInvoicePercentage("6").decrease) +
      parseFloat(getInvoicePercentage("12.5").decrease) +
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
          parseFloat(getGoodsReturnsNote().decrease)));
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
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
            />

            {/* section 8 start here */}
            <THEBALANCE2
              returnsentrys={returns_entryData ?? []}
              return01={return01}
              lastMonthDue={lastmonthdue}
              isComp={return01?.dvat04.frequencyFilings === "QUARTERLY"}
              paidChallans={paidChallans}
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

            {/* {!payment && (
              <>
                {(isAllNil && lateFees == 0) ||
                (!isAllNil && getNetPayable() > 0 && lateFees == 0) ? (
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
            )} */}
          </div>
        </section>
      )}
    </>
  );
};
export default Dvat16ReturnPreview;
