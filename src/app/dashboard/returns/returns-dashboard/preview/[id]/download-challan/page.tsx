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
import { ToWords } from "to-words";
import {
  capitalcase,
  decryptURLData,
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
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  user,
} from "@prisma/client";
import GetReturn01 from "@/action/return/getreturn";
import getReturnEntry from "@/action/return/getreturnentry";
import GetUser from "@/action/user/getuser";
import GetPaidChallanByReturnId from "@/action/challan/getpaidchallanbyreturnid";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

const DownloadChallan = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [lateFees, setLateFees] = useState<number>(0);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    [],
  );
  const [paidChallans, setPaidChallans] = useState<challan[]>([]);

  const [user, setUser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const returns_response = await GetReturn01({
        id: parseInt(decryptURLData(params.id.toString(), router)),
      });
      if (returns_response.status && returns_response.data) {
        setReturn01(returns_response.data);

        const challanResponse = await GetPaidChallanByReturnId({
          returnid: returns_response.data.id,
        });

        if (challanResponse.status && challanResponse.data) {
          setPaidChallans(challanResponse.data);
        } else {
          setPaidChallans([]);
        }

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
          serReturns_entryData(entry_response.data);
        }

        getLateFees(
          returns_response.data.year,
          returns_response.data.month!,
          returns_response.data.rr_number,
          new Date(returns_response.data.filing_datetime),
        );
      }
    };
    init();
  }, []);

  const getLateFees = (
    year: string,
    month: string,
    rr_number: string,
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

    // Get the month index from the month name
    let monthIndex = monthNames.indexOf(month);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
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

  const paidvatamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.vat ?? "0");
  }, 0);

  const paidinterestamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.interest ?? "0");
  }, 0);

  const paidpenaltyamount = paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.penalty ?? "0");
  }, 0);
  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = new Date();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
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
  const get5_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
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

  const getTaxBaseAmount = (): number =>
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
        parseFloat(getGoodsReturnsNote().decrease)));

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
        const paymentAmount = parseFloat(payment.total_tax_amount ?? "0");

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

  const getInterestDueDate = (): Date => {
    if (!return01) return new Date();

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

    const month = return01.month ?? "";
    let monthIndex = monthNames.indexOf(month);
    let computedYear = parseInt(return01.year);

    if (monthIndex === 11) {
      computedYear += 1;
      monthIndex = 0;
    } else {
      monthIndex += 1;
    }

    return new Date(computedYear, monthIndex, 15);
  };

  const getR6_1 = (): number => getTaxBaseAmount();

  const getR6_2a = (): number => {
    const totalDue = getR6_1();
    const dueDate = getInterestDueDate();
    const interest = calculateInterest(totalDue, dueDate, paidChallans, 15);
    return isNegative(interest) ? 0 : interest;
  };

  const getNetPayableBreakdown = () => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    const vatBalance = vat - paidvatamount;
    const penaltyBalance = penalty - paidpenaltyamount;
    const interestBalance = interest - paidinterestamount;

    const pendingPaymentRaw = vatBalance + penaltyBalance + interestBalance;
    const pendingPayment =
      pendingPaymentRaw < 0 ? Math.abs(pendingPaymentRaw) : 0;

    if (vatBalance <= 0) {
      return {
        vatamount: 0,
        penalty: Math.max(0, penaltyBalance),
        interestamount: Math.max(0, interestBalance),
        totaltaxamount:
          Math.max(0, penaltyBalance) + Math.max(0, interestBalance),
        pendingPayment,
      };
    }

    const excessPenalty = penaltyBalance < 0 ? Math.abs(penaltyBalance) : 0;
    const excessInterest = interestBalance < 0 ? Math.abs(interestBalance) : 0;
    const adjustedVatBalance = Math.max(
      0,
      vatBalance - excessPenalty - excessInterest,
    );

    return {
      vatamount: adjustedVatBalance,
      penalty: Math.max(0, penaltyBalance),
      interestamount: Math.max(0, interestBalance),
      totaltaxamount:
        adjustedVatBalance +
        Math.max(0, penaltyBalance) +
        Math.max(0, interestBalance),
      pendingPayment,
    };
  };

  const paymentBreakdown = getNetPayableBreakdown();

  const getTotalTaxAmount = (): number => {
    return Math.max(0, paymentBreakdown.totaltaxamount);
  };
  return (
    <>
      <div className="p-2 mainpdf" id="mainpdf">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">DVAT 16 Challan</div>
          <main>
            <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
              Details Of Taxpayer
            </div>
            <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
              <div>
                <p className="text-sm">Name</p>
                <p className="text-sm  font-medium">
                  {user?.firstName} - {user?.lastName}
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
                      {paymentBreakdown.vatamount.toFixed(0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Interest
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {paymentBreakdown.interestamount.toFixed(0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Late Penalty
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {paymentBreakdown.penalty.toFixed(0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Penalty
                    </TableCell>
                    <TableCell className="text-center p-2 border">0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left p-2 border">
                      Others
                    </TableCell>
                    <TableCell className="text-center p-2 border">0</TableCell>
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
                      {capitalcase(toWords.convert(getTotalTaxAmount()))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
              Payment Details
            </div>
            <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
              <div>
                <p className="text-sm">Bank Name</p>
                <p className="text-sm  font-medium h-20 border-b border-black"></p>
              </div>
              <div>
                <p className="text-sm">Paymode</p>
                <p className="text-sm  font-medium h-20 border-b border-black"></p>
              </div>
              <div>
                <p className="text-sm">Transaction ID</p>
                <p className="text-sm  font-medium h-20 border-b border-black"></p>
              </div>
              <div>
                <p className="text-sm">Bank Stamp</p>
                <p className="text-sm  font-medium h-20 border-b border-black"></p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DownloadChallan;
