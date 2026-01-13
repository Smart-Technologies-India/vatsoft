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
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            Create DVAT 24A Notice
          </div>
          <DepartmentCreateDvat24AProvider userid={userid} />
        </div>
      </div>
    </>
  );
};

export default CreateDvat24A;
