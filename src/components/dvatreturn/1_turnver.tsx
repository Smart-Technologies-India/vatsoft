import { returns_entry } from "@prisma/client";
import { R4Turnover } from "./vatcalculation";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

interface TurnOverProps {
  returnsentrys: returns_entry[];
  lastMonthCash: string;
}

const TurnOver = (props: TurnOverProps) => {
  const r4Turnover = new R4Turnover(
    props.returnsentrys,
    parseFloat(props.lastMonthCash),
  );

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
            {r4Turnover.getInvoicePercentage("0").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("0").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.1 Goods taxable at 1%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("1").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("1").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.1 Goods taxable at 2%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("2").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("2").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.1.1 Goods taxable at 3%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("3").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("3").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2 Goods taxable at 4%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("4").decrease}
          </td>
        </tr>

        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2.1 Goods taxable at 5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.2 Goods taxable at 6%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("6").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("6").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3 Goods taxable at 12.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("12.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.1 Goods taxable at 12.75%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("12.75").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("12.75").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.2 Goods taxable at 13.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("13.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("13.5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.3.3 Goods taxable at 15%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("15").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("15").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.4 Goods taxable at 20%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("20").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getInvoicePercentage("20").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.1 Works contract taxable at 4%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("4").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.1.a Works contract taxable at 5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("5").decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.5.2 Works contract taxable at 12.5%
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.getSaleOfPercentage("12.5").decrease}
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
            {r4Turnover.get4_6().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.get4_6().decrease}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            R4.7 Goods Manufactured, Processed and assembled by eligible Unit
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.get4_7().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {r4Turnover.get4_7().decrease}
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
            {r4Turnover.get4_8()}
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
            {r4Turnover.get4_9().toFixed(2)}
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
            {r4Turnover.get4_10().toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TurnOver;
