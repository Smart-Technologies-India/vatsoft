"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import DashboardCards from "@/components/dashboard/cards/dashboardcard";
import { user } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<user>();

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const userresponse = await GetUser({
        id: authResponse.data,
      });
      if (userresponse.status && userresponse.data) {
        setUser(userresponse.data);
      }
    };
    init();
  }, [userid]);

  return (
    <>
      <main className="bg-linear-to-l py-4 px-4 rounded-md mt-4  w-full xl:w-5/6 xl:mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
          {[
            "SYSTEM",
            "ADMIN",
            "COMMISSIONER",
            "JOINT_COMMISSIONER",
            "DY_COMMISSIONER",
            "VATOFFICER",
            "ASST_VAT_OFFICER",
            "INSPECTOR",
            "UDC",
            "LDC",
            "DATA_ENTRY_OPERATOR",
            "ACCOUNTANT",
            "CA",
          ].includes(user?.role!) && (
            <>
              <DashboardCards
                title="Track Filed Status"
                description="Monitor submitted VAT returns in real-time."
                link="/dashboard/returns/department-track-return-status"
              />
              <DashboardCards
                title="Track Pending Return"
                description="Monitor submitted VAT returns in real-time."
                link="/dashboard/returns/department-pending-return"
              />
            </>
          )}
          {["USER"].includes(user?.role!) && (
            <>
              <DashboardCards
                title="Returns Dashboard"
                description="Access an overview of all your VAT return activities, deadlines, and notifications in one place."
                link="/dashboard/returns/returns-dashboard"
              />

              <DashboardCards
                title="Track Return Status"
                description="Monitor the progress and status of your submitted VAT returns in real-time."
                link="/dashboard/returns/track-return-status"
              />
              <DashboardCards
                title="Return Compliance"
                description="Check your VAT return compliance status and ensure all filings meet regulatory requirements."
                link={`/dashboard/returns/user-pending-return`}
              />
              <DashboardCards
                title="CFORM"
                description="Check your CFORM status and ensure all filings meet regulatory requirements."
                link={`/dashboard/returns/cform-status`}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default Page;
