"use client";

import getReturnEntryReportById from "@/action/return/getreturnentryreportbyid";
import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import {
  dvat04,
  DvatType,
  returns_01,
  returns_entry,
  state,
  tin_number_master,
} from "@prisma/client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type ReturnEntryWithRelations = returns_entry & {
  seller_tin_number: tin_number_master;
  state: state | null;
};

type Return01WithDvat = returns_01 & {
  dvat04: dvat04;
};

const formatIndianNumber = (value: string | number | null | undefined) => {
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat((value ?? "0").toString().replaceAll(",", "")) || 0;

  return numericValue.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const PurchaseSaleReportByIdPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string | string[] }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [return01, setReturn01] = useState<Return01WithDvat | null>(null);
  const [entries, setEntries] = useState<ReturnEntryWithRelations[]>([]);

  const encryptedId = Array.isArray(id) ? id[0] : id;

  const returnId = useMemo(() => {
    const decrypted = decryptURLData(encryptedId, router);
    const parsed = parseInt(decrypted, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [encryptedId, router]);

  const nonNilEntries = useMemo(
    () => entries.filter((item) => !item.isnil),
    [entries],
  );

  const dvat31Entries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_31),
    [nonNilEntries],
  );
  const dvat31AEntries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_31_A),
    [nonNilEntries],
  );
  const dvat30Entries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_30),
    [nonNilEntries],
  );
  const dvat30AEntries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_30_A),
    [nonNilEntries],
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!returnId) {
        setLoading(false);
        toast.error("Invalid return id");
        return;
      }

      try {
        setLoading(true);
        const response = await getReturnEntryReportById({
          id: returnId,
        });

        if (!response.status || !response.data) {
          toast.error(response.message || "Unable to load return data");
          setReturn01(null);
          setEntries([]);
          return;
        }

        setReturn01(response.data.returns_01);
        setEntries(response.data.returns_entry ?? []);
      } catch {
        toast.error("Unable to load return data");
        setReturn01(null);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [returnId]);

  const renderSection = (
    title: string,
    sectionEntries: ReturnEntryWithRelations[],
  ) => {
    if (sectionEntries.length === 0) {
      return (
        <div className="mt-4">
          <h3 className="font-semibold text-xs mb-2">{title}</h3>
          <p className="text-xs">No entries found.</p>
        </div>
      );
    }

    const taxSummary = sectionEntries.reduce(
      (acc, item) => {
        const taxPercent = item.tax_percent || "0";
        const amount = parseFloat(item.amount || "0") || 0;
        const vatAmount = parseFloat(item.vatamount || "0") || 0;
        const totalValue = parseFloat(item.total_invoice_number || "0") || 0;

        if (!acc[taxPercent]) {
          acc[taxPercent] = {
            invoiceNumbers: new Set<string>(),
            totalInvoiceValue: 0,
            totalAmount: 0,
            totalVatAmount: 0,
          };
        }

        if (item.invoice_number) {
          acc[taxPercent].invoiceNumbers.add(item.invoice_number);
        }
        acc[taxPercent].totalInvoiceValue += totalValue;
        acc[taxPercent].totalAmount += amount;
        acc[taxPercent].totalVatAmount += vatAmount;

        return acc;
      },
      {} as Record<
        string,
        {
          invoiceNumbers: Set<string>;
          totalInvoiceValue: number;
          totalAmount: number;
          totalVatAmount: number;
        }
      >,
    );

    const summaryRows = Object.entries(taxSummary).sort(
      ([taxA], [taxB]) => parseFloat(taxA) - parseFloat(taxB),
    );

    const grandInvoices = new Set(
      sectionEntries
        .map((item) => item.invoice_number)
        .filter((invoice): invoice is string => Boolean(invoice)),
    ).size;

    const grandTotalInvoiceValue = summaryRows.reduce(
      (total, [, summary]) => total + summary.totalInvoiceValue,
      0,
    );
    const grandTotalAmount = summaryRows.reduce(
      (total, [, summary]) => total + summary.totalAmount,
      0,
    );
    const grandTotalVatAmount = summaryRows.reduce(
      (total, [, summary]) => total + summary.totalVatAmount,
      0,
    );

    return (
      <div className="mt-4">
        <h3 className="font-semibold text-xs mb-2">{title}</h3>
        <table border={1} className="w-full text-[0.65rem]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1">#</th>
              <th className="border border-black px-1 py-1">Invoice No</th>
              <th className="border border-black px-1 py-1">Invoice Date</th>
              <th className="border border-black px-1 py-1">Seller TIN</th>
              <th className="border border-black px-1 py-1">State</th>
              <th className="border border-black px-1 py-1">Quantity</th>
              <th className="border border-black px-1 py-1">Tax %</th>
              <th className="border border-black px-1 py-1">Amount</th>
              <th className="border border-black px-1 py-1">VAT Amount</th>
              <th className="border border-black px-1 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sectionEntries.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black px-1 py-1 text-center">
                  {index + 1}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.invoice_number || "-"}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.invoice_date ? formateDate(item.invoice_date) : "-"}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.seller_tin_number?.tin_number || "-"}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.state?.name || "-"}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.quantity ?? 0}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.tax_percent || "0"}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {formatIndianNumber(item.amount)}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {formatIndianNumber(item.vatamount)}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {formatIndianNumber(item.total_invoice_number)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {summaryRows.map(([taxPercent, summary]) => (
              <tr key={`summary-${title}-${taxPercent}`}>
                <td
                  className="border border-black px-1 py-1 text-center font-semibold"
                  colSpan={5}
                >
                  Total (Tax % {taxPercent})
                </td>
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  Invoices: {summary.invoiceNumbers.size}
                </td>
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  {taxPercent}
                </td>
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  {formatIndianNumber(summary.totalAmount)}
                </td>
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  {formatIndianNumber(summary.totalVatAmount)}
                </td>
                <td className="border border-black px-1 py-1 text-center font-semibold">
                  {formatIndianNumber(summary.totalInvoiceValue)}
                </td>
              </tr>
            ))}
            <tr>
              <td
                className="border border-black px-1 py-1 text-center font-semibold"
                colSpan={5}
              >
                Grand Total
              </td>
              <td className="border border-black px-1 py-1 text-center font-semibold">
                Invoices: {grandInvoices}
              </td>
              <td className="border border-black px-1 py-1 text-center font-semibold">
                -
              </td>
              <td className="border border-black px-1 py-1 text-center font-semibold">
                {formatIndianNumber(grandTotalAmount)}
              </td>
              <td className="border border-black px-1 py-1 text-center font-semibold">
                {formatIndianNumber(grandTotalVatAmount)}
              </td>
              <td className="border border-black px-1 py-1 text-center font-semibold">
                {formatIndianNumber(grandTotalInvoiceValue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <section className="px-5 py-4">
      <div className="w-full mx-auto flex items-center gap-3 mb-4 no-print">
        <button
          onClick={() => router.back()}
          className="py-1 px-4 border text-xs rounded bg-white text-gray-700"
        >
          Back
        </button>
        <button
          onClick={() => generatePDF(pathname, "purchase_sale_report.pdf")}
          className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
        >
          Download PDF
        </button>
      </div>

      <main className="bg-white p-4 w-full mx-auto border border-black">
        <div className="border border-black py-2 mt-4 mx-auto leading-3">
          <p className="text-center font-semibold text-xs leading-4">
            DEPARTMENT OF VALUE ADDED TAX
          </p>
          <p className="text-center font-semibold text-xs leading-4">
            UT Administration of Dadra & Nagar Haveli
          </p>
          <p className="text-center font-semibold text-xs leading-4">
            Form DVAT 16 - Purchase/Sale Report
          </p>
        </div>
        <div className="mt-4 border border-black py-2 w-full">
          <h1 className="text-center text-sm leading-4">
            Company Name : {return01?.dvat04?.tradename ?? "-"}
          </h1>
          <p className="text-center text-xs leading-4">
            TIN Number : {return01?.dvat04?.tinNumber ?? "-"} Period (
            {return01?.month ?? "-"} {return01?.year ?? "-"})
          </p>
        </div>

        <table border={1} className="w-full mx-auto mt-4">
          <tbody>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                Return Id
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                {return01?.id ?? "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                RR No
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                {return01?.rr_number || "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                Return Type
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                {return01?.return_type ?? "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mx-auto mt-5">
          <h2 className="font-semibold text-xs mb-2">Returns Entry Data</h2>

          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : nonNilEntries.length === 0 ? (
            <p className="text-xs">No entry data found for this return id.</p>
          ) : (
            <>
              {renderSection("DVAT_31 - Sales Local", dvat31Entries)}
              {renderSection("DVAT_31_A - Sales Inter State", dvat31AEntries)}
              {renderSection("DVAT_30 - Purchase Local", dvat30Entries)}
              {renderSection(
                "DVAT_30_A - Purchase Inter State",
                dvat30AEntries,
              )}
            </>
          )}
        </div>
      </main>
    </section>
  );
};

export default PurchaseSaleReportByIdPage;
