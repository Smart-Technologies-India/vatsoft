"use client";

import RefineryLoginOtp from "@/action/user/refineryloginotp";
import RefineryPasswordLogin from "@/action/user/refinerypasswordlogin";
import RefineryResetForgetPassword from "@/action/user/refineryresetforgotpassword";
import RefinerySendForgetPasswordOtp from "@/action/user/refinerysendforgetpasswordotp";
import RefinerySendOtp from "@/action/user/refinerysendotp";
import RefineryVerifyForgetPasswordOtp from "@/action/user/refineryverifyforgetpasswordotp";
import { FluentEye12Regular, FluentEyeOff16Regular } from "@/components/icons";
import { Button, Input, Modal } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function RefineryLoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#e8edf5] text-gray-800">
      <header className="bg-white border-b border-[#b7c6de]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <Image
              src="/favicon.png"
              alt="DVAT Emblem"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Union Territory of Dadra &amp; Nagar Haveli and Daman &amp; Diu
            </p>
            <h1 className="text-base font-bold text-[#0f2f67] leading-tight">
              VAT-SMART Refinery Portal
            </h1>
            <p className="text-xs text-gray-500">
              Department of Value Added Tax/GST Administration
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#c8d4e8] rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Left branding panel */}
          <div className="bg-[#0f2f67] px-6 py-8 flex flex-col justify-between gap-6">
            <div>
              <p className="inline-block px-2 py-1 text-xs font-semibold text-[#5a4000] bg-[#fff2cc] rounded-sm mb-4">
                Authorized Access
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Welcome to VAT-SMART
                <br />
                Refinery Login
              </h2>
              <p className="text-sm text-[#dbe8ff] mt-3 leading-relaxed max-w-md">
                Login using OTP or password with your refinery TIN to manage
                sales records and compliance operations.
              </p>
            </div>

            <div className="relative w-44 h-44 bg-white/95 rounded-md self-center">
              <Image
                fill
                src="/emblem.png"
                alt="DVAT Emblem"
                className="object-contain object-center p-3"
              />
            </div>

            <ul className="space-y-2 text-sm text-[#e3ecff]">
              <li className="flex items-start gap-2">
                <span className="text-[#ffd36a]">&#9658;</span>
                <span>Secure TIN-based OTP authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ffd36a]">&#9658;</span>
                <span>Password login for existing refinery users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ffd36a]">&#9658;</span>
                <span>Built-in password recovery through OTP</span>
              </li>
            </ul>
          </div>

          {/* Right form panel */}
          <div className="px-6 py-8 bg-[#f7f9fc]">
            <h3 className="text-lg font-semibold text-[#0f2f67] text-center">
              Sign In
            </h3>
            <p className="text-sm text-gray-600 text-center mt-1">
              Login to access your refinery account
            </p>
            <div className="mt-6">
              <RefineryInlineLoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const RefineryInlineLoginForm = () => {
  const router = useRouter();
  const [tin, setTin] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [loginMode, setLoginMode] = useState<"password" | "otp">("otp");
  const [loginOtp, setLoginOtp] = useState("");
  const [isTinOtpSent, setIsTinOtpSent] = useState(false);
  const [tinMaskedMobile, setTinMaskedMobile] = useState("");
  const [tinOtpResendInSeconds, setTinOtpResendInSeconds] = useState(0);
  const [isSendingTinOtp, setIsSendingTinOtp] = useState(false);
  const [isVerifyingTinOtp, setIsVerifyingTinOtp] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotTin, setForgotTin] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const normalizedTin = tin?.trim() ?? "";
  const isTinValid = normalizedTin.length === 11;

  useEffect(() => {
    if (resendInSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendInSeconds]);

  useEffect(() => {
    if (tinOtpResendInSeconds <= 0) return;
    const timer = setInterval(() => {
      setTinOtpResendInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [tinOtpResendInSeconds]);

  const handleNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setData: Dispatch<SetStateAction<string | undefined>>,
  ) => {
    const { value } = event.target;
    if (/^[0-9]*$/.test(value)) setData(value);
  };

  const resetTinOtpFlow = () => {
    setLoginOtp("");
    setIsTinOtpSent(false);
    setTinMaskedMobile("");
    setTinOtpResendInSeconds(0);
  };

  const submit = async () => {
    setIsLogin(true);
    if (!isTinValid) {
      toast.error("TIN number must be 11 digits");
      setIsLogin(false);
      return;
    }
    if (!password) {
      toast.error("Enter password");
      setIsLogin(false);
      return;
    }

    const response = await RefineryPasswordLogin({
      tin_number: normalizedTin,
      password,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    toast.success(response.message);
    router.push("/dashboard/refinery_sales");
    setTimeout(() => setIsLogin(false), 1000);
  };

  const sendTinOtp = async () => {
    setIsSendingTinOtp(true);

    if (!isTinValid) {
      toast.error("TIN number must be 11 digits");
      setIsSendingTinOtp(false);
      return;
    }

    const response = await RefinerySendOtp({
      tin_number: normalizedTin,
    });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsSendingTinOtp(false);
      return;
    }

    setTinMaskedMobile(response.data.maskedMobile);
    setTinOtpResendInSeconds(response.data.resendInSeconds);

    if (response.data.otpSent) {
      setIsTinOtpSent(true);
      setLoginOtp("");
      toast.success(response.message);
    } else {
      toast.info(response.message);
    }

    setIsSendingTinOtp(false);
  };

  const loginWithOtp = async () => {
    setIsVerifyingTinOtp(true);

    if (!isTinValid) {
      toast.error("TIN number must be 11 digits");
      setIsVerifyingTinOtp(false);
      return;
    }

    if (!loginOtp.trim()) {
      toast.error("Enter OTP");
      setIsVerifyingTinOtp(false);
      return;
    }

    const response = await RefineryLoginOtp({
      tin_number: normalizedTin,
      otp: loginOtp.trim(),
    });

    if (!response.status) {
      toast.error(response.message);
      setIsVerifyingTinOtp(false);
      return;
    }

    toast.success(response.message);
    router.push("/dashboard/refinery_sales");
    setIsVerifyingTinOtp(false);
  };

  const resetForgotPasswordModal = () => {
    setForgotTin("");
    setForgotOtp("");
    setNewPassword("");
    setRePassword("");
    setMaskedMobile("");
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setResendInSeconds(0);
  };

  const sendOtp = async () => {
    setIsSendingOtp(true);

    if (!forgotTin.trim()) {
      toast.error("Enter valid TIN number");
      setIsSendingOtp(false);
      return;
    }

    const response = await RefinerySendForgetPasswordOtp({
      tin_number: forgotTin.trim(),
    });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsSendingOtp(false);
      return;
    }

    setMaskedMobile(response.data.maskedMobile);
    setResendInSeconds(response.data.resendInSeconds);

    if (response.data.otpSent) {
      setIsOtpSent(true);
      setIsOtpVerified(false);
      setForgotOtp("");
      toast.success(response.message);
    } else {
      toast.info(response.message);
    }

    setIsSendingOtp(false);
  };

  const verifyOtp = async () => {
    setIsVerifyingOtp(true);

    if (!forgotTin.trim()) {
      toast.error("Enter valid TIN number");
      setIsVerifyingOtp(false);
      return;
    }

    if (!forgotOtp.trim()) {
      toast.error("Enter OTP");
      setIsVerifyingOtp(false);
      return;
    }

    const response = await RefineryVerifyForgetPasswordOtp({
      tin_number: forgotTin.trim(),
      otp: forgotOtp.trim(),
    });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsVerifyingOtp(false);
      return;
    }

    if (!response.data.verified) {
      toast.error(response.message);
      setIsVerifyingOtp(false);
      return;
    }

    setIsOtpVerified(true);
    toast.success(response.message);
    setIsVerifyingOtp(false);
  };

  const submitForgotPassword = async () => {
    setIsChangingPassword(true);

    if (!isOtpVerified) {
      toast.error("Verify OTP before changing password");
      setIsChangingPassword(false);
      return;
    }

    const response = await RefineryResetForgetPassword({
      tin_number: forgotTin.trim(),
      password: newPassword,
      repassword: rePassword,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsChangingPassword(false);
      return;
    }

    toast.success("Password updated successfully");
    setIsForgotOpen(false);
    resetForgotPasswordModal();
    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-2 w-80 mx-auto">
      <div className="flex items-center justify-center gap-2 mt-5 mb-2 p-1 rounded-md">
        <button
          type="button"
          onClick={() => {
            setLoginMode("otp");
            setPassword(undefined);
          }}
          className={`px-3 py-1.5 text-sm rounded ${
            loginMode === "otp"
              ? "bg-[#0f2f67] text-white"
              : "text-gray-700 hover:bg-[#eef3fb]"
          }`}
        >
          Login with OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMode("password");
            resetTinOtpFlow();
          }}
          className={`px-3 py-1.5 text-sm rounded ${
            loginMode === "password"
              ? "bg-[#0f2f67] text-white"
              : "text-gray-700 hover:bg-[#eef3fb]"
          }`}
        >
          Login with Password
        </button>
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-2">TIN Number</label>
        <Input
          size="small"
          maxLength={11}
          placeholder="Enter TIN Number"
          value={tin ?? ""}
          onChange={(e) => {
            handleNumberChange(e, setTin);
            resetTinOtpFlow();
          }}
          className="text-sm"
        />
        {normalizedTin.length > 0 && !isTinValid ? (
          <p className="mt-1 text-xs text-red-600">
            TIN number must be 11 digits.
          </p>
        ) : null}
      </div>

      {loginMode === "password" ? (
        <>
          <p className="text-sm text-gray-600 bg-[#f7f9fc] border border-[#e5ebf5] px-2 py-1.5">
            Use your refinery TIN and account password to login.
          </p>
          <div>
            <label className="text-sm text-gray-500 block mb-2">Password</label>
            <Input.Password
              size="small"
              placeholder="Enter Password"
              iconRender={(visible) =>
                visible ? <FluentEye12Regular /> : <FluentEyeOff16Regular />
              }
              value={password ?? ""}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-sm text-[#0f2f67] underline hover:text-[#16448b] cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <Button
            onClick={submit}
            disabled={isLogin || !isTinValid}
            className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
          >
            {isLogin ? "Verifying..." : "Login with Password"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 bg-[#f7f9fc] border border-[#e5ebf5] px-2 py-1.5">
            OTP will be sent to your registered mobile number.
          </p>

          {!isTinOtpSent && (
            <Button
              onClick={sendTinOtp}
              disabled={isSendingTinOtp || !isTinValid}
              className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
            >
              {isSendingTinOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          )}

          {isTinOtpSent && (
            <>
              <p className="text-sm text-gray-600">
                OTP sent to registered mobile ending with{" "}
                <b>{tinMaskedMobile}</b>
              </p>
              <div>
                <label className="text-sm text-gray-500 block mb-2">OTP</label>
                <Input
                  size="small"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={loginOtp}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (/^[0-9]*$/.test(value)) setLoginOtp(value);
                  }}
                  className="text-sm"
                />
              </div>

              <Button
                onClick={loginWithOtp}
                disabled={isVerifyingTinOtp || !isTinValid}
                className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
              >
                {isVerifyingTinOtp ? "Verifying OTP..." : "Login with OTP"}
              </Button>

              <div className="text-right">
                {tinOtpResendInSeconds > 0 ? (
                  <span className="text-sm text-gray-500">
                    Resend OTP in {tinOtpResendInSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendTinOtp}
                    className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        title="Forgot Password"
        open={isForgotOpen}
        onCancel={() => {
          setIsForgotOpen(false);
          resetForgotPasswordModal();
        }}
        footer={null}
      >
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">
              TIN Number
            </label>
            <Input
              maxLength={11}
              placeholder="Enter TIN Number"
              value={forgotTin}
              disabled={isOtpSent}
              onChange={(e) => {
                const { value } = e.target;
                if (/^[0-9]*$/.test(value)) setForgotTin(value);
              }}
              className="text-sm"
            />
          </div>

          {!isOtpSent && (
            <Button
              onClick={sendOtp}
              disabled={isSendingOtp}
              className="mt-4 text-center font-semibold text-white bg-[#0f2f67]
			   hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
            >
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          )}

          {isOtpSent && (
            <>
              <p className="text-sm text-gray-600">
                OTP sent to registered mobile ending with <b>{maskedMobile}</b>
              </p>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">
                  OTP
                </label>
                <Input
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={forgotOtp}
                  disabled={isOtpVerified}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (/^[0-9]*$/.test(value)) setForgotOtp(value);
                  }}
                  className="text-sm"
                />
              </div>

              {!isOtpVerified && (
                <Button
                  onClick={verifyOtp}
                  disabled={isVerifyingOtp}
                  className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
                >
                  {isVerifyingOtp ? "Verifying OTP..." : "Verify OTP"}
                </Button>
              )}

              <div className="text-right">
                {resendInSeconds > 0 ? (
                  <span className="text-sm text-gray-500">
                    Resend OTP in {resendInSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="text-sm text-[#0f2f67] underline hover:text-[#16448b] cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {isOtpVerified && (
            <>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">
                  New Password
                </label>
                <Input.Password
                  placeholder="Enter New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">
                  Re-Password
                </label>
                <Input.Password
                  placeholder="Enter Re-Password"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={submitForgotPassword}
                disabled={isChangingPassword}
                className="w-full bg-[#0f2f67] text-white text-sm h-8 rounded-none border-none"
              >
                {isChangingPassword ? "Updating..." : "Change Password"}
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
