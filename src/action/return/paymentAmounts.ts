import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  returns_entry,
  SaleOf,
} from "@prisma/client";
import { getDaysBetweenDates, isNegative } from "@/utils/methods";

const MONTH_NAMES = [
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
] as const;

type ReturnEntryCalculationData = Pick<
  returns_entry,
  | "dvat_type"
  | "category_of_entry"
  | "sale_of"
  | "tax_percent"
  | "nature_purchase"
  | "nature_purchase_option"
  | "input_tax_credit"
  | "vatamount"
>;

type CalculateReturnAmountsInput = {
  entries: ReturnEntryCalculationData[];
  month: string;
  year: string;
  filingDate: Date;
  lastMonthDue?: number | string | null;
  compositionScheme: boolean;
  hasReferenceNumber?: boolean;
  lateFeeCap?: number;
};

type CalculateReturnAmountsResult = {
  vatAmount: number;
  interest: number;
  penalty: number;
  totalTaxAmount: number;
  pendingPayment: number;
  formatted: {
    vatamount: string;
    interest: string;
    penalty: string;
    total_tax_amount: string;
    pending_payment: string;
  };
};

const parseAmount = (value?: number | string | null): number => {
  if (value == null || value === "") {
    return 0;
  }

  const parsedValue = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const sumVat = (
  entries: ReturnEntryCalculationData[],
  predicate: (entry: ReturnEntryCalculationData) => boolean,
): number =>
  entries.reduce((total, entry) => {
    if (!predicate(entry)) {
      return total;
    }

    return total + parseAmount(entry.vatamount);
  }, 0);

const getDueDays = (
  year: string,
  month: string,
  filingDate: Date,
): { interestDiffDays: number; penaltyDiffDays: number } => {
  const monthIndex = MONTH_NAMES.indexOf(
    month as (typeof MONTH_NAMES)[number],
  );

  if (monthIndex === -1) {
    return {
      interestDiffDays: 0,
      penaltyDiffDays: 0,
    };
  }

  let dueYear = parseInt(year, 10);
  let dueMonthIndex = monthIndex;

  if (dueMonthIndex === 11) {
    dueYear += 1;
    dueMonthIndex = 0;
  } else {
    dueMonthIndex += 1;
  }

  return {
    interestDiffDays: getDaysBetweenDates(
      new Date(dueYear, dueMonthIndex, 16),
      filingDate,
    ),
    penaltyDiffDays: getDaysBetweenDates(
      new Date(dueYear, dueMonthIndex, 29),
      filingDate,
    ),
  };
};

const getInvoicePercentageVat = (
  entries: ReturnEntryCalculationData[],
  taxPercent: string,
): number =>
  sumVat(
    entries,
    (entry) =>
      entry.dvat_type === DvatType.DVAT_31 &&
      entry.category_of_entry === CategoryOfEntry.INVOICE &&
      entry.sale_of === SaleOf.GOODS_TAXABLE &&
      entry.tax_percent === taxPercent,
  );

const getSaleOfPercentageVat = (
  entries: ReturnEntryCalculationData[],
  taxPercent: string,
): number =>
  sumVat(
    entries,
    (entry) =>
      entry.dvat_type === DvatType.DVAT_31 &&
      entry.category_of_entry === CategoryOfEntry.INVOICE &&
      entry.sale_of === SaleOf.WORKS_CONTRACT &&
      entry.tax_percent === taxPercent,
  );

const getRegularVatAmount = (
  entries: ReturnEntryCalculationData[],
  lastMonthDue: number,
): number => {
  const outwardVat =
    getInvoicePercentageVat(entries, "0") +
    getInvoicePercentageVat(entries, "1") +
    getInvoicePercentageVat(entries, "4") +
    getInvoicePercentageVat(entries, "5") +
    getInvoicePercentageVat(entries, "6") +
    getInvoicePercentageVat(entries, "12.5") +
    getInvoicePercentageVat(entries, "12.75") +
    getInvoicePercentageVat(entries, "13.5") +
    getInvoicePercentageVat(entries, "15") +
    getInvoicePercentageVat(entries, "20") +
    getSaleOfPercentageVat(entries, "4") +
    getSaleOfPercentageVat(entries, "5") +
    getSaleOfPercentageVat(entries, "12.5") +
    sumVat(
      entries,
      (entry) =>
        entry.dvat_type === DvatType.DVAT_31 &&
        entry.category_of_entry === CategoryOfEntry.INVOICE &&
        (entry.sale_of === SaleOf.LABOUR ||
          entry.sale_of === SaleOf.EXEMPTED_GOODS),
    ) +
    sumVat(
      entries,
      (entry) =>
        entry.dvat_type === DvatType.DVAT_31 &&
        entry.category_of_entry === CategoryOfEntry.INVOICE &&
        entry.sale_of === SaleOf.PROCESSED_GOODS,
    ) -
    sumVat(
      entries,
      (entry) =>
        entry.dvat_type === DvatType.DVAT_31 &&
        (entry.category_of_entry === CategoryOfEntry.GOODS_RETURNED ||
          entry.category_of_entry === CategoryOfEntry.SALE_CANCELLED) &&
        entry.sale_of === SaleOf.GOODS_TAXABLE,
    );

  const inputTaxCredit =
    sumVat(
      entries,
      (entry) =>
        entry.dvat_type === DvatType.DVAT_30 &&
        entry.category_of_entry === CategoryOfEntry.INVOICE &&
        entry.nature_purchase === NaturePurchase.CAPITAL_GOODS &&
        entry.nature_purchase_option === NaturePurchaseOption.REGISTER_DEALERS &&
        entry.input_tax_credit === InputTaxCredit.ITC_ELIGIBLE,
    ) +
    sumVat(
      entries,
      (entry) =>
        entry.dvat_type === DvatType.DVAT_30 &&
        entry.category_of_entry === CategoryOfEntry.INVOICE &&
        entry.nature_purchase === NaturePurchase.OTHER_GOODS &&
        entry.nature_purchase_option === NaturePurchaseOption.REGISTER_DEALERS &&
        entry.input_tax_credit === InputTaxCredit.ITC_ELIGIBLE,
    ) +
    (
      sumVat(
        entries,
        (entry) =>
          entry.dvat_type === DvatType.DVAT_30 &&
          entry.category_of_entry === CategoryOfEntry.CREDIT_NOTE &&
          (entry.nature_purchase === NaturePurchase.OTHER_GOODS ||
            entry.nature_purchase === NaturePurchase.CAPITAL_GOODS) &&
          entry.input_tax_credit === InputTaxCredit.ITC_ELIGIBLE &&
          entry.nature_purchase_option === NaturePurchaseOption.REGISTER_DEALERS,
      ) -
      sumVat(
        entries,
        (entry) =>
          entry.dvat_type === DvatType.DVAT_30 &&
          entry.category_of_entry === CategoryOfEntry.DEBIT_NOTE &&
          (entry.nature_purchase === NaturePurchase.OTHER_GOODS ||
            entry.nature_purchase === NaturePurchase.CAPITAL_GOODS) &&
          entry.input_tax_credit === InputTaxCredit.ITC_ELIGIBLE &&
          entry.nature_purchase_option === NaturePurchaseOption.REGISTER_DEALERS,
      ) -
      sumVat(
        entries,
        (entry) =>
          entry.dvat_type === DvatType.DVAT_30 &&
          entry.category_of_entry === CategoryOfEntry.GOODS_RETURNED &&
          (entry.nature_purchase === NaturePurchase.OTHER_GOODS ||
            entry.nature_purchase === NaturePurchase.CAPITAL_GOODS) &&
          entry.input_tax_credit === InputTaxCredit.ITC_ELIGIBLE &&
          entry.nature_purchase_option === NaturePurchaseOption.REGISTER_DEALERS,
      ) -
      lastMonthDue
    );

  return outwardVat - inputTaxCredit;
};

const formatRoundedValue = (value: number): string => value.toFixed(0);

const calculateReturnAmounts = (
  input: CalculateReturnAmountsInput,
): CalculateReturnAmountsResult => {
  const lastMonthDue = parseAmount(input.lastMonthDue);
  const regularVatAmount = getRegularVatAmount(input.entries, lastMonthDue);
  const compositionVatAmount = getInvoicePercentageVat(input.entries, "1");
  const { interestDiffDays, penaltyDiffDays } = getDueDays(
    input.year,
    input.month,
    input.filingDate,
  );
  const vatAmount = input.compositionScheme
    ? compositionVatAmount
    : regularVatAmount;
  const interest = input.compositionScheme
    ? ((compositionVatAmount * 0.15) / 365) * penaltyDiffDays
    : isNegative(((regularVatAmount * 0.15) / 365) * interestDiffDays)
      ? 0
      : ((regularVatAmount * 0.15) / 365) * interestDiffDays;
  const penalty = input.hasReferenceNumber
    ? 0
    : Math.min(100 * penaltyDiffDays, input.lateFeeCap ?? 1_000_000);
  const pendingInterest = isNegative(
    ((regularVatAmount * 0.15) / 365) * penaltyDiffDays,
  )
    ? 0
    : ((regularVatAmount * 0.15) / 365) * penaltyDiffDays;
  const pendingPayment = isNegative(regularVatAmount + pendingInterest)
    ? regularVatAmount + pendingInterest
    : 0;
  const totalTaxAmount =
    (isNegative(vatAmount) ? 0 : vatAmount) +
    penalty +
    (isNegative(interest) ? 0 : interest);

  return {
    vatAmount,
    interest,
    penalty,
    totalTaxAmount,
    pendingPayment,
    formatted: {
      vatamount: formatRoundedValue(vatAmount),
      interest: formatRoundedValue(interest),
      penalty: formatRoundedValue(penalty),
      total_tax_amount: formatRoundedValue(totalTaxAmount),
      pending_payment: formatRoundedValue(pendingPayment),
    },
  };
};

const getPreviousReturnPeriod = (
  year: string,
  month: string,
): { year: string; month: string } | null => {
  const monthIndex = MONTH_NAMES.indexOf(
    month as (typeof MONTH_NAMES)[number],
  );

  if (monthIndex === -1) {
    return null;
  }

  if (monthIndex === 0) {
    return {
      year: (parseInt(year, 10) - 1).toString(),
      month: MONTH_NAMES[11],
    };
  }

  return {
    year,
    month: MONTH_NAMES[monthIndex - 1],
  };
};

export { calculateReturnAmounts, getPreviousReturnPeriod };