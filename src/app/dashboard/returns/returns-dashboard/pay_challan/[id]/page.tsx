"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { decryptURLData } from "@/utils/methods";
import { DepartmentPayChallanProvider } from "@/components/forms/challan/departmentpaychallan";

const CreateChallan = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const { id } = useParams<{ id: string | string[] }>();
  const returnId: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );


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
            Create Challan Form DVAT 20
          </div>
          <DepartmentPayChallanProvider userid={userid} returnId={returnId} />
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
