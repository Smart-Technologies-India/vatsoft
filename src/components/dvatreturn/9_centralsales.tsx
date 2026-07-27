import { challan, returns_01, returns_entry } from "@prisma/client";
import { CentralSalesCalculation, TheBalance } from "./vatcalculation";

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
  const centralSales = new CentralSalesCalculation(
    props.returnsentrys,
    props.paidChallans,
    props.return01,
    parseFloat(props.lastMonthDue),
    parseFloat(props.lastMonthCash),
    props.isComp,
  );
  const thebalance = new TheBalance(
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
      <thead className="w-full" style={{ display: "table-header-group" }}>
        <tr className="w-full" style={{ pageBreakInside: "avoid" }}>
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
            {/* {(
              parseFloat(getStateSalesTaxable().increase) +
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase) +
              parseFloat(get4_6().increase)
            ).toFixed(2)} */}
            {centralSales.gross_amount()}
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
            {centralSales.getLabour().increase}
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
            {centralSales.getFormF().increase}
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
            {centralSales.getExportIndia().increase}
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
           
            {centralSales.balance_turnover()}
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
           
            {centralSales.deduct_turnover()}
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
           
            {centralSales.balance_turnover_of_inter_State()}
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
            {centralSales.getFreightCharges().increase}
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
            {centralSales.getSaleCanceled().increase}
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
            {/* {(
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)
            ).toFixed(2)} */}
            {centralSales.balance_total_turnover()}
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
            {centralSales.getUS6().increase}
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
            {centralSales.getSch1().increase}
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
            {centralSales.get10_3().increase}
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
            {/* {(
              parseFloat(getInterStateSales().increase) +
              parseFloat(get10_2_6_2().increase)
              ).toFixed(2)} */}
            {centralSales.balance_total_taxable()}
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
            {centralSales.get10_2_6_2().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.get10_2().decrease}
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
            {centralSales.getPercentageValue("0").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("0").decrease}
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
            {centralSales.getPercentageValue("1").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("1").decrease}
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
            {centralSales.getPercentageValue("2").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("2").decrease}
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
            {centralSales.getPercentageValue("4").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("4").decrease}
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
            {centralSales.getPercentageValue("5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("5").decrease}
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
            {centralSales.getPercentageValue("6").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("6").decrease}
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
            {centralSales.getPercentageValue("12.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("12.5").decrease}
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
            {centralSales.getPercentageValue("12.75").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("12.75").decrease}
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
            {centralSales.getPercentageValue("13.5").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("13.5").decrease}
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
            {centralSales.getPercentageValue("15").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("15").decrease}
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
            {centralSales.getPercentageValue("20").increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getPercentageValue("20").decrease}
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
            {centralSales.getProcessedGoods().increase}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.getProcessedGoods().decrease}
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
           
            {centralSales.total_increase()}
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            
            {centralSales.total_decrease()}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Adjusted against VAT Input Credit as per./ TOTAL
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
           
            {centralSales.adjusted_vat()}
          </td>
        </tr>
        <tr className="w-full">
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            Net Payable
          </td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]"></td>
          <td className="border border-black px-2 leading-4 text-[0.6rem]">
            {centralSales.netpayable().toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default CentralSales;
