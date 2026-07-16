import {
  CategoryOfEntry,
  challan,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  returns_01,
  returns_entry,
  SaleOf,
  SaleOfInterstate,
} from "@prisma/client";

interface PercentageOutput {
  increase: number;
  decrease: number;
}

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

class CreditDebit {
  readonly returns_entry: returns_entry[];

  constructor(returns_entry: returns_entry[]) {
    this.returns_entry = returns_entry;
  }
  // old credit debit goods
  getCreditNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getDebitNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getGoodsReturnsNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  // one credit debit goods
  getSalesDebitNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getGoodsReturns = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getSaleCanceled = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.SALE_CANCELLED &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getSalesCreditNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
}

export class R4Turnover extends CreditDebit {
  readonly returns_entry: returns_entry[];
  readonly lastmonthcash: number;

  constructor(returns_entry: returns_entry[], lastmonthcash: number) {
    super(returns_entry);
    this.returns_entry = returns_entry;
    this.lastmonthcash = lastmonthcash;
  }

  getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getSaleOfPercentage = (value: string): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_6 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_7 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.PROCESSED_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_8 = (): number => {
    return (
      this.getInvoicePercentage("0").decrease +
      this.getInvoicePercentage("1").decrease +
      this.getInvoicePercentage("2").decrease +
      this.getInvoicePercentage("3").decrease +
      this.getInvoicePercentage("4").decrease +
      this.getInvoicePercentage("5").decrease +
      this.getInvoicePercentage("6").decrease +
      this.getInvoicePercentage("12.5").decrease +
      this.getInvoicePercentage("12.75").decrease +
      this.getInvoicePercentage("13.5").decrease +
      this.getInvoicePercentage("15").decrease +
      this.getInvoicePercentage("20").decrease +
      this.getSaleOfPercentage("4").decrease +
      this.getSaleOfPercentage("5").decrease +
      this.getSaleOfPercentage("12.5").decrease +
      this.get4_6().decrease +
      this.get4_7().decrease
    );
  };

  old_get4_9 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_9 = (): number => {
    return (
      this.getSalesDebitNote().decrease -
      (this.getGoodsReturns().decrease +
        this.getSaleCanceled().decrease +
        this.lastmonthcash +
        this.getSalesCreditNote().decrease)
    );
  };

  get4_10 = (): number => {
    return this.get4_8() + this.get4_9();
  };
}

export class R5Turnover extends CreditDebit {
  readonly returns_entry: returns_entry[];
  readonly lastmonthdue: number;

  constructor(returns_entry: returns_entry[], lastmonthdue: number) {
    super(returns_entry);
    this.returns_entry = returns_entry;
    this.lastmonthdue = lastmonthdue;
  }
  get5_1 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get5_2 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get5_3 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get5_4 = (): number => {
    return this.get5_1().decrease + this.get5_2().decrease;
  };

  get5_5 = (): number => {
    return (
      this.getCreditNote().decrease -
      this.getDebitNote().decrease -
      this.getGoodsReturnsNote().decrease +
      this.lastmonthdue
    );
  };

  get5_6 = (): number => {
    return this.get5_4() + this.get5_5();
  };
}

export class S1adjustment extends CreditDebit {
  readonly returns_entry: returns_entry[];
  readonly lastmonthcash: number;
  constructor(returns_entry: returns_entry[], lastmonthcash: number) {
    super(returns_entry);
    this.returns_entry = returns_entry;
    this.lastmonthcash = lastmonthcash;
  }

  total = (): number => {
    return (
      this.getGoodsReturns().decrease +
      this.getSaleCanceled().decrease +
      this.lastmonthcash +
      this.getSalesCreditNote().decrease
    );
  };

  totalNetPayable = (): number => {
    return this.getSalesDebitNote().decrease - this.total();
  };
}
export class S2adjustment extends CreditDebit {
  readonly returns_entry: returns_entry[];
  readonly lastMonthDue: number;
  constructor(returns_entry: returns_entry[], lastMonthDue: number) {
    super(returns_entry);
    this.returns_entry = returns_entry;
    this.lastMonthDue = lastMonthDue;
  }

  total_C = (): number => {
    return this.getCreditNote().decrease + this.lastMonthDue;
  };

  total_D = (): number => {
    return this.getDebitNote().decrease + this.getGoodsReturnsNote().decrease;
  };

  total = (): number => {
    return this.total_C() - this.total_D();
  };
}

export class InterState {
  readonly returns_entry: returns_entry[];
  constructor(returns_entry: returns_entry[]) {
    this.returns_entry = returns_entry;
  }

  get10_1 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (dvattype == DvatType.DVAT_31_A
          ? val.sale_of_interstate == SaleOfInterstate.FORMF
          : val.purchase_type == PurchaseType.STOCK_TRANSFER),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_2 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_3 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMI,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_4 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMH,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_6_1 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.purchase_type == PurchaseType.TAXABLE_RATE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_6 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_7 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_8 = (dvattype: DvatType): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == dvattype &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXEMPT_US6,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  total_dvat_30_A = (): number => {
    return (
      this.get10_1(DvatType.DVAT_30_A).decrease +
      this.get10_2(DvatType.DVAT_30_A).decrease +
      this.get10_3(DvatType.DVAT_30_A).decrease +
      this.get10_4(DvatType.DVAT_30_A).decrease +
      this.get10_6(DvatType.DVAT_30_A).decrease +
      this.get10_7(DvatType.DVAT_30_A).decrease +
      this.get10_8(DvatType.DVAT_30_A).decrease +
      this.get10_6_1(DvatType.DVAT_30_A).decrease
    );
  };

  total_dvat_31_A = (): number => {
    return (
      this.get10_1(DvatType.DVAT_31_A).decrease +
      this.get10_2(DvatType.DVAT_31_A).decrease +
      this.get10_3(DvatType.DVAT_31_A).decrease +
      this.get10_4(DvatType.DVAT_31_A).decrease +
      this.get10_6(DvatType.DVAT_31_A).decrease +
      this.get10_7(DvatType.DVAT_31_A).decrease +
      this.get10_8(DvatType.DVAT_31_A).decrease +
      this.get10_6_1(DvatType.DVAT_31_A).decrease
    );
  };
}

export class NetTaxCalculation extends CreditDebit {
  readonly returns_entry: returns_entry[];
  readonly paidChallans: challan[];
  readonly lastMonthDue: number;
  readonly lastMonthCash: number;
  readonly return01: returns_01;
  readonly isComp: boolean;
  constructor(
    returns_entry: returns_entry[],
    paidChallans: challan[],
    return01: returns_01,
    lastMonthDue: number,
    lastMonthCash: number,
    isComp: boolean,
  ) {
    super(returns_entry);
    this.returns_entry = returns_entry;
    this.paidChallans = paidChallans;
    this.lastMonthDue = lastMonthDue;
    this.lastMonthCash = lastMonthCash;
    this.return01 = return01;
    this.isComp = isComp;
  }

  getR6_1 = (): number => {
    const r4turnover = new R4Turnover(this.returns_entry, this.lastMonthCash);
    const r5turnover = new R5Turnover(this.returns_entry, this.lastMonthDue);
    return parseFloat((r4turnover.get4_10() - r5turnover.get5_6()).toFixed(2));
  };

  // Penalty calculation start here

  getPenalty = (): number => {
    const month: string = this.return01.month ?? "April";
    const year: string = this.return01.year;
    // const currentDate: Date = new Date(2026, 9, 1);
    const currentDate: Date = new Date();

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
    if (this.isComp) {
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
    if (
      this.return01.rr_number == null ||
      this.return01.rr_number == undefined ||
      this.return01.rr_number == ""
    ) {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(year), monthIndex, 29),
        currentDate,
      );
      return isNegative(Math.min(100 * pdiff_days, 10000))
        ? 0
        : Math.min(100 * pdiff_days, 10000);
    } else {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(year), monthIndex, 29),
        new Date(this.return01.transaction_date ?? currentDate.toISOString()),
      );
      return isNegative(Math.min(100 * pdiff_days, 10000))
        ? 0
        : Math.min(100 * pdiff_days, 10000);
    }
  };

  // interest calculation logic

  getInterestDueDate = (
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

  calculateInterest = (
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
  getInterest = (): number => {
    if (!this.return01.month) return 0;

    const dueDate = this.getInterestDueDate(
      this.return01.year,
      this.return01.month,
      this.isComp,
    );

    const interest = this.calculateInterest(
      this.getR6_1(),
      dueDate,
      this.paidChallans,
      15,
    );
    return isNegative(interest) ? 0 : interest;
  };

  total = (): number => {
    const r6_1 = this.getR6_1() > 0 ? this.getR6_1() : 0;
    const r6_2a = this.getInterest();
    const penalty = this.getPenalty();

    return r6_1 + r6_2a + penalty;
  };
}

export class TheBalance {
  readonly returns_entry: returns_entry[];
  readonly paidChallans: challan[];
  readonly lastMonthDue: number;
  readonly lastMonthCash: number;
  readonly return01: returns_01;
  readonly isComp: boolean;
  readonly netTaxCalculation: NetTaxCalculation;
  readonly centralSalesCalculation: CentralSalesCalculation;
  constructor(
    returns_entry: returns_entry[],
    paidChallans: challan[],
    return01: returns_01,
    lastMonthDue: number,
    lastMonthCash: number,
    isComp: boolean,
  ) {
    this.returns_entry = returns_entry;
    this.paidChallans = paidChallans;
    this.lastMonthDue = lastMonthDue;
    this.lastMonthCash = lastMonthCash;
    this.return01 = return01;
    this.isComp = isComp;
    this.netTaxCalculation = new NetTaxCalculation(
      this.returns_entry,
      this.paidChallans,
      this.return01,
      this.lastMonthDue,
      this.lastMonthCash,
      this.isComp,
    );
    this.centralSalesCalculation = new CentralSalesCalculation(
      this.returns_entry,
      this.paidChallans,
      this.return01,
      this.lastMonthDue,
      this.lastMonthCash,
      this.isComp,
    );
  }

  posivite = (): number => {
    const total =
      this.netTaxCalculation.total() > 0 ? this.netTaxCalculation.total() : 0;
    const paidChallansTotal = this.paidChallans.reduce((acc, curr) => {
      const vat = parseFloat(curr.vat ?? "0");
      const penalty = parseFloat(curr.penalty ?? "0");
      const interest = parseFloat(curr.interest ?? "0");
      return acc + vat + penalty + interest;
    }, 0);

    const r6_1 = this.netTaxCalculation.getR6_1();
    const penalty = this.netTaxCalculation.getPenalty();

    if (r6_1 < 0) {
      return penalty - paidChallansTotal > 0 ? penalty - paidChallansTotal : 0;
    } else {
      return total - paidChallansTotal > 0 ? total - paidChallansTotal : 0;
    }
  };

  excessCash = (): number => {
    const paidChallansTotal = this.paidChallans.reduce((acc, curr) => {
      const vat = parseFloat(curr.vat ?? "0");
      const penalty = parseFloat(curr.penalty ?? "0");
      const interest = parseFloat(curr.interest ?? "0");
      return acc + vat + penalty + interest;
    }, 0);

    const r6_1 = this.netTaxCalculation.getR6_1();
    const penalty = this.netTaxCalculation.getPenalty();

    const total =
      this.netTaxCalculation.total() > 0 ? this.netTaxCalculation.total() : 0;

    const otherpaidchallan = this.paidChallans.reduce((acc, curr) => {
      const others = parseFloat(curr.others ?? "0");
      return acc + others;
    }, 0);

    const value =
      this.centralSalesCalculation.total_decrease() -
      this.centralSalesCalculation.adjusted_vat() -
      otherpaidchallan;

    const centersale: number = value < 0 ? Math.abs(value) : 0;
    // return value > 0 ? value : 0;

    // case 1
    if (r6_1 < 0) {
      if (penalty - paidChallansTotal < 0) {
        return Math.abs(penalty - paidChallansTotal) + centersale;
      } else {
        return centersale;
      }
    } else {
      if (total - paidChallansTotal < 0) {
        return Math.abs(total - paidChallansTotal) + centersale;
      } else {
        return centersale;
      }
    }
  };

  negative = (): number => {
    const r6_1 = this.netTaxCalculation.getR6_1();
    if (r6_1 > 0) return 0;
    return Math.abs(r6_1);
  };

  balance_carried_forward = (): number => {
    return this.negative() - this.centralSalesCalculation.adjusted_vat();
  };

  // this.centralSalesCalculation.netpayable(); //A
  // this.excessCash(); //B

  // if (A > B) {
  //   return A - B;
  // } else {
  //   return 0;
  // }
  excess_cash_payment = (): number => {
    const A = this.centralSalesCalculation.netpayable();
    const B = this.excessCash();

    if (A < B) {
      return B - A;
    } else {
      return 0;
    }
  };

  netpayable = () => {
    const A = this.centralSalesCalculation.netpayable();
    const B = this.excessCash();
    if (A > B) {
      return A - B;
    } else {
      return 0;
    }
  };
}

export class CentralSalesCalculation {
  readonly returns_entry: returns_entry[];
  readonly paidChallans: challan[];
  readonly lastMonthDue: number;
  readonly lastMonthCash: number;
  readonly return01: returns_01;
  readonly isComp: boolean;

  readonly r4Turnover: R4Turnover;
  readonly creditDebit: CreditDebit;
  constructor(
    returns_entry: returns_entry[],
    paidChallans: challan[],
    return01: returns_01,
    lastMonthDue: number,
    lastMonthCash: number,
    isComp: boolean,
  ) {
    this.returns_entry = returns_entry;
    this.paidChallans = paidChallans;
    this.lastMonthDue = lastMonthDue;
    this.lastMonthCash = lastMonthCash;
    this.return01 = return01;
    this.isComp = isComp;
    this.r4Turnover = new R4Turnover(returns_entry, lastMonthCash);
    this.creditDebit = new CreditDebit(returns_entry);
  }

  getInterStateSales = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getStateSales = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getStateSalesTaxable = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getFreightCharges = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.FREIGHT_CHARGES,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_2_6_2 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  gross_amount = (): number => {
    return (
      this.getStateSalesTaxable().increase +
      this.getInterStateSales().increase +
      this.get10_2_6_2().increase +
      this.r4Turnover.get4_6().increase
    );
  };

  getLabour = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.LABOUR,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getFormF = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMF,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getExportIndia = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  balance_turnover = (): number => {
    return (
      this.getStateSalesTaxable().increase +
      this.getInterStateSales().increase +
      this.r4Turnover.get4_6().increase +
      this.get10_2_6_2().increase -
      (this.creditDebit.getGoodsReturnsNote().increase -
        this.getLabour().increase -
        this.getFormF().increase -
        this.getExportIndia().increase)
    );
  };

  deduct_turnover = (): number => {
    return (
      this.getStateSalesTaxable().increase + this.r4Turnover.get4_6().increase
    );
  };
  balance_turnover_of_inter_State = (): number => {
    return this.getInterStateSales().increase + this.get10_2_6_2().increase;
  };

  getSaleCanceled = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getUS6 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.EXEMPT_US6,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getSch1 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.SCHI,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  balance_total_turnover = (): number => {
    return this.getInterStateSales().increase + this.get10_2_6_2().increase;
  };
  get10_3 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.FORMI,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get10_2 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getPercentageValue = (value: string): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getProcessedGoods = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of_interstate == SaleOfInterstate.PROCESSED_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  balance_total_taxable = (): number => {
    return this.getInterStateSales().increase + this.get10_2_6_2().increase;
  };

  total_increase = (): number => {
    return (
      this.get10_2_6_2().increase +
      this.getPercentageValue("0").increase +
      this.getPercentageValue("1").increase +
      this.getPercentageValue("2").increase +
      this.getPercentageValue("4").increase +
      this.getPercentageValue("5").increase +
      this.getPercentageValue("6").increase +
      this.getPercentageValue("12.5").increase +
      this.getPercentageValue("12.75").increase +
      this.getPercentageValue("13.5").increase +
      this.getPercentageValue("15").increase +
      this.getPercentageValue("20").increase +
      this.getProcessedGoods().increase
    );
  };
  total_decrease = (): number => {
    return (
      this.get10_2_6_2().decrease +
      this.getPercentageValue("0").decrease +
      this.getPercentageValue("1").decrease +
      this.getPercentageValue("2").decrease +
      this.getPercentageValue("4").decrease +
      this.getPercentageValue("5").decrease +
      this.getPercentageValue("6").decrease +
      this.getPercentageValue("12.5").decrease +
      this.getPercentageValue("12.75").decrease +
      this.getPercentageValue("13.5").decrease +
      this.getPercentageValue("15").decrease +
      this.getPercentageValue("20").decrease +
      this.getProcessedGoods().decrease
    );
  };

  negative = (): number => {
    const netTaxCalculation = new NetTaxCalculation(
      this.returns_entry,
      this.paidChallans,
      this.return01,
      this.lastMonthDue,
      this.lastMonthCash,
      this.isComp,
    );
    const r6_1 = netTaxCalculation.getR6_1();
    if (r6_1 > 0) return 0;
    return Math.abs(r6_1);
  };

  adjusted_vat = (): number => {
    return Math.min(this.total_decrease(), Math.abs(this.negative()));
  };

  netpayable = (): number => {
    const otherpaidchallan = this.paidChallans.reduce((acc, curr) => {
      const others = parseFloat(curr.others ?? "0");
      return acc + others;
    }, 0);
    const value =
      this.total_decrease() - this.adjusted_vat() - otherpaidchallan;
    return value > 0 ? value : 0;
  };
}

export class CompositionCalculation {
  readonly returns_entry: returns_entry[];
  readonly paidChallans: challan[];
  readonly return01: returns_01;
  readonly isComp: boolean;

  constructor(
    returns_entry: returns_entry[],
    paidChallans: challan[],
    return01: returns_01,
    isComp: boolean,
  ) {
    this.returns_entry = returns_entry;
    this.paidChallans = paidChallans;
    this.return01 = return01;
    this.isComp = isComp;
  }

  getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  tax_paid = (): number => {
    const total = this.paidChallans.reduce(
      (sum, challan) => sum + parseFloat(challan.total_tax_amount || "0"),
      0,
    );

    return total;
  };

  balance_payable = (): number => {
    return this.getInvoicePercentage("1").decrease - this.tax_paid();
  };

  getPenalty = (): number => {
    const month: string = this.return01.month ?? "April";
    const year: string = this.return01.year;
    const currentDate: Date = new Date();

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
    if (this.isComp) {
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
    if (
      this.return01.rr_number == null ||
      this.return01.rr_number == undefined ||
      this.return01.rr_number == ""
    ) {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(year), monthIndex, 29),
        currentDate,
      );
      return isNegative(Math.min(100 * pdiff_days, 10000))
        ? 0
        : Math.min(100 * pdiff_days, 10000);
    } else {
      pdiff_days = getDaysBetweenDates(
        new Date(parseInt(year), monthIndex, 29),
        new Date(this.return01.transaction_date ?? currentDate.toISOString()),
      );
      return isNegative(Math.min(100 * pdiff_days, 10000))
        ? 0
        : Math.min(100 * pdiff_days, 10000);
    }
  };

  // interest calculation logic

  getInterestDueDate = (
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

  calculateInterest = (
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
  getInterest = (): number => {
    if (!this.return01.month) return 0;

    const dueDate = this.getInterestDueDate(
      this.return01.year,
      this.return01.month,
      this.isComp,
    );

    const interest = this.calculateInterest(
      this.getR6_1(),
      dueDate,
      this.paidChallans,
      15,
    );
    return isNegative(interest) ? 0 : interest;
  };

  getSaleOfPercentage = (value: string): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_6 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS),
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_7 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.PROCESSED_GOODS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  get4_9 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
        val.sale_of == SaleOf.GOODS_TAXABLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get5_1 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  get5_2 = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getCreditNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        // val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getDebitNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        // val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };
  getGoodsReturnsNote = (): PercentageOutput => {
    let increase: number = 0;
    let decrease: number = 0;
    const output: returns_entry[] = this.returns_entry.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );
    for (let i = 0; i < output.length; i++) {
      increase = increase + parseFloat(output[i].amount ?? "0");
      decrease = decrease + parseFloat(output[i].vatamount ?? "0");
    }
    return {
      increase: parseFloat(increase.toFixed(2)),
      decrease: parseFloat(decrease.toFixed(2)),
    };
  };

  getR6_1 = (): number => {
    return (
      this.getInvoicePercentage("1").decrease +
      this.get4_6().decrease +
      this.get4_7().decrease -
      this.get4_9().decrease -
      (this.get5_1().decrease +
        this.get5_2().decrease +
        (this.getCreditNote().decrease -
          this.getDebitNote().decrease -
          this.getGoodsReturnsNote().decrease))
    );
  };
  total = (): number => {
    return this.balance_payable() + this.getPenalty() + this.getInterest();
  };
}
