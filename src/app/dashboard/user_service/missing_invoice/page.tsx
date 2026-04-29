"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Modal,
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
import UpdateMissingInvoiceStatus from "@/action/missing_invoice/updatemissinginvoicestatus";
import type { MissingInvoiceComplaintWithCreator } from "@/models/missinginvoice";
import { formateDate } from "@/utils/methods";
import { dvat04, MissingInvoiceStatus, MissingInvoiceType } from "@prisma/client";
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
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedComplaintToClose, setSelectedComplaintToClose] =
    useState<MissingInvoiceComplaintWithCreator | null>(null);
  const [isClosingComplaint, setIsClosingComplaint] = useState(false);

  const [invoiceType, setInvoiceType] =
    useState<MissingInvoiceType>("MISSING_SALE");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxableAmount, setTaxableAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Dayjs | null>(null);
  const [supplierTin, setSupplierTin] = useState("");
  const [supplierTinName, setSupplierTinName] = useState("");
  const [supplierTinError, setSupplierTinError] = useState("");
  const [isSupplierTinLoading, setIsSupplierTinLoading] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");

  const sanitizeTin = (value: string) => value.replace(/\D/g, "").slice(0, 11);

  const resetForm = () => {
    setInvoiceType("MISSING_SALE");
    setInvoiceNumber("");
    setTaxableAmount("");
    setVatAmount("");
    setInvoiceDate(null);
    setSupplierTin("");
    setSupplierTinName("");
    setSupplierTinError("");
    setIsSupplierTinLoading(false);
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

      if (dvatData?.tinNumber && supplierTin === dvatData.tinNumber) {
        setSupplierTinName("");
        setSupplierTinError("Supplier TIN cannot be same as your DVAT TIN.");
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
  }, [supplierTin, dvatData?.tinNumber]);

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

    if (!taxableAmount.trim()) {
      toast.error("Taxable amount is required.");
      return;
    }

    if (!vatAmount.trim()) {
      toast.error("VAT amount is required.");
      return;
    }

    if (!supplierTin) {
      toast.error("Supplier TIN is required.");
      return;
    }

    if (supplierTin.length !== 11) {
      toast.error("Supplier TIN must be 11 digits.");
      return;
    }

    if (dvatData.tinNumber && supplierTin === dvatData.tinNumber) {
      toast.error("Supplier TIN cannot be same as your DVAT TIN.");
      return;
    }

    if (supplierTin.length === 11 && !supplierTinName) {
      toast.error("Supplier DVAT/TIN does not exist.");
      return;
    }

    setIsSubmitting(true);

    const response = await CreateMissingInvoiceComplaint({
      dvat04Id: dvatData.id,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber.trim(),
      taxable_amount: taxableAmount.trim(),
      vat_amount: vatAmount.trim(),
      invoice_date: invoiceDate ? invoiceDate.toDate() : undefined,
      supplier_tin: supplierTin.trim(),
      customer_tin_no: dvatData.tinNumber?.trim() ?? "",
      customer_name: (dvatData.tradename ?? dvatData.name ?? "").trim(),
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

  const openCloseComplaintModal = (row: MissingInvoiceComplaintWithCreator) => {
    setSelectedComplaintToClose(row);
    setIsCloseModalOpen(true);
  };

  const onConfirmCloseComplaint = async () => {
    if (!selectedComplaintToClose || !dvatData) {
      return;
    }

    setIsClosingComplaint(true);

    const response = await UpdateMissingInvoiceStatus({
      id: selectedComplaintToClose.id,
      status: "RESOLVED" as MissingInvoiceStatus,
    });

    setIsClosingComplaint(false);

    if (!response.status) {
      toast.error(response.message);
      return;
    }

    toast.success("Complaint closed successfully.");
    setIsCloseModalOpen(false);
    setSelectedComplaintToClose(null);
    await loadComplaints(dvatData.id, pagination.take, pagination.skip);
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
                        Taxable Amount
                      </TableHead>
                      <TableHead className="text-center p-2 text-xs">
                        VAT Amount
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
                      <TableHead className="text-center p-2 text-xs">
                        Action
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
                              row.invoice_type === "MISSING_SALE"
                                ? "green"
                                : "blue"
                            }
                          >
                            {row.invoice_type}
                          </Tag>
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.invoice_number}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.taxable_amount}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {row.vat_amount}
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
                        <TableCell className="text-center text-xs p-2">
                          {row.status === "IN_REVIEW" ? (
                            <Button
                              size="small"
                              danger
                              onClick={() => openCloseComplaintModal(row)}
                            >
                              Close Complaint
                            </Button>
                          ) : (
                            "-"
                          )}
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
                { value: "MISSING_SALE", label: "Missing Sale" },
                { value: "WRONG_SALE", label: "Wrong Sale" },
              ]}
              className="w-full"
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
              placeholder="Enter 11 digit supplier TIN"
            />
            <p
              className={`text-[11px] mt-1 min-h-4 ${
                supplierTinError ? "text-rose-500" : "text-gray-500"
              }`}
            >
              {supplierTin.length === 0
                ? "Supplier TIN is required"
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
              Supplier Name
            </label>
            <div className="min-h-10 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {supplierTinName || "Will be auto-fetched from supplier TIN"}
            </div>
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
              Taxable Amount
            </label>
            <Input
              value={taxableAmount}
              onChange={(e) => setTaxableAmount(e.target.value)}
              placeholder="Enter taxable amount"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              VAT Amount
            </label>
            <Input
              value={vatAmount}
              onChange={(e) => setVatAmount(e.target.value)}
              placeholder="Enter VAT amount"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Complaint Details (Optional)
            </label>
            <Input.TextArea
              value={complaintMessage}
              onChange={(e) => setComplaintMessage(e.target.value)}
              rows={5}
              placeholder="Describe missing invoice issue with details (optional)"
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

      <Modal
        title="Close Complaint"
        open={isCloseModalOpen}
        onCancel={() => {
          if (!isClosingComplaint) {
            setIsCloseModalOpen(false);
            setSelectedComplaintToClose(null);
          }
        }}
        onOk={onConfirmCloseComplaint}
        okText="Yes, Close"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: isClosingComplaint }}
        cancelButtonProps={{ disabled: isClosingComplaint }}
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to close this complaint?
        </p>
        {selectedComplaintToClose && (
          <p className="text-xs text-gray-500 mt-2">
            Invoice: {selectedComplaintToClose.invoice_number}
          </p>
        )}
      </Modal>
    </main>
  );
};

export default MissingInvoicePage;
