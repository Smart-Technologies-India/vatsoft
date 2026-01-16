"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Drawer } from "antd";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ProductRequestWithUser | null>(null);

  const fetchProductRequests = async () => {
    setLoading(true);
    const response = await GetAllProductRequests();
    if (response.status && response.data) {
      setProductRequests(response.data as ProductRequestWithUser[]);
    } else {
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
      fetchProductRequests();
    };
    init();
  }, []);

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
        <Button onClick={() => router.back()}>Back</Button>
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
