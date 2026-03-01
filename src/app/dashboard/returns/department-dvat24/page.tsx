"use client";
import { DepartmentCreateDvat24Provider } from "@/components/forms/department/departmentcreatedvat24";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

const CreateDvat24 = async () => {
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
            Create DVAT 24 Notice
          </div>
          <div className="p-4">
            <DepartmentCreateDvat24Provider userid={userid} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateDvat24;
