"use client";

import GetCurrentDvatRefinerySale, {
  CurrentDvatRefinerySale,
} from "@/action/refinery_sale/getcurrentdvatrefinerysale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Drawer, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { TaxtInput } from "@/components/forms/inputfields/textinput";
import { FormProvider, useForm } from "react-hook-form";
import CreateRefinerySale from "@/action/refinery_sale/createrefinerysale";
import { commodity_master, refinery } from "@prisma/client";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetRefineryDealerPurchasers from "@/action/refinery_sale/getrefinerydealerpurchasers";
import GetAutoRefinerySalePrice from "@/action/refinery_sale/getautorefinerysaleprice";

type RefinerySaleFormValues = {
  purchaserTin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  selectedCommodityId?: string;
  price: string;
  quantity: string;
};

const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

const toDateTimeLocalValue = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(100 + Math.random() * 900);
  return `RS-${timestamp}-${random}`;
};

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

const formatToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStatusColor = (status: string) => {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    PAID: { bg: "bg-green-100", text: "text-green-800" },
    VATPAID: { bg: "bg-blue-100", text: "text-blue-800" },
    DISPATCH: { bg: "bg-amber-100", text: "text-amber-800" },
  };
  return statusColorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

const getStatusRowColor = (status: string) => {
  const statusRowColorMap: Record<string, string> = {
    SALE: "bg-red-50 hover:bg-red-100 border-red-200",
    PAID: "bg-green-50 hover:bg-green-100 border-green-200",
    VATPAID: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    DISPATCH: "bg-amber-50 hover:bg-amber-100 border-amber-200",
  };

  return statusRowColorMap[status] || "hover:bg-gray-50";
};

const RefinerySalesPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<CurrentDvatRefinerySale[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaserOptions, setPurchaserOptions] = useState<refinery[]>([]);
  const [commodities, setCommodities] = useState<commodity_master[]>([]);

  const methods = useForm<RefinerySaleFormValues>({
    defaultValues: {
      purchaserTin: undefined,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: toDateTimeLocalValue(new Date()),
      selectedCommodityId: undefined,
      price: "",
      quantity: "1",
    },
  });

  const { handleSubmit, reset, watch, setValue } = methods;

  const purchaserTin = watch("purchaserTin");
  const invoiceNumber = watch("invoiceNumber");
  const invoiceDate = watch("invoiceDate");
  const selectedCommodityId = watch("selectedCommodityId");
  const price = Number.parseFloat(watch("price") ?? "0") || 0;
  const selectedCommodityIdNumber: number | undefined = selectedCommodityId
    ? Number.parseInt(String(selectedCommodityId), 10)
    : undefined;
  const quantityInKL = Number.parseFloat(watch("quantity") ?? "1") || 1;
  const quantityInLitres = quantityInKL * 1000;

  const selectedRefinery = useMemo(() => {
    if (!purchaserTin) {
      return undefined;
    }

    return purchaserOptions.find((item) => item.tinNumber === purchaserTin);
  }, [purchaserOptions, purchaserTin]);

  const selectedCommodity = useMemo(() => {
    return commodities.find(
      (commodity) => commodity.id === selectedCommodityIdNumber,
    );
  }, [commodities, selectedCommodityIdNumber]);

  const itemPrice = useMemo(() => {
    const parsedPrice = price;
    return Number.isFinite(parsedPrice) ? parsedPrice : 0;
  }, [price]);

  const taxPercent = useMemo(() => {
    const parsedTax = Number.parseFloat(selectedCommodity?.taxable_at ?? "0");
    return Number.isFinite(parsedTax) ? parsedTax : 0;
  }, [selectedCommodity]);

  const taxableValue = useMemo(() => {
    return quantityInLitres * itemPrice;
  }, [quantityInLitres, itemPrice]);

  const vatAmount = useMemo(() => {
    return (taxableValue * taxPercent) / 100;
  }, [taxPercent, taxableValue]);

  const formDrawerTotalInvoiceValue = useMemo(() => {
    return taxableValue + vatAmount;
  }, [taxableValue, vatAmount]);

  const resetForm = () => {
    reset({
      purchaserTin: undefined,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: toDateTimeLocalValue(new Date()),
      selectedCommodityId: undefined,
      price: "",
      quantity: "1",
    });
  };

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const [purchaserResponse, commodityResponse] = await Promise.all([
        GetRefineryDealerPurchasers(),
        AllCommodityMaster({}),
      ]);

      if (purchaserResponse.status && purchaserResponse.data) {
        setPurchaserOptions(purchaserResponse.data);
      } else {
        setPurchaserOptions([]);
      }

      if (commodityResponse.status && commodityResponse.data) {
        setCommodities(
          commodityResponse.data.filter((val) =>
            ALLOWED_COMMODITY_IDS.includes(val.id),
          ),
        );
      }

      const response = await GetCurrentDvatRefinerySale();
      if (!response.status || !response.data) {
        setSales([]);
        toast.info(response.message || "No refinery sales found.");
        return;
      }

      setSales(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    const selectedRefineryId = selectedRefinery?.id;
    if (!selectedRefineryId || !selectedCommodityIdNumber || !invoiceDate) {
      setValue("price", "0", { shouldValidate: true, shouldDirty: true });
      return;
    }

    const parsedInvoiceDate = new Date(invoiceDate);
    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      setValue("price", "0", { shouldValidate: true, shouldDirty: true });
      return;
    }

    const invoiceDateForLookup = formatToDDMMYYYY(parsedInvoiceDate);

    const loadAutoPrice = async () => {
      const response = await GetAutoRefinerySalePrice({
        refineryId: selectedRefineryId,
        commodityMasterId: selectedCommodityIdNumber,
        invoiceDate: invoiceDateForLookup,
      });

      if (!response.status || response.data === null || response.data === undefined) {
        setValue("price", "0", { shouldValidate: true, shouldDirty: true });
        return;
      }

      setValue("price", response.data.toFixed(2), {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    void loadAutoPrice();
  }, [invoiceDate, selectedCommodityIdNumber, selectedRefinery?.id, setValue]);

  const totals = useMemo(() => {
    return sales.reduce(
      (acc, sale) => {
        const taxable = Number.parseFloat(sale.amount || "0");
        const vat = Number.parseFloat(sale.vatamount || "0");
        acc.taxableValue += taxable;
        acc.vatAmount += vat;
        acc.invoiceValue += taxable + vat;
        return acc;
      },
      { taxableValue: 0, vatAmount: 0, invoiceValue: 0 },
    );
  }, [sales]);

  const handleCreateSale = async (data: RefinerySaleFormValues) => {
    if (!data.purchaserTin) {
      toast.error("Please select purchaser TIN number.");
      return;
    }

    if (!data.selectedCommodityId) {
      toast.error("Please select item details.");
      return;
    }

    const parsedCommodityId = Number.parseInt(data.selectedCommodityId, 10);
    const parsedPrice = Number.parseFloat(data.price);
    const parsedQuantityInKL = Number.parseFloat(data.quantity);

    if (!Number.isInteger(parsedCommodityId) || parsedCommodityId <= 0) {
      toast.error("Invalid item details selection.");
      return;
    }

    if (!ALLOWED_COMMODITY_IDS.includes(parsedCommodityId)) {
      toast.error("Only allowed refinery commodities can be selected.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }

    if (!Number.isFinite(parsedQuantityInKL) || parsedQuantityInKL <= 0) {
      toast.error("Quantity (kL) must be greater than 0.");
      return;
    }

    const parsedQuantityInLitres = parsedQuantityInKL * 1000;

    setIsSubmitting(true);

    try {
      const response = await CreateRefinerySale({
        purchaser_tin_number: data.purchaserTin,
        invoice_number: data.invoiceNumber,
        invoice_date: new Date(data.invoiceDate),
        commodity_master_id: parsedCommodityId,
        price: parsedPrice,
        quantity: parsedQuantityInLitres,
      });

      if (!response.status || !response.data) {
        toast.error(response.message || "Unable to create refinery sale.");
        return;
      }

      toast.success("Refinery sale entry added successfully.");
      setIsDrawerOpen(false);
      resetForm();
      router.push(`/dashboard/refinery_sales/view/${response.data.id}`);
    } catch (error) {
      toast.error("Unable to create refinery sale entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium text-gray-900">
              Refinery Sales
            </h1>
            <div className="grow"></div>
            <Button type="primary" onClick={openDrawer}>
              Add Refinery Sale
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
            <p className="text-lg font-medium text-gray-900">{sales.length}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total VAT</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totals.vatAmount)}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Invoice Value</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totals.invoiceValue)}
            </p>
          </div>
        </div>

        <Drawer
          title="Add Refinery Sale"
          placement="right"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size={660}
        >
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(handleCreateSale)}
              className="space-y-3"
            >
              <div className="space-y-1">
                <MultiSelect<RefinerySaleFormValues>
                  name="purchaserTin"
                  title="Purchaser Refinery"
                  placeholder="Select refinery"
                  required={true}
                  options={purchaserOptions
                    .filter((refinery) => Boolean(refinery.tinNumber))
                    .map((refinery) => ({
                      value: refinery.tinNumber || "",
                      label: `${refinery.tradename || refinery.name || "Refinery"} - ${refinery.tinNumber}`,
                    }))}
                />
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-2">
                <p className="text-xs text-blue-700">
                  Purchaser TIN is auto-used from selected refinery.
                </p>
              </div>

              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name="invoiceNumber"
                  title="Invoice No (Auto Generated)"
                  required={true}
                  disable={true}
                />
              </div>

              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name="invoiceDate"
                  title="Invoice Date (Current Timestamp)"
                  required={true}
                  disable={true}
                />
              </div>

              <div className="space-y-1">
                <MultiSelect<RefinerySaleFormValues>
                  name="selectedCommodityId"
                  title="Item Details"
                  placeholder="Select item"
                  required={true}
                  options={commodities.map((commodity) => ({
                    value: commodity.id.toString(),
                    label: `${commodity.product_name}`,
                  }))}
                />
              </div>
              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name="price"
                  title="Price (Auto from Price Master)"
                  placeholder="Auto"
                  required={true}
                  disable={true}
                />
              </div>

              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name="quantity"
                  title="Quantity (kL)"
                  placeholder="Enter Quantity in kL"
                  required={true}
                  numdes={true}
                />
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Calculated Values
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Item Price
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(itemPrice)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Quantity in Liter
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(quantityInLitres)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">Tax %</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(taxPercent)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Taxable Value
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(taxableValue)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      VAT Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(vatAmount)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Total Invoice Value
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(formDrawerTotalInvoiceValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                <Button type="primary" loading={isSubmitting} htmlType="submit">
                  Save Entry
                </Button>
              </div>
            </form>
          </FormProvider>
        </Drawer>

        {isLoading ? (
          <div className="bg-white rounded shadow-sm border p-8 flex justify-center">
            <Spin />
          </div>
        ) : sales.length > 0 ? (
          <div className="bg-white rounded shadow-sm border p-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Sr. No.
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice Number
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice Date
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Seller
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Product
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Litres
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Tax Rate
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Taxable Value
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Status
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, index) => {
                    const status = sale.refinery_status || "SALE";

                    return (
                      <TableRow
                        key={sale.id}
                        className={`border-b ${getStatusRowColor(status)}`}
                      >
                        <TableCell className="text-center p-2 text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.invoice_number}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatDate(sale.invoice_date)}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.refinery.tradename ||
                            sale.refinery.name ||
                            "Refinery"}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.quantity}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.tax_percent}%
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(
                            Number.parseFloat(sale.vatamount || "0"),
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(
                            Number.parseFloat(sale.amount || "0"),
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(status).bg
                            } ${getStatusColor(status).text}`}
                          >
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          <Button
                            size="small"
                            onClick={() =>
                              router.push(
                                `/dashboard/refinery_sales/view/${sale.id}`,
                              )
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm border p-12 text-center">
            <p className="text-gray-500">
              No refinery sales found for current DVAT.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default RefinerySalesPage;
