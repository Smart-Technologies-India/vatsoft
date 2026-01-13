"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import ChangePassword from "@/action/user/changepassword";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgetpasswordSchema } from "@/schema/forgetpassword";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";

export default function Home() {
  const router = useRouter();
  const password = useRef<HTMLInputElement>(null);
  const repassword = useRef<HTMLInputElement>(null);

  const [isCahanging, setIsChanging] = useState<boolean>(false);

  const changePassword = async () => {
    setIsChanging(true);

    const passwordValue = password.current?.value;
    const repasswordValue = repassword.current?.value;
    const result = safeParse(ForgetpasswordSchema, {
      password: passwordValue,
      repassword: repasswordValue,
    });

    if (result.success) {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      const passwordrespone = await ChangePassword({
        id: authResponse.data,
        password: result.output.password,
      });

      if (passwordrespone.status) {
        toast.success(passwordrespone.message);
        password.current!.value = "";
        repassword.current!.value = "";
        router.push("/dashboard");
      } else {
        toast.error(passwordrespone.message);
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
    setIsChanging(false);
    return;
  };

  return (
    <>
      <div className="p-10 rounded-md min-h-screen w-full bg-[#f5f6f8] grid place-items-center">
        <div className="  bg-white rounded-r-md p-4 rounded shadow">
          <div>
            <h1 className="text-2xl font-semibold mb-2 border-b border-gray-300 pb-2">
              Forget Password
            </h1>
            <div className="grid max-w-sm items-center gap-1.5 w-80">
              <Label htmlFor="password">Password</Label>
              <Input id="firstname" type="text" ref={password} />

              <div className="h-4"></div>

              <Label htmlFor="repassword">Re-Password</Label>
              <Input id="repassword" type="text" ref={repassword} />

              {isCahanging ? (
                <Button className="mt-4 text-center font-semibold text-white bg-black rounded-md block py-2 w-full ">
                  Changing Password...
                </Button>
              ) : (
                <Button
                  onClick={changePassword}
                  className="mt-4 text-center font-semibold text-white bg-[#172e57] hover:bg-[#224688] rounded-md block py-2 w-full "
                >
                  Change Password
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
