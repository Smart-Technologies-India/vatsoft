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
  lineItems: Array<{
    saleId: number;
    kiloLiter: string;
  }>;
  cstpurchase: string;
};

const formatCurrency = (val: string | null | undefined) =>
  val
    ? Number.parseFloat(val).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

const formatKiloLiterValue = (liters: number) => {
  const kiloLiter = liters / 1000;
  return Number.isFinite(kiloLiter) ? String(Number(kiloLiter.toFixed(3))) : "";
};

const deriveWorkflowStatus = (
  rows: VatpaidInvoiceDetail["rows"],
): "SALE" | "VATPAID" | "DISPATCH" | "COMPLETED" => {
  if (!rows || rows.length === 0) {
    return "SALE";
  }

  const statuses = rows.map((row) => row.refinery_status || "SALE");

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
};

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
      lineItems: [],
      cstpurchase: "",
    },
  });

  const { handleSubmit, register, reset } = methods;

  const currentWorkflowStatus = useMemo(() => {
    return deriveWorkflowStatus(invoice?.rows || []);
  }, [invoice]);

  const canDispatch = currentWorkflowStatus === "VATPAID";

  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      const res = await GetVatpaidInvoiceById(id);
      const data = res.data;

      if (res.status && data) {
        setInvoice(data);
        const workflowStatus = deriveWorkflowStatus(data.rows || []);
        const tankerList = data.tankerOptions || [];
        setTankerOptions(tankerList);

        reset({
          invoiceNumber: data.invoiceNumber,
          invoiceDate:
            workflowStatus === "VATPAID"
              ? new Date().toISOString()
              : new Date(data.invoiceDate).toISOString(),
          vehicleNumber: tankerList[0] || undefined,
          lineItems: data.rows.map((row) => ({
            saleId: row.id,
            kiloLiter: formatKiloLiterValue(Number(row.quantity || 0)),
          })),
          cstpurchase: "",
        });

        if (workflowStatus === "COMPLETED") {
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
    if (!data.cstpurchase.trim()) {
      toast.error("CST Purchase value is required.");
      return;
    }

    const parsedInvoiceDate = new Date(data.invoiceDate);
    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      toast.error("Invoice Date is invalid.");
      return;
    }

    if (!data.lineItems || data.lineItems.length === 0) {
      toast.error("Kilo Liter is required for all items.");
      return;
    }

    for (let index = 0; index < data.lineItems.length; index += 1) {
      const item = data.lineItems[index];
      const parsedItemKiloLiter = Number.parseFloat(String(item.kiloLiter || ""));
      if (!Number.isFinite(parsedItemKiloLiter) || parsedItemKiloLiter <= 0) {
        toast.error(`Kilo Liter must be greater than 0 in item row ${index + 1}.`);
        return;
      }
    }

    setSubmitting(true);

    const res = await DispatchRefinerySale({
      id,
      invoice_number: data.invoiceNumber,
      invoice_date: format(parsedInvoiceDate, "dd/MM/yyyy"),
      vehicle_number: data.vehicleNumber,
      line_items: data.lineItems.map((item) => ({
        sale_id: item.saleId,
        kilo_liter: String(item.kiloLiter),
      })),
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
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-semibold text-gray-800">
            Invoice Shipment Workflow
          </h1>
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
            Status: {currentWorkflowStatus}
          </span>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            x
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Product Name
                </TableHead>
                <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                  Litres
                </TableHead>
                {currentWorkflowStatus !== "COMPLETED" && (
                  <TableHead className="text-center p-2 text-xs font-medium text-gray-700 w-60">
                    Dispatch Kilo Liter
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.rows.map((row, index) => (
                <TableRow key={row.id} className="border-b w-60">
                  <TableCell className="text-center p-2 text-xs">
                    {row.commodity_master.product_name}
                    {currentWorkflowStatus !== "COMPLETED" && (
                      <input
                        type="hidden"
                        {...register(`lineItems.${index}.saleId` as const, {
                          valueAsNumber: true,
                        })}
                        value={row.id}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-center p-2 text-xs">
                    {row.quantity.toLocaleString("en-IN")}
                  </TableCell>
                  {currentWorkflowStatus !== "COMPLETED" && (
                    <TableCell className="p-2 text-xs">
                      <input
                        type="number"
                        // step="0.001"
                        min="0"
                        {...register(`lineItems.${index}.kiloLiter` as const)}
                        className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                        placeholder="kL"
                        disabled={!canDispatch || submitting}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {currentWorkflowStatus === "COMPLETED" ? (
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
                    name="cstpurchase"
                    title="CST Purchase"
                    required={true}
                    numdes={true}
                  />
                </div>
              </div>

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
