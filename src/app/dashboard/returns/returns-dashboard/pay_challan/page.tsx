"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { DepartmentPayChallanProvider } from "@/components/forms/challan/departmentpaychallan";
import { Quarter } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const CreateChallanWithoutReturn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const returnContext = useMemo(() => {
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const quarterParam = searchParams.get("quarter");

    if (!year || !month || !quarterParam) {
      return null;
    }

    if (!Object.values(Quarter).includes(quarterParam as Quarter)) {
      return null;
    }

    console.log("Parsed search params", { year, month, quarter: quarterParam });

    return {
      year,
      month,
      quarter: quarterParam as Quarter,
    };
  }, [searchParams]);

  useEffect(() => {
    if (returnContext) {
      return;
    }

    toast.error("Invalid return context. Please select period again.");
    router.push("/dashboard/returns/returns-dashboard");
  }, [returnContext, router]);

  if (!returnContext) {
    return null;
  }

  return (
    <div className="p-2">
      <div className="bg-white p-2 shadow mt-4">
        <div className="bg-blue-500 p-2 text-white">
          Create Challan Form DVAT 20
        </div>
        <DepartmentPayChallanProvider
          userid={userid}
          returnContext={returnContext}
        />
      </div>
    </div>
  );
};

export default CreateChallanWithoutReturn;
