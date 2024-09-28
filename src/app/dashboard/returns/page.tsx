"use client";

import IsRegisterPedning from "@/action/register/isregisterpending";
import GetUser from "@/action/user/getuser";
import DashboardCards from "@/components/dashboard/cards/dashboardcard";
import { user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

const Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [user, setUser] = useState<user>();

  useEffect(() => {
    const init = async () => {
      const userresponse = await GetUser({
        id: id,
      });
      if (userresponse.status && userresponse.data) {
        setUser(userresponse.data);
      }
    };
    init();
  }, [id]);

  return (
    <>
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4  w-full xl:w-5/6 xl:mx-auto">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
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
              {/* <DashboardCards
                title="View Filed Returns"
                description="Review all your previously filed VAT returns and access detailed records and receipts."
                link="/dashboard/returns/view-filed-returns"
              /> */}
              <DashboardCards
                title="Return Compliance"
                description="Check your VAT return compliance status and ensure all filings meet regulatory requirements."
                link="/dashboard/returns/returns-dashboard"
              />
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default Page;
