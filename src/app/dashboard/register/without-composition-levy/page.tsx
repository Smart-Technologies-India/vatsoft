"use client";
import { CompositionProvider } from "@/components/forms/composition/createcomposition";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

const Dvat2Page = async ({ params }: { params: { dvatid: string } }) => {
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
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">
              DVAT-03 : Application for Withdrawal from Composition scheme
            </p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>
          <CompositionProvider userid={userid} composition={false} />
          <div className="flex gap-2"></div>
        </div>
      </main>
    </>
  );
};

export default Dvat2Page;
