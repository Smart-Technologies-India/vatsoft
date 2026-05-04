"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Drawer, Input, Select } from "antd";
import * as XLSX from "xlsx";
import type { ColumnsType } from "antd/es/table";
import { toast } from "react-toastify";
import GetAllProductRequests from "@/action/product_request/getallproductrequests";
import { product_request, ProductRequest } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ProcessProductRequestProvider } from "@/components/forms/product_request/processproductrequest";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

interface ProductRequestWithUser extends product_request {
  requestedBy: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    mobileOne: string;
    email: string | null;
  };
  createdBy: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
}

const ProductRequestsPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [productRequests, setProductRequests] = useState<
    ProductRequestWithUser[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchProductName, setSearchProductName] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductRequest | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ProductRequestWithUser | null>(null);

  const fetchProductRequests = async (
    filters?: {
      productName?: string;
      status?: ProductRequest;
    }
  ) => {
    setLoading(true);
    const response = await GetAllProductRequests(filters);
    if (response.status && response.data) {
      setProductRequests(response.data as ProductRequestWithUser[]);
    } else {
      setProductRequests([]);
      toast.error(response.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userid) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchProductRequests({
        productName: searchProductName.trim() || undefined,
        status: statusFilter,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [userid, searchProductName, statusFilter]);

  const downloadExcel = () => {
    const rows = productRequests.map((r) => ({
      ID: r.id,
      "Product Name": r.product_name,
      "Company Name": r.company_name,
      "Pack Type": r.pack_type,
      "Crate Size": r.crate_size,
      "Requested By": `${r.requestedBy.firstName ?? ""} ${r.requestedBy.lastName ?? ""}`.trim(),
      "Mobile": r.requestedBy.mobileOne,
      "Email": r.requestedBy.email ?? "",
      Status: r.status,
      "Created At": new Date(r.createdAt).toLocaleString(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Requests");
    XLSX.writeFile(workbook, "product_requests.xlsx");
  };

  const handleProcess = (record: ProductRequestWithUser) => {
    setSelectedRequest(record);
    setDrawerOpen(true);
  };

  const getStatusColor = (status: ProductRequest) => {
    switch (status) {
      case "REJECTED":
        return "red";
      case "PENDING":
        return "orange";
      case "APPROVED":
        return "blue";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<ProductRequestWithUser> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      width: 200,
    },
    {
      title: "Pack Type",
      dataIndex: "pack_type",
      key: "pack_type",
      width: 120,
      render: (pack_type: string) => <Tag color="blue">{pack_type}</Tag>,
    },
    {
      title: "Crate Size",
      dataIndex: "crate_size",
      key: "crate_size",
      width: 100,
    },
    {
      title: "Requested By",
      key: "requestedBy",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.requestedBy.firstName} {record.requestedBy.lastName}
          </div>
          <div className="text-xs text-gray-500">
            {record.requestedBy.mobileOne}
          </div>
          {record.requestedBy.email && (
            <div className="text-xs text-gray-500">
              {record.requestedBy.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: ProductRequest) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleProcess(record)}
          disabled={record.status === "APPROVED" || record.status === "REJECTED"}
        >
          Process
        </Button>
      ),
    },
  ];

  return (
    <main className="bg-white py-6 px-6 rounded-md mt-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Product Requests Management</h1>
        <div className="flex gap-2">
          <Button onClick={downloadExcel} type="primary">Download Excel</Button>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          allowClear
          className="md:max-w-sm"
          placeholder="Search by product name"
          value={searchProductName}
          onChange={(event) => setSearchProductName(event.target.value)}
        />
        <Select<ProductRequest | undefined>
          allowClear
          className="md:w-48"
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={productRequests}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} requests`,
        }}
      />

      {/* Process Product Request Drawer */}
      <Drawer
        placement="right"
        closeIcon={null}
        width={500}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRequest(null);
        }}
        open={drawerOpen}
      >
        <p className="text-lg text-left font-semibold mb-4">
          Process Product Request
        </p>
        {selectedRequest && (
          <ProcessProductRequestProvider
            userid={userid}
            productRequest={selectedRequest}
            setAddBox={setDrawerOpen}
            init={fetchProductRequests}
          />
        )}
      </Drawer>
    </main>
  );
};

export default ProductRequestsPage;
