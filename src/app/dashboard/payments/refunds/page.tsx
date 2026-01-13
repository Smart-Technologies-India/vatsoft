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
    <main className="p-4">
      <div className="p-2 bg-white shadow">
        <div className="bg-blue-500 p-2 text-white">Refunds</div>
        <CreateRefundProvider userid={userid} />
      </div>
    </main>
  );
};

export default Refunds;
