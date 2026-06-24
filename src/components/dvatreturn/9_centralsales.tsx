import { getDaysBetweenDates } from "@/utils/methods";
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
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const isNegative = (value: number): boolean => {
  return value < 0;
};

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface CentralSalesProps {
  return01: returns_01;
  returnsentrys: returns_entry[];
  lastMonthDue: string;
  lastMonthCash: string;
  isComp: boolean;
  challan_amount: number;
  paidChallans: challan[];
}

const CentralSales = (props: CentralSalesProps) => {
  const searchparam = useSearchParams();

  const paidvatamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.vat);
  }, 0);

  const paidinterestamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.interest);
  }, 0);
  const paidpenaltyamount = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.penalty);
  }, 0);

  const [lateFees, setLateFees] = useState<number>(0);

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
  }, [props.return01, props.returnsentrys]);

  const getLabour = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.LABOUR,
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
        val.sale_of_interstate == SaleOfInterstate.FORMF,
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
        val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA,
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
        val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE,
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
        val.sale_of == SaleOf.GOODS_TAXABLE,
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
  const getFreightCharges = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.FREIGHT_CHARGES,
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
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED),
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
        val.sale_of_interstate == SaleOfInterstate.EXEMPT_US6,
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
        val.sale_of_interstate == SaleOfInterstate.SCHI,
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
        val.sale_of_interstate == SaleOfInterstate.FORMI,
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
  const get10_2 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31_A &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of_interstate == SaleOfInterstate.FORMC ||
          val.purchase_type == PurchaseType.FORMC_CONCESSION),
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
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
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

  ///--------------------------------------
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
  const get5_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
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
        (val.sale_of == SaleOf.GOODS_TAXABLE || val.sale_of == SaleOf.TAXABLE),
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
  // const [lateFees, setLateFees] = useState<number>(0);

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
        parseFloat(props.lastMonthDue) +
        parseFloat(props.lastMonthCash)));

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
    return isNegative(interest) ? 0 : interest;
  };

  const getNetPayable = (): number => {
    const penalty = isNegative(lateFees) ? 0 : lateFees;
    const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
    const vat = getR6_1();

    // Remaining balance per component after their own payments
    const vatBalance = vat - paidvatamount;
    const penaltyBalance = penalty - paidpenaltyamount;
    const interestBalance = interest - paidinterestamount;

    if (vatBalance <= 0) {
      // VAT fully paid or overpaid — excess VAT does NOT reduce penalty/interest.
      // Penalty and interest are shown as independent dues.
      return Math.max(0, penaltyBalance) + Math.max(0, interestBalance);
    }

    // VAT is underpaid — excess paid penalty/interest adjusts the VAT balance.
    const excessPenalty = penaltyBalance < 0 ? Math.abs(penaltyBalance) : 0;
    const excessInterest = interestBalance < 0 ? Math.abs(interestBalance) : 0;
    const adjustedVatBalance = Math.max(
      0,
      vatBalance - excessPenalty - excessInterest,
    );

    return (
      adjustedVatBalance +
      Math.max(0, penaltyBalance) +
      Math.max(0, interestBalance)
    );
  };
  // const adjustAmount = (): number => {
  //   const penalty = isNegative(lateFees) ? 0 : lateFees;
  //   const interest = isNegative(getR6_2a()) ? 0 : getR6_2a();
  //   const vat = getR6_1();

  //   return isNegative(penalty + interest + vat) ? penalty + interest + vat : 0;
  // };

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

  const otherPayments = props.paidChallans.reduce((total, challan) => {
    return total + parseFloat(challan.others);
  }, 0);
  const totalPayable = (): number => {
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
            {(
              parseFloat(getStateSalesTaxable().increase) +
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase) +
              parseFloat(get4_6().increase)
            ).toFixed(2)}
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
              parseFloat(get4_6().increase) +
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
            {(
              parseFloat(getStateSalesTaxable().increase) +
              parseFloat(get4_6().increase)
            ).toFixed(2)}
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
            0
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
            {/* {isNegative(lateFees) ? 0 : lateFees} */}0
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
            {/* {(
              parseFloat(get5_1().decrease) +
              parseFloat(get5_2().decrease) +
              (parseFloat(getDebitNote().decrease) -
                parseFloat(getCreditNote().decrease) -
                parseFloat(getGoodsReturnsNote().decrease) +
                parseFloat(props.lastMonthDue))
            ).toFixed(2)} */}
            {adjustAmount().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Net Payable
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {isNegative(totalPayable()) ? 0 : totalPayable().toFixed(2)}{" "}
            {/* pending_cash */}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default CentralSales;
