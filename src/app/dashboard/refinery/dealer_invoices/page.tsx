"use client";

import GetRefinerySaleDealers, {
  RefinerySaleDealer,
} from "@/action/refinery_dealer/getrefinerysaledealers";
import GetDealerInvoiceDetails, {
  InvoiceDetail,
} from "@/action/refinery_dealer/getdealerdetails";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Modal, Pagination, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const DealerInvoicesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dealers, setDealers] = useState<RefinerySaleDealer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedDealerName, setSelectedDealerName] = useState("");
  const [selectedStatusType, setSelectedStatusType] = useState<
    "COMPLETED" | "VATPAID"
  >("COMPLETED");
  const [filteredDealers, setFilteredDealers] = useState<RefinerySaleDealer[]>(
    []
  );
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  const [pagination, setPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });
  const [modalPagination, setModalPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });

  const pagedDealers = useMemo(
    () => dealers.slice(pagination.skip, pagination.skip + pagination.take),
    [dealers, pagination],
  );

  const pagedInvoiceDetails = useMemo(
    () =>
      invoiceDetails.slice(
        modalPagination.skip,
        modalPagination.skip + modalPagination.take,
      ),
    [invoiceDetails, modalPagination],
  );

  const summary = useMemo(() => {
    return {
      totalDealers: dealers.length,
      totalInvoices: dealers.reduce((sum, d) => sum + d.invoiceCount, 0),
      totalCompleted: dealers.reduce((sum, d) => sum + d.completedCount, 0),
      totalVatpaid: dealers.reduce((sum, d) => sum + d.vatpaidCount, 0),
    };
  }, [dealers]);

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const response = await GetRefinerySaleDealers();

      if (response.status && response.data !== null) {
        setDealers(response.data);
        setPagination((prev) => ({
          ...prev,
          skip: 0,
          total: response.data!.length,
        }));
      } else {
        setDealers([]);
        setPagination((prev) => ({
          ...prev,
          skip: 0,
          total: 0,
        }));
        toast.info(response.message || "No dealers found.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const onPageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }));
  };

  const onModalPageChange = (page: number, pageSize: number) => {
    setModalPagination((prev) => ({
      ...prev,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }));
  };

  const openCompletedModal = async () => {
    const completed = dealers.filter((d) => d.completedCount > 0);
    setFilteredDealers(completed);
    setSelectedStatusType("COMPLETED");
    setSelectedDealerName("All Dealers - Completed");
    
    // Fetch invoice details for all completed dealers
    setModalLoading(true);
    try {
      const allInvoices: InvoiceDetail[] = [];
      for (const dealer of completed) {
        const response = await GetDealerInvoiceDetails(dealer.id, "COMPLETED");
        if (response.status && response.data) {
          allInvoices.push(...response.data);
        }
      }
      const sorted = allInvoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
      setInvoiceDetails(sorted);
      setModalPagination({ take: 10, skip: 0, total: sorted.length });
    } catch (error) {
      toast.error("Failed to fetch invoice details");
    } finally {
      setModalLoading(false);
    }
    
    setModalOpen(true);
  };

  const openVatpaidModal = async () => {
    const vatpaid = dealers.filter((d) => d.vatpaidCount > 0);
    setFilteredDealers(vatpaid);
    setSelectedStatusType("VATPAID");
    setSelectedDealerName("All Dealers - VAT Paid");
    
    // Fetch invoice details for all vatpaid dealers
    setModalLoading(true);
    try {
      const allInvoices: InvoiceDetail[] = [];
      for (const dealer of vatpaid) {
        const response = await GetDealerInvoiceDetails(dealer.id, "VATPAID");
        if (response.status && response.data) {
          allInvoices.push(...response.data);
        }
      }
      const sorted = allInvoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
      setInvoiceDetails(sorted);
      setModalPagination({ take: 10, skip: 0, total: sorted.length });
    } catch (error) {
      toast.error("Failed to fetch invoice details");
    } finally {
      setModalLoading(false);
    }
    
    setModalOpen(true);
  };

  const openDealerCompletedModal = async (dealer: RefinerySaleDealer) => {
    setFilteredDealers([dealer]);
    setSelectedStatusType("COMPLETED");
    setSelectedDealerName(`${dealer.name_of_dealer} - Completed`);
    
    // Fetch invoice details
    setModalLoading(true);
    try {
      const response = await GetDealerInvoiceDetails(dealer.id, "COMPLETED");
      if (response.status && response.data) {
        const sorted = response.data.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
        setInvoiceDetails(sorted);
        setModalPagination({ take: 10, skip: 0, total: sorted.length });
      } else {
        setInvoiceDetails([]);
        setModalPagination({ take: 10, skip: 0, total: 0 });
        toast.info("No invoice details found");
      }
    } catch (error) {
      toast.error("Failed to fetch invoice details");
    } finally {
      setModalLoading(false);
    }
    
    setModalOpen(true);
  };

  const openDealerVatpaidModal = async (dealer: RefinerySaleDealer) => {
    setFilteredDealers([dealer]);
    setSelectedStatusType("VATPAID");
    setSelectedDealerName(`${dealer.name_of_dealer} - VAT Paid`);
    
    // Fetch invoice details
    setModalLoading(true);
    try {
      const response = await GetDealerInvoiceDetails(dealer.id, "VATPAID");
      if (response.status && response.data) {
        const sorted = response.data.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
        setInvoiceDetails(sorted);
        setModalPagination({ take: 10, skip: 0, total: sorted.length });
      } else {
        setInvoiceDetails([]);
        setModalPagination({ take: 10, skip: 0, total: 0 });
        toast.info("No invoice details found");
      }
    } catch (error) {
      toast.error("Failed to fetch invoice details");
    } finally {
      setModalLoading(false);
    }
    
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-3">
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Dealer Invoices
              </h1>
              <p className="text-xs text-gray-500">
                View all dealers from refinery sales records.
              </p>
            </div>
            <div className="grow" />
            <Button type="primary" onClick={refreshData}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Dealers</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalDealers}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalInvoices}
            </p>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={openCompletedModal}
          >
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.totalCompleted}
            </p>
          </div>
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={openVatpaidModal}
          >
            <p className="text-xs text-gray-500">VAT Paid</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.totalVatpaid}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="p-2 text-center text-xs">
                    TIN Number
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Dealer Name
                  </TableHead>
                  <TableHead className="p-2 text-right text-xs">
                    Invoice Count
                  </TableHead>
                  <TableHead className="p-2 text-right text-xs">
                    Completed
                  </TableHead>
                  <TableHead className="p-2 text-right text-xs">
                    VAT Paid
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Last Invoice Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedDealers.length > 0 ? (
                  pagedDealers.map((dealer) => (
                    <TableRow key={dealer.id} className="border-b hover:bg-gray-50">
                      <TableCell className="p-2 text-center text-xs font-medium">
                        {dealer.tin_number || "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {dealer.name_of_dealer || "-"}
                      </TableCell>
                      <TableCell className="p-2 text-right text-xs font-semibold">
                        {dealer.invoiceCount}
                      </TableCell>
                      <TableCell
                        className="p-2 text-right text-xs font-semibold text-green-600 cursor-pointer hover:underline"
                        onClick={() => openDealerCompletedModal(dealer)}
                      >
                        {dealer.completedCount}
                      </TableCell>
                      <TableCell
                        className="p-2 text-right text-xs font-semibold text-blue-600 cursor-pointer hover:underline"
                        onClick={() => openDealerVatpaidModal(dealer)}
                      >
                        {dealer.vatpaidCount}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {dealer.lastInvoiceDate
                          ? new Date(dealer.lastInvoiceDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="p-4 text-center text-sm text-gray-500"
                    >
                      No dealers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {dealers.length > 0 && (
          <div className="flex justify-end">
            <Pagination
              current={Math.floor(pagination.skip / pagination.take) + 1}
              pageSize={pagination.take}
              total={pagination.total}
              onChange={onPageChange}
              showSizeChanger
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>

      {/* Modal for Details */}
      <Modal
        title={selectedDealerName}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={1200}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="p-2 text-center text-xs">
                      Invoice No.
                    </TableHead>
                    <TableHead className="p-2 text-center text-xs">
                      Invoice Date
                    </TableHead>
                    <TableHead className="p-2 text-center text-xs">
                      Dealer
                    </TableHead>
                    <TableHead className="p-2 text-right text-xs">
                      Quantity
                    </TableHead>
                    <TableHead className="p-2 text-right text-xs">
                      Amount
                    </TableHead>
                    <TableHead className="p-2 text-right text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="p-2 text-center text-xs">
                      Tax %
                    </TableHead>
                    <TableHead className="p-2 text-center text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedInvoiceDetails.length > 0 ? (
                    pagedInvoiceDetails.map((invoice) => (
                      <TableRow key={invoice.id} className="border-b">
                        <TableCell className="p-2 text-center text-xs font-medium">
                          {invoice.invoice_number || "-"}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {invoice.sellerName || "-"}
                        </TableCell>
                        <TableCell className="p-2 text-right text-xs">
                          {invoice.quantity}
                        </TableCell>
                        <TableCell className="p-2 text-right text-xs">
                          {invoice.amount}
                        </TableCell>
                        <TableCell className="p-2 text-right text-xs font-semibold text-blue-600">
                          {invoice.vatamount}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {invoice.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              invoice.refinery_status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : invoice.refinery_status === "VATPAID"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invoice.refinery_status || "SALE"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="p-4 text-center text-sm text-gray-500"
                      >
                        No invoice details found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Modal Pagination */}
            {invoiceDetails.length > 0 && (
              <div className="flex justify-end pt-3 border-t">
                <Pagination
                  current={
                    Math.floor(modalPagination.skip / modalPagination.take) + 1
                  }
                  pageSize={modalPagination.take}
                  total={modalPagination.total}
                  onChange={onModalPageChange}
                  showSizeChanger
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
};

export default DealerInvoicesPage;
