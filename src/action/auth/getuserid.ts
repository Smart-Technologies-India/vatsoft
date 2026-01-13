"use server";

import { getCurrentUserId, requireAuth } from "@/lib/auth";
import { ApiResponseType } from "@/models/response";

/**
 * Server action to get the current authenticated user's ID
 * This replaces the insecure getCookie("id") pattern
 */
export async function getAuthenticatedUserId(): Promise<
  ApiResponseType<number>
> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        status: false,
        data: 0,
        message: "Not authenticated. Please login.",
        functionname: "getAuthenticatedUserId",
      };
    }

    return {
      status: true,
      data: userId,
      message: "User ID retrieved successfully",
      functionname: "getAuthenticatedUserId",
    };
  } catch (error) {
    return {
      status: false,
      data: 0,
      message: "Authentication failed",
      functionname: "getAuthenticatedUserId",
    };
  }
}

/**
 * Server action that requires authentication and returns user ID
 * Throws error if not authenticated
 */
export async function requireAuthUserId(): Promise<number> {
  const user = await requireAuth();
  return user.id;
}
