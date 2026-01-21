"use client";
import { CreateRefundProvider } from "@/components/forms/refund/refund";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

const Refunds = () => {
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
    <main className="relative bg-gray-50 min-h-screen">
      <div className="p-3">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Create Refund
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Submit a new refund request
                </p>
              </div>
            </div>
          </div>

          {/* Refund Form Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <CreateRefundProvider userid={userid} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Refunds;
