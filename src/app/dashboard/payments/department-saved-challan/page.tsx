"use client";
import { DepartmentCreateChallanProvider } from "@/components/forms/challan/departmentcreatechallan";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

const CreateChallan = () => {
  const router = useRouter();
  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
    };
    init();
  }, []);
  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            Create Challan Form DVAT 20
          </div>
          <DepartmentCreateChallanProvider />
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
