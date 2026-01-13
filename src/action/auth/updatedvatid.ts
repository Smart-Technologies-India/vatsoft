"use server";

import { getCurrentUser } from "@/lib/auth";
import { generateToken } from "@/lib/jwt";
import { ApiResponseType } from "@/models/response";
import { cookies } from "next/headers";

/**
 * Server action to update the JWT token with a new dvatid
 * This should be called when a user's registration is approved and they receive a TIN
 */
export async function updateDvatIdInToken(
  dvatid: number
): Promise<ApiResponseType<boolean>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        status: false,
        data: false,
        message: "Not authenticated. Please login.",
        functionname: "updateDvatIdInToken",
      };
    }

    // Generate new JWT token with the dvatid
    const token = generateToken({
      userId: currentUser.id,
      mobile: currentUser.mobileOne ?? "",
      role: currentUser.role,
      dvatid: dvatid,
    });

    // Update the auth_token cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return {
      status: true,
      data: true,
      message: "DVAT ID updated in token successfully",
      functionname: "updateDvatIdInToken",
    };
  } catch (error) {
    return {
      status: false,
      data: false,
      message: "Failed to update DVAT ID in token",
      functionname: "updateDvatIdInToken",
    };
  }
}
