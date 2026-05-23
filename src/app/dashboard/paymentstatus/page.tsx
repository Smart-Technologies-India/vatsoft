"use client";

import SearchChallan from "@/action/challan/searchchallan";
import UpdateChallanStatus from "@/action/challan/updatechallanstatus";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { encryptURLData, formateDate } from "@/utils/methods";
import { challan } from "@prisma/client";
import { Alert, Button, Modal } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

type PaymentBucket = "success" | "pending" | "failed";
type StatusLookupMode = "order_no" | "reference_no";
type TableStatusFilter = "all" | "pending" | "failed";

type OrderStatusResult = {
  order_no?: string;
  reference_no?: string;
  order_status?: string;
  status_group?: string;
  order_status_date_time?: string;
  order_fee_flat?: string | number;
  order_tax?: string | number;
  error_desc?: string;
  raw_response?: string;
  order_bank_ref_no?: string;
  order_card_name?: string;
  order_option_type?: string;
  status_code?: string;
  response_code?: string;
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
  const [isDirectUpdateModalOpen, setIsDirectUpdateModalOpen] = useState(false);
  const [isDirectUpdateModalLoading, setIsDirectUpdateModalLoading] =
    useState(false);

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
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

  const loadRecentChallans = async () => {
    const searchResponse = await SearchChallan({
      take: 100000,
      skip: 0,
      excludePaid: false,
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
          statusGroup: data?.data?.status_group,
          orderStatusDateTime: data?.data?.order_status_date_time,
          bankRefNo: data?.data?.order_bank_ref_no,
          cardName: data?.data?.order_card_name,
          paymentMode: data?.data?.order_option_type,
          statusCode: data?.data?.status_code,
          statusMessage: "Completed Successfully",
          responseCode: data?.data?.response_code,
          failureMessage: data?.data?.error_desc,
          tracking_id: data?.data?.reference_no,
          orderFeeFlat: data?.data?.order_fee_flat,
          orderTax: data?.data?.order_tax,
        });

        if (updateResponse.status) {
          toast.success("Challan updated with payment success status");
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
            statusGroup: data?.data?.status_group,
            orderStatusDateTime: data?.data?.order_status_date_time,
            bankRefNo: data?.data?.order_bank_ref_no,
            cardName: data?.data?.order_card_name,
            paymentMode: data?.data?.order_option_type,
            statusCode: data?.data?.status_code,
            statusMessage: "Completed Successfully",
            responseCode: data?.data?.response_code,
            failureMessage: data?.data?.error_desc,
            tracking_id: data?.data?.reference_no,
            orderFeeFlat: data?.data?.order_fee_flat,
            orderTax: data?.data?.order_tax,
          });

          if (updateResponse.status) {
            toast.success("Challan updated with payment success status");
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

  const columns = useMemo<ColumnDef<challan>[]>(
    () => [
      {
        accessorKey: "cpin",
        header: "CPIN",
        cell: ({ row }) => (
          <Link
            className="text-blue-600"
            href={`/dashboard/payments/saved-challan/${encryptURLData(
              row.original.id.toString(),
            )}`}
          >
            {row.original.cpin}
          </Link>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created On",
        sortingFn: "datetime",
        cell: ({ row }) => formateDate(new Date(row.original.createdAt)),
      },
      {
        accessorKey: "total_tax_amount",
        header: "Amount",
      },
      {
        id: "payment_bucket",
        header: "Payment Status",
        accessorFn: (row) => getPaymentBucket(row),
        filterFn: "equalsString",
        cell: ({ row }) => {
          const bucket = getPaymentBucket(row.original);
          return (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getBucketClass(
                bucket,
              )}`}
            >
              {getBucketText(bucket)}
            </span>
          );
        },
      },
      {
        id: "gateway_status",
        header: "Gateway Status",
        accessorFn: (row) => row.order_status ?? row.paymentstatus,
      },
      {
        id: "message",
        header: "Message",
        accessorFn: (row) => row.failure_message ?? row.status_message ?? "-",
      },
      {
        id: "last_update",
        header: "Last Update",
        accessorFn: (row) =>
          row.transaction_date
            ? formateDate(new Date(row.transaction_date))
            : "-",
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const bucket = getPaymentBucket(row.original);
          const canRetry = bucket !== "success";

          if (!canRetry) {
            return <span className="text-xs text-gray-500">Not required</span>;
          }

          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="small"
                onClick={() => handleCheckOrderStatus(row.original)}
                loading={processingId === row.original.id}
              >
                Check Status
              </Button>
            </div>
          );
        },
      },
    ],
    [processingId],
  );

  const table = useReactTable({
    data: challanData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchText,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = String(filterValue ?? "").trim().toLowerCase();
      if (!needle) return true;

      const haystack = [
        row.original.cpin,
        row.original.order_id,
        row.original.track_id,
        row.original.order_status,
        row.original.paymentstatus,
        row.original.failure_message,
        row.original.status_message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    },
  });

  const handleStatusFilterChange = (value: TableStatusFilter) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    table
      .getColumn("payment_bucket")
      ?.setFilterValue(value === "all" ? undefined : value);
  };

  const summary = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let failed = 0;

    const initiatedRows = table.getFilteredRowModel().rows;

    for (let i = 0; i < initiatedRows.length; i++) {
      const bucket = getPaymentBucket(initiatedRows[i].original);

      if (bucket === "failed") {
        failed += 1;
      } else if (bucket === "pending") {
        pending += 1;
      } else {
        paid += 1;
      }
    }

    return {
      total: initiatedRows.length,
      paid,
      pending,
      failed,
    };
  }, [table]);

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
          All Payments
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

              {/* Check Status Button and Modal for direct update */}
              <Button
                type="primary"
                className="mt-2"
                onClick={() => setIsDirectUpdateModalOpen(true)}
                disabled={
                  !lastStatusResult ||
                  !lastStatusResult.order_no ||
                  !lastStatusResult.reference_no ||
                  !lastStatusResult.order_status
                }
              >
                Check Status
              </Button>

              <Modal
                open={isDirectUpdateModalOpen}
                title="Update Challan Status"
                okText="Update"
                cancelText="Cancel"
                confirmLoading={isDirectUpdateModalLoading}
                onOk={async () => {
                  setIsDirectUpdateModalLoading(true);
                  try {
                    // Find the challanId from challanData by matching order_no or reference_no
                    const matchingChallan = challanData.find(
                      (row) => row.order_id === lastStatusResult.order_no,
                    );
                    const challanId = matchingChallan?.id;
                    if (!challanId) {
                      toast.error("Matching challan not found for update.");
                      setIsDirectUpdateModalLoading(false);
                      return;
                    }
                    const updateResponse = await UpdateChallanStatus({
                      challanId,
                      orderStatus: lastStatusResult.order_status,
                      statusGroup: lastStatusResult.status_group,
                      orderStatusDateTime:
                        lastStatusResult.order_status_date_time,
                      bankRefNo: lastStatusResult.order_bank_ref_no,
                      cardName: lastStatusResult.order_card_name,
                      paymentMode: lastStatusResult.order_option_type,
                      statusCode: lastStatusResult.status_code,
                      statusMessage: "Completed Successfully",
                      responseCode: lastStatusResult.response_code,
                      failureMessage: lastStatusResult.error_desc,
                      tracking_id: lastStatusResult.reference_no,
                      orderFeeFlat: lastStatusResult.order_fee_flat,
                      orderTax: lastStatusResult.order_tax,
                    });
                    if (updateResponse.status) {
                      toast.success("Challan updated with payment status");
                      setIsDirectUpdateModalOpen(false);
                    } else {
                      toast.warning(updateResponse.message);
                    }
                  } catch (err) {
                    toast.error("Failed to update challan status");
                  } finally {
                    setIsDirectUpdateModalLoading(false);
                  }
                }}
                onCancel={() => setIsDirectUpdateModalOpen(false)}
              >
                <p>
                  Are you sure you want to update the challan status with the
                  latest result?
                </p>
              </Modal>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs text-sky-700">Total Payments</p>
            <p className="text-xl font-semibold text-sky-700">
              {summary.total}
            </p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Paid</p>
            <p className="text-xl font-semibold text-emerald-700">
              {summary.paid}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                setSearchText(e.target.value);
              }}
              placeholder="Search CPIN / Order ID / Message"
              className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 lg:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilterChange(e.target.value as TableStatusFilter)
              }
              className="h-9 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">In Process</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <p className="mt-2 text-xs text-gray-600">
            Showing {table.getRowModel().rows.length} of {summary.total} total
            record(s)
          </p>
        </div>

        {table.getFilteredRowModel().rows.length === 0 && (
          <Alert
            style={{ marginTop: "12px" }}
            type="warning"
            showIcon
            description="No records found for selected filter/search."
          />
        )}

        {table.getFilteredRowModel().rows.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border min-w-245">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr className="bg-gray-100" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortState = header.column.getIsSorted();
                      const sortText =
                        sortState === "asc"
                          ? " ▲"
                          : sortState === "desc"
                            ? " ▼"
                            : "";

                      return (
                        <th
                          className="text-center px-2 py-2 border-b"
                          key={header.id}
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                          role={canSort ? "button" : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {canSort && sortText}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td className="text-center p-2 border-b" key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {Math.max(1, table.getPageCount())} &mdash; {summary.total} total
                record(s)
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                    table.setPageIndex(0);
                  }}
                  className="h-7 rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button
                  size="small"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
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
