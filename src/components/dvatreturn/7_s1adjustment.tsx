import {
  CategoryOfEntry,
  DvatType,
  returns_entry,
  SaleOf,
} from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { S1adjustment } from "./vatcalculation";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface S1_1AdjustmentProps {
  returnsentrys: returns_entry[];
  lastMonthCash: string;
}

const S1_1Adjustment = (props: S1_1AdjustmentProps) => {
  const s1adjustment = new S1adjustment(
    props.returnsentrys,
    parseFloat(props.lastMonthCash),
  );
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
  const searchparam = useSearchParams();

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
            {s1adjustment.getGoodsReturns().decrease}
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
            {s1adjustment.getSaleCanceled().decrease}
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
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {searchparam.get("month") == "April" ? "0" : props.lastMonthCash}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Other adjustments(against credit note for sales)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {s1adjustment.getSalesCreditNote().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Other adjustments(against debit note for sales)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {s1adjustment.getSalesDebitNote().decrease}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Total
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {s1adjustment.getSalesDebitNote().decrease}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {(
              parseFloat(getGoodsReturns().decrease) +
              parseFloat(getSaleCanceled().decrease) +
              parseFloat(props.lastMonthCash) +
              parseFloat(getSalesCreditNote().decrease)
            ).toFixed(2)} */}
            {s1adjustment.total()}
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
            {/* {(
              parseFloat(getSalesDebitNote().decrease) -
              (parseFloat(getGoodsReturns().decrease) +
                parseFloat(getSaleCanceled().decrease) +
                parseFloat(props.lastMonthCash) +
                parseFloat(getSalesCreditNote().decrease))
            ).toFixed(2)} */}
            {s1adjustment.totalNetPayable()}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default S1_1Adjustment;
