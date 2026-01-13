"use server";

import { cookies } from "next/headers";
import { verifyToken, JWTPayload } from "@/lib/jwt";
import prisma from "../../prisma/database";
import { user } from "@prisma/client";

/**
 * Get the currently authenticated user from the JWT token
 * @returns User object if authenticated, null if not authenticated or invalid token
 */
export async function getCurrentUser(): Promise<user | null> {
  try {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Verify the JWT token
    const payload: JWTPayload | null = verifyToken(token);

    if (!payload) {
      return null;
    }

    // Fetch the user from database to ensure they still exist and are active
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId, 
        status: "ACTIVE",
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get the currently authenticated user's ID
 * @returns User ID if authenticated, null if not authenticated
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getCurrentDvatId(): Promise<number | null> {
  try {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("auth_token")?.value;
    if (!token) {
      return null;
    }
    const payload: JWTPayload | null = verifyToken(token);
    if (!payload) {
      return null;
    }

    const dvatRecord = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatid,
        deletedAt: null,
      },
    });
    return dvatRecord ? dvatRecord.id : null;
  } catch (error) {
    console.error("Error getting current DVAT ID:", error);
    return null;
  }
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Require authentication - throws error if user is not authenticated
 * @returns Authenticated user object
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<user> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required. Please login.");
  }

  return user;
}

/**
 * Logout the current user by clearing the auth token
 */
export async function logout(): Promise<void> {
  const cookiesStore = await cookies();
  cookiesStore.delete("auth_token");
}
