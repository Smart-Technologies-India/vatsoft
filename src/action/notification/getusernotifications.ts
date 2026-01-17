"use server";

import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

interface GetUserNotificationsParams {
  page?: number;
  limit?: number;
}

export default async function GetUserNotifications(
  params?: GetUserNotificationsParams
): Promise<
  ApiResponseType<{ notifications: any[]; total: number; totalPages: number }>
> {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;

  try {
    const dvatid = await getCurrentDvatId();
    if (!dvatid) {
      return {
        functionname: GetUserNotifications.name,
        status: false,
        message: "User not authenticated",
        data: null,
      };
    }

    // Get dvat04 directly based on createdById
    const dvat04Records = await prisma.dvat04.findMany({
      where: {
        id: dvatid,
        deletedAt: null,
      },
      select: {
        id: true,
        commodity: true,
      },
    });

    if (!dvat04Records || dvat04Records.length === 0) {
      return {
        functionname: GetUserNotifications.name,
        status: false,
        data: null,
        message: "Dvat04 not found for this user",
      };
    }

    const dvat04Id = dvat04Records[0].id;
    const userCommodity = dvat04Records[0]?.commodity;

    // Build notification filter
    const notificationFilter: any = {
      OR: [
        { notificationDvatType: "ALL" },
        { notificationDvatType: "ONE", dvat04Id: dvat04Id },
      ],
    };

    // Add commodity-based filters
    if (userCommodity === "FUEL") {
      notificationFilter.OR.push({ notificationDvatType: "PETROLEUM" });
    }
    if (userCommodity === "LIQUOR") {
      notificationFilter.OR.push({ notificationDvatType: "LIQUOR" });
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: notificationFilter,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: notificationFilter,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      status: true,
      data: {
        notifications,
        total,
        totalPages,
      },
      message: "Notifications fetched successfully",
      functionname: GetUserNotifications.name,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      status: false,
      message: "Failed to fetch notifications",
      functionname: GetUserNotifications.name,
      data: null,
    };
  }
}
