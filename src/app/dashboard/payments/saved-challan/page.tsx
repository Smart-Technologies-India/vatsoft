"use client";
import { CreateChallanProvider } from "@/components/forms/challan/createchallan";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

const CreateChallan = async () => {
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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <h1 className="text-lg font-medium text-gray-900">
              Create Challan Form DVAT 20
            </h1>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
            <CreateChallanProvider userid={userid} />
          </div>
        </div>
      </main>
    </>
  );
};

export default CreateChallan;
