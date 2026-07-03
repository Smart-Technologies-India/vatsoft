"use client";

import GetCurrentDvatRefinerySale, {
  CurrentDvatRefinerySale,
} from "@/action/refinery_sale/getcurrentdvatrefinerysale";
import DeleteRefinerySale from "@/action/refinery_sale/deleterefinerysale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Spin, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AddRefinery from "@/components/refinery/addrefinery";

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

const formatQuantity = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(3)));
};

const formatDateKey = (value: Date | string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

type GroupedRefinerySale = {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  refineryName: string;
  productSummary: string;
  count: number;
  quantity: number;
  taxPercentDisplay: string;
  vatAmount: number;
  taxableAmount: number;
  invoiceValue: number;
  status: string;
};

const RefinerySalesPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<CurrentDvatRefinerySale[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    open: boolean;
    saleId: number | null;
    isDeleting: boolean;
  }>({
    open: false,
    saleId: null,
    isDeleting: false,
  });

  const  loadSales = async () => {
    setIsLoading(true);
    try {
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

  const handleDeleteConfirm = async () => {
    if (!deleteModalState.saleId) return;

    const deleteSaleId = deleteModalState.saleId;

    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const response = await DeleteRefinerySale({
        id: deleteSaleId,
      });

      if (response.status) {
        // FIRST: Close modal immediately
        setDeleteModalState({
          open: false,
          saleId: null,
          isDeleting: false,
        });

        // SECOND: Show success toast
        toast.success(response.message || "Refinery sale deleted successfully.");

        // THIRD: Reload all data
        await loadSales();
      } else {
        toast.error(response.message || "Failed to delete refinery sale.");
        setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting refinery sale.");
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const openDeleteModal = (saleId: number) => {
    setDeleteModalState({
      open: true,
      saleId,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalState({
      open: false,
      saleId: null,
      isDeleting: false,
    });
  };

  useEffect(() => {
    loadSales();
  }, []);

  const formatQuantity = (value: number) => {
    if (!Number.isFinite(value)) {
      return "0";
    }

    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(3)));
  };

  const groupedSales = useMemo(() => {
    const grouped = new Map<string, GroupedRefinerySale>();

    sales.forEach((sale) => {
      const invoiceDateKey = formatDateKey(sale.invoice_date);
      const groupKey = `${sale.refineryId}|${sale.invoice_number}|${invoiceDateKey}`;
      const taxable = Number.parseFloat(sale.amount || "0");
      const vat = Number.parseFloat(sale.vatamount || "0");
      const status = sale.refinery_status || "SALE";
      const productName = sale.commodity_master.product_name || "Item";

      const existing = grouped.get(groupKey);

      if (!existing) {
        grouped.set(groupKey, {
          id: sale.id,
          invoiceNumber: sale.invoice_number,
          invoiceDate: new Date(sale.invoice_date),
          refineryName:
            sale.refinery.tradename || sale.refinery.name || "Refinery",
          productSummary: productName,
          count: 1,
          quantity: Number(sale.quantity || 0),
          taxPercentDisplay: `${sale.tax_percent}%`,
          vatAmount: vat,
          taxableAmount: taxable,
          invoiceValue: taxable + vat,
          status,
        });
        return;
      }

      existing.count += 1;
      existing.quantity += Number(sale.quantity || 0);
      existing.vatAmount += vat;
      existing.taxableAmount += taxable;
      existing.invoiceValue += taxable + vat;
      existing.productSummary =
        existing.count > 1 ? `${existing.count} items` : productName;
      existing.taxPercentDisplay =
        existing.count > 1 ? "Multiple" : `${sale.tax_percent}%`;

      const statuses = [existing.status, status];
      if (statuses.includes("COMPLETED")) {
        existing.status = "COMPLETED";
      } else if (statuses.includes("DISPATCH")) {
        existing.status = "DISPATCH";
      } else if (statuses.every((value) => value === "VATPAID")) {
        existing.status = "VATPAID";
      } else if (statuses.includes("PAID")) {
        existing.status = "PAID";
      } else {
        existing.status = "SALE";
      }
    });

    return Array.from(grouped.values()).sort(
      (a, b) =>
        b.invoiceDate.getTime() - a.invoiceDate.getTime() || b.id - a.id,
    );
  }, [sales]);

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

  const handleCreated = (saleIds: number[]) => {
    const firstSaleId = saleIds[0];
    if (!firstSaleId) {
      return;
    }

    router.push(`/dashboard/refinery_sales/view/${firstSaleId}`);
  };

  const openDrawer = () => {
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
            <p className="text-lg font-medium text-gray-900">
              {groupedSales.length}
            </p>
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

        <AddRefinery
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onCreated={handleCreated}
        />

        {isLoading ? (
          <div className="bg-white rounded shadow-sm border p-8 flex justify-center">
            <Spin />
          </div>
        ) : groupedSales.length > 0 ? (
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
                  {groupedSales.map((sale, index) => {
                    const status = sale.status || "SALE";

                    return (
                      <TableRow
                        key={sale.id}
                        className={`border-b ${getStatusRowColor(status)}`}
                      >
                        <TableCell className="text-center p-2 text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatDate(sale.invoiceDate)}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.refineryName}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.productSummary}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatQuantity(sale.quantity)}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {sale.taxPercentDisplay}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(sale.vatAmount)}
                        </TableCell>
                        <TableCell className="text-center p-2 text-xs">
                          {formatCurrency(sale.taxableAmount)}
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
                          <div className="flex gap-1 justify-center">
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
                            {status === "SALE" && (
                              <Button
                                size="small"
                                danger
                                onClick={() => openDeleteModal(sale.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
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

        <Modal
          title="Delete Refinery Sale"
          open={deleteModalState.open}
          onCancel={closeDeleteModal}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: deleteModalState.isDeleting }}
          onOk={handleDeleteConfirm}
        >
          <p>
            Are you sure you want to delete this refinery sale? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </main>
  );
};

export default RefinerySalesPage;
