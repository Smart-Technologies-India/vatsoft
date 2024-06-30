"use client";

import { Button } from "@/components/ui/button";
import { FormSteps } from "@/components/formstepts";
import { useEffect, useRef, useState } from "react";
import GetUser from "@/action/user/getuser";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { handleNumberChange } from "@/utils/methods";
import { safeParse } from "valibot";
import { UserDataSchema } from "@/schema/userdata";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";
import { useRouter } from "next/navigation";
import registerUser from "@/action/user/register/registeruser";
const UserRegister = () => {
  const router = useRouter();
  const id: number = parseInt(getCookie("id") ?? "0");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

  const firstnameRef = useRef<HTMLInputElement>(null);
  const lastnameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const altMobileRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const aadharRef = useRef<HTMLInputElement>(null);

  const handelSubmit = async () => {
    setIsSubmit(true);
    const result = safeParse(UserDataSchema, {
      firstName: firstnameRef.current?.value,
      lastName: lastnameRef.current?.value,
      address: addressRef.current?.value,
      email: emailRef.current?.value,
      mobileOne: mobileRef.current?.value,
      pan: panRef.current?.value,
      aadhar: aadharRef.current?.value,
    });

    if (result.success) {
      const userrespone: ApiResponseType<user | null> = await registerUser({
        id: id,
        firstName: result.output.firstName,
        lastName: result.output.lastName,
        address: result.output.address,
        email: result.output.email,
        mobileOne: result.output.mobileOne,
        mobileTwo:
          altMobileRef.current?.value == ""
            ? undefined
            : altMobileRef.current?.value,
        pan: result.output.pan,
        aadhar: result.output.aadhar,
      });
      if (userrespone.status) {
        router.push("/dashboard/new-registration/dvat1");
      } else {
        toast.error(userrespone.message);
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
    setIsSubmit(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const user = await GetUser({ id: id });

      if (user.status) {
        setTimeout(() => {
          firstnameRef.current!.value = user.data?.firstName ?? "";
          lastnameRef.current!.value = user.data?.lastName ?? "";
          addressRef.current!.value = user.data?.address ?? "";
          emailRef.current!.value = user.data?.email ?? "";
          mobileRef.current!.value = user.data?.mobileOne ?? "";
          altMobileRef.current!.value = user.data?.mobileTwo ?? "";
          panRef.current!.value = user.data?.pan ?? "";
          aadharRef.current!.value = user.data?.aadhar ?? "";
        }, 500);
      } else {
        toast.error(user.message);
      }

      setIsLoading(false);
    };
    init();
  }, [id]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white mx-auto p-4 shadow mt-6">
          <FormSteps
            completedSteps={1}
            labels={[
              "User",
              "DVAT01",
              "DVAT02",
              "DVAT03",
              "ANNEXURE-1",
              "ANNEXURE-2",
              "ANNEXURE-3",
              "Preview",
            ]}
          ></FormSteps>
        </div>
        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">User Registration</p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>

          <div className="flex gap-4 mt-1">
            <div className="flex-1">
              <Label htmlFor="firstname" className="text-sm font-normal">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={firstnameRef}
                type="text"
                id="firstname"
                name="firstName"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="First name"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="lastname" className="text-sm font-normal">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={lastnameRef}
                type="text"
                id="lastname"
                name="firstName"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="address" className="text-sm font-normal">
              Address <span className="text-red-500">*</span>
            </Label>

            <Textarea
              ref={addressRef}
              name="address"
              id="address"
              className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none mt-1"
              placeholder="Address"
            />
          </div>

          <div className="mt-2">
            <Label htmlFor="email" className="text-sm font-normal">
              Email <span className="text-red-500">*</span>
            </Label>

            <Input
              ref={emailRef}
              type="email"
              name="email"
              id="email"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Email"
            />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="mobileOne" className="text-sm font-normal">
                Mobile Number <span className="text-red-500">*</span>
              </Label>

              <Input
                ref={mobileRef}
                disabled={true}
                type="text"
                id="mobileOne"
                name="mobileOne"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Mobile Number"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="mobileTwo" className="text-sm font-normal">
                Alternate Number
              </Label>

              <Input
                ref={altMobileRef}
                type="text"
                name="mobileTwo"
                id="mobileTwo"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Alternate Number"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label htmlFor="pan" className="text-sm font-normal">
                Pan Card <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={panRef}
                type="text"
                name="pan"
                id="pan"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Pan Card"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="aadhar" className="text-sm font-normal">
                Aadhar Card <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={aadharRef}
                type="text"
                name="aadhar"
                id="aadhar"
                className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
                placeholder="Aadhar Card"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="grow"></div>

            {isSubmit ? (
              <Button
                disabled={true}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Loading...
              </Button>
            ) : (
              <Button
                onClick={handelSubmit}
                className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 "
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default UserRegister;
