"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Button,
  Spin,
  Divider,
  Table,
  Modal,
  Input,
  Space,
  Tag,
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import SearchWalletRefunds from "@/action/payments/searchwalletrefunds";
import ApproveWalletRefund from "@/action/payments/approvewalletrefund";
import RejectWalletRefund from "@/action/payments/rejectwalletrefund";

interface AdminRefundRequestData {
  id: number;
  dvatId: number;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  created_at: Date;
  dvat_name: string;
  dvat_tin: string;
  rr_number: string;
  return_month: string | null;
  return_quarter: string | null;
  return_year: string;
  return_status: string;
  total_tax_amount: string | null;
  filing_datetime: Date | null;
}

const RefundsHistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [refundRequests, setRefundRequests] = useState<
    AdminRefundRequestData[]
  >([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"approve" | "reject">("approve");
  const [selectedRefund, setSelectedRefund] =
    useState<AdminRefundRequestData | null>(null);
  const [remark, setRemark] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("DUE");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page: number = 1, search: string = searchText, status: string = statusFilter) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pagination.pageSize;

      const response = await SearchWalletRefunds({
        search: search,
        status: status,
        skip,
        take: pagination.pageSize,
      });

      if (response.status && response.data) {
        setRefundRequests(response.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: response.total || 0,
        }));
      } else {
        setRefundRequests([]);
        toast.error("Failed to load refund requests");
      }
    } catch (error) {
      setRefundRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData(1, searchText, statusFilter);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "status") {
      setStatusFilter(value || "");
      setPagination((prev) => ({ ...prev, current: 1 }));
      loadData(1, searchText, value || "");
    }
  };

  const handleClear = () => {
    setSearchText("");
    setStatusFilter("");
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData(1, "", "");
  };

  const showApproveModal = (record: AdminRefundRequestData) => {
    setSelectedRefund(record);
    setModalMode("approve");
    setRemark("");
    setModalVisible(true);
  };

  const showRejectModal = (record: AdminRefundRequestData) => {
    setSelectedRefund(record);
    setModalMode("reject");
    setRemark("");
    setModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    if (!remark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    try {
      setLoading(true);
      const response = await ApproveWalletRefund({
        walletRefundId: selectedRefund.id,
        remark: remark,
      });

      if (response.status) {
        toast.success("Refund request approved successfully!");
        setModalVisible(false);
        setRemark("");
        loadData(pagination.current);
      } else {
        toast.error(response.message || "Failed to approve refund request");
      }
    } catch (error) {
      toast.error("Error approving refund request");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    if (!remark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    try {
      setLoading(true);
      const response = await RejectWalletRefund({
        walletRefundId: selectedRefund.id,
        remark: remark,
      });

      if (response.status) {
        toast.success("Refund request rejected successfully!");
        setModalVisible(false);
        setRemark("");
        loadData(pagination.current);
      } else {
        toast.error(response.message || "Failed to reject refund request");
      }
    } catch (error) {
      toast.error("Error rejecting refund request");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "DVAT Name",
      dataIndex: "dvat_name",
      key: "dvat_name",
      width: 100,
    },
    {
      title: "TIN",
      dataIndex: "dvat_tin",
      key: "dvat_tin",
      width: 80,
    },
    {
      title: "RR #",
      dataIndex: "rr_number",
      key: "rr_number",
      width: 90,
    },
    {
      title: "Period",
      dataIndex: "return_month",
      key: "return_period",
      width: 90,
      render: (text: string, record: AdminRefundRequestData) =>
        record.return_month
          ? `${record.return_month} ${record.return_year}`
          : `Q${record.return_quarter} ${record.return_year}`,
    },
    {
      title: "Filing Date",
      dataIndex: "filing_datetime",
      key: "filing_datetime",
      width: 85,
      render: (date: Date) =>
        date ? new Date(date).toLocaleDateString("en-IN") : "N/A",
    },
    {
      title: "Return Sts",
      dataIndex: "return_status",
      key: "return_status",
      width: 75,
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          PAID: "green",
          DUE: "orange",
          REJECTED: "red",
        };
        return <Tag color={statusColors[text] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "ITC (₹)",
      dataIndex: "itc_amount",
      key: "itc_amount",
      width: 80,
      render: (text: string) => `₹${parseFloat(text).toFixed(0)}`,
    },
    {
      title: "Cash (₹)",
      dataIndex: "cash_amount",
      key: "cash_amount",
      width: 80,
      render: (text: string) => `₹${parseFloat(text).toFixed(0)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 70,
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          DUE: "orange",
          APPROVED: "green",
          REJECTED: "red",
        };
        return <Tag color={statusColors[text] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right" as const,
      render: (text: string, record: AdminRefundRequestData) => (
        <Space size="small">
          {record.status === "DUE" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => showApproveModal(record)}
              />
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => showRejectModal(record)}
              />
            </>
          )}
          {record.status === "APPROVED" && <Tag color="green">Approved</Tag>}
          {record.status === "REJECTED" && <Tag color="red">Rejected</Tag>}
        </Space>
      ),
    },
  ];

  if (!refundRequests && loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mx-auto mt-3">
      <h1 className="text-lg font-bold mb-3">Wallet Refunds History</h1>

      {/* Compact Search & Filter */}
      <div className="flex gap-2 mb-4 items-center flex-wrap bg-gray-50 p-2 rounded-lg">
        <Input
          placeholder="DVAT / TIN / RR#"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          size="small"
          prefix={<SearchOutlined />}
          style={{ width: "180px" }}
        />

        <Select
          placeholder="Request Status"
          value={statusFilter}
          onChange={(value) => handleFilterChange("status", value)}
          size="small"
          allowClear
          style={{ width: "130px" }}
          options={[
            { label: "Due", value: "DUE" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />

        <Button
          type="primary"
          size="small"
          onClick={handleSearch}
          loading={loading}
        >
          Search
        </Button>

        <Button size="small" onClick={handleClear} icon={<DeleteOutlined />}>
          Clear
        </Button>

        <span className="text-xs text-gray-600 ml-auto">
          Total:{" "}
          <span className="font-semibold text-blue-600">
            {pagination.total}
          </span>
        </span>
      </div>

      {/* Empty State */}
      {!loading && refundRequests.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-300">
          <p className="text-gray-600 mb-3">No records found</p>
          {(searchText || statusFilter) && (
            <Button size="small" onClick={handleClear} type="primary" ghost>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={refundRequests.map((req) => ({ ...req, key: req.id }))}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => loadData(page),
            onShowSizeChange: (current, pageSize) => {
              setPagination((prev) => ({ ...prev, pageSize, current: 1 }));
              loadData(1);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "20", "30"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            size: "small",
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      )}

      {/* Modal */}
      <Modal
        title={modalMode === "approve" ? "Approve Refund" : "Reject Refund"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={450}
        footer={[
          <Button
            key="cancel"
            size="small"
            onClick={() => setModalVisible(false)}
          >
            Cancel
          </Button>,
          <Button
            key="action"
            type={modalMode === "approve" ? "primary" : "primary"}
            danger={modalMode === "reject"}
            loading={loading}
            size="small"
            onClick={modalMode === "approve" ? handleApprove : handleReject}
          >
            {modalMode === "approve" ? "Approve" : "Reject"}
          </Button>,
        ]}
      >
        {selectedRefund && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">DVAT Name</p>
                <p className="font-semibold">{selectedRefund.dvat_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">TIN</p>
                <p className="font-semibold">{selectedRefund.dvat_tin}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Return Period</p>
                <p className="font-semibold">
                  {selectedRefund.return_month ||
                    `Q${selectedRefund.return_quarter}`}{" "}
                  {selectedRefund.return_year}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount (₹)</p>
                <p className="font-semibold">
                  ₹
                  {(
                    parseFloat(selectedRefund.itc_amount || "0") +
                    parseFloat(selectedRefund.cash_amount || "0")
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div>
              <label className="block text-xs font-semibold mb-1">
                Remark <span className="text-red-600">*</span>
              </label>
              <Input.TextArea
                rows={3}
                size="small"
                placeholder="Enter remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundsHistoryPage;
