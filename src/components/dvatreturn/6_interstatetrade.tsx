import {
  CategoryOfEntry,
  DvatType,
  NaturePurchase,
  PurchaseType,
  returns_entry,
  SaleOfInterstate,
} from "@prisma/client";
import { InterState } from "./vatcalculation";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface InterStateTradeProps {
  returnsentrys: returns_entry[];
}

const InterStateTrade = (props: InterStateTradeProps) => {
  const interState = new InterState(props.returnsentrys);
  // const get10_1 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       (dvattype == DvatType.DVAT_31_A
  //         ? val.sale_of_interstate == SaleOfInterstate.FORMF
  //         : val.purchase_type == PurchaseType.STOCK_TRANSFER),
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
  // const get10_2 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       (val.sale_of_interstate == SaleOfInterstate.FORMC ||
  //         val.purchase_type == PurchaseType.FORMC_CONCESSION),
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
  // const get10_3 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.FORMI,
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
  // const get10_4 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.FORMH,
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
  // const get10_6_1 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.purchase_type == PurchaseType.TAXABLE_RATE &&
  //       val.nature_purchase == NaturePurchase.OTHER_GOODS,
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
  // const get10_6 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.TAXABLE_SALE &&
  //       val.nature_purchase == NaturePurchase.CAPITAL_GOODS,
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
  // const get10_7 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.EXPORT_OUTOF_INDIA,
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
  // const get10_8 = (dvattype: DvatType): PercentageOutput => {
  //   let increase: string = "0";
  //   let decrease: string = "0";
  //   const output: returns_entry[] = props.returnsentrys.filter(
  //     (val: returns_entry) =>
  //       val.dvat_type == dvattype &&
  //       val.category_of_entry == CategoryOfEntry.INVOICE &&
  //       val.sale_of_interstate == SaleOfInterstate.EXEMPT_US6,
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
            {interState.get10_1(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_1(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.2 Against C Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_2(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_2(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.3 Against I Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_3(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_3(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.4 Against H Forms
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_4(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_4(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.5 Sale of Goods in course of Export out of India (As defined in Section 5(1) of the Act)
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
            R10.6 Sale of Goods in course of Import into India (As defined in Section 5(2) of the Act)(High Seas Sale/Purchase)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_6(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_6(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.7 Sale of Goods exempt u/s 6(2) of CST Act
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_7(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_7(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.8 Sale of Excepted Goods specified in schedule-I of daman and Diu Value Added tax Regulation, 2005
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_8(DvatType.DVAT_31_A).increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {interState.get10_8(DvatType.DVAT_30_A).increase}
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
            {interState.get10_6_1(DvatType.DVAT_30_A).increase}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R10.9 Against any other Forms
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
            {/* {(
              parseFloat(get10_1(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_2(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_3(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_4(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_6(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_7(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_8(DvatType.DVAT_31_A).increase) +
              parseFloat(get10_6_1(DvatType.DVAT_31_A).increase)
            ).toFixed(2)} */}
            {interState.total_dvat_31_A()}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {(
              parseFloat(get10_1(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_2(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_3(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_4(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_6(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_7(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_8(DvatType.DVAT_30_A).increase) +
              parseFloat(get10_6_1(DvatType.DVAT_30_A).increase)
            ).toFixed(2)} */}
            {interState.total_dvat_30_A()}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default InterStateTrade;
