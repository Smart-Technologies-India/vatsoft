"use client";

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
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
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
