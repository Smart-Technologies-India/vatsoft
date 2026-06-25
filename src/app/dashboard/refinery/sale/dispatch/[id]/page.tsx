"use client";

import GetVatpaidInvoiceById, {
  VatpaidInvoiceDetail,
} from "@/action/refinery_sale/getvatpaidinvoicebyid";
import GetCompletedDailyPurchaseView, {
  CompletedDailyPurchaseView,
} from "@/action/refinery_sale/getcompleteddailypurchaseview";
import DispatchRefinerySale from "@/action/refinery_sale/dispatchrefinerysale";
import { DateSelect } from "@/components/forms/inputfields/dateselect";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { TaxtInput } from "@/components/forms/inputfields/textinput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { format } from "date-fns";

type DispatchFormValues = {
  invoiceNumber: string;
  invoiceDate: string;
  vehicleNumber?: string;
  kiloLiter: string;
  cstpurchase: string;
};

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
  const [tankerOptions, setTankerOptions] = useState<string[]>([]);
  const [completedPurchaseView, setCompletedPurchaseView] =
    useState<CompletedDailyPurchaseView | null>(null);

  const methods = useForm<DispatchFormValues>({
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: "",
      vehicleNumber: undefined,
      kiloLiter: "",
      cstpurchase: "",
    },
  });

  const { handleSubmit, reset } = methods;
  const canDispatch = invoice?.refineryStatus === "VATPAID";

  const currentWorkflowStatus = useMemo(() => {
    if (!invoice || invoice.rows.length === 0) {
      return "SALE";
    }

    const statuses = invoice.rows.map((row) => row.refinery_status || "SALE");

    if (statuses.includes("COMPLETED")) {
      return "COMPLETED";
    }
    if (statuses.includes("DISPATCH")) {
      return "DISPATCH";
    }
    if (statuses.every((status) => status === "VATPAID")) {
      return "VATPAID";
    }

    return "SALE";
  }, [invoice]);

  useEffect(() => {
    const loadInvoice = async () => {
      const res = await GetVatpaidInvoiceById(id);
      const data = res.data;
      if (res.status && data) {
        setInvoice(data);
        const tankerList = data.tankerOptions || [];
        setTankerOptions(tankerList);

        reset({
          invoiceNumber: data.invoiceNumber,
          invoiceDate:
            data.refineryStatus === "VATPAID"
              ? new Date().toISOString()
              : new Date(data.invoiceDate).toISOString(),
          vehicleNumber: tankerList[0] || undefined,
          kiloLiter: "",
          cstpurchase: "",
        });

        if (data.refineryStatus === "COMPLETED") {
          const completedResponse = await GetCompletedDailyPurchaseView(id);
          if (completedResponse.status && completedResponse.data) {
            setCompletedPurchaseView(completedResponse.data);
          } else {
            setCompletedPurchaseView(null);
          }
        } else {
          setCompletedPurchaseView(null);
        }
      } else {
        toast.error(res.message || "Invoice not found.");
      }
      setLoading(false);
    };

    void loadInvoice();
  }, [id, reset]);

  const handleApproveRelease = async (data: DispatchFormValues) => {
    if (!canDispatch) {
      toast.info("This invoice is already processed and available in view mode.");
      return;
    }

    if (!data.invoiceNumber.trim()) {
      toast.error("Invoice Number is required.");
      return;
    }
    if (!data.invoiceDate) {
      toast.error("Invoice Date is required.");
      return;
    }
    if (!data.vehicleNumber?.trim()) {
      toast.error("Vehicle Number is required.");
      return;
    }
    if (!data.kiloLiter.trim()) {
      toast.error("Kilo Liter is required.");
      return;
    }
    if (!data.cstpurchase.trim()) {
      toast.error("CST Purchase value is required.");
      return;
    }

    const parsedInvoiceDate = new Date(data.invoiceDate);
    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      toast.error("Invoice Date is invalid.");
      return;
    }

    const parsedKiloLiter = Number.parseFloat(data.kiloLiter);
    if (!Number.isFinite(parsedKiloLiter) || parsedKiloLiter <= 0) {
      toast.error("Kilo Liter must be greater than 0.");
      return;
    }

    setSubmitting(true);
    const res = await DispatchRefinerySale({
      id,
      invoice_number: data.invoiceNumber,
      invoice_date: format(parsedInvoiceDate, "dd/MM/yyyy"),
      vehicle_number: data.vehicleNumber,
      kilo_liter: parsedKiloLiter.toString(),
      cstpurchase: data.cstpurchase,
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
          {invoice?.refineryStatus && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
              Status: {invoice.refineryStatus}
            </span>
          )}
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
                {/* <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Sr. No.
                </TableHead> */}
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Product Name
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Litres
                </TableHead>
                {/* <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
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
                </TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.rows.map((row, idx) => {
                const amount = Number.parseFloat(row.amount || "0");
                const vat = Number.parseFloat(row.vatamount || "0");
                const total = amount + vat;
                return (
                  <TableRow key={row.id} className="border-b">
                    {/* <TableCell className="text-center p-2 text-xs">
                      {idx + 1}
                    </TableCell> */}
                    <TableCell className="text-center p-2 text-xs">
                      {row.commodity_master.product_name}
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      {row.quantity.toLocaleString("en-IN")}
                    </TableCell>
                    {/* <TableCell className="text-center p-2 text-xs">
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
                    </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {invoice.refineryStatus === "COMPLETED" ? (
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              Completed Purchase View
            </div>
            {completedPurchaseView?.rows?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white">
                      <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                        Product
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                        Quantity
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                        Tax %
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                        Amount
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                        Tax
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedPurchaseView.rows.map((row) => (
                      <TableRow key={row.id} className="bg-white border-b">
                        <TableCell className="text-center p-2 text-xs">
                          {row.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {row.quantity.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {row.tax_percent}%
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(row.vatamount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Daily purchase details are not available for this completed invoice.
              </div>
            )}
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleApproveRelease)}>
              {/* Invoice Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <TaxtInput<DispatchFormValues>
                    name="invoiceNumber"
                    title="Invoice Number"
                    required={true}
                  />
                </div>
                <div>
                  <DateSelect<DispatchFormValues>
                    name="invoiceDate"
                    title="Invoice Date"
                    placeholder="Select Invoice Date"
                    required={true}
                    format="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Purchaser</div>
                  <div className="text-sm font-semibold text-gray-800 py-1.5">
                    {invoice.buyer.name_of_dealer}
                  </div>
                </div>
              </div>

              {/* Vehicle + Liter Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <MultiSelect<DispatchFormValues>
                    name="vehicleNumber"
                    title="Vehicle No"
                    placeholder={
                      tankerOptions.length ? "Select tanker" : "No tanker mapped"
                    }
                    required={true}
                    options={tankerOptions.map((tanker) => ({
                      value: tanker,
                      label: tanker,
                    }))}
                    disable={!tankerOptions.length}
                  />
                </div>
                <div>
                  <TaxtInput<DispatchFormValues>
                    name="kiloLiter"
                    title="Kilo Liter"
                    required={true}
                    numdes={true}
                  />
                </div>
                <div>
                  <TaxtInput<DispatchFormValues>
                    name="cstpurchase"
                    title="CST Purchase"
                    required={true}
                    numdes={true}
                  />
                </div>
              </div>

              {/* Approve Button */}
              <button
                type="submit"
                disabled={submitting || !canDispatch}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded mb-6"
              >
                {submitting
                  ? "Processing..."
                  : canDispatch
                    ? "Approve and Release"
                    : "View Only"}
              </button>
            </form>
          </FormProvider>
        )}

        {/* Steps */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Steps</div>
          <ol className="flex flex-col gap-2">
            {[
              {
                label: "Accept invoice",
                done: true,
              },
              {
                label: "Tax Paid",
                done: ["VATPAID", "DISPATCH", "COMPLETED"].includes(currentWorkflowStatus),
              },
              {
                label: "Approve by refinery",
                done: ["DISPATCH", "COMPLETED"].includes(currentWorkflowStatus),
              },
              {
                label: "Completed",
                done: currentWorkflowStatus === "COMPLETED",
              },
            ].map((step, index) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    step.done
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-sm ${
                    step.done ? "text-green-700 font-medium" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
