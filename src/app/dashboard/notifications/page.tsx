"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button, Card, Tag, Pagination, Empty } from "antd";
import { NotificationType } from "@prisma/client";
import GetUserNotifications from "@/action/notification/getusernotifications";

const UserNotificationsPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const fetchNotifications = async (page: number) => {
    setLoading(true);
    try {
      const response = await GetUserNotifications({ page, limit: 10 });
      if (response.status && response.data) {
        setNotifications(response.data.notifications);
        setTotalNotifications(response.data.total);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
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

  return (
    <main className="p-3 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                My Notifications
              </h1>
            </div>
            <div className="grow"></div>
            <Button size="small" onClick={() => router.back()}>Back</Button>
          </div>
        </div>

      {loading && notifications.length === 0 ? (
        <div className="h-64 w-full grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded shadow-sm border p-8 text-center">
          <Empty
            description="No notifications yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white border border-gray-200 p-3 rounded shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h3>
                  <Tag
                    color={getNotificationTypeColor(
                      notification.notificationType,
                    )}
                    className="text-xs"
                  >
                    {notification.notificationType}
                  </Tag>
                </div>
                <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            ))}
          </div>

          {totalNotifications > 10 && (
            <div className="bg-white rounded shadow-sm border mt-3">
              <div className="px-3 py-2">
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
          )}
        </>
      )}
      </div>
    </main>
  );
};

export default UserNotificationsPage;
