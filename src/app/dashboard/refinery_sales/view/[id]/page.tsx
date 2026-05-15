"use client";

import GetCurrentDvatRefinerySaleById, {
  CurrentDvatRefineryInvoiceView,
} from "@/action/refinery_sale/getcurrentdvatrefinerysalebyid";
import PayRefinerySaleTax from "@/action/refinery_sale/payrefinerysaletax";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const formatDate = (value: Date | string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const formatCurrency = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const RefinerySaleInvoiceViewPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isPayingTax, setIsPayingTax] = useState(false);
  const [invoiceData, setInvoiceData] =
    useState<CurrentDvatRefineryInvoiceView | null>(null);

  const invoiceId = Number.parseInt(params.id, 10);

  const loadInvoice = async () => {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      toast.error("Invalid invoice id.");
      router.push("/dashboard/refinery_sales");
      return;
    }

    setIsLoading(true);
    try {
      const response = await GetCurrentDvatRefinerySaleById({ id: invoiceId });
      if (!response.status || !response.data) {
        toast.error(response.message || "Unable to load invoice details.");
        router.push("/dashboard/refinery_sales");
        return;
      }

      setInvoiceData(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const hasSaleStatus = useMemo(() => {
    if (!invoiceData) {
      return false;
    }

    return invoiceData.rows.some((row) => row.refinery_status === "SALE");
  }, [invoiceData]);

  const isVatPaid = useMemo(() => {
    if (!invoiceData || invoiceData.rows.length === 0) {
      return false;
    }

    return invoiceData.rows.every((row) => row.refinery_status === "VATPAID");
  }, [invoiceData]);

  const handlePayTax = async () => {
    if (!invoiceData || !hasSaleStatus) {
      return;
    }

    setIsPayingTax(true);
    try {
      const response = await PayRefinerySaleTax({ id: invoiceId });
      if (!response.status) {
        toast.error(response.message || "Unable to update tax status.");
        return;
      }

      toast.success(response.message);
      await loadInvoice();
    } finally {
      setIsPayingTax(false);
    }
  };

  const totals = useMemo(() => {
    if (!invoiceData) {
      return {
        invoiceValue: 0,
        vatAmount: 0,
        taxableValue: 0,
      };
    }

    return invoiceData.rows.reduce(
      (acc, row) => {
        const taxable = Number.parseFloat(row.amount || "0");
        const vat = Number.parseFloat(row.vatamount || "0");
        acc.taxableValue += taxable;
        acc.vatAmount += vat;
        acc.invoiceValue += taxable + vat;
        return acc;
      },
      { invoiceValue: 0, vatAmount: 0, taxableValue: 0 },
    );
  }, [invoiceData]);

  if (isLoading) {
    return (
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto flex min-h-56 items-center justify-center">
          <Spin />
        </div>
      </main>
    );
  }

  if (!invoiceData) {
    return null;
  }

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Invoice Tax Workflow</h1>
            <button
              className="text-xl leading-none text-gray-500 hover:text-gray-700"
              onClick={() => router.push("/dashboard/refinery_sales")}
              aria-label="Close"
            >
              x
            </button>
          </div>

          <div className="mt-3 rounded border border-gray-200 bg-gray-100 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-2xl font-medium text-gray-900">{invoiceData.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="text-2xl font-medium text-gray-900">{formatDate(invoiceData.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seller</p>
              <p className="text-2xl font-medium text-gray-900">
                {invoiceData.refinery.tradename || invoiceData.refinery.name || "Refinery"}
              </p>
            </div>
          </div>

          <div className="mt-3 border border-gray-200 rounded overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Sr. No.</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Product Name</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Litres</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Invoice Value</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Tax Rate</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">VAT Amount</TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700">Taxable Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData.rows.map((row, index) => {
                  const taxable = Number.parseFloat(row.amount || "0");
                  const vat = Number.parseFloat(row.vatamount || "0");
                  const total = taxable + vat;

                  return (
                    <TableRow key={row.id} className="border-b hover:bg-gray-50">
                      <TableCell className="text-center p-2 text-sm">{index + 1}</TableCell>
                      <TableCell className="text-center p-2 text-sm">{row.commodity_master.product_name}</TableCell>
                      <TableCell className="text-center p-2 text-sm">{row.quantity}</TableCell>
                      <TableCell className="text-center p-2 text-sm">Rs {formatCurrency(total)}</TableCell>
                      <TableCell className="text-center p-2 text-sm">{formatCurrency(Number.parseFloat(row.tax_percent || "0"))}%</TableCell>
                      <TableCell className="text-center p-2 text-sm">Rs {formatCurrency(vat)}</TableCell>
                      <TableCell className="text-center p-2 text-sm">Rs {formatCurrency(taxable)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="primary"
              onClick={handlePayTax}
              loading={isPayingTax}
              disabled={!hasSaleStatus}
            >
              Pay Tax
            </Button>
            {!hasSaleStatus && (
              <span className="text-xs text-gray-600">Tax is already paid for this invoice.</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <h2 className="text-xl font-semibold text-gray-900">Steps</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold">1</span>
              <span className="text-green-700 font-medium">Accept invoice</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                  isVatPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                2
              </span>
              <span className={isVatPaid ? "text-green-700 font-medium" : "text-gray-600"}>Tax Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-semibold">3</span>
              <span className="text-gray-600">Approve by refinery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-semibold">4</span>
              <span className="text-gray-600">Shipped</span>
            </div>
          </div>

          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-600">Invoice Value</p>
              <p className="text-sm font-semibold text-gray-900">Rs {formatCurrency(totals.invoiceValue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">VAT Amount</p>
              <p className="text-sm font-semibold text-gray-900">Rs {formatCurrency(totals.vatAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Taxable Value</p>
              <p className="text-sm font-semibold text-gray-900">Rs {formatCurrency(totals.taxableValue)}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RefinerySaleInvoiceViewPage;
