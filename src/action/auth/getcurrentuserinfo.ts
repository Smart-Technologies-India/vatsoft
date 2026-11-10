"use server";

import { getCurrentUser } from "@/lib/auth";
import { ApiResponseType } from "@/models/response";

export type UserInfo = {
  id: number;
  role: string;
  office: string;
};

export async function getCurrentUserInfo(): Promise<ApiResponseType<UserInfo>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "getCurrentUserInfo",
      };
    }

    return {
      status: true,
      data: {
        id: user.id,
        role: user.role,
        office: user.selectOffice || "Dadra_Nagar_Haveli",
      },
      message: "User info retrieved successfully",
      functionname: "getCurrentUserInfo",
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: "Failed to retrieve user info",
      functionname: "getCurrentUserInfo",
    };
  }
}
