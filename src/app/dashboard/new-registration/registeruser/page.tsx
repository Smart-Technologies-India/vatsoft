import { FormSteps } from "@/components/formstepts";

import { RegisterProvider } from "@/components/forms/user/register";
import { cookies } from "next/headers";
const UserRegister = () => {
  const id: number = parseInt(cookies().get("id")?.value ?? "0");

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
          <RegisterProvider userid={id} />
        </div>
      </main>
    </>
  );
};

export default UserRegister;
