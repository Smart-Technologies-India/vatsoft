import jwt from "jsonwebtoken";

// Use a strong secret key - in production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-secret-key-change-in-production-min-32-chars-long";

export interface JWTPayload {
  userId: number;
  mobile: string;
  role: string;
  dvatid?: number;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user
 * @param payload User data to encode in the token
 * @returns Signed JWT token string
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string to verify
 * @returns Decoded payload if valid, null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
