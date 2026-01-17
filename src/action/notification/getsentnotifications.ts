"use server";

import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";

interface GetSentNotificationsParams {
  page?: number;
  limit?: number;
}

export default async function GetSentNotifications(
  params?: GetSentNotificationsParams
): Promise<
  ApiResponseType<{ notifications: any[]; total: number; totalPages: number }>
> {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          dvat04: {
            select: {
              id: true,
              name: true,
              tinNumber: true,
              contact_one: true,
            },
          },
        },
      }),
      prisma.notification.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      status: true,
      data: {
        notifications,
        total,
        totalPages,
      },
      functionname: GetSentNotifications.name,
      message: "Notifications fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      status: false,
      message: "Failed to fetch notifications",
      data: null,
      functionname: GetSentNotifications.name,
    };
  }
}
