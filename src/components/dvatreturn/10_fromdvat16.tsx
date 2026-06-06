import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  returns_entry,
} from "@prisma/client";

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

interface FORM_DVAT_16Props {
  returnsentrys: returns_entry[];
}

const FORM_DVAT_16 = (props: FORM_DVAT_16Props) => {
  const getFormDvat16Data = (): returns_entry[] => {
    const filtered: returns_entry[] = props.returnsentrys.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS,
    );

    const grouped: Record<string, returns_entry> = {};

    for (const entry of filtered) {
      const key = entry.invoice_number;

      if (!grouped[key]) {
        grouped[key] = { ...entry }; // shallow copy
      } else {
        const existing = grouped[key];

        // Merge comma-separated strings (avoid duplicates if needed)
        existing.description_of_goods += `, ${entry.description_of_goods}`;
        existing.tax_percent += `, ${entry.tax_percent}`;
        // Sum numeric fields (after converting to float)
        const amountSum =
          parseFloat(existing.amount || "0") + parseFloat(entry.amount || "0");
        const vatSum =
          parseFloat(existing.vatamount || "0") +
          parseFloat(entry.vatamount || "0");
        const quantitySum = (existing.quantity || 0) + (entry.quantity || 0);

        existing.amount = amountSum.toFixed(2); // or keep as number if preferred
        existing.vatamount = vatSum.toFixed(2);
        existing.quantity = quantitySum; // assuming you want quantity as string
      }
    }
    for (const key in grouped) {
      const entry = grouped[key];
      const desc = entry.description_of_goods!.toLowerCase();

      if (
        desc.includes("diesel") ||
        desc.includes("high speed petrol") ||
        desc.includes("petrol") ||
        desc.includes("high speed diesel")
      ) {
        entry.description_of_goods = "MS HSD";
      } else if (desc.includes("additives") || desc.includes("oil")) {
        entry.description_of_goods = "Lubricant";
      } else if (desc.includes("cng") || desc.includes("png")) {
        entry.description_of_goods = "NG";
      } else {
        entry.description_of_goods = "IMFL";
      }
    }

    return Object.values(grouped);
    // return output;
  };

  return (
    <>
      <h1 className="text-center font-semibold text-sm mt-4">
        FORM DVAT 16 - Annexure II For VAT Credit : Purchase of Other Goods
      </h1>
      <table border={1} className="w-11/12 mx-auto mt-2">
        <thead className="w-full">
          <tr className="w-full">
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[2%] text-left">
              SI No
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Tax Invoice No
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Date of purchase
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[18%] text-left">
              Name of the Dealer From whom Goods Purchased
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[10%] text-left">
              TIN no of selling dealer
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[18%] text-left">
              Description of Goods
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Quantity (Ltr/Nos)
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Total Amount of tax Invoice
            </th>
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              VAT Charged
            </th>
            {/* <th className="border border-black px-1 leading-4 text-[0.6rem] w-[6%] text-left">
              Rate of Charged
            </th> */}
            <th className="border border-black px-1 leading-4 text-[0.6rem] w-[19%] text-left">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody className="w-full">
          {getFormDvat16Data().map((val: any, index: number) => {
            return (
              <tr className="w-full" key={index}>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {index + 1}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.invoice_number}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {formateDate(new Date(val.invoice_date))}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.seller_tin_number.name_of_dealer}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.seller_tin_number.tin_number}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.description_of_goods}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.quantity}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.total_invoice_number}
                </td>
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.vatamount}
                </td>
                {/* <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.tax_percent}
                </td> */}
                <td className="border border-black px-1 leading-4 text-[0.6rem]">
                  {val.remarks}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default FORM_DVAT_16;
