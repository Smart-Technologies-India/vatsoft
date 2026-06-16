"use client";

import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateRefinerySale from "@/action/refinery_sale/createrefinerysale";
import GetUserRefinerySale from "@/action/refinery_sale/getuserrefinerysale";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
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
import {
  commodity_master,
  refinery_sale,
  tin_number_master,
} from "@prisma/client";
import { Button, Drawer, Pagination, Spin } from "antd";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type RefinerySaleWithRelations = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

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

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatCurrency = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const getStatusColor = (status: string) => {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    SALE: { bg: "bg-red-100", text: "text-red-800" },
    PAID: { bg: "bg-green-100", text: "text-green-800" },
    VATPAID: { bg: "bg-blue-100", text: "text-blue-800" },
    DISPATCH: { bg: "bg-amber-100", text: "text-amber-800" },
  };

  return statusColorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

const RefinerySalePage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tinNumbers, setTinNumbers] = useState<tin_number_master[]>([]);
  const [commodities, setCommodities] = useState<commodity_master[]>([]);
  const [saleEntries, setSaleEntries] = useState<RefinerySaleWithRelations[]>(
    [],
  );
  const [pagination, setPagination] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

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

  const { handleSubmit, reset, watch } = methods;

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

  const paginatedEntries = useMemo(() => {
    return saleEntries.slice(
      pagination.skip,
      pagination.skip + pagination.take,
    );
  }, [saleEntries, pagination]);

  const totalTaxableValue = useMemo(() => {
    return saleEntries.reduce(
      (sum, entry) => sum + Number.parseFloat(entry.amount || "0"),
      0,
    );
  }, [saleEntries]);

  const totalVatAmount = useMemo(() => {
    return saleEntries.reduce(
      (sum, entry) => sum + Number.parseFloat(entry.vatamount || "0"),
      0,
    );
  }, [saleEntries]);

  const tableTotalInvoiceValue = useMemo(() => {
    return totalTaxableValue + totalVatAmount;
  }, [totalTaxableValue, totalVatAmount]);

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      take: pageSize,
      skip: (page - 1) * pageSize,
      total: saleEntries.length,
    });
  };

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

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const [tinResponse, commodityResponse, salesResponse] = await Promise.all(
        [
          getAllTinNumberMaster(),
          AllCommodityMaster({}),
          GetUserRefinerySale(),
        ],
      );

      if (tinResponse.status && tinResponse.data) {
        setTinNumbers(tinResponse.data);
      }

      if (commodityResponse.status && commodityResponse.data) {
        setCommodities(
          commodityResponse.data.filter((val) =>
            ALLOWED_COMMODITY_IDS.includes(val.id),
          ),
        );
      }

      if (salesResponse.status && salesResponse.data) {
        setSaleEntries(salesResponse.data);
        setPagination({
          take: 10,
          skip: 0,
          total: salesResponse.data.length,
        });
      } else {
        setSaleEntries([]);
        setPagination({
          take: 10,
          skip: 0,
          total: 0,
        });
      }
    } catch (error) {
      toast.error("Unable to load refinery sale data.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

      setSaleEntries((previousEntries) => [response.data!, ...previousEntries]);
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
      }));
      toast.success("Refinery sale entry added successfully.");
      setIsDrawerOpen(false);
      resetForm();
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
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Refinery Sale
              </h1>
            </div>
            <div className="grow"></div>
            <Button type="primary" onClick={openDrawer}>
              Add Refinery Sale
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
            <p className="text-lg font-medium text-gray-900">
              {saleEntries.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totalTaxableValue)}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total VAT</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(totalVatAmount)}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(tableTotalInvoiceValue)}
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
                  title="Purchaser TIN Number"
                  placeholder="Select purchaser TIN"
                  required={true}
                  options={tinNumbers.map((tin) => ({
                    value: tin.tin_number,
                    label: `${tin.tin_number} - ${tin.name_of_dealer ?? "NA"}`,
                  }))}
                />
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
                    label: `${commodity.product_name} (${commodity.id})`,
                  }))}
                />
              </div>
              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name="price"
                  title="Price"
                  placeholder="Enter price"
                  required={true}
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

        {isPageLoading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Spin />
          </div>
        ) : saleEntries.length > 0 ? (
          <div className="bg-white rounded shadow-sm border p-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Count
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice No.
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice Date
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Purchaser TIN
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Item Details
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Quantity
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Taxable Value
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Status
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Invoice Value (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry, index) => {
                    const amount = Number.parseFloat(entry.amount || "0");
                    const vat = Number.parseFloat(entry.vatamount || "0");
                    const total = amount + vat;
                    const status = entry.refinery_status || "SALE";

                    return (
                      <TableRow
                        key={entry.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="p-2 text-center text-xs">
                          1
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {entry.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formatDateTime(entry.invoice_date)}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {entry.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {entry.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {entry.quantity}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formatCurrency(vat)}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(status).bg
                            } ${getStatusColor(status).text}`}
                          >
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formatCurrency(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="px-3 py-2 border-t bg-gray-50">
              <Pagination
                align="center"
                current={Math.floor(pagination.skip / pagination.take) + 1}
                onChange={handlePaginationChange}
                pageSize={pagination.take}
                total={pagination.total}
                showSizeChanger
                showTotal={(total: number) => `Total ${total} items`}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm border p-12 text-center">
            <p className="text-gray-500">No refinery sale entries found.</p>
          </div>
        )}
      </div>
    </main>
  );
};
export default RefinerySalePage;
