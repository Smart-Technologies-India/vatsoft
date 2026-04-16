"use client";

import { Label } from "@/components/ui/label";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";
import Login from "@/action/user/login";
import { Button } from "@/components/ui/button";
import { LoginSchema } from "@/schema/login";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Fa6RegularEye, Fa6RegularEyeSlash } from "@/components/icons";
import SendOtp from "@/action/user/sendotp";
import MobileLoginOtp from "@/action/user/mobileloginotp";
import ResetMobilePasswordOtp from "@/action/user/resetmobilepasswordotp";
import { Modal } from "antd";
import console from "node:console";

const AdminLogin = () => {
  const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isForgotOtpSent, setIsForgotOtpSent] = useState(false);
  const [forgotResendInSeconds, setForgotResendInSeconds] = useState(0);

  // password section
  const mobile = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (resendInSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendInSeconds]);

  useEffect(() => {
    if (forgotResendInSeconds <= 0) return;
    const timer = setInterval(() => {
      setForgotResendInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotResendInSeconds]);

  const loginuser = async () => {
    setIsLogin(true);
    const result = safeParse(LoginSchema, {
      mobile: mobile.current?.value,
      password: password.current?.value,
    });

    if (result.success) {
      const loginrespone: ApiResponseType<user | null> = await Login({
        password: result.output.password,
        mobile: result.output.mobile,
      });
      if (loginrespone.status) {
        toast.success(loginrespone.message);
        mobile.current!.value = "";
        password.current!.value = "";
        router.push("/dashboard");
      } else {
        toast.error(loginrespone.message);
      }
    } else {
      let errorMessage = "";
      if (result.issues[0].input) {
        errorMessage = result.issues[0].message;
      } else {
        errorMessage = result.issues[0].path![0].key + " is required";
      }
      toast.error(errorMessage);
    }
    setIsLogin(false);
  };

  const sendOtp = async () => {
    const mobileValue = mobile.current?.value?.trim() ?? "";
    if (!mobileValue || mobileValue.length !== 10) {
      toast.error("Enter valid 10 digit mobile number");
      return;
    }

    setIsLogin(true);
    const response = await SendOtp({ mobile: mobileValue });

    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    setIsOtpSent(true);
    setResendInSeconds(60);
    toast.success(response.message);
    setIsLogin(false);
  };

  const loginWithOtp = async () => {
    const mobileValue = mobile.current?.value?.trim() ?? "";
    if (!mobileValue || mobileValue.length !== 10) {
      toast.error("Enter valid 10 digit mobile number");
      return;
    }

    if (!otp.trim()) {
      toast.error("Enter OTP");
      return;
    }

    setIsLogin(true);
    const response = await MobileLoginOtp({
      mobile: mobileValue,
      otp: otp.trim(),
    });

    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    toast.success(response.message);
    router.push("/dashboard");
    setIsLogin(false);
  };

  const sendForgotOtp = async () => {
    if (!forgotMobile.trim() || forgotMobile.trim().length !== 10) {
      toast.error("Enter valid 10 digit mobile number");
      return;
    }

    setIsSendingForgotOtp(true);
    const response = await SendOtp({ mobile: forgotMobile.trim() });

    if (!response.status) {
      toast.error(response.message);
      setIsSendingForgotOtp(false);
      return;
    }

    setIsForgotOtpSent(true);
    setForgotResendInSeconds(60);
    toast.success(response.message);
    setIsSendingForgotOtp(false);
  };

  const resetForgotPasswordState = () => {
    setForgotMobile("");
    setForgotOtp("");
    setNewPassword("");
    setRePassword("");
    setIsForgotOtpSent(false);
    setForgotResendInSeconds(0);
  };

  const submitForgotPassword = async () => {
    if (!isForgotOtpSent) {
      toast.error("Send OTP before changing password");
      return;
    }

    setIsChangingPassword(true);
    const response = await ResetMobilePasswordOtp({
      mobile: forgotMobile.trim(),
      otp: forgotOtp.trim(),
      password: newPassword,
      repassword: rePassword,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsChangingPassword(false);
      return;
    }

    toast.success(response.message);
    setIsForgotOpen(false);
    resetForgotPasswordState();
    setIsChangingPassword(false);
  };

  const resetOtpLoginState = () => {
    setOtp("");
    setIsOtpSent(false);
    setResendInSeconds(0);
  };

  return (
    <>
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
                VAT-SMART Administration Portal
              </h1>
              <p className="text-xs text-gray-500">
                Department of Value Added Tax/GST Administration
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#c8d4e8] rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-[#0f2f67] px-6 py-8 flex flex-col justify-between gap-6">
              <div>
                <p className="inline-block px-2 py-1 text-xs font-semibold text-[#5a4000] bg-[#fff2cc] rounded-sm mb-4">
                  Authorized Access
                </p>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Welcome to VAT-SMART
                  <br />
                  Admin Login
                </h2>
                <p className="text-sm text-[#dbe8ff] mt-3 leading-relaxed max-w-md">
                  Login using OTP or password to manage administrative workflows,
                  verification queues, and compliance operations.
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
                  <span>Secure mobile OTP authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffd36a]">&#9658;</span>
                  <span>Password login for existing users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffd36a]">&#9658;</span>
                  <span>Built-in password recovery through OTP</span>
                </li>
              </ul>
            </div>

            <div className="px-6 py-8 bg-[#f7f9fc]">
              <h3 className="text-lg font-semibold text-[#0f2f67] text-center">
                Sign In
              </h3>
              <p className="text-sm text-gray-600 text-center mt-1">
                Login to access your account
              </p>

              <div className="flex items-center justify-center gap-2 mt-5 mb-2 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("otp");
                    password.current && (password.current.value = "");
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
                    resetOtpLoginState();
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

              <div className="grid max-w-sm items-center gap-1.5 w-80 mt-4 mx-auto">
                <Label htmlFor="mobile" className="text-xs text-gray-600">
                  Mobile Number
                </Label>
                <input
                  id="mobile"
                  type="text"
                  ref={mobile}
                  maxLength={10}
                  className="border border-[#cad6ea] outline-none focus:ring-0 focus:outline-none rounded-md py-2 px-2 bg-white"
                />
              </div>

              {loginMode === "otp" ? (
                <>
                  {!isOtpSent ? (
                    <Button
                      onClick={sendOtp}
                      className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
                      disabled={isLogin}
                    >
                      {isLogin ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <div className="grid max-w-sm items-center gap-1.5 w-80 mt-6 mx-auto">
                        <Label htmlFor="otp" className="text-xs text-gray-600">
                          OTP
                        </Label>
                        <input
                          id="otp"
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^[0-9]*$/.test(value)) setOtp(value);
                          }}
                          className="border border-[#cad6ea] outline-none focus:ring-0 focus:outline-none rounded-md py-2 px-2 bg-white"
                        />
                      </div>

                      <Button
                        onClick={loginWithOtp}
                        className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
                        disabled={isLogin}
                      >
                        {isLogin ? "Verifying OTP..." : "Login with OTP"}
                      </Button>

                      <div className="text-right mt-2 max-w-sm mx-auto">
                        {resendInSeconds > 0 ? (
                          <span className="text-xs text-gray-500">
                            Resend OTP in {resendInSeconds}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={sendOtp}
                            className="text-xs text-[#0f2f67] underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="grid max-w-sm items-center gap-1.5 w-80 mt-6 mx-auto">
                    <Label htmlFor="password" className="text-xs text-gray-600">
                      Password
                    </Label>
                    <div>
                      <div className="flex items-center gap-2 px-2 rounded border border-[#cad6ea] bg-white">
                        <input
                          id="password"
                          type={isShow ? "text" : "password"}
                          ref={password}
                          className="grow border-0 outline-none focus:ring-0 focus:border-0 focus:outline-none rounded-md py-2"
                        />
                        {isShow ? (
                          <Fa6RegularEyeSlash
                            className="cursor-pointer"
                            onClick={() => {
                              setIsShow(false);
                            }}
                          />
                        ) : (
                          <Fa6RegularEye
                            className="cursor-pointer"
                            onClick={() => {
                              setIsShow(true);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right mt-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-[#0f2f67] underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    onClick={loginuser}
                    className="mt-4 text-center font-semibold text-white bg-[#0f2f67] hover:bg-[#16448b] rounded-md block py-2 w-full max-w-sm mx-auto"
                    disabled={isLogin}
                  >
                    {isLogin ? "Loading..." : "Login"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal
        title="Forgot Password"
        open={isForgotOpen}
        onCancel={() => {
          setIsForgotOpen(false);
          resetForgotPasswordState();
        }}
        footer={null}
      >
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">
              Mobile Number
            </label>
            <input
              maxLength={10}
              placeholder="Enter 10-digit mobile"
              value={forgotMobile}
              disabled={isForgotOtpSent}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[0-9]*$/.test(value)) setForgotMobile(value);
              }}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
          </div>

          {!isForgotOtpSent && (
            <Button
              onClick={sendForgotOtp}
              disabled={isSendingForgotOtp}
              className="w-full bg-[#2350f0] text-white text-sm h-8 rounded-none border-none hover:bg-blue-600"
            >
              {isSendingForgotOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          )}

          {isForgotOtpSent && (
            <>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">OTP</label>
                <input
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={forgotOtp}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[0-9]*$/.test(value)) setForgotOtp(value);
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">
                  Re-Password
                </label>
                <input
                  type="password"
                  placeholder="Enter Re-Password"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              <Button
                onClick={submitForgotPassword}
                disabled={isChangingPassword}
                className="w-full bg-[#2350f0] text-white text-sm h-8 rounded-none border-none hover:bg-blue-600"
              >
                {isChangingPassword ? "Updating..." : "Change Password"}
              </Button>

              <div className="text-right">
                {forgotResendInSeconds > 0 ? (
                  <span className="text-sm text-gray-500">
                    Resend OTP in {forgotResendInSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendForgotOtp}
                    className="text-sm text-[#2350f0] underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AdminLogin;
