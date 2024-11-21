"use client";

import IsRegisterPedning from "@/action/register/isregisterpending";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";
import DashboardCards from "@/components/dashboard/cards/dashboardcard";
import { user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

const Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [user, setUser] = useState<user>();

  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  const [isRegisterPending, setRegisterPending] = useState<boolean>(false);
  useEffect(() => {
    const init = async () => {
      const userresponse = await GetUser({
        id: id,
      });
      if (userresponse.status && userresponse.data) {
        setUser(userresponse.data);
      }
      const pendingregistraion = await IsRegisterPedning({
        userid: id,
      });

      if (pendingregistraion.status && pendingregistraion.data) {
        setRegisterPending(pendingregistraion.data);
      }

      const profile_response = await GetUserStatus({
        id: id,
      });
      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }
    };
    init();
  }, [id]);

  return (
    <>
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
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
                title="Track Application Status"
                description="Monitor the progress and status of your submitted applications and requests with real-time updates."
                link="/dashboard/register/department-track-application-status"
              />
            </>
          )}
          {["USER"].includes(user?.role!) && (
            <>
              {!isRegisterPending && !isProfileCompletd && (
                <DashboardCards
                  title="DVAT-04 : Application for Registration as a Dealer"
                  description="Initiate the process of registering a new taxpayer account for VAT compliance."
                  link="/dashboard/new-registration/registeruser"
                />
              )}
              <DashboardCards
                title="Track Application Status"
                description="Monitor the progress and status of your submitted applications and requests with real-time updates."
                link="/dashboard/register/track-application-status"
              />
              {isProfileCompletd && (
                <>
                  <DashboardCards
                    title="Application For Filing Clarification"
                    description="Submit a request to provide or seek clarification regarding an existing VAT application or filing."
                    link="/dashboard/register/applicatin_for_filing_clarification"
                  />
                  <DashboardCards
                    title="DVAT-07 : Amendment of Registration"
                    description="Modify critical details in your VAT registration, including business name, type, or ownership changes."
                    link="/dashboard/new-registration/registeruser"
                  />
                  {/* <DashboardCards
                    title="Amendment of Registration Non-Core Fields"
                    description="Update non-essential information in your VAT registration, such as contact details or business address."
                    link="/dashboard/new-registration/registeruser"
                  /> */}
                  <DashboardCards
                    title="DVAT-01 : Application to Opt for Composition scheme"
                    description="Apply to join the composition scheme, allowing for a simplified VAT payment method with lower compliance burdens."
                    link="/dashboard/register/composition-levy"
                  />
                  <DashboardCards
                    title="DVAT-03 : Application for Withdrawal from Composition scheme "
                    description="Apply to discontinue participation in the composition scheme and return to standard VAT payment."
                    link="/dashboard/register/without-composition-levy"
                  />
                  <DashboardCards
                    title="DVAT-09 : Application for Cancellation of Registration"
                    description="Request the cancellation of your VAT registration if your business is closing or no longer requires VAT registration."
                    link="/dashboard/new-registration/registeruser"
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default Page;
