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
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-white rounded-full"></div>
            <h1 className="text-2xl font-bold text-white">Submit Grievance</h1>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <p className="text-sm font-normal text-gray-600">Grievance Type</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                Grievance Against Payment(VAT)
              </p>
            </div>
            <div className="flex-1">
              <Label htmlFor="lastname" className="text-sm font-normal text-gray-700">
                Previous Grievance Number <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={lastnameRef}
                type="text"
                id="lastname"
                name="firstName"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Previous Grievance Number"
              />
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
            <p className="text-blue-700 text-sm font-semibold">
              Details of Taxpayer (Person) who is reporting the grievance
            </p>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="firstname" className="text-sm font-normal text-gray-700">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={firstnameRef}
                type="text"
                id="firstname"
                name="firstName"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="First name"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="lastname" className="text-sm font-normal text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={lastnameRef}
                type="text"
                id="lastname"
                name="firstName"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="address" className="text-sm font-normal text-gray-700">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              ref={addressRef}
              name="address"
              id="address"
              className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-24 placeholder:text-sm rounded-lg resize-none mt-1 border-gray-300"
              placeholder="Address"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="mobileOne" className="text-sm font-normal text-gray-700">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={mobileRef}
                disabled={true}
                type="text"
                id="mobileOne"
                name="mobileOne"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Mobile Number"
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="email" className="text-sm font-normal text-gray-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={emailRef}
                type="email"
                name="email"
                id="email"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Email"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="pan" className="text-sm font-normal text-gray-700">
                Pan Card <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={panRef}
                type="text"
                name="pan"
                id="pan"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Pan Card"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="aadhar" className="text-sm font-normal text-gray-700">
                Aadhar Card <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={aadharRef}
                type="text"
                name="aadhar"
                id="aadhar"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Aadhar Card"
                onChange={handleNumberChange}
              />
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
            <p className="text-blue-700 text-sm font-semibold">Discrepancy In Payments</p>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="cpin" className="text-sm font-normal text-gray-700">
                CPIN <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={firstnameRef}
                type="text"
                id="cpin"
                name="cpin"
                className="px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 h-10 placeholder:text-sm rounded-lg mt-1 border-gray-300"
                placeholder="Enter CPIN"
              />
              <p className="text-xs text-gray-500 mt-1">Select grievance Related to field first</p>
            </div>
            <div className="flex-1"></div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <div className="grow"></div>
            {isSubmit ? (
              <Button
                disabled={true}
                className="w-32 bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm h-10 rounded-lg"
              >
                Loading...
              </Button>
            ) : (
              <Button className="w-32 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 text-sm h-10 rounded-lg font-semibold shadow-md">
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Grievance;
