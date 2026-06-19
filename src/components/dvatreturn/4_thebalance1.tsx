import {
  CategoryOfEntry,
  challan,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  returns_01,
  returns_entry,
  SaleOf,
} from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const formateDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month < 10 && day < 10) {
    return `0${day}-0${month}-${year}`;
  } else if (month < 10) {
    return `${day}-0${month}-${year}`;
  } else if (day < 10) {
    return `0${day}-${month}-${year}`;
  } else {
    return `${day}-${month}-${year}`;
  }
};

const isNegative = (value: number): boolean => {
  return value < 0;
};

function getDaysBetweenDates(startDate: Date, endDate: Date): number {
  // Calculate the difference in milliseconds
  const differenceInTime = endDate.getTime() - startDate.getTime();

  // Convert milliseconds to days
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

  return Math.ceil(differenceInDays); // Rounds up to the nearest whole day
}

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface THEBALANCEProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
  isComp: boolean;
  paidChallans: challan[];
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
    if (props.isComp) {
      // Composition scheme: map to next quarter's first month
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
    const diff_days = getDaysBetweenDates(
      new Date(parseInt(props.return01.year), monthIndex, 16),
      currentDate,
    );
    setDiffDays(diff_days);

    let pdiff_days = 0;
    if (
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == ""
    ) {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(props.return01.year), monthIndex, 29),
        currentDate,
      );
      setLateFees(Math.min(100 * pdiff_days, 10000));
    } else {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(props.return01.year), monthIndex, 29),
        new Date(props.return01.transaction_date!),
      );
      setLateFees(Math.min(100 * pdiff_days, 10000));
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

  const getValue = () => {
    return (
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
          parseFloat(getGoodsReturnsNote().decrease))) +
      (((parseFloat(getInvoicePercentage("0").decrease) +
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
            parseFloat(getGoodsReturnsNote().decrease)))) *
        0.15) /
        365) *
        DiffDays +
      lateFees +
      0 -
      0
    );
  };

  const isPayment = (): boolean => {
    let res: boolean =
      props.return01.rr_number == null ||
      props.return01.rr_number == undefined ||
      props.return01.rr_number == "";
    return res == false;
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
        parseFloat(props.lastMonthDue)));

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
        const paymentAmount = parseFloat(payment.vat ?? "0") + parseFloat(payment.penalty ?? "0") + parseFloat(payment.interest ?? "0");

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

      // Payments on/before due date should reduce principal, but must not
      // move anchorDate backward; interest starts from due date.
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

  const getR6_2a = (): number => {
    if (!props.return01?.month) return 0;

    const dueDate = getInterestDueDate(
      props.return01.year,
      props.return01.month,
      props.isComp,
    );

    const interest = calculateInterest(
      getR6_1(),
      dueDate,
      props.paidChallans,
      15,
    );
    console.log("interest for 4", interest);
    return isNegative(interest) ? 0 : interest;
  };


  const paidChallanCpins = props.paidChallans
    .map((challan) => challan.cpin)
    .filter((cpin): cpin is string => Boolean(cpin && cpin.trim()))
    .join(", ");

  const latestPaidChallanDate = props.paidChallans
    .map((challan) => challan.transaction_date ?? challan.createdAt)
    .filter((date): date is Date => Boolean(date))
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const paidvatamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.vat);
  }, 0);

  const paidinterestamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.interest);
  }, 0);
  const paidpenaltyamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.penalty);
  }, 0);

  const getNetPayable = (): number => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    const totalpaid = paidvatamount + paidinterestamount + paidpenaltyamount;

    return isNegative(interest + vat)
      ? penalty - totalpaid
      : interest + vat + penalty - totalpaid;
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
            {isNegative(getNetPayable()) ? 0 : getNetPayable().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.1 Challan number by which payment made
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getNetPayable() == 0 ? "-" : paidChallanCpins || "-"}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.2 Date of payment
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {getNetPayable() == 0
              ? "-"
              : latestPaidChallanDate
                ? formateDate(latestPaidChallanDate)
                : "-"}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default THEBALANCE1;
