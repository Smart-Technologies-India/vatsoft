"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { notification, NotificationDvatType, NotificationType } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";

interface CreateNotificationPayload {
  title: string;
  description: string;
  dvat04Id?: number;
  notificationDvatType: NotificationDvatType;
  notificationType: NotificationType;
}

const CreateNotification = async (
  payload: CreateNotificationPayload
): Promise<ApiResponseType<notification | null>> => {
  const functionname: string = CreateNotification.name;

  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return createResponse({
      message: "User not found. Please login again.",
      functionname,
    });
  }

  try {
    // If notificationDvatType is ONE, dvat04Id must be provided
    if (payload.notificationDvatType === "ONE" && !payload.dvat04Id) {
      return createResponse({
        message: "Dvat04 ID is required when sending notification to one user",
        functionname,
      });
    }

    // If sending to ALL, PETROLEUM, or LIQUOR, create single notification entry
    if (payload.notificationDvatType !== "ONE") {
      const notification_response = await prisma.notification.create({
        data: {
          title: payload.title,
          description: payload.description,
          notificationDvatType: payload.notificationDvatType,
          notificationType: payload.notificationType,
          dvat04Id: null,
        },
      });

      return createResponse({
        message: "Notification sent successfully",
        functionname,
        data: notification_response,
      });
    }

    // If sending to ONE user, create notification with dvat04Id
    const notification_response = await prisma.notification.create({
      data: {
        title: payload.title,
        description: payload.description,
        notificationDvatType: payload.notificationDvatType,
        notificationType: payload.notificationType,
        dvat04Id: payload.dvat04Id,
      },
    });

    return createResponse({
      message: "Notification sent successfully to user",
      functionname,
      data: notification_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateNotification;
