"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { DepartmentCreateDvat24AProvider } from "@/components/forms/department/departmentcreatedvat24a";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CreateDvat24A = async () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
    };
    init();
  }, []);
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-base font-semibold text-gray-900">
            Create DVAT 24A Notice
          </div>
          <div className="p-4">
            <DepartmentCreateDvat24AProvider userid={userid} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateDvat24A;
