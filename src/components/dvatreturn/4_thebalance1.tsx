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
import { TheBalance } from "./vatcalculation";

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
  lastMonthCash: string;
}

const THEBALANCE1 = (props: THEBALANCEProps) => {
  const thebalance = new TheBalance(
    props.returnsentrys,
    props.paidChallans,
    props.return01,
    parseFloat(props.lastMonthDue),
    parseFloat(props.lastMonthCash),
    props.isComp,
  );
  const paidChallanCpins = props.paidChallans
    .map((challan) => challan.cpin)
    .filter((cpin): cpin is string => Boolean(cpin && cpin.trim()))
    .join(", ");

  const latestPaidChallanDate = props.paidChallans
    .map((challan) => challan.transaction_date ?? challan.createdAt)
    .filter((date): date is Date => Boolean(date))
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];

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
            {/* {isNegative(getNetPayable()) ? 0 : getNetPayable().toFixed(2)} */}
            {thebalance.posivite().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            Excess cash payment carried forward to next month (if any)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {/* {(pendingcashtwo() + pendingcashone()).toFixed(2)} */}
            {/* {thebalance.excess_cash_payment()} */}
            {thebalance.excessCash().toFixed(2)}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.1 Challan number by which payment made
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {thebalance.posivite() != 0 ? paidChallanCpins || "-" : "-"}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            R8.2 Date of payment
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[50%]">
            {thebalance.posivite() != 0
              ? latestPaidChallanDate
                ? formateDate(latestPaidChallanDate)
                : "-"
              : "-"}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default THEBALANCE1;
