"use client";

import SearchChallan from "@/action/challan/searchchallan";
import UpdateChallanStatus from "@/action/challan/updatechallanstatus";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encryptURLData, formateDate } from "@/utils/methods";
import { challan } from "@prisma/client";
import { Alert, Button, Modal } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type PaymentBucket = "success" | "pending" | "failed";
type StatusLookupMode = "order_no" | "reference_no";
type TableStatusFilter = "all" | PaymentBucket;

type OrderStatusResult = {
  order_no?: string;
  reference_no?: string;
  order_status?: string;
  status_group?: string;
  order_status_date_time?: string;
  error_desc?: string;
  raw_response?: string;
};

type ChallanUpdateConfirmDetails = {
  challanId: number;
  orderNo?: string | null;
  referenceNo?: string | null;
  orderStatus?: string | null;
};

const pendingGatewayStatus = ["Awaited", "Initiated"];
const failedGatewayStatus = [
  "Unsuccessful",
  "Invalid",
  "Fraud",
  "Timeout",
  "Chargeback",
  "Auto-Reversed",
  "Aborted",
  "Cancelled",
  "Auto-Cancelled",
  "Refunded",
  "Systemrefund",
];
const successGatewayStatus = ["Successful", "Success", "Shipped"];

const getPaymentBucket = (row: challan): PaymentBucket => {
  // Gateway status should win over local software status when deciding bucket.
  if (row.order_status && successGatewayStatus.includes(row.order_status)) {
    return "success";
  }

  if (row.order_status && pendingGatewayStatus.includes(row.order_status)) {
    return "pending";
  }

  if (row.order_status && failedGatewayStatus.includes(row.order_status)) {
    return "failed";
  }

  if (row.paymentstatus === "PAID") return "success";
  if (row.paymentstatus === "FAILED") return "failed";

  return "pending";
};

const getBucketText = (bucket: PaymentBucket): string => {
  if (bucket === "success") return "Paid";
  if (bucket === "failed") return "Failed";
  return "In Process";
};

const getBucketClass = (bucket: PaymentBucket): string => {
  if (bucket === "success") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (bucket === "failed") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
};

const PaymentStatusPage = () => {
  const router = useRouter();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [challanData, setChallanData] = useState<challan[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  // const [dvatId, setDvatId] = useState<number | null>(null);
  const [manualOrderId, setManualOrderId] = useState<string>("");
  const [lookupMode, setLookupMode] = useState<StatusLookupMode>("order_no");
  const [isManualChecking, setIsManualChecking] = useState<boolean>(false);
  const [lastStatusResult, setLastStatusResult] =
    useState<OrderStatusResult | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<TableStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] =
    useState<boolean>(false);
  const [confirmDetails, setConfirmDetails] =
    useState<ChallanUpdateConfirmDetails | null>(null);
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirmChallanUpdate = (details: ChallanUpdateConfirmDetails) =>
    new Promise<boolean>((resolve) => {
      setConfirmDetails(details);
      setIsUpdateConfirmOpen(true);
      confirmResolveRef.current = resolve;
    });

  const resolveChallanUpdateConfirmation = (value: boolean) => {
    setIsUpdateConfirmOpen(false);
    setConfirmDetails(null);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(value);
      confirmResolveRef.current = null;
    }
  };

  const isOpenOrFailedPayment = (row: challan): boolean => {
    if (row.paymentstatus === "PAID") {
      return false;
    }

    if (row.order_status && successGatewayStatus.includes(row.order_status)) {
      return false;
    }

    return (
      row.paymentstatus === "FAILED" ||
      row.paymentstatus === "PENDING" ||
      row.paymentstatus === "CREATED" ||
      (row.order_status && pendingGatewayStatus.includes(row.order_status)) ||
      (row.order_status && failedGatewayStatus.includes(row.order_status)) ||
      Boolean(row.order_id)
    );
  };

  const loadRecentChallans = async () => {
    const todate = new Date();
    const fromdate = new Date();
    fromdate.setDate(todate.getDate() - 3);

    const searchResponse = await SearchChallan({
      fromdate,
      todate,
      take: 200,
      skip: 0,
    });

    if (searchResponse.status && searchResponse.data.result) {
      setChallanData(searchResponse.data.result);
    } else if (!searchResponse.status) {
      toast.error(searchResponse.message || "Unable to fetch payment status.");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        setLoading(false);
        return router.push("/");
      }

      // const dvatResponse = await GetUserDvat04();
      // if (!dvatResponse.status || !dvatResponse.data) {
      //   toast.error(dvatResponse.message || "Unable to fetch DVAT details.");
      //   setLoading(false);
      //   return;
      // }

      // setDvatId(dvatResponse.data.id);
      await loadRecentChallans();

      setLoading(false);
    };

    init();
  }, [router]);

  const fetchOrderStatus = async (params: {
    orderNo?: string;
    referenceNo?: string;
  }) => {
    const query = new URLSearchParams();

    if (params.orderNo) {
      query.set("order_no", params.orderNo);
    }

    if (params.referenceNo) {
      query.set("reference_no", params.referenceNo);
    }

    return fetch(`/orderstatus?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const handleCheckOrderStatus = async (row: challan) => {
    if (!row.order_id) {
      toast.error("Order ID is missing for this challan.");
      return;
    }

    setProcessingId(row.id);
    try {
      const response = await fetchOrderStatus({
        orderNo: row.order_id,
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.message || "Unable to check payment status.");
        return;
      }

      setLastStatusResult(data?.data || null);

      // If API returns success status but challan doesn't have success status, update it
      const apiStatusGroup = data?.data?.status_group;
      const isApiSuccess = apiStatusGroup === "success";
      const isAlreadySuccess =
        row.order_status && successGatewayStatus.includes(row.order_status);

      if (isApiSuccess && !isAlreadySuccess) {
        const shouldUpdate = await confirmChallanUpdate({
          challanId: row.id,
          orderNo: data?.data?.order_no || row.order_id,
          referenceNo: data?.data?.reference_no,
          orderStatus: data?.data?.order_status,
        });

        if (!shouldUpdate) {
          toast.info("Challan update cancelled.");
          return;
        }

        const updateResponse = await UpdateChallanStatus({
          challanId: row.id,
          orderStatus: data?.data?.order_status,
          orderStatusDateTime: data?.data?.order_status_date_time,
          bankRefNo: data?.data?.order_bank_ref_no,
          cardName: data?.data?.order_card_name,
          paymentMode: data?.data?.order_option_type,
          statusCode: data?.data?.status_code,
          statusMessage: data?.data?.status_message,
          responseCode: data?.data?.response_code,
          failureMessage: data?.data?.error_desc,
          tracking_id: data?.data?.reference_no,
        });

        if (updateResponse.status) {
          toast.success("Challan updated with payment success status");
          // Reload challans to show updated data
          await loadRecentChallans();
        } else {
          toast.warning(updateResponse.message);
        }
      }

      toast.success(
        `Status checked: ${data?.data?.order_status || "Fetched successfully"}`,
      );
    } catch (error) {
      toast.error("Something went wrong while checking order status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualOrderStatusCheck = async () => {
    const inputValue = manualOrderId.trim();
    if (!inputValue) {
      toast.error(
        lookupMode === "order_no"
          ? "Please enter an Order ID."
          : "Please enter a Reference No.",
      );
      return;
    }

    setIsManualChecking(true);
    try {
      const response = await fetchOrderStatus({
        orderNo: lookupMode === "order_no" ? inputValue : undefined,
        referenceNo: lookupMode === "reference_no" ? inputValue : undefined,
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.message || "Unable to check payment status.");
        return;
      }

      setLastStatusResult(data?.data || null);

      // If API returns success status, check if there's a matching challan to update
      const apiStatusGroup = data?.data?.status_group;
      const isApiSuccess = apiStatusGroup === "success";

      if (isApiSuccess) {
        // Find matching challan by order_id
        const matchingChallan = challanData.find(
          (c) => c.order_id === (data?.data?.order_no || inputValue),
        );

        if (
          matchingChallan &&
          matchingChallan.order_status &&
          !successGatewayStatus.includes(matchingChallan.order_status)
        ) {
          const shouldUpdate = await confirmChallanUpdate({
            challanId: matchingChallan.id,
            orderNo: data?.data?.order_no || matchingChallan.order_id,
            referenceNo: data?.data?.reference_no,
            orderStatus: data?.data?.order_status,
          });

          if (!shouldUpdate) {
            toast.info("Challan update cancelled.");
            return;
          }

          const updateResponse = await UpdateChallanStatus({
            challanId: matchingChallan.id,
            orderStatus: data?.data?.order_status,
            orderStatusDateTime: data?.data?.order_status_date_time,
            bankRefNo: data?.data?.order_bank_ref_no,
            cardName: data?.data?.order_card_name,
            paymentMode: data?.data?.order_option_type,
            statusCode: data?.data?.status_code,
            statusMessage: data?.data?.status_message,
            responseCode: data?.data?.response_code,
            failureMessage: data?.data?.error_desc,
            tracking_id: data?.data?.reference_no,
          });

          if (updateResponse.status) {
            toast.success("Challan updated with payment success status");
            // Reload challans to show updated data
            await loadRecentChallans();
          }
        }
      }

      toast.success(
        `Status checked: ${data?.data?.order_status || "Fetched successfully"}`,
      );
    } catch (error) {
      toast.error("Something went wrong while checking order status.");
    } finally {
      setIsManualChecking(false);
    }
  };

  const initiatedRows = useMemo(
    () => challanData.filter((row) => isOpenOrFailedPayment(row)),
    [challanData],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return initiatedRows.filter((row) => {
      const bucket = getPaymentBucket(row);
      const matchesStatus = statusFilter === "all" || bucket === statusFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.cpin?.toLowerCase().includes(normalizedSearch) ||
        row.order_id?.toLowerCase().includes(normalizedSearch) ||
        row.track_id?.toLowerCase().includes(normalizedSearch) ||
        row.order_status?.toLowerCase().includes(normalizedSearch) ||
        row.paymentstatus?.toLowerCase().includes(normalizedSearch) ||
        row.failure_message?.toLowerCase().includes(normalizedSearch) ||
        row.status_message?.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [initiatedRows, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const summary = useMemo(() => {
    let pending = 0;
    let created = 0;
    let failed = 0;

    for (let i = 0; i < initiatedRows.length; i++) {
      if (getPaymentBucket(initiatedRows[i]) === "failed") {
        failed += 1;
      } else if (initiatedRows[i].paymentstatus === "PENDING") {
        pending += 1;
      } else {
        created += 1;
      }
    }

    return {
      total: initiatedRows.length,
      pending,
      created,
      failed,
    };
  }, [initiatedRows]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-100">
        Loading payment status...
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="bg-white shadow mt-4 p-3">
        <div className="bg-blue-600 p-3 text-white text-lg font-semibold">
          Initiated/Failed Payments (Not Completed)
        </div>

        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Search Payment Status by Order ID or Reference No
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={lookupMode}
              onChange={(e) =>
                setLookupMode(e.target.value as StatusLookupMode)
              }
              className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="order_no">Order ID</option>
              <option value="reference_no">Reference No</option>
            </select>
            <input
              type="text"
              value={manualOrderId}
              onChange={(e) => setManualOrderId(e.target.value)}
              placeholder={
                lookupMode === "order_no"
                  ? "Enter Order ID"
                  : "Enter Reference No"
              }
              className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
            />
            <Button
              type="primary"
              onClick={handleManualOrderStatusCheck}
              loading={isManualChecking}
              className="h-9"
            >
              Check Status
            </Button>
          </div>

          {lastStatusResult && (
            <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">Latest API Response</p>
              <p>Order No: {lastStatusResult.order_no || "-"}</p>
              <p>Reference No: {lastStatusResult.reference_no || "-"}</p>
              <p>Status: {lastStatusResult.order_status || "-"}</p>
              <p>
                Status Group:{" "}
                {lastStatusResult.status_group?.toUpperCase() || "-"}
              </p>
              <p>
                Status Updated At:{" "}
                {lastStatusResult.order_status_date_time || "-"}
              </p>
              {lastStatusResult.error_desc && (
                <p>Error: {lastStatusResult.error_desc}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs text-sky-700">Total Initiated</p>
            <p className="text-xl font-semibold text-sky-700">
              {summary.total}
            </p>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Pending</p>
            <p className="text-xl font-semibold text-amber-700">
              {summary.pending}
            </p>
          </div>
          <div className="rounded border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs text-rose-700">Failed</p>
            <p className="text-xl font-semibold text-rose-700">
              {summary.failed}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Table Search, Filter and Pagination
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search CPIN / Order ID / Message"
              className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 lg:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TableStatusFilter)
              }
              className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">In Process</option>
              <option value="failed">Failed</option>
              <option value="success">Paid</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <p className="mt-2 text-xs text-gray-600">
            Showing {filteredRows.length} result(s)
          </p>
        </div>

        {filteredRows.length === 0 && (
          <Alert
            style={{ marginTop: "12px" }}
            type="warning"
            showIcon
            description="No records found for selected filter/search in last 3 days."
          />
        )}

        {filteredRows.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <Table className="border min-w-245">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-center">CPIN</TableHead>
                  <TableHead className="text-center">Created On</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-center">Payment Status</TableHead>
                  <TableHead className="text-center">Gateway Status</TableHead>
                  <TableHead className="text-center">Message</TableHead>
                  <TableHead className="text-center">Last Update</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row: challan) => {
                  const bucket = getPaymentBucket(row);
                  const canRetry = bucket !== "success";

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-center p-2 text-blue-600">
                        <Link
                          href={`/dashboard/payments/saved-challan/${encryptURLData(
                            row.id.toString(),
                          )}`}
                        >
                          {row.cpin}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {formateDate(new Date(row.createdAt))}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {row.total_tax_amount}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getBucketClass(
                            bucket,
                          )}`}
                        >
                          {getBucketText(bucket)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {row.order_status ?? row.paymentstatus}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {row.failure_message ?? row.status_message ?? "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {row.transaction_date
                          ? formateDate(new Date(row.transaction_date))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {canRetry ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="small"
                              onClick={() => handleCheckOrderStatus(row)}
                              loading={processingId === row.id}
                            >
                              Check Status
                            </Button>
                            {/* <Link
                              href={`/dashboard/payments/saved-challan/${encryptURLData(
                                row.id.toString(),
                              )}`}
                            >
                              <Button size="small" type="primary">
                                Retry
                              </Button>
                            </Link> */}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Not required
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={isUpdateConfirmOpen}
        title="Confirm Challan Update"
        okText="Yes, Update"
        cancelText="Cancel"
        onOk={() => resolveChallanUpdateConfirmation(true)}
        onCancel={() => resolveChallanUpdateConfirmation(false)}
      >
        <div className="text-sm">
          <p>This will update challan payment details in database.</p>
          <p>Challan ID: {confirmDetails?.challanId ?? "-"}</p>
          <p>Order No: {confirmDetails?.orderNo || "-"}</p>
          <p>Reference No: {confirmDetails?.referenceNo || "-"}</p>
          <p>Gateway Status: {confirmDetails?.orderStatus || "-"}</p>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentStatusPage;
