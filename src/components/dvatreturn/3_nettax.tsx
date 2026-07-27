import { challan, returns_01, returns_entry } from "@prisma/client";
import { NetTaxCalculation } from "./vatcalculation";

interface NetTaxProps {
  returnsentrys: returns_entry[];
  return01: returns_01;
  lastMonthDue: string;
  isComp: boolean;
  challan_amount: number;
  paidChallans: challan[];
  lastMonthCash: string;
}

const NetTax = (props: NetTaxProps) => {
  const netTaxCalculation = new NetTaxCalculation(
    props.returnsentrys,
    props.paidChallans,
    props.return01,
    parseFloat(props.lastMonthDue),
    parseFloat(props.lastMonthCash),
    props.isComp,
  );

  return (
    <table
      border={1}
      className="w-5/6 mx-auto mt-4"
      style={{ pageBreakInside: "avoid" }}
    >
      <tbody className="w-full" style={{ display: "table-header-group" }}>
        <tr className="w-full" style={{ pageBreakInside: "avoid" }}>
          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[80%]">
            R6.1 Net Tax (R4.10)-(R5.6)
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem] w-[20%]">
            {/* {getR6_1().toFixed(2)} */}
            {netTaxCalculation.getR6_1()}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2a :Interest
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {isNegative(getR6_2a()) ? "0" : getR6_2a().toFixed(0)} */}
            {netTaxCalculation.getInterest().toFixed(2)}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2b :Penalty
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {isNegative(lateFees) ? 0 : lateFees} */}
            {netTaxCalculation.getPenalty()}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.2c :Other
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {props.challan_amount.toFixed(2)  } */}0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R6.3 Less : Tax deducted at source
          </td>

          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            0
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R7 Balance (R6.1+R6.2-R6.3)
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {/* {getNetPayable().toFixed(2)} */}
            {netTaxCalculation.total().toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default NetTax;
