"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUser from "@/action/user/getuser";
import DashboardCards from "@/components/dashboard/cards/dashboardcard";
import { user } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<user>();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const userresponse = await GetUser({
        id: userid,
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
            "VATOFFICER_DNH",
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
                title="DVAT-20 : Create Challan "
                description="Payment of pending interest and penalty."
                link="/dashboard/payments/department-saved-challan"
              />
              <DashboardCards
                title="Refunds History"
                description="View the history of all your VAT retunds and their statuses."
                link="/dashboard/payments/department-refunds-history"
              />
              <DashboardCards
                title="Challan History"
                description="View the history of all your VAT payment challans and their statuses."
                link="/dashboard/payments/department-challan-history"
              />
            </>
          )}

          {["USER"].includes(user?.role!) && (
            <>
              <DashboardCards
                title="DVAT-20 : Create Challan "
                description="Payment of pending interest and penalty."
                link="/dashboard/payments/saved-challan"
              />
              <DashboardCards
                title="Challan History"
                description="View the history of all your VAT payment challans and their statuses."
                link="/dashboard/payments/challan-history"
              />

              <DashboardCards
                title="Grievance against Payment"
                description="Submit and track complaints related to VAT payments."
                link="/dashboard/payments/grievance-against-payment"
              />
              <DashboardCards
                title="Electronic Credit Ledger"
                description="Check the details and status of your electronic credit ledger for input tax credits."
                link="/dashboard/payments/challan-history"
              />

              <DashboardCards
                title="DVAT-21 : Refund Claim Form"
                description="Apply for and monitor the status of your VAT refund claims."
                link="/dashboard/payments/refunds"
              />
              <DashboardCards
                title="Refunds History"
                description="View the history of all your VAT retunds and their statuses."
                link="/dashboard/payments/refunds-history"
              />
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default Page;
