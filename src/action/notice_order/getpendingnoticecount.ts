"use server";

import { errorToString } from "@/utils/methods";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";

interface ApiResponseType<T> {
  status: boolean;
  data?: T;
  message: string;
}

const GetPendingNoticeCount = async (): Promise<
  ApiResponseType<number>
> => {
  const functionname: string = GetPendingNoticeCount.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: 0,
        message: "Not authenticated. Please login.",
      };
    }

    const currentDate = new Date();

    // Count notices where due_date is greater than current date and not deleted
    const count = await prisma.order_notice.count({
      where: {
        dvatid: currentDvatId,
        due_date: {
          gt: currentDate,
        },
        deletedAt: null,
        deletedById: null,
      },
    });

    return {
      status: true,
      data: count,
      message: "Pending notice count fetched successfully.",
    };
  } catch (error) {
    const errorMessage = errorToString(error);
    return {
      status: false,
      data: 0,
      message: errorMessage,
    };
  }
};

export default GetPendingNoticeCount;
