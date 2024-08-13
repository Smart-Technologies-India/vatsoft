"use client";

import { Label } from "@/components/ui/label";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";

import Login from "@/action/user/login";
import { Button } from "@/components/ui/button";
import { LoginSchema } from "@/schema/login";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Fa6RegularEye, Fa6RegularEyeSlash } from "@/components/icons";
import LoginOtp from "@/action/user/loginotp";
import { decrypt, handleNumberChange } from "@/utils/methods";
import { Input } from "@/components/ui/input";
import SendOtp from "@/action/user/sendotp";

export default function LoginPage() {
  // password section
  const mobile = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const [isShow, setIsShow] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(false);

  const [isPassword, setIsPassword] = useState<boolean>(false);

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

  // top section
  const firstname = useRef<HTMLInputElement>(null);
  const lastname = useRef<HTMLInputElement>(null);

  const [isOtpSent, setIsOtpSent] = useState(false);

  const [otpresponse, setOtpResponse] = useState<user>();

  const mobileNumber = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const sendOtp = async () => {
    setIsLogin(true);
    const mobile = mobileNumber.current?.value;
    if (!mobile) {
      toast.error("Please enter a valid mobile number");
      setIsLogin(false);
      return;
    }

    if (mobile.length !== 10) {
      toast.error("Mobile number should be 10 digits long");
      setIsLogin(false);
      return;
    }
    const response = await SendOtp({ mobile: mobile });
    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    toast.success(response.message);
    setIsOtpSent(true);
    setOtpResponse(response.data!);
    setIsLogin(false);
  };

  const verifyOtp = async () => {
    setIsLogin(true);
    const mobile = mobileNumber.current?.value!;
    const otp = otpRef.current?.value;
    const firstnameValue = otpresponse?.firstName ?? firstname.current?.value;
    const lastnameValue = otpresponse?.lastName ?? lastname.current?.value;

    if (!mobile) {
      toast.error("Please enter a valid mobile number");
      setIsLogin(false);
      return;
    }

    if (!otp) {
      toast.error("Please enter a valid otp");
      setIsLogin(false);
      return;
    }

    if (!firstnameValue) {
      toast.error("Please enter a valid first name");
      return setIsLogin(false);
    }

    if (!lastnameValue) {
      toast.error("Please enter a valid last name");
      return setIsLogin(false);
    }

    const response = await LoginOtp({
      mobile: mobile,
      otp: otp,
      firstname: firstnameValue,
      lastname: lastnameValue,
    });

    if (!response.status) {
      toast.error(response.message);
      return setIsLogin(false);
    }

    toast.success(response.message);
    router.push("/dashboard");
    setIsLogin(false);
  };

  if (isPassword) {
    return (
      <>
        <div className="p-10 rounded-md min-h-screen w-full bg-[#f5f6f8] flex">
          <div className="flex-1 relative bg-gradient-to-tr from-[#2350f0] to-blue-400  grid place-items-center  rounded-l-md">
            <div></div>
            <div className="w-64 h-64 relative bg-white rounded-md mt-10">
              <div>
                <Image
                  fill={true}
                  src="/emblem.png"
                  alt="error"
                  className="object-contain object-center rounded-sm drop-shadow-2xl p-4"
                />
              </div>
            </div>
            <p className="text-white text-3xl text-center leading-relaxed font-bold">
              Department of <br /> Value Added Tax DNH
            </p>
            <div></div>
          </div>
          <div className="flex-1 grid place-items-center bg-white  rounded-r-md">
            <div>
              <h1 className="text-lg font-semibold mt-6 text-center">
                Welcome to Vat-Soft
              </h1>
              <h1 className="text-sm font-normal pb-2 text-center">
                Login to access your Account
              </h1>
              <div className="grid max-w-sm items-center gap-1.5 w-80 mt-4">
                <Label htmlFor="mobile" className="text-xs">
                  Mobile{" "}
                </Label>
                <input
                  id="mobile"
                  type="text"
                  ref={mobile}
                  className="border border-gray-300 grow outline-none focus:ring-0 ring-0 focus:outline-none rounded-md py-2 focus-visible:right-0 px-2 bg-transparent fill-none appearance-none"
                />
              </div>
              <div className="grid max-w-sm items-center gap-1.5 w-80 mt-6">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <div>
                  <div className="flex items-center gap-2 px-2 rounded border border-gray-300 bg-[#e8f0fe]">
                    <input
                      id="password"
                      type={isShow ? "text" : "password"}
                      ref={password}
                      className="grow border-0 outline-none focus:ring-0 ring-0 focus:border-0 focus:outline-none rounded-md py-2 focus-visible:right-0"
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

              {isLogin ? (
                <Button
                  className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full "
                  disabled
                >
                  Loading...
                </Button>
              ) : (
                <Button
                  onClick={loginuser}
                  className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full "
                >
                  Login
                </Button>
              )}

              <div className="flex w-full mt-6 items-center gap-4 justify-center">
                <button
                  onClick={() => setIsPassword(false)}
                  className="text-center text-xs text-[#2350f0]"
                >
                  Login With OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-10 rounded-md min-h-screen w-full bg-[#f5f6f8] flex">
        <div className="flex-1 relative bg-gradient-to-tr from-[#2350f0] to-blue-400  grid place-items-center  rounded-l-md">
          <div></div>
          <div className="w-64 h-64 relative bg-white rounded-md mt-10">
            <div>
              <Image
                fill={true}
                src="/emblem.png"
                alt="error"
                className="object-contain object-center rounded-sm drop-shadow-2xl p-4"
              />
            </div>
          </div>
          <p className="text-white text-3xl text-center leading-relaxed font-bold">
            Department of <br /> Value Added Tax DNH
          </p>
          <div></div>
        </div>
        <div className="flex-1 grid place-items-center bg-white rounded-r-md">
          <div>
            <h1 className="text-lg font-semibold mt-6 text-center">
              Welcome to Vat-Soft
            </h1>
            <h1 className="text-sm font-normal pb-2 text-center">
              Login to access your Account
            </h1>
            <div className="grid max-w-sm items-center gap-1.5 w-80 mt-4">
              {isOtpSent ? (
                <>
                  {otpresponse?.firstName == null ||
                  otpresponse?.firstName == "" ||
                  otpresponse?.lastName == null ||
                  otpresponse?.lastName == "" ? (
                    <>
                      <Label htmlFor="mobile" className="text-xs">
                        Mobile Number
                      </Label>
                      <Input
                        id="mobile"
                        type="text"
                        value={decrypt(otpresponse?.mobileOne!)}
                        ref={mobileNumber}
                        disabled
                        maxLength={10}
                        onChange={handleNumberChange}
                      />
                      <Label htmlFor="firstname" className="text-xs">
                        First Name
                      </Label>
                      <Input id="firstname" type="text" ref={firstname} />

                      <Label htmlFor="lastname" className="text-xs">
                        Last Name
                      </Label>
                      <Input id="lastname" type="text" ref={lastname} />
                    </>
                  ) : (
                    <>
                      <h1 className="text-left text-xl mb-6">
                        Hello {otpresponse?.firstName} {otpresponse?.lastName}
                      </h1>
                      <Label htmlFor="mobile" className="text-xs">
                        Mobile Number
                      </Label>
                      <div className="flex">
                        <Input
                          id="mobile"
                          type="text"
                          ref={mobileNumber}
                          value={decrypt(otpresponse?.mobileOne!)}
                          maxLength={10}
                          disabled
                          onChange={handleNumberChange}
                        />
                      </div>
                    </>
                  )}

                  <Label htmlFor="otp" className="text-xs">
                    OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    ref={otpRef}
                    maxLength={4}
                    onChange={handleNumberChange}
                  />
                  {isLogin ? (
                    <Button className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full ">
                      Loading...
                    </Button>
                  ) : (
                    <Button
                      onClick={verifyOtp}
                      className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full "
                    >
                      Verify OTP
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="mobile" className="text-xs">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="text"
                    ref={mobileNumber}
                    maxLength={10}
                    onChange={handleNumberChange}
                  />
                  {isLogin ? (
                    <Button
                      disabled
                      className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full "
                    >
                      Loading...
                    </Button>
                  ) : (
                    <Button
                      onClick={sendOtp}
                      className="mt-4 text-center font-semibold text-white bg-[#2350f0] hover:bg-blue-600 rounded-md block py-2 w-full "
                    >
                      Send OTP
                    </Button>
                  )}
                </>
              )}
              <div className="flex w-full mt-6 items-center gap-4 justify-center">
                <button
                  onClick={() => setIsPassword(true)}
                  className="text-center text-xs text-[#2350f0]"
                >
                  Login With password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
