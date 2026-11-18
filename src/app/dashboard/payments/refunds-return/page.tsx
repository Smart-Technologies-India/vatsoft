"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Form, Input, Select, Spin, Space, Divider, Table } from "antd";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { dvat04 } from "@prisma/client";
import CreateWalletRefund from "@/action/payments/createwalletrefund";
import GetWalletRefundReturns from "@/action/payments/getwalletrefundreturns";

interface WalletRefundData {
  id: number;
  liquor_wallet_historyId: number;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  invoice_number: string;
  amount: string;
  return_month: string | null;
  return_quarter: string | null;
  created_at: Date;
}

const RefundsReturnPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
  const [refundRequests, setRefundRequests] = useState<WalletRefundData[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const dvatResponse = await GetUserDvat04();
        if (dvatResponse.status && dvatResponse.data) {
          setDvat(dvatResponse.data);
          checkEligibility(dvatResponse.data);
          loadRefundRequests(dvatResponse.data.id);
        } else {
          toast.error("Failed to load DVAT details");
        }
      } catch (error) {
        toast.error("Error loading data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const checkEligibility = async (dvatData: dvat04) => {
    try {
      // For now, set eligibility based on frequency
      // The actual check will be done by the action when creating
      if (dvatData.frequencyFilings === "MONTHLY") {
        setEligibilityMessage(
          "ℹ️ MONTHLY: October 2026 return must be filed to create refund request"
        );
      } else if (dvatData.frequencyFilings === "QUARTERLY") {
        setEligibilityMessage(
          "ℹ️ QUARTERLY: September 2026 return must be filed to create refund request"
        );
      }
      setIsEligible(true);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    }
  };

  const loadRefundRequests = async (dvatId: number) => {
    try {
      const response = await GetWalletRefundReturns({ dvatId });
      if (response.status && response.data) {
        setRefundRequests(response.data);
      }
    } catch (error) {
      console.error("Error loading refund requests:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!dvat || !isEligible) {
      toast.error("You are not eligible to create a refund request");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        dvatId: dvat.id,
        itc_amount: values.itc_amount || "0",
        cash_amount: values.cash_amount || "0",
        remark: values.remark || "",
      };

      const response = await CreateWalletRefund(payload);

      if (response.status) {
        toast.success("Refund request created successfully!");
        form.resetFields();
        setShowForm(false);
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

  const columns = [
    {
      title: "Invoice Number",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      render: (text: string) => `₹${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "ITC Amount (₹)",
      dataIndex: "itc_amount",
      key: "itc_amount",
      render: (text: string) => `₹${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "Cash Amount (₹)",
      dataIndex: "cash_amount",
      key: "cash_amount",
      render: (text: string) => `₹${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "Return Period",
      dataIndex: "return_month",
      key: "return_period",
      render: (text: string, record: WalletRefundData) => {
        if (record.return_month) {
          return `${record.return_month}`;
        }
        return `Q${record.return_quarter}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          DUE: "text-yellow-600",
          APPROVED: "text-green-600",
          REJECTED: "text-red-600",
        };
        return <span className={statusColors[text] || "text-gray-600"}>{text}</span>;
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => new Date(text).toLocaleDateString(),
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
    <div className="bg-white rounded-lg shadow-md p-6 mx-auto mt-6">
      <h1 className="text-3xl font-bold mb-6">Refunds Return</h1>

      {/* Eligibility Check */}
      <div className="p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200">
        <p className="font-semibold text-blue-700">
          {eligibilityMessage}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Frequency: <strong>{dvat.frequencyFilings}</strong>
        </p>
      </div>

      {/* Create New Request Button */}
      {!showForm && (
        <Button
          type="primary"
          size="large"
          onClick={() => setShowForm(true)}
          className="mb-6"
        >
          Create New Refund Request
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <>
          <Divider />
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">New Refund Request</h2>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={loading}
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="ITC Amount (₹)"
                  name="itc_amount"
                  rules={[
                    {
                      pattern: /^[0-9]*\.?[0-9]*$/,
                      message: "Please enter a valid amount",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Enter ITC amount"
                    step="0.01"
                    min="0"
                  />
                </Form.Item>

                <Form.Item
                  label="Cash Amount (₹)"
                  name="cash_amount"
                  rules={[
                    {
                      pattern: /^[0-9]*\.?[0-9]*$/,
                      message: "Please enter a valid amount",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Enter cash amount"
                    step="0.01"
                    min="0"
                  />
                </Form.Item>
              </div>

              <Form.Item label="Remark" name="remark">
                <Input.TextArea
                  rows={3}
                  placeholder="Enter any additional remarks (optional)"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                  >
                    Create Request
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      form.resetFields();
                    }}
                    size="large"
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
          <Divider />
        </>
      )}

      {/* Table of Existing Requests */}
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
    </div>
  );
};

export default RefundsReturnPage;
