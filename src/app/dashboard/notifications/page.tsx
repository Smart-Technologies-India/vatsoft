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
    <main className="bg-white py-6 px-6 rounded-md mt-4 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Notifications</h1>
        <Button onClick={() => router.back()}>Back</Button>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <Empty
            description="No notifications yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <>
                <Card
                  key={notification.id}
                  className="hover:shadow-md transition-shadow mt-2"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <Tag
                      color={getNotificationTypeColor(
                        notification.notificationType
                      )}
                    >
                      {notification.notificationType}
                    </Tag>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                    {notification.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      {new Date(notification.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </Card>
                <div className="mt-4"></div>
              </>
            ))}
          </div>

          {totalNotifications > 10 && (
            <div className="flex justify-center mt-6">
              <Pagination
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
          )}
        </>
      )}
    </main>
  );
};

export default UserNotificationsPage;
