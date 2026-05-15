"use client";

import GetVatpaidInvoiceById, {
  VatpaidInvoiceDetail,
} from "@/action/refinery_sale/getvatpaidinvoicebyid";
import DispatchRefinerySale from "@/action/refinery_sale/dispatchrefinerysale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";

const formatCurrency = (val: string | null | undefined) =>
  val
    ? Number.parseFloat(val).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

export default function DispatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<VatpaidInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editable fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [shipmentTime, setShipmentTime] = useState("");

  useEffect(() => {
    GetVatpaidInvoiceById(id).then((res) => {
      if (res.status && res.data) {
        setInvoice(res.data);
        setInvoiceNumber(res.data.invoiceNumber);
        setInvoiceDate(
          format(new Date(res.data.invoiceDate), "yyyy-MM-dd")
        );
      } else {
        toast.error(res.message || "Invoice not found.");
      }
      setLoading(false);
    });
  }, [id]);

  const handleApproveRelease = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Invoice Number is required.");
      return;
    }
    if (!invoiceDate) {
      toast.error("Invoice Date is required.");
      return;
    }
    if (!vehicleNumber.trim()) {
      toast.error("Vehicle Number is required.");
      return;
    }
    if (!shipmentTime) {
      toast.error("Shipment Time is required.");
      return;
    }

    setSubmitting(true);
    const res = await DispatchRefinerySale({
      id,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      vehicle_number: vehicleNumber,
      shipment_time: shipmentTime,
    });

    if (res.status) {
      toast.success("Invoice dispatched successfully.");
      router.back();
    } else {
      toast.error(res.message || "Failed to dispatch.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-sm text-red-500">Invoice not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-semibold text-gray-800">
            Invoice Shipment Workflow
          </h1>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Product Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Sr. No.
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Product Name
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Litres
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Taxable Value
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Rate of Tax
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  VAT Amount
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Invoice Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.rows.map((row, idx) => {
                const amount = Number.parseFloat(row.amount || "0");
                const vat = Number.parseFloat(row.vatamount || "0");
                const total = amount + vat;
                return (
                  <TableRow key={row.id} className="border-b">
                    <TableCell className="text-center p-2 text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {row.commodity_master.product_name}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {row.quantity.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {row.tax_percent}%
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatCurrency(row.vatamount)}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {formatCurrency(String(total))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Invoice Info Row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-xs text-gray-500 mb-1">Invoice Number</div>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Invoice Date</div>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Purchaser</div>
            <div className="text-sm font-semibold text-gray-800 py-1.5">
              {invoice.buyer.name_of_dealer}
            </div>
          </div>
        </div>

        {/* Vehicle + Shipment Time Row */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Vehicle No
            </label>
            <input
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. GJ-05-DH-1234"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Shipment Time
            </label>
            <input
              type="datetime-local"
              value={shipmentTime}
              onChange={(e) => setShipmentTime(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Approve Button */}
        <button
          onClick={handleApproveRelease}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded mb-6"
        >
          {submitting ? "Processing..." : "Approve and Release"}
        </button>

        {/* Steps */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Steps</div>
          <ol className="flex flex-col gap-2">
            {[
              "Accept invoice",
              "Tax Paid",
              "Approve by refinery",
              "Shipped",
            ].map((step, i) => {
              const completed = i < 2; // steps 1 & 2 are done (VATPAID status)
              const current = i === 2;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      completed
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : current
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-sm ${
                      completed
                        ? "text-green-700"
                        : current
                        ? "text-blue-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
