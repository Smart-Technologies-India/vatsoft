"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Spin,
  Table,
  Tabs,
  Button,
  Empty,
  Statistic,
  Row,
  Col,
  Card,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import getDeferredRevenueDetails from "@/action/report/getDeferredRevenueDetails";
import getDeferredRevenueDetailsLiquor from "@/action/report/getDeferredRevenueDetailsLiquor";
import getDeferredRevenueDetailsNonLiquor from "@/action/report/getDeferredRevenueDetailsNonLiquor";

const DeferredRevenueDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "challans">("all");

  const transactionMonth = searchParams.get("transactionMonth");
  const forMonth = searchParams.get("forMonth");
  const office = searchParams.get("office");
  const type = searchParams.get("type");

  useEffect(() => {
    const init = async () => {
      if (!transactionMonth || !forMonth) {
        toast.error("Missing required parameters");
        router.back();
        return;
      }

      setLoading(true);

      let response;

      if (type === "fuel") {
        response = await getDeferredRevenueDetailsLiquor({
          transactionMonth,
          forMonth,
          selectOffice: (office as any) || undefined,
        });
      } else if (type === "liquor") {
        response = await getDeferredRevenueDetailsNonLiquor({
          transactionMonth,
          forMonth,
          selectOffice: (office as any) || undefined,
        });
      } else {
        response = await getDeferredRevenueDetails({
          transactionMonth,
          forMonth,
          selectOffice: (office as any) || undefined,
        });
      }

      if (response.status && response.data) {
        setData(response.data);
      } else {
        toast.error(response.message || "Failed to load details");
      }

      setLoading(false);
    };

    init();
  }, [transactionMonth, forMonth, office, type]);

  const getChallanColumns = () => [
    {
      title: "Challan ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number | string) => (
        <span className="font-semibold">#{id}</span>
      ),
    },
    {
      title: "Transaction Date",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 130,
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount: string | number) => (
        <span className="font-semibold text-green-600">
          ₹
          {parseFloat(String(amount) || "0").toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentmode",
      key: "paymentmode",
      width: 120,
      render: (mode: string | null) => mode || "N/A",
    },
    {
      title: "Bank",
      dataIndex: "bank_name",
      key: "bank_name",
      width: 150,
      render: (bank: string | null) => bank || "N/A",
    },
    {
      title: "Order ID",
      dataIndex: "order_id",
      key: "order_id",
      width: 150,
      render: (id: string | null) => id || "N/A",
    },
    {
      title: "Dealer Name",
      dataIndex: "dealerName",
      key: "dealerName",
      width: 200,
      render: (name: string | null) => (
        <span className="font-medium text-blue-700">{name || "N/A"}</span>
      ),
    },
    {
      title: "Dealer TIN",
      dataIndex: "dealerTIN",
      key: "dealerTIN",
      width: 150,
      render: (tin: string | null) => (
        <span className="font-mono">{tin || "N/A"}</span>
      ),
    },
    {
      title: "Office",
      dataIndex: "dealerOffice",
      key: "dealerOffice",
      width: 150,
      render: (office: string | null) => office || "N/A",
    },
    {
      title: "Frequency Filings",
      dataIndex: "frequencyFilings",
      key: "frequencyFilings",
      width: 250,
      render: (filings: string | null) => (
        <span className="text-gray-600">{filings || "N/A"}</span>
      ),
    },
  ];

  const getAllColumns = () => [
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_: unknown, record: any) => (
        <span
          className={`px-2 py-1 rounded font-semibold ${
            record.type === "challan"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {(record.type as string).toUpperCase()}
        </span>
      ),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number | string) => (
        <span className="font-semibold">#{id}</span>
      ),
    },
    {
      title: "Transaction Date",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 130,
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount: string | number) => (
        <span className="font-semibold text-green-600">
          ₹
          {parseFloat(String(amount) || "0").toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: "Dealer Name",
      dataIndex: "dealerName",
      key: "dealerName",
      width: 200,
      render: (name: string | null) => (
        <span className="font-medium text-blue-700">{name || "N/A"}</span>
      ),
    },
    {
      title: "Dealer TIN",
      dataIndex: "dealerTIN",
      key: "dealerTIN",
      width: 150,
      render: (tin: string | null) => (
        <span className="font-mono">{tin || "N/A"}</span>
      ),
    },
    {
      title: "Office",
      dataIndex: "dealerOffice",
      key: "dealerOffice",
      width: 150,
      render: (office: string | null) => office || "N/A",
    },
    {
      title: "Frequency Filings",
      dataIndex: "frequencyFilings",
      key: "frequencyFilings",
      width: 250,
      render: (filings: string | null) => (
        <span className="text-gray-600">{filings || "N/A"}</span>
      ),
    },
  ];

  const tabItems = [
    {
      key: "all",
      label: `All Records (${data?.allRecords?.length || 0})`,
      children:
        data?.allRecords && data.allRecords.length > 0 ? (
          <Table
            columns={getAllColumns()}
            dataSource={data.allRecords}
            pagination={{ pageSize: 10 }}
            bordered
            size="small"
            scroll={{ x: 1500 }}
            rowKey={(record) => {
              const rec = record as any;
              return `${rec.type}-${rec.id}`;
            }}
          />
        ) : (
          <Empty description="No records found" />
        ),
    },
    {
      key: "challans",
      label: `Challans (${data?.challans?.length || 0})`,
      children:
        data?.challans && data.challans.length > 0 ? (
          <Table
            columns={getChallanColumns()}
            dataSource={data.challans}
            pagination={{ pageSize: 10 }}
            bordered
            size="small"
            scroll={{ x: 1500 }}
            rowKey={(record) => {
              const rec = record as any;
              return `challan-${rec.id}`;
            }}
          />
        ) : (
          <Empty description="No challans found" />
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading details..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <Empty description="No data available" style={{ marginTop: 50 }} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back to Report
        </Button>

        <h1 className="text-3xl font-bold mt-4 mb-2">
          Deferred Revenue Details
        </h1>
        <p className="text-gray-600">
          Showing all transactions for{" "}
          <span className="font-semibold">{data.transactionMonth}</span>{" "}
          (payment month) for{" "}
          <span className="font-semibold">{data.forMonth}</span> (return month)
        </p>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Challans"
                value={data.summary.totalChallans}
                prefix=""
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Challan Amount"
                value={data.summary.challanAmount}
                prefix="₹"
                formatter={(value) =>
                  `${parseFloat(value.toString()).toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Data Table */}
      <div className="bg-white rounded shadow px-4 py-2">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          items={tabItems}
          className="p-4"
        />
      </div>
    </div>
  );
};

export default DeferredRevenueDetailsPage;
