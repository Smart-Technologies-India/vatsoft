"use client";
import { FormSteps } from "@/components/formstepts";
import { Dvat03Provider } from "@/components/forms/user/dvat03";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { decryptURLData } from "@/utils/methods";

const Dvat3Page = () => {
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

  const { dvatid } = useParams<{ dvatid: string | string[] }>();
  const dvat04id = parseInt(
    decryptURLData(Array.isArray(dvatid) ? dvatid[0] : dvatid, router)
  );


  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white mx-auto p-4 shadow mt-6">
          <FormSteps
            completedSteps={4}
            labels={[
              "User",
              "DVAT04-1",
              "DVAT04-2",
              "DVAT04-3",
              "ANNEXURE-1",
              "ANNEXURE-2",
              "ANNEXURE-3",
              "Preview",
            ]}
          ></FormSteps>
        </div>

        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">DVAT 04 (18 to 23)</p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>
          <Dvat03Provider userid={userid} dvatid={dvat04id} />
        </div>
      </main>
    </>
  );
};

export default Dvat3Page;
