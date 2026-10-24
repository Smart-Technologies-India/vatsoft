"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { user } from "@prisma/client";
import { generateToken } from "@/lib/jwt";
import { logout as logoutUser } from "@/lib/auth";

interface AdminQuickLoginPayload {
  dvatId: number;
}

/**
 * Admin quick login - logs in as the user associated with the specified DVAT04
 * Properly clears admin session before logging in as the dealer user
 * Used for development/testing only
 */
const adminQuickLogin = async (
  payload: AdminQuickLoginPayload,
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = adminQuickLogin.name;
  const cookie = await cookies();
  try {
    // First, properly logout the current admin session
    try {
      await logoutUser();
    } catch (e) {
      // Continue even if logout fails
    }

    // Get the specific DVAT04 with an associated user
    const dvatResponse = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatId,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        createdBy: true,
      },
    });

    if (!dvatResponse || !dvatResponse.createdBy) {
      return createResponse({
        message: "DVAT user not found or is not active.",
        functionname,
      });
    }

    const token = generateToken({
      userId: dvatResponse.createdBy.id,
      mobile: dvatResponse.createdBy.mobileOne ?? "",
      role: dvatResponse.createdBy.role,
      dvatid: dvatResponse.id,
    });

    // Set httpOnly secure cookie
    cookie.set("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return createResponse({
      message: "Admin quick login successful",
      functionname,
      data: dvatResponse.createdBy,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default adminQuickLogin;
