import {
  CategoryOfEntry,
  DvatType,
  returns_entry,
  SaleOf,
} from "@prisma/client";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface TurnOverProps {
  returnsentrys: returns_entry[];
  lastMonthCash: string;
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

  const getSalesDebitNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
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
  const getGoodsReturns = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
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
  const getSaleCanceled = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.SALE_CANCELLED &&
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
  const getSalesCreditNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
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
            R4.1.1 Goods taxable at 3%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("3").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {getInvoicePercentage("3").decrease}
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
            {(
              parseFloat(getSalesDebitNote().decrease) -
              (parseFloat(getGoodsReturns().decrease) +
                parseFloat(getSaleCanceled().decrease) +
                parseFloat(props.lastMonthCash) +
                parseFloat(getSalesCreditNote().decrease))
            ).toFixed(2)}
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
              parseFloat(get4_9().decrease) +
              (parseFloat(getSalesDebitNote().decrease) -
                (parseFloat(getGoodsReturns().decrease) +
                  parseFloat(getSaleCanceled().decrease) +
                  parseFloat(props.lastMonthCash) +
                  parseFloat(getSalesCreditNote().decrease)))
            ).toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TurnOver;
