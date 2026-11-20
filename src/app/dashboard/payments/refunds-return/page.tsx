"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Spin, Divider, Table, Modal } from "antd";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { dvat04 } from "@prisma/client";
import CreateWalletRefund from "@/action/payments/createwalletrefund";
import GetWalletRefundReturns from "@/action/payments/getwalletrefundreturns";
import CheckFiledReturnStatus from "@/action/payments/checkfiledreturnstatus";

interface WalletRefundData {
  id: number;
  liquor_wallet_historyId: number | null;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  invoice_number: string;
  amount: string;
  return_month: string | null;
  return_quarter: string | null;
  return_year: string | null;
  return_status: string;
  rr_number: string;
  filing_datetime: Date | null;
  total_tax_amount: string | null;
  dvat_name: string | null;
  dvat_tin: string | null;
  created_at: Date;
}

const RefundsReturnPage = () => {
  const [loading, setLoading] = useState(false);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
  const [refundRequests, setRefundRequests] = useState<WalletRefundData[]>([]);
  const [filedReturn, setFiledReturn] = useState<any>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const dvatResponse = await GetUserDvat04();
        if (dvatResponse.status && dvatResponse.data) {
          setDvat(dvatResponse.data);
          checkFiledReturn(dvatResponse.data);
          loadRefundRequests(dvatResponse.data.id);
        } else {
          toast.error("Failed to load DVAT details");
        }
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const checkFiledReturn = async (dvatData: dvat04) => {
    try {
      // Fetch the return status based on frequency filing
      const returnResponse = await CheckFiledReturnStatus({
        dvatId: dvatData.id,
      });
      if (returnResponse.status && returnResponse.data) {
        setFiledReturn(returnResponse.data);
      } else {
        setFiledReturn(null);
      }
    } catch (error) {
      setFiledReturn(null);
    }
  };

  const loadRefundRequests = async (dvatId: number) => {
    try {
      const response = await GetWalletRefundReturns();
      if (response.status && response.data) {
        setRefundRequests(response.data);
      }
    } catch (error) {
      console.error("Error loading refund requests:", error);
    }
  };

  const handleCreateRefund = async () => {
    if (!dvat || !filedReturn || filedReturn.status !== "PAID") {
      toast.error("You are not eligible to create a refund request");
      return;
    }

    try {
      setLoading(true);

      const response = await CreateWalletRefund();

      if (response.status) {
        toast.success("Refund request created successfully!");
        loadRefundRequests(dvat.id);
      } else {
        toast.error(response.message || "Failed to create refund request");
      }
    } catch (error) {
      toast.error("Error creating refund request");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = () => {
    Modal.confirm({
      title: "Create Refund Request",
      content: `Are you sure you want to create a refund request for ${filedReturn?.month || `Q${filedReturn?.quarter}`} ${filedReturn?.year}?`,
      okText: "Yes, Create",
      cancelText: "Cancel",
      onOk: handleCreateRefund,
    });
  };

  const columns = [
    {
      title: "DVAT Name",
      dataIndex: "dvat_name",
      key: "dvat_name",
      width: 150,
    },
    {
      title: "TIN",
      dataIndex: "dvat_tin",
      key: "dvat_tin",
      width: 100,
    },

    {
      title: "Return Period",
      dataIndex: "return_month",
      key: "return_period",
      width: 120,
      render: (text: string, record: WalletRefundData) => {
        if (record.return_month) {
          return `${record.return_month} ${record.return_year}`;
        }
        return `Q${record.return_quarter} ${record.return_year}`;
      },
    },
    {
      title: "Filing Date",
      dataIndex: "filing_datetime",
      key: "filing_datetime",
      width: 120,
      render: (date: Date) =>
        date ? new Date(date).toLocaleDateString() : "N/A",
    },

    {
      title: "ITC Amount (₹)",
      dataIndex: "itc_amount",
      key: "itc_amount",
      width: 120,
      render: (text: string) => `₹${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "Cash Amount (₹)",
      dataIndex: "cash_amount",
      key: "cash_amount",
      width: 120,
      render: (text: string) => `₹${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "Total Amount (₹)",
      key: "total_amount",
      width: 120,
      render: (text: string, record: WalletRefundData) => {
        const itc = parseFloat(record.itc_amount || "0");
        const cash = parseFloat(record.cash_amount || "0");
        const total = itc + cash;
        return `₹${total.toFixed(2)}`;
      },
    },
    {
      title: "Request Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          DUE: "text-yellow-600",
          APPROVED: "text-green-600",
          REJECTED: "text-red-600",
        };
        return (
          <span className={statusColors[text] || "text-gray-600"}>{text}</span>
        );
      },
    },
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      width: 150,
      render: (text: string) => text || "N/A",
    },
  ];

  if (!dvat) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-2 mx-auto mt-2 w-4/6">
      <h1 className="text-xl font-bold mb-4">Refunds Return</h1>

      {/* Eligibility Check */}
      <div
        className={`p-4 rounded-lg mb-6 ${
          filedReturn && filedReturn.status === "PAID"
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        {filedReturn ? (
          <>
            <p
              className={`font-semibold ${
                filedReturn.status === "PAID"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {filedReturn.status === "PAID"
                ? `✅ Return Filed and Paid`
                : `❌ Return Not Paid`}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>{filedReturn.month || `Q${filedReturn.quarter}`}</strong>{" "}
              {filedReturn.year} - Status: <strong>{filedReturn.status}</strong>
            </p>

            {filedReturn.status === "PAID" && (
              <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-green-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    ITC Cash
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    ₹{parseFloat(filedReturn.pending_payment || "0").toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-green-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    Pending Cash
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    ₹{parseFloat(filedReturn.cash_payment || "0").toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">❌ Return Not Filed</p>
            <p className="text-sm text-gray-600 mt-2">
              {dvat?.frequencyFilings === "MONTHLY"
                ? "October 2026 return not filed yet"
                : "September 2026 return not filed yet"}
            </p>
          </>
        )}
      </div>

      {/* Create New Request Button */}
      {filedReturn && filedReturn.status === "PAID" && (
        refundRequests.length === 0 || 
        refundRequests.some((req) => req.status === "REJECTED")
      ) && (
        <Button
          type="primary"
          size="large"
          onClick={showConfirmation}
          loading={loading}
          className="mb-6"
        >
          Create New Refund Request
        </Button>
      )}

      {/* Table of Existing Requests */}
      {refundRequests.length > 0 && (
        <>
          <Divider />
          <h2 className="text-xl font-semibold mb-4">Your Refund Requests</h2>
          <Table
            columns={columns}
            dataSource={refundRequests.map((req) => ({ ...req, key: req.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              total: refundRequests.length,
            }}
          />
        </>
      )}
    </div>
  );
};

export default RefundsReturnPage;
