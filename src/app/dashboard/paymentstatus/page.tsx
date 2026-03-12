"use client";

import SearchChallan from "@/action/challan/searchchallan";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
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
import { Alert, Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type PaymentBucket = "success" | "pending" | "failed";

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
  if (row.paymentstatus === "PAID") return "success";
  if (row.paymentstatus === "FAILED") return "failed";

  if (row.order_status && pendingGatewayStatus.includes(row.order_status)) {
    return "pending";
  }

  if (row.order_status && failedGatewayStatus.includes(row.order_status)) {
    return "failed";
  }

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
  const [dvatId, setDvatId] = useState<number | null>(null);

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

  const loadRecentChallans = async (currentDvatId: number) => {
    const todate = new Date();
    const fromdate = new Date();
    fromdate.setDate(todate.getDate() - 3);

    const searchResponse = await SearchChallan({
      dvatid: currentDvatId,
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

      const dvatResponse = await GetUserDvat04();
      if (!dvatResponse.status || !dvatResponse.data) {
        toast.error(dvatResponse.message || "Unable to fetch DVAT details.");
        setLoading(false);
        return;
      }

      setDvatId(dvatResponse.data.id);
      await loadRecentChallans(dvatResponse.data.id);

      setLoading(false);
    };

    init();
  }, [router]);

  const handleCheckOrderStatus = async (row: challan) => {
    if (!row.order_id) {
      toast.error("Order ID is missing for this challan.");
      return;
    }

    setProcessingId(row.id);
    try {
      const response = await fetch(
        `/orderstatus?order_no=${encodeURIComponent(row.order_id)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.message || "Unable to check payment status.");
        return;
      }

      toast.success(
        `Status checked: ${data?.data?.order_status || "Updated successfully"}`,
      );

      if (dvatId) {
        await loadRecentChallans(dvatId);
      }
    } catch (error) {
      toast.error("Something went wrong while checking order status.");
    } finally {
      setProcessingId(null);
    }
  };

  const initiatedRows = useMemo(
    () => challanData.filter((row) => isOpenOrFailedPayment(row)),
    [challanData],
  );

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

        {initiatedRows.length === 0 && (
          <Alert
            style={{ marginTop: "12px" }}
            type="warning"
            showIcon
            description="No initiated or failed payment found in last 3 days."
          />
        )}

        {initiatedRows.length > 0 && (
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
                {initiatedRows.map((row: challan) => {
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
                            <Link
                              href={`/dashboard/payments/saved-challan/${encryptURLData(
                                row.id.toString(),
                              )}`}
                            >
                              <Button size="small" type="primary">
                                Retry
                              </Button>
                            </Link>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
