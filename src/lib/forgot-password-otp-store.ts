type ForgotPasswordOtpSession = {
  tinNumber: string;
  otp: string;
  maskedMobile: string;
  dvatId: number;
  userId: number;
  requestedAt: number;
  resendAvailableAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
};

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const forgotPasswordOtpStore = new Map<string, ForgotPasswordOtpSession>();

const normalizeTin = (tinNumber: string) => tinNumber.trim();

const maskMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, "");
  const base = digits.length > 10 ? digits.slice(-10) : digits;
  const lastFour = base.slice(-4);
  return `******${lastFour}`;
};

const upsertOtpSession = (payload: {
  tinNumber: string;
  otp: string;
  maskedMobile: string;
  dvatId: number;
  userId: number;
}) => {
  const now = Date.now();
  const key = normalizeTin(payload.tinNumber);
  forgotPasswordOtpStore.set(key, {
    tinNumber: key,
    otp: payload.otp,
    maskedMobile: payload.maskedMobile,
    dvatId: payload.dvatId,
    userId: payload.userId,
    requestedAt: now,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    verified: false,
  });
};

const getOtpSession = (tinNumber: string) => {
  const key = normalizeTin(tinNumber);
  return forgotPasswordOtpStore.get(key) ?? null;
};

const clearOtpSession = (tinNumber: string) => {
  const key = normalizeTin(tinNumber);
  forgotPasswordOtpStore.delete(key);
};

const getResendRemainingSeconds = (tinNumber: string) => {
  const session = getOtpSession(tinNumber);
  if (!session) return 0;
  const remaining = session.resendAvailableAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const verifyOtpCode = (tinNumber: string, otp: string) => {
  const session = getOtpSession(tinNumber);
  if (!session) {
    return {
      ok: false,
      message: "Please send OTP first.",
      attemptsLeft: MAX_ATTEMPTS,
      maskedMobile: "",
    };
  }

  const now = Date.now();
  if (now > session.expiresAt) {
    clearOtpSession(tinNumber);
    return {
      ok: false,
      message: "OTP expired. Please request a new OTP.",
      attemptsLeft: 0,
      maskedMobile: session.maskedMobile,
    };
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    clearOtpSession(tinNumber);
    return {
      ok: false,
      message: "Too many invalid attempts. Please request a new OTP.",
      attemptsLeft: 0,
      maskedMobile: session.maskedMobile,
    };
  }

  if (session.otp !== otp.trim()) {
    session.attempts += 1;
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - session.attempts);
    if (attemptsLeft === 0) {
      clearOtpSession(tinNumber);
      return {
        ok: false,
        message: "Too many invalid attempts. Please request a new OTP.",
        attemptsLeft,
        maskedMobile: session.maskedMobile,
      };
    }

    return {
      ok: false,
      message: `Invalid OTP. ${attemptsLeft} attempt(s) left.`,
      attemptsLeft,
      maskedMobile: session.maskedMobile,
    };
  }

  session.verified = true;
  return {
    ok: true,
    message: "OTP verified successfully.",
    attemptsLeft: MAX_ATTEMPTS - session.attempts,
    maskedMobile: session.maskedMobile,
  };
};

const isOtpVerified = (tinNumber: string) => {
  const session = getOtpSession(tinNumber);
  if (!session) return false;
  return session.verified && Date.now() <= session.expiresAt;
};

export {
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  maskMobile,
  upsertOtpSession,
  getOtpSession,
  clearOtpSession,
  getResendRemainingSeconds,
  verifyOtpCode,
  isOtpVerified,
};
