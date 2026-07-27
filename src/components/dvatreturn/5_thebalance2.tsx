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
