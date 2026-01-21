"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button, Form, Input, Select, Card, Table, Tag, Pagination, Modal } from "antd";
import { NotificationDvatType, NotificationType } from "@prisma/client";
import CreateNotification from "@/action/notification/createnotification";
import GetAllUsersWithDvat from "@/action/notification/getalluserswithdvat";
import GetSentNotifications from "@/action/notification/getsentnotifications";

const { TextArea } = Input;

interface UserWithDvat {
  id: number;
  firstName: string | null;
  lastName: string | null;
  mobileOne: string;
  email: string | null;
  dvat04: {
    id: number;
    tinNumber: string | null;
    name: string | null;
    commodity: string | null;
  }[];
}

const SendNotificationPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithDvat[]>([]);
  const [selectedDvatType, setSelectedDvatType] = useState<NotificationDvatType>("ALL");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await GetAllUsersWithDvat();
      if (response.status && response.data) {
        setUsers(response.data);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const fetchNotifications = async (page: number) => {
    setLoadingNotifications(true);
    try {
      const response = await GetSentNotifications({ page, limit: 10 });
      if (response.status && response.data) {
        setNotifications(response.data.notifications);
        setTotalNotifications(response.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await CreateNotification({
        title: values.title,
        description: values.description,
        dvat04Id: values.dvat04Id,
        notificationDvatType: values.notificationDvatType,
        notificationType: values.notificationType,
      });

      if (response.status) {
        toast.success(response.message);
        form.resetFields();
        setIsModalOpen(false);
        fetchNotifications(currentPage);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (selectedDvatType === "PETROLEUM") {
      return users.filter((user) =>
        user.dvat04.some((dvat) => dvat.commodity === "FUEL")
      );
    }
    if (selectedDvatType === "LIQUOR") {
      return users.filter((user) =>
        user.dvat04.some((dvat) => dvat.commodity === "LIQUOR")
      );
    }
    return users;
  };

  const getNotificationTypeColor = (type: NotificationType) => {
    switch (type) {
      case "ALERT":
        return "red";
      case "WARNING":
        return "orange";
      case "INFO":
        return "blue";
      case "NOTICE":
        return "purple";
      case "GENERAL":
      default:
        return "green";
    }
  };

  const getDvatTypeLabel = (type: NotificationDvatType) => {
    switch (type) {
      case "ALL":
        return "All Users";
      case "ONE":
        return "Specific User";
      case "PETROLEUM":
        return "Petroleum Dealers";
      case "LIQUOR":
        return "Liquor Dealers";
      default:
        return type;
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "25%",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "30%",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "notificationType",
      key: "notificationType",
      render: (type: NotificationType) => (
        <Tag color={getNotificationTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: "Recipient",
      dataIndex: "notificationDvatType",
      key: "notificationDvatType",
      render: (type: NotificationDvatType, record: any) => (
        <div>
          <div>{getDvatTypeLabel(type)}</div>
          {type === "ONE" && record.dvat04 && (
            <div className="text-xs text-gray-500">
              {record.dvat04.name} - {record.dvat04.tinNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Sent Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Sent Notifications
              </h1>
            </div>
            <div className="grow"></div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="small" type="primary" onClick={() => setIsModalOpen(true)}>
                Send Notification
              </Button>
              <Button size="small" onClick={() => router.back()}>Back</Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm border p-3">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={notifications}
              loading={loadingNotifications}
              pagination={false}
              rowKey="id"
              scroll={{ x: 800 }}
              size="small"
            />
          </div>
          <div className="px-3 py-2 border-t bg-gray-50">
            <Pagination
              align="center"
              current={currentPage}
              total={totalNotifications}
              pageSize={10}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} notifications`
              }
            />
          </div>
        </div>
      </div>

      <Modal
        title="Send Notification"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            notificationDvatType: "ALL",
            notificationType: "GENERAL",
          }}
        >
          <Form.Item
            label="Notification Title"
            name="title"
            rules={[{ required: true, message: "Please enter notification title" }]}
          >
            <Input placeholder="Enter notification title" size="large" />
          </Form.Item>

          <Form.Item
            label="Notification Description"
            name="description"
            rules={[
              { required: true, message: "Please enter notification description" },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Enter notification description"
              size="large"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Notification Type"
              name="notificationType"
              rules={[{ required: true, message: "Please select notification type" }]}
            >
              <Select size="large" placeholder="Select notification type">
                <Select.Option value="GENERAL">General</Select.Option>
                <Select.Option value="ALERT">Alert</Select.Option>
                <Select.Option value="WARNING">Warning</Select.Option>
                <Select.Option value="INFO">Info</Select.Option>
                <Select.Option value="NOTICE">Notice</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Send To"
              name="notificationDvatType"
              rules={[{ required: true, message: "Please select recipient type" }]}
            >
              <Select
                size="large"
                placeholder="Select recipient type"
                onChange={(value) => {
                  setSelectedDvatType(value as NotificationDvatType);
                  if (value !== "ONE") {
                    form.setFieldValue("dvat04Id", undefined);
                  }
                }}
              >
                <Select.Option value="ALL">All Users</Select.Option>
                <Select.Option value="ONE">Specific User</Select.Option>
                <Select.Option value="PETROLEUM">Petroleum Dealers</Select.Option>
                <Select.Option value="LIQUOR">Liquor Dealers</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {selectedDvatType === "ONE" && (
            <Form.Item
              label="Select User"
              name="dvat04Id"
              rules={[{ required: true, message: "Please select a user" }]}
            >
              <Select
                size="large"
                placeholder="Select user"
                showSearch
                filterOption={(input, option) =>
                  (String(option?.label ?? "")).toLowerCase().includes(input.toLowerCase())
                }
                options={getFilteredUsers().map((user: UserWithDvat) => ({
                  value: user.dvat04.length > 0 ? user.dvat04[0].id : null,
                  label: `${user.firstName || ""} ${user.lastName || ""} - ${
                    user.mobileOne
                  } ${
                    user.dvat04.length > 0
                      ? `(${user.dvat04[0].tinNumber || "No TIN"})`
                      : ""
                  }`,
                }))}
              />
            </Form.Item>
          )}

          {selectedDvatType !== "ALL" && selectedDvatType !== "ONE" && (
            <div className="mb-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Recipients:</strong> {getFilteredUsers().length} users will
                receive this notification
              </p>
            </div>
          )}

          {selectedDvatType === "ALL" && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This notification will be sent to <strong>all users</strong> in the
                system. Please review the content carefully before sending.
              </p>
            </div>
          )}

          <Form.Item>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                }}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                Send Notification
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};

export default SendNotificationPage;
