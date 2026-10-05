"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { AddWalletTransactionProvider } from "@/components/forms/wallet/addwallettransaction";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AddWalletTransactionPage = () => {
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
    <div className="p-2">
      <div className="bg-white p-2 shadow mt-4">
        <div className="bg-blue-500 p-2 text-white">
          Wallet Top-up Form - Add Amount to Wallet
        </div>
        <AddWalletTransactionProvider userid={userid} />
      </div>
    </div>
  );
};

export default AddWalletTransactionPage;
