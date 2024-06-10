"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiResponseType } from "@/models/response";
import { Role, user } from "@prisma/client";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";

import createUser from "@/action/user/createuser";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { RegisterUserSchema } from "@/schema/registeruser";
export default function Home() {
  const mobile = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const repassword = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const onSubmit = async () => {
    setIsCreating(true);
    const result = safeParse(RegisterUserSchema, {
      mobile: mobile.current?.value,
      password: password.current?.value,
      repassword: repassword.current?.value,
      role: "ADMIN",
    });

    if (result.success) {
      const registerrespone: ApiResponseType<user | null> = await createUser({
        password: result.output.password,
        mobile: result.output.mobile,
        role: Role.ADMIN,
      });
      if (registerrespone.status) {
        toast.success(registerrespone.message);
        mobile.current!.value = "";
        password.current!.value = "";
        repassword.current!.value = "";
      } else {
        toast.error(registerrespone.message);
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
    setIsCreating(false);
  };

  return (
    <>
      <div className="min-h-screen w-full bg-[#f5f6f8] flex">
        <div className="flex-1 relative">
          <Image
            fill={true}
            src="/log_in_bg.png"
            alt="error"
            className="w-full object-cover object-center h-screen"
          />
        </div>
        <div className="flex-1 grid place-items-center">
          <div>
            <h1 className="text-2xl font-semibold mt-6 mb-2 border-b border-gray-300 pb-2 ">
              Register
            </h1>
            <div className="grid max-w-sm items-center gap-1.5 w-80">
              <Label htmlFor="mobile">Mobile No. : </Label>
              <Input id="mobile" type="text" ref={mobile} />
            </div>
            <div className="grid max-w-sm items-center gap-1.5 w-80 mt-6">
              <Label htmlFor="password">Password : </Label>
              <Input id="password" type="text" ref={password} />
            </div>
            <div className="grid max-w-sm items-center gap-1.5 w-80 mt-6">
              <Label htmlFor="repassword">Re-Password : </Label>
              <Input id="repassword" type="text" ref={repassword} />
            </div>
            {isCreating ? (
              <Button
                disabled
                className="mt-4 text-center font-semibold text-white bg-black rounded-md block py-2 "
              >
                Loading...
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                className="mt-4 text-center font-semibold text-white bg-black rounded-md block py-2 "
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
