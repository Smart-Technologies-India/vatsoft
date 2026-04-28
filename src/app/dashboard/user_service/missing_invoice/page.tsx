"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Pagination,
  Select,
  Tag,
} from "antd";
import dayjs, { Dayjs } from "dayjs";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import SearchTinNumber from "@/action/dvat/searchtin";
import CreateMissingInvoiceComplaint from "@/action/missing_invoice/createmissinginvoicecomplaint";
import GetUserMissingInvoiceComplaints from "@/action/missing_invoice/getusermissinginvoicecomplaints";
import type { MissingInvoiceComplaintWithCreator } from "@/models/missinginvoice";
import { formateDate } from "@/utils/methods";
import { dvat04, MissingInvoiceType } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MissingInvoicePage = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [userid, setUserid] = useState(0);
  const [dvatData, setDvatData] = useState<dvat04>();

  const [rows, setRows] = useState<Array<MissingInvoiceComplaintWithCreator>>(
    [],
  );

  const [pagination, setPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceType, setInvoiceType] = useState<MissingInvoiceType>("SALE");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Dayjs | null>(null);
  const [supplierTin, setSupplierTin] = useState("");
  const [customerTin, setCustomerTin] = useState("");
  const [supplierTinName, setSupplierTinName] = useState("");
  const [customerTinName, setCustomerTinName] = useState("");
  const [supplierTinError, setSupplierTinError] = useState("");
  const [customerTinError, setCustomerTinError] = useState("");
  const [isSupplierTinLoading, setIsSupplierTinLoading] = useState(false);
  const [isCustomerTinLoading, setIsCustomerTinLoading] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");

  const sanitizeTin = (value: string) => value.replace(/\D/g, "").slice(0, 11);

  const resetForm = () => {
    setInvoiceType("SALE");
    setInvoiceNumber("");
    setInvoiceDate(null);
    setSupplierTin("");
    setCustomerTin("");
    setSupplierTinName("");
    setCustomerTinName("");
    setSupplierTinError("");
    setCustomerTinError("");
    setIsSupplierTinLoading(false);
    setIsCustomerTinLoading(false);
    setComplaintMessage("");
  };

  useEffect(() => {
    const fetchSupplierTinDetails = async () => {
      if (supplierTin.length !== 11) {
        setSupplierTinName("");
        setSupplierTinError("");
        setIsSupplierTinLoading(false);
        return;
      }

      if (customerTin.length === 11 && supplierTin === customerTin) {
        setSupplierTinName("");
        setSupplierTinError("Supplier TIN and customer TIN cannot be the same.");
        setIsSupplierTinLoading(false);
        return;
      }

      setIsSupplierTinLoading(true);
      const response = await SearchTinNumber({ tinumber: supplierTin });
      setIsSupplierTinLoading(false);

      if (response.status && response.data) {
        setSupplierTinName(response.data.tradename ?? response.data.name ?? "");
        setSupplierTinError("");
        return;
      }

      setSupplierTinName("");
      setSupplierTinError("Supplier DVAT/TIN does not exist.");
    };

    void fetchSupplierTinDetails();
  }, [supplierTin]);

  useEffect(() => {
    const fetchCustomerTinDetails = async () => {
      if (customerTin.length !== 11) {
        setCustomerTinName("");
        setCustomerTinError("");
        setIsCustomerTinLoading(false);
        return;
      }

      if (supplierTin.length === 11 && supplierTin === customerTin) {
        setCustomerTinName("");
        setCustomerTinError("Customer TIN and supplier TIN cannot be the same.");
        setIsCustomerTinLoading(false);
        return;
      }

      setIsCustomerTinLoading(true);
      const response = await SearchTinNumber({ tinumber: customerTin });
      setIsCustomerTinLoading(false);

      if (response.status && response.data) {
        const dealerName = response.data.tradename ?? response.data.name ?? "";
        setCustomerTinName(dealerName);
        setCustomerTinError("");
        return;
      }

      setCustomerTinName("");
      setCustomerTinError("Customer DVAT/TIN does not exist.");
    };

    void fetchCustomerTinDetails();
  }, [customerTin]);

  const loadComplaints = async (dvatid: number, take: number, skip: number) => {
    const response = await GetUserMissingInvoiceComplaints({
      dvatid,
      take,
      skip,
    });

    if (response.status && response.data.result) {
      setRows(response.data.result);
      setPagination({
        take: response.data.take,
        skip: response.data.skip,
        total: response.data.total,
      });
      return;
    }

    setRows([]);
    setPagination((prev) => ({ ...prev, take, skip, total: 0 }));

    if (response.message) {
      toast.error(response.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }

      setUserid(authResponse.data);

      const dvatResponse = await GetUserDvat04();
      if (!dvatResponse.status || !dvatResponse.data) {
        toast.error(dvatResponse.message);
        setIsLoading(false);
        return;
      }

      setDvatData(dvatResponse.data);
      await loadComplaints(
        dvatResponse.data.id,
        pagination.take,
        pagination.skip,
      );

      setIsLoading(false);
    };

    init();
  }, []);

  const onPageChange = async (page: number, pageSize: number) => {
    if (!dvatData) {
      toast.error("DVAT not found.");
      return;
    }

    const skip = pageSize * (page - 1);
    await loadComplaints(dvatData.id, pageSize, skip);
  };

  const onSubmitComplaint = async () => {
    if (!dvatData) {
      toast.error("DVAT not found.");
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }

    if (supplierTin && supplierTin.length !== 11) {
      toast.error("Supplier TIN must be 11 digits.");
      return;
    }

    if (customerTin && customerTin.length !== 11) {
      toast.error("Customer TIN must be 11 digits.");
      return;
    }

    if (supplierTin && customerTin && supplierTin === customerTin) {
      toast.error("Supplier TIN and customer TIN cannot be the same.");
      return;
    }

    if (supplierTin.length === 11 && !supplierTinName) {
      toast.error("Supplier DVAT/TIN does not exist.");
      return;
    }

    if (customerTin.length === 11 && !customerTinName) {
      toast.error("Customer DVAT/TIN does not exist.");
      return;
    }

    if (!complaintMessage.trim()) {
      toast.error("Complaint details are required.");
      return;
    }

    setIsSubmitting(true);

    const response = await CreateMissingInvoiceComplaint({
      dvat04Id: dvatData.id,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber.trim(),
      invoice_date: invoiceDate ? invoiceDate.toDate() : undefined,
      supplier_tin: supplierTin.trim(),
      customer_tin_no: customerTin.trim(),
      customer_name: customerTinName.trim(),
      complaint_message: complaintMessage.trim(),
    });

    setIsSubmitting(false);

    if (!response.status) {
      toast.error(response.message);
      return;
    }

    toast.success("Complaint created successfully.");
    setDrawerOpen(false);
    resetForm();
    await loadComplaints(dvatData.id, pagination.take, 0);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <main className="p-3 bg-gray-50 min-h-screen">
      <div className="mx-auto">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Missing Invoice Complaints
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                DVAT: {dvatData?.tinNumber ?? "N/A"}
              </p>
            </div>

            <div className="grow" />

            <Button
              type="primary"
              size="small"
              onClick={() => setDrawerOpen(true)}
            >
              Create Complaint
            </Button>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm border p-3">
          {rows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 text-xs">
                        Type
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Invoice No.
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Invoice Date
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Supplier TIN
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Customer TIN
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Customer Name
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Status
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        Created On
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="text-center text-xs p-2">
                          <Tag
                            color={
                              row.invoice_type === "SALE" ? "green" : "blue"
                            }
                          >
                            {row.invoice_type}
                          </Tag>
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.invoice_number}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.invoice_date
                            ? formateDate(row.invoice_date)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.supplier_tin ?? "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.customer_tin_no ?? "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.customer_name ?? "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          <Tag
                            color={
                              row.status === "PENDING"
                                ? "orange"
                                : row.status === "IN_REVIEW"
                                  ? "gold"
                                  : row.status === "RESOLVED"
                                    ? "green"
                                    : "red"
                            }
                          >
                            {row.status}
                          </Tag>
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {formateDate(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-3 py-2 border-t bg-gray-50 mt-2">
                <Pagination
                  showQuickJumper
                  align="center"
                  defaultCurrent={1}
                  onChange={onPageChange}
                  showSizeChanger
                  pageSizeOptions={[5, 10, 20, 50, 100]}
                  total={pagination.total}
                  responsive
                  showTotal={(total: number, range: number[]) =>
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              No complaints found for this DVAT.
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Create Missing Invoice Complaint"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Invoice Type
            </label>
            <Select
              value={invoiceType}
              onChange={(value) => setInvoiceType(value as MissingInvoiceType)}
              options={[
                { value: "SALE", label: "Sale" },
                { value: "PURCHASE", label: "Purchase" },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Invoice Number
            </label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter invoice number"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Invoice Date
            </label>
            <DatePicker
              value={invoiceDate}
              onChange={(value) => setInvoiceDate(value)}
              format="DD-MM-YYYY"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Supplier TIN
            </label>
            <Input
              value={supplierTin}
              onChange={(e) => setSupplierTin(sanitizeTin(e.target.value))}
              maxLength={11}
              placeholder="Optional"
            />
            <p
              className={`text-[11px] mt-1 min-h-4 ${
                supplierTinError ? "text-rose-500" : "text-gray-500"
              }`}
            >
              {supplierTin.length === 0
                ? "Enter 11 digit supplier TIN to verify dealer details"
                : supplierTin.length < 11
                  ? `${11 - supplierTin.length} digit(s) remaining`
                  : isSupplierTinLoading
                    ? "Verifying supplier TIN..."
                    : supplierTinError
                      ? supplierTinError
                      : supplierTinName
                      ? `Verified dealer: ${supplierTinName}`
                      : "Supplier TIN not found"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Customer TIN
            </label>
            <Input
              value={customerTin}
              onChange={(e) => setCustomerTin(sanitizeTin(e.target.value))}
              maxLength={11}
              placeholder="Optional"
            />
            <p
              className={`text-[11px] mt-1 min-h-4 ${
                customerTinError ? "text-rose-500" : "text-gray-500"
              }`}
            >
              {customerTin.length === 0
                ? "Enter 11 digit customer TIN to verify dealer details"
                : customerTin.length < 11
                  ? `${11 - customerTin.length} digit(s) remaining`
                  : isCustomerTinLoading
                    ? "Verifying customer TIN..."
                    : customerTinError
                      ? customerTinError
                      : customerTinName
                      ? `Verified dealer: ${customerTinName}`
                      : "Customer TIN not found"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Customer Name
            </label>
            <div className="min-h-10 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {customerTinName || "Will be auto-filled from customer TIN"}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Supplier Name
            </label>
            <div className="min-h-10 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {supplierTinName || "Will be auto-fetched from supplier TIN"}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Complaint Details
            </label>
            <Input.TextArea
              value={complaintMessage}
              onChange={(e) => setComplaintMessage(e.target.value)}
              rows={5}
              placeholder="Describe missing invoice issue with details"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={onSubmitComplaint}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Drawer>
    </main>
  );
};

export default MissingInvoicePage;
