"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Button,
  Drawer,
  Input,
  Pagination,
  Select,
  Spin,
  Tag,
} from "antd";

import GetAllMissingInvoiceComplaints from "@/action/missing_invoice/getallmissinginvoicecomplaints";
import UpdateMissingInvoiceStatus from "@/action/missing_invoice/updatemissinginvoicestatus";
import SearchTinNumber from "@/action/dvat/searchtin";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import type { MissingInvoiceComplaintWithCreator } from "@/models/missinginvoice";
import { formateDate } from "@/utils/methods";
import { dvat04, MissingInvoiceStatus, MissingInvoiceType, user } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS: { value: MissingInvoiceStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

const TYPE_OPTIONS: { value: MissingInvoiceType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "MISSING_SALE", label: "Missing Sale" },
  { value: "WRONG_SALE", label: "Wrong Sale" },
];

const STATUS_COLORS: Record<MissingInvoiceStatus, string> = {
  PENDING: "orange",
  IN_REVIEW: "gold",
  RESOLVED: "green",
  REJECTED: "red",
};

const AdminMissingInvoicePage = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<Array<MissingInvoiceComplaintWithCreator>>([]);
  const [pagination, setPagination] = useState({ take: 10, skip: 0, total: 0 });

  const [filterStatus, setFilterStatus] = useState<MissingInvoiceStatus | "">("");
  const [filterType, setFilterType] = useState<MissingInvoiceType | "">("");
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MissingInvoiceComplaintWithCreator | null>(null);
  const [newStatus, setNewStatus] = useState<MissingInvoiceStatus>("PENDING");
  const [isUpdating, setIsUpdating] = useState(false);

  type DvatWithUser = dvat04 & { createdBy: user };
  const [supplierInfo, setSupplierInfo] = useState<DvatWithUser | null>(null);
  const [customerInfo, setCustomerInfo] = useState<DvatWithUser | null>(null);
  const [isFetchingTins, setIsFetchingTins] = useState(false);

  const loadComplaints = async (
    take: number,
    skip: number,
    status: MissingInvoiceStatus | "",
    invoice_type: MissingInvoiceType | "",
    search: string,
  ) => {
    const response = await GetAllMissingInvoiceComplaints({
      take,
      skip,
      status: status || undefined,
      invoice_type: invoice_type || undefined,
      search: search || undefined,
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

      await loadComplaints(10, 0, "", "", "");
      setIsLoading(false);
    };

    init();
  }, []);

  const onPageChange = async (page: number, pageSize: number) => {
    const skip = pageSize * (page - 1);
    await loadComplaints(pageSize, skip, filterStatus, filterType, searchText);
  };

  const onFilterChange = async (
    status: MissingInvoiceStatus | "",
    type: MissingInvoiceType | "",
    search: string,
  ) => {
    await loadComplaints(pagination.take, 0, status, type, search);
  };

  const handleStatusChange = (val: MissingInvoiceStatus | "") => {
    setFilterStatus(val);
    void onFilterChange(val, filterType, searchText);
  };

  const handleTypeChange = (val: MissingInvoiceType | "") => {
    setFilterType(val);
    void onFilterChange(filterStatus, val, searchText);
  };

  const handleSearch = () => {
    setSearchText(searchInput);
    void onFilterChange(filterStatus, filterType, searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    setSearchText("");
    void onFilterChange(filterStatus, filterType, "");
  };

  const openDrawer = async (row: MissingInvoiceComplaintWithCreator) => {
    setSelectedRow(row);
    setNewStatus(row.status);
    setSupplierInfo(null);
    setCustomerInfo(null);
    setDrawerOpen(true);

    if (row.supplier_tin || row.customer_tin_no) {
      setIsFetchingTins(true);
      const fetches = await Promise.all([
        row.supplier_tin ? SearchTinNumber({ tinumber: row.supplier_tin }) : Promise.resolve(null),
        row.customer_tin_no ? SearchTinNumber({ tinumber: row.customer_tin_no }) : Promise.resolve(null),
      ]);
      setIsFetchingTins(false);

      if (fetches[0]?.status && fetches[0].data) setSupplierInfo(fetches[0].data);
      if (fetches[1]?.status && fetches[1].data) setCustomerInfo(fetches[1].data);
    }
  };

  const onUpdateStatus = async () => {
    if (!selectedRow) return;

    setIsUpdating(true);
    const response = await UpdateMissingInvoiceStatus({
      id: selectedRow.id,
      status: newStatus,
    });
    setIsUpdating(false);

    if (!response.status) {
      toast.error(response.message);
      return;
    }

    toast.success("Status updated successfully.");
    setDrawerOpen(false);
    setSelectedRow(null);
    await loadComplaints(pagination.take, pagination.skip, filterStatus, filterType, searchText);
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
                Missing Invoice Complaints (Admin)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                View and manage all missing invoice complaints
              </p>
            </div>

            <div className="grow" />

            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={filterStatus}
                onChange={handleStatusChange}
                options={STATUS_OPTIONS}
                size="small"
                style={{ width: 140 }}
              />
              <Select
                value={filterType}
                onChange={handleTypeChange}
                options={TYPE_OPTIONS}
                size="small"
                style={{ width: 130 }}
              />
              <Input.Search
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={handleSearch}
                onPressEnter={handleSearch}
                placeholder="Invoice No. / TIN / Name"
                allowClear
                onClear={handleSearchClear}
                size="small"
                style={{ width: 220 }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm border p-3">
          {rows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 text-xs">Type</TableHead>
                      <TableHead className="text-center p-2 text-xs">Invoice No.</TableHead>
                      <TableHead className="text-center p-2 text-xs">Taxable Amount</TableHead>
                      <TableHead className="text-center p-2 text-xs">VAT Amount</TableHead>
                      <TableHead className="text-center p-2 text-xs">Invoice Date</TableHead>
                      <TableHead className="text-center p-2 text-xs">Supplier TIN</TableHead>
                      <TableHead className="text-center p-2 text-xs">Customer TIN</TableHead>
                      <TableHead className="text-center p-2 text-xs">Customer Name</TableHead>
                      <TableHead className="text-center p-2 text-xs">Submitted By</TableHead>
                      <TableHead className="text-center p-2 text-xs">Status</TableHead>
                      <TableHead className="text-center p-2 text-xs">Created On</TableHead>
                      <TableHead className="text-center p-2 text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className="border-b hover:bg-gray-50">
                        <TableCell className="text-center text-xs p-2">
                          <Tag color={row.invoice_type === "MISSING_SALE" ? "green" : "blue"}>
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
                          {row.invoice_date ? formateDate(row.invoice_date) : "-"}
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
                          <div>
                            {row.createdBy.firstName ?? ""} {row.createdBy.lastName ?? ""}
                          </div>
                          <div className="text-gray-400">{row.createdBy.mobileOne}</div>
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          <Tag color={STATUS_COLORS[row.status]}>{row.status}</Tag>
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          {formateDate(row.createdAt)}
                        </TableCell>
                        <TableCell className="text-center text-xs p-2">
                          <Button
                            size="small"
                            type="link"
                            onClick={() => openDrawer(row)}
                          >
                            Manage
                          </Button>
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
              No complaints found.
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Manage Complaint"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={480}
      >
        {selectedRow && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <p className="text-gray-500">Invoice Type</p>
                <Tag color={selectedRow.invoice_type === "MISSING_SALE" ? "green" : "blue"} className="mt-1">
                  {selectedRow.invoice_type}
                </Tag>
              </div>
              <div>
                <p className="text-gray-500">Invoice Number</p>
                <p className="font-medium mt-1">{selectedRow.invoice_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Taxable Amount</p>
                <p className="font-medium mt-1">{selectedRow.taxable_amount}</p>
              </div>
              <div>
                <p className="text-gray-500">VAT Amount</p>
                <p className="font-medium mt-1">{selectedRow.vat_amount}</p>
              </div>
              <div>
                <p className="text-gray-500">Invoice Date</p>
                <p className="font-medium mt-1">
                  {selectedRow.invoice_date ? formateDate(selectedRow.invoice_date) : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Current Status</p>
                <Tag color={STATUS_COLORS[selectedRow.status]} className="mt-1">
                  {selectedRow.status}
                </Tag>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Submitted By</p>
                <p className="font-medium mt-1">
                  {selectedRow.createdBy.firstName ?? ""} {selectedRow.createdBy.lastName ?? ""} &mdash; {selectedRow.createdBy.mobileOne}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Created On</p>
                <p className="font-medium mt-1">{formateDate(selectedRow.createdAt)}</p>
              </div>
            </div>

            {/* Supplier Info */}
            {selectedRow.supplier_tin && (
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Supplier TIN: {selectedRow.supplier_tin}
                </p>
                {isFetchingTins ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Spin size="small" /> Fetching details...
                  </div>
                ) : supplierInfo ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <p className="text-gray-500">Trade Name</p>
                      <p className="font-medium">{supplierInfo.tradename ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{supplierInfo.name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact 1</p>
                      <p className="font-medium">{supplierInfo.contact_one ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact 2</p>
                      <p className="font-medium">{supplierInfo.contact_two ?? "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{supplierInfo.email ?? "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">
                        {[supplierInfo.buildingNumber, supplierInfo.area, supplierInfo.address, supplierInfo.city, supplierInfo.pincode]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500">Dealer not found in DVAT records.</p>
                )}
              </div>
            )}

            {/* Customer Info */}
            {selectedRow.customer_tin_no && (
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Customer TIN: {selectedRow.customer_tin_no}
                </p>
                {isFetchingTins ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Spin size="small" /> Fetching details...
                  </div>
                ) : customerInfo ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <p className="text-gray-500">Trade Name</p>
                      <p className="font-medium">{customerInfo.tradename ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{customerInfo.name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact 1</p>
                      <p className="font-medium">{customerInfo.contact_one ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact 2</p>
                      <p className="font-medium">{customerInfo.contact_two ?? "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{customerInfo.email ?? "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">
                        {[customerInfo.buildingNumber, customerInfo.area, customerInfo.address, customerInfo.city, customerInfo.pincode]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500">Dealer not found in DVAT records.</p>
                )}
              </div>
            )}

            <div className="border-t pt-3">
              <p className="text-gray-500 text-xs mb-1">Complaint Details</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded p-2 border">
                {selectedRow.complaint_message || "-"}
              </p>
            </div>

            <div className="border-t pt-3">
              <label className="text-xs text-gray-600 block mb-1">Update Status</label>
              <Select
                value={newStatus}
                onChange={(val) => setNewStatus(val as MissingInvoiceStatus)}
                options={STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                className="w-full mb-3"
              />
              <Button
                type="primary"
                onClick={onUpdateStatus}
                loading={isUpdating}
                disabled={newStatus === selectedRow.status}
                block
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </main>
  );
};

export default AdminMissingInvoicePage;
