import { challan, returns_01, returns_entry } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { CentralSalesCalculation, TheBalance } from "./vatcalculation";

interface THEBALANCEProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
  lastMonthCash: string;
  isComp: boolean;
  paidChallans: challan[];
}

const THEBALANCE2 = (props: THEBALANCEProps) => {
  const thebalance = new TheBalance(
    props.returnsentrys,
    props.paidChallans,
    props.return01,
    parseFloat(props.lastMonthDue),
    parseFloat(props.lastMonthCash),
    props.isComp,
  );
  const centralSales = new CentralSalesCalculation(
    props.returnsentrys,
    props.paidChallans,
    props.return01,
    parseFloat(props.lastMonthDue),
    parseFloat(props.lastMonthCash),
    props.isComp,
  );
  // const [lateFees, setLateFees] = useState<number>(0);

  // useEffect(() => {
  //   const year: string = searchparam.get("year") ?? "";

  //   const currentDate = new Date();

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

  //   // Get the month index from the month name
  //   let monthIndex = monthNames.indexOf(props.return01.month!);

  //   // Check if it's December (index 11) and increment year if needed
  //   let newYear = parseInt(year);
  //   if (props.isComp) {
  //     // Composition scheme: map to next quarter's first month
  //     if (["January", "February", "March"].includes(props.return01.month!)) {
  //       monthIndex = 3; // April
  //     } else if (["April", "May", "June"].includes(props.return01.month!)) {
  //       monthIndex = 6; // July
  //     } else if (
  //       ["July", "August", "September"].includes(props.return01.month!)
  //     ) {
  //       monthIndex = 9; // October
  //     } else {
  //       monthIndex = 0; // January
  //       newYear += 1;
  //     }
  //   } else {
  //     // Check if it's December (index 11) and increment year if needed
  //     if (monthIndex === 11) {
  //       newYear += 1;
  //       monthIndex = 0; // Set month to January
  //     } else {
  //       monthIndex += 1; // Otherwise, just increment the month
  //     }
  //   }

  //   let pdiff_days = 0;
  //   if (
  //     props.return01.rr_number == null ||
  //     props.return01.rr_number == undefined ||
  //     props.return01.rr_number == ""
  //   ) {
  //     pdiff_days = getDaysBetweenDates(
  //       new Date(parseInt(props.return01.year), monthIndex, 29),
  //       currentDate,
  //     );
  //     setLateFees(Math.min(100 * pdiff_days, 10000));
  //   } else {
  //     pdiff_days = getDaysBetweenDates(
  //       new Date(parseInt(props.return01.year), monthIndex, 29),
  //       new Date(props.return01.transaction_date!),
  //     );
  //     setLateFees(Math.min(100 * pdiff_days, 10000));
  //   }
  // }, [props.return01, props.returnsentrys, props.isComp, searchparam]);

  // const getInvoicePercentage = (value: string): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //       parseFloat(props.lastMonthDue) +
  //       parseFloat(props.lastMonthCash))) +
  //   (parseFloat(getSalesDebitNote().decrease) -
  //     (parseFloat(getGoodsReturns().decrease) +
  //       parseFloat(getSaleCanceled().decrease) +
  //       parseFloat(props.lastMonthCash) +
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
  //     const diff = Math.floor((endUtc - startUtc) / dayMs);
  //     return Math.max(0, diff);
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
  //       ) {
  //         return null;
  //       }

  //       return {
  //         amount: paymentAmount,
  //         date: normalizeDate(paymentDateRaw),
  //       };
  //     })
  //     .filter(
  //       (payment): payment is { amount: number; date: Date } =>
  //         payment !== null,
  //     )
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

  //     // Payments on/before due date should reduce principal, but must not
  //     // move anchorDate backward; interest starts from due date.
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

  // const getInterestDueDate = (
  //   year: string,
  //   month: string,
  //   isComp: boolean = false,
  // ): Date => {
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

  //   let monthIndex = monthNames.indexOf(month);
  //   let computedYear = parseInt(year);

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
  //   if (!props.return01?.month) return 0;

  //   const dueDate = getInterestDueDate(
  //     props.return01.year,
  //     props.return01.month,
  //     props.isComp,
  //   );

  //   const interest = calculateInterest(
  //     getR6_1(),
  //     dueDate,
  //     props.paidChallans,
  //     15,
  //   );
  //   return isNegative(interest) ? 0 : interest;
  // };

  // const getR7 = (): number => {

  //   return Math.round(
  //     getR6_1() +
  //       (isNegative(getR6_2a()) ? 0 : getR6_2a()) -
  //       getPaidChallanAmount(),
  //   );
  // };

  // const getPercentageValue = (value: string): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
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
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
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

  // const getNetPayable = (): number => {
  //   const penalty = isNegative(lateFees) ? 0 : lateFees;
  //   const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
  //   const vat = getR6_1();

  //   return isNegative(interest + vat) ? interest + vat : 0;
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
            {/* {isNegative(getR7()) ? getR7().toFixed(2) : 0} */}
            {/* {getNetPayable().toFixed(2)} */}
            {thebalance.negative()}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R9.1 Adjusted against liability under Central Sales Tax
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {/* {adjustAmount().toFixed(2)} */}
            {centralSales.adjusted_vat()}
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
            {/* {(getNetPayable() + adjustAmount()).toFixed(2)}{" "} */}
            {/* forward to next period pending_payment*/}
            {thebalance.balance_carried_forward().toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default THEBALANCE2;
