"use server";

import { logout as logoutUser } from "@/lib/auth";
import { ApiResponseType } from "@/models/response";

/**
 * Server action to logout the current user
 */
export async function logout(): Promise<ApiResponseType<null>> {
  try {
    await logoutUser();

    return {
      status: true,
      data: null,
      message: "Logged out successfully",
      functionname: "logout",
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: "Logout failed",
      functionname: "logout",
    };
  }
}
