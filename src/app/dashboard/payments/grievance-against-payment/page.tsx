"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleNumberChange } from "@/utils/methods";
import { useRef, useState } from "react";

const Grievance = () => {
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

  return (
    <main className="p-4">
      <div className="p-2 bg-white shadow">
        <div className="bg-blue-500 p-2 text-white">Submit Grievance</div>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <p className="text-sm font-normal">Grievance Type</p>
            <p className="text-sm font-medium">
              Grievance Against Payment(GST PMT 07)
            </p>
          </div>
          <div className="flex-1">
            <Label htmlFor="lastname" className="text-sm font-normal">
              Previous Grievance Number <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={lastnameRef}
              type="text"
              id="lastname"
              name="firstName"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Previous Grievance Number"
            />
          </div>
        </div>

        <p className="mt-4 text-blue-400 text-sm">
          Details of Taxpayer (Person) who is reporting the grievance
        </p>
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

        <p className="mt-4 text-blue-400 text-sm">Discrepancy In Payments</p>
        <div className="flex gap-4 mt-1">
          <div className="flex-1">
            <Label htmlFor="cpin" className="text-sm font-normal">
              CPIN <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={firstnameRef}
              type="text"
              id="cpin"
              name="cpin"
              className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm mt-1"
              placeholder="Enter CPIN"
            />
            <p className="text-xs">Select grievanc Related to field first</p>
          </div>
          <div className="flex-1"></div>
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
            <Button className="w-20  bg-blue-500 hover:bg-blue-600 text-white py-1 text-sm mt-2 h-8 ">
              Submit
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default Grievance;
