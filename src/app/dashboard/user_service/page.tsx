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
      <main className="bg-linear-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
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
                title="View Notice and Order"
                description="Check any notices and orders issued by the VAT department."
                link="/dashboard/user_service/department-notice_order"
              />
              <DashboardCards
                title="Send Notification"
                description="Send notifications to all users, specific groups, or individual users."
                link="/dashboard/send-notification"
              />
            </>
          )}

          {["USER"].includes(user?.role!) && (
            <>
              <DashboardCards
                title="View/Download certificate"
                description="Access and download your VAT registration certificate."
                link="/dashboard/register/track-application-status"
              />
              <DashboardCards
                title="My Application"
                description="View and manage all your submitted VAT-related applications."
                link="/dashboard/register/track-application-status"
              />
              <DashboardCards
                title="View Notice and Order"
                description="Check any notices and orders issued by the VAT department."
                link="/dashboard/user_service/notice_order"
              />
              {/* <DashboardCards
                title="My Profile"
                description="Update and manage your personal and business profile information."
                link="/dashboard/user_service/profile"
              /> */}
              {/* <DashboardCards
                title="My Registration"
                description="Review the details of your VAT registration and make necessary updates."
                link="/dashboard/register/track-application-status"
              /> */}
              {/* <DashboardCards
                title="Search HSN Code"
                description="Find the Harmonized System of Nomenclature (HSN) code for goods and services."
                link="/dashboard/user_service/hsn_code"
              />
              <DashboardCards
                title="Holiday List"
                description="View the list of official holidays recognized by the VAT department."
                link="/dashboard/user_service/holiday-list"
              /> */}
              {/* <DashboardCards
                title="Locate VAT Practitioner"
                description="Find a registered VAT practitioner to assist with your VAT compliance."
                link="/dashboard/user_service/paractitioner"
              /> */}
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default Page;
