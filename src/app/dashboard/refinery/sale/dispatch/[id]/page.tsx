"use client";

import GetVatpaidInvoiceById, {
  VatpaidInvoiceDetail,
} from "@/action/refinery_sale/getvatpaidinvoicebyid";
import GetCompletedDailyPurchaseView, {
  CompletedDailyPurchaseView,
} from "@/action/refinery_sale/getcompleteddailypurchaseview";
import DispatchRefinerySale from "@/action/refinery_sale/dispatchrefinerysale";
import UpdateCompletedInvoice from "@/action/refinery_sale/updatecompletedinvoice";
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
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { decryptURLData } from "@/utils/methods";
import { getCurrentUserRole } from "@/lib/auth";
import ServerTime from "@/action/servertime";

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

type EditFormValues = {
  invoiceNumber: string;
  invoiceDate: string;
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
  const id: number = parseInt(
    decryptURLData((params.id ?? "").toString(), router),
  );

  const [invoice, setInvoice] = useState<VatpaidInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tankerOptions, setTankerOptions] = useState<string[]>([]);
  const [completedPurchaseView, setCompletedPurchaseView] =
    useState<CompletedDailyPurchaseView | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const methods = useForm<DispatchFormValues>({
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: "",
      vehicleNumber: undefined,
      lineItems: [],
      cstpurchase: "",
    },
  });

  const editMethods = useForm<EditFormValues>({
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: "",
      cstpurchase: "",
    },
  });

  const { handleSubmit, register, reset, control } = methods;
  const {
    handleSubmit: handleEditSubmit,
    register: editRegister,
    reset: editReset,
  } = editMethods;

  const currentWorkflowStatus = useMemo(() => {
    return deriveWorkflowStatus(invoice?.rows || []);
  }, [invoice]);

  const canDispatch = currentWorkflowStatus === "VATPAID";

  const lineItems = useWatch({ control, name: "lineItems" }) || [];

  const lineCalculations = useMemo(() => {
    if (!invoice) return [];
    
    return invoice.rows.map((row, index) => {
      const dispatchKL = Number.parseFloat(lineItems[index]?.kiloLiter ?? "0") || 0;
      const dispatchLitres = dispatchKL * 1000;
      
      // Original values from database
      const originalKL = Number.parseFloat(String(row.quantity ?? "0")) / 1000 || 0;
      const originalLitres = Number.parseFloat(String(row.quantity ?? "0")) || 0;
      
      // Calculate item price from amount and quantity
      const originalQuantityLitres = Number.parseFloat(String(row.quantity ?? "0")) || 0;
      const originalAmount = Number.parseFloat(String(row.amount ?? "0")) + Number.parseFloat(String(row.vatamount ?? "0")) || 0;
      const itemPrice = originalQuantityLitres > 0 ? originalAmount / originalQuantityLitres : 0;
      
      const taxPercent = Number.parseFloat(String(row.tax_percent ?? "0")) || 0;
      
      // Current (modified) values
      const totalInvoiceValue = dispatchLitres * itemPrice;
      const taxableValue = totalInvoiceValue / (1 + taxPercent / 100);
      const vatAmount = (taxableValue * taxPercent) / 100;

      // Original calculated values
      const originalTotalInvoiceValue = originalLitres * itemPrice;
      const originalTaxableValue = originalTotalInvoiceValue / (1 + taxPercent / 100);
      const originalVatAmount = (originalTaxableValue * taxPercent) / 100;

      return {
        itemPrice,
        dispatchKL,
        dispatchLitres,
        originalKL,
        originalLitres,
        taxPercent,
        taxableValue,
        vatAmount,
        totalInvoiceValue,
        originalTotalInvoiceValue,
        originalTaxableValue,
        originalVatAmount,
      };
    });
  }, [invoice, lineItems]);

  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      const userrole = await getCurrentUserRole();
      if (userrole == "USER" || userrole == null || userrole == undefined) {
        return router.back();
      }
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
              ? (ServerTime().data as Date).toISOString()
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

            // Initialize edit form with completed invoice data
            editReset({
              invoiceNumber: completedResponse.data.invoiceNumber,
              invoiceDate: new Date(
                completedResponse.data.invoiceDate,
              ).toISOString(),
              cstpurchase: completedResponse.data.cstPurchase,
            });
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
  }, [id, reset, editReset]);

  const handleApproveRelease = async (data: DispatchFormValues) => {
    if (!canDispatch) {
      toast.info(
        "This invoice is already processed and available in view mode.",
      );
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
      const parsedItemKiloLiter = Number.parseFloat(
        String(item.kiloLiter || ""),
      );
      if (!Number.isFinite(parsedItemKiloLiter) || parsedItemKiloLiter <= 0) {
        toast.error(
          `Kilo Liter must be greater than 0 in item row ${index + 1}.`,
        );
        return;
      }
    }

    setSubmitting(true);

    // Calculate VAT difference (Original VAT - Changed VAT)
    const vatDifference = lineCalculations.reduce(
      (sum, calc) => sum + (calc.originalVatAmount - calc.vatAmount),
      0,
    );

    // Calculate original and new quantities and amounts
    const oldQuantityLitres = lineCalculations.reduce(
      (sum, calc) => sum + calc.originalLitres,
      0,
    );
    const newQuantityLitres = lineCalculations.reduce(
      (sum, calc) => sum + calc.dispatchLitres,
      0,
    );
    const oldTotalAmount = lineCalculations.reduce(
      (sum, calc) => sum + calc.originalVatAmount,
      0,
    );
    const newTotalAmount = lineCalculations.reduce(
      (sum, calc) => sum + calc.vatAmount,
      0,
    );

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
      vatDifference,
      oldQuantityLitres,
      newQuantityLitres,
      oldTotalAmount,
      newTotalAmount,
    });

    if (res.status) {
      toast.success("Invoice dispatched successfully.");
      router.back();
    } else {
      toast.error(res.message || "Failed to dispatch.");
      setSubmitting(false);
    }
  };

  const handleEditInvoice = async (data: EditFormValues) => {
    if (!data.invoiceNumber.trim()) {
      toast.error("Invoice Number is required.");
      return;
    }
    if (!data.invoiceDate) {
      toast.error("Invoice Date is required.");
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

    const cstPurchaseValue = Number.parseFloat(data.cstpurchase);
    if (!Number.isFinite(cstPurchaseValue) || cstPurchaseValue <= 0) {
      toast.error("CST Purchase value must be greater than 0.");
      return;
    }

    setIsUpdating(true);

    const res = await UpdateCompletedInvoice({
      id,
      invoice_number: data.invoiceNumber,
      invoice_date: format(parsedInvoiceDate, "dd/MM/yyyy"),
      cst_purchase: data.cstpurchase,
    });

    if (res.status) {
      toast.success("Invoice updated successfully.");
      setIsEditMode(false);

      // Reload the data
      const reloadRes = await GetVatpaidInvoiceById(id);
      if (reloadRes.status && reloadRes.data) {
        setInvoice(reloadRes.data);

        const completedResponse = await GetCompletedDailyPurchaseView(id);
        if (completedResponse.status && completedResponse.data) {
          setCompletedPurchaseView(completedResponse.data);
          editReset({
            invoiceNumber: completedResponse.data.invoiceNumber,
            invoiceDate: new Date(
              completedResponse.data.invoiceDate,
            ).toISOString(),
            cstpurchase: completedResponse.data.cstPurchase,
          });
        }
      }
    } else {
      toast.error(res.message || "Failed to update invoice.");
    }

    setIsUpdating(false);
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
        {currentWorkflowStatus !== "COMPLETED" ? (
          <>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Product Name
                    </TableHead>
                    {/* <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Item Price
                    </TableHead> */}
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Qty (Litres)
                    </TableHead>
                    {/* <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Tax %
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Taxable Value
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      VAT Amount
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                      Total Amount
                    </TableHead> */}
                    <TableHead className="text-center p-2 text-xs font-medium text-gray-700 w-32">
                      Dispatch Kilo Liter
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.rows.map((row, index) => {
                    const calc = lineCalculations[index];
                    return (
                      <TableRow key={row.id} className="border-b">
                        <TableCell className="text-center p-2 text-xs">
                          {row.commodity_master.product_name}
                          <input
                            type="hidden"
                            {...register(`lineItems.${index}.saleId` as const, {
                              valueAsNumber: true,
                            })}
                            value={row.id}
                          />
                        </TableCell>
                        {/* <TableCell className="text-center p-2 text-xs font-medium text-gray-700">
                          ₹ {calc?.itemPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell> */}
                        <TableCell className="text-center p-2 text-xs font-medium text-gray-700">
                          {calc?.dispatchLitres.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        {/* <TableCell className="text-center p-2 text-xs font-medium text-gray-700">
                          {calc?.taxPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs font-medium text-blue-600">
                          ₹ {calc?.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs font-medium text-red-600">
                          ₹ {calc?.vatAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs font-medium text-green-600">
                          ₹ {calc?.totalInvoiceValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell> */}
                        <TableCell className="p-2 text-xs">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            {...register(`lineItems.${index}.kiloLiter` as const)}
                            className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                            placeholder="kL"
                            disabled={!canDispatch || submitting}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Dispatch Summary Card - Original */}
            {/* {lineCalculations.some((calc) => calc.originalLitres > 0) && (
              <div className="border border-gray-200 rounded-lg p-4 mb-5 bg-blue-50">
                <div className="text-sm font-semibold text-gray-800 mb-3">
                  Dispatch Summary (Original)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Quantity (Litres)</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {lineCalculations.reduce((sum, calc) => sum + calc.originalLitres, 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Taxable Value</div>
                    <div className="text-sm font-semibold text-blue-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.originalTaxableValue, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total VAT Amount</div>
                    <div className="text-sm font-semibold text-red-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.originalVatAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                    <div className="text-sm font-semibold text-green-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.originalTotalInvoiceValue, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Change Dispatch Summary Card */}
            {/* {lineCalculations.some((calc) => calc.dispatchLitres > 0) && (
              <div className="border border-gray-200 rounded-lg p-4 mb-5 bg-yellow-50">
                <div className="text-sm font-semibold text-gray-800 mb-3">
                  Change Dispatch Summary (Modified)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Quantity (Litres)</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {lineCalculations.reduce((sum, calc) => sum + calc.dispatchLitres, 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Taxable Value</div>
                    <div className="text-sm font-semibold text-blue-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.taxableValue, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total VAT Amount</div>
                    <div className="text-sm font-semibold text-red-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.vatAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                    <div className="text-sm font-semibold text-green-600">
                      ₹ {lineCalculations.reduce((sum, calc) => sum + calc.totalInvoiceValue, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Different Dispatch Summary Card */}
            {/* {lineCalculations.some((calc) => calc.dispatchLitres !== calc.originalLitres) && (
              <div className="border border-gray-200 rounded-lg p-4 mb-5 bg-orange-50">
                <div className="text-sm font-semibold text-gray-800 mb-3">
                  Different Dispatch Summary (Variance)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Quantity Difference (Litres)</div>
                    <div className={`text-sm font-semibold ${lineCalculations.reduce((sum, calc) => sum + (calc.originalLitres - calc.dispatchLitres), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(lineCalculations.reduce((sum, calc) => sum + (calc.originalLitres - calc.dispatchLitres), 0)).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Taxable Value Difference</div>
                    <div className={`text-sm font-semibold ${lineCalculations.reduce((sum, calc) => sum + (calc.originalTaxableValue - calc.taxableValue), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹ {(lineCalculations.reduce((sum, calc) => sum + (calc.originalTaxableValue - calc.taxableValue), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">VAT Difference</div>
                    <div className={`text-sm font-semibold ${lineCalculations.reduce((sum, calc) => sum + (calc.originalVatAmount - calc.vatAmount), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹ {(lineCalculations.reduce((sum, calc) => sum + (calc.originalVatAmount - calc.vatAmount), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Amount Difference</div>
                    <div className={`text-sm font-semibold ${lineCalculations.reduce((sum, calc) => sum + (calc.originalTotalInvoiceValue - calc.totalInvoiceValue), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹ {(lineCalculations.reduce((sum, calc) => sum + (calc.originalTotalInvoiceValue - calc.totalInvoiceValue), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Dealer Details Card */}
            <div className="border border-gray-200 rounded-lg p-4 mb-5 bg-blue-50">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Dealer Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Dealer Name</div>
                  <div className="text-sm font-medium text-gray-800">
                    {invoice.buyer.name_of_dealer}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">TIN Number</div>
                  <div className="text-sm font-medium text-gray-800">
                    {invoice.buyer.tin_number}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <> </>
        )}

        {currentWorkflowStatus === "COMPLETED" ? (
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            {!isEditMode ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Completed Invoice Details
                  </h2>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded"
                  >
                    Edit
                  </button>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Invoice Number
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {completedPurchaseView?.invoiceNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Invoice Date
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {completedPurchaseView?.invoiceDate
                          ? format(
                              new Date(completedPurchaseView.invoiceDate),
                              "dd/MM/yyyy",
                            )
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        CST Purchase
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {completedPurchaseView?.cstPurchase}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="text-sm font-semibold text-gray-800 mb-3">
                    Dealer Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Dealer Name
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {invoice.buyer.name_of_dealer}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        TIN Number
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {invoice.buyer.tin_number}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-800 mb-3">
                  Completed Sale Items
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
                            Quantity (L)
                          </TableHead>

                          <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                            Vehicle
                          </TableHead>
                          <TableHead className="text-center p-2 text-xs font-medium text-gray-700">
                            Status
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
                              {row.vehicle_number || "-"}
                            </TableCell>
                            <TableCell className="text-center p-2 text-xs">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                {row.refinery_status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No completed sale records found for this invoice.
                  </div>
                )}
              </>
            ) : (
              <FormProvider {...editMethods}>
                <form onSubmit={handleEditSubmit(handleEditInvoice)}>
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">
                      Edit Invoice Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <TaxtInput<EditFormValues>
                        name="invoiceNumber"
                        title="Invoice Number"
                        required={true}
                      />
                    </div>
                    <div>
                      <DateSelect<EditFormValues>
                        name="invoiceDate"
                        title="Invoice Date"
                        placeholder="Select Invoice Date"
                        required={true}
                        format="DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <TaxtInput<EditFormValues>
                        name="cstpurchase"
                        title="CST Purchase"
                        required={true}
                        numdes={true}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded"
                    >
                      {isUpdating ? "Updating..." : "Update"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      disabled={isUpdating}
                      className="bg-gray-300 hover:bg-gray-400 disabled:opacity-60 text-gray-800 text-sm font-medium px-6 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </FormProvider>
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
                  <div className="text-xs text-gray-500 mb-1">Dealer Name</div>
                  <div className="text-sm font-semibold text-gray-800 py-1.5">
                    {invoice.buyer.name_of_dealer}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <div className="text-xs text-gray-500 mb-1">TIN Number</div>
                  <div className="text-sm font-semibold text-gray-800 py-1.5">
                    {invoice.buyer.tin_number}
                  </div>
                </div>
                <div>
                  <MultiSelect<DispatchFormValues>
                    name="vehicleNumber"
                    title="Vehicle No"
                    placeholder={
                      tankerOptions.length
                        ? "Select tanker"
                        : "No tanker mapped"
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
                done: ["VATPAID", "DISPATCH", "COMPLETED"].includes(
                  currentWorkflowStatus,
                ),
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
