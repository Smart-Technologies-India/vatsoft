"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import StockCount from "@/action/firststock/getstockcount";
import IsRegisterPedning from "@/action/register/isregisterpending";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";
import DashboardCards from "@/components/dashboard/cards/dashboardcard";
import { user } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<user>();

  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  const [isRegisterPending, setRegisterPending] = useState<boolean>(false);

  const [count, setCount] = useState<number>(0);
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
      const pendingregistraion = await IsRegisterPedning({
        userid: authResponse.data,
      });

      if (pendingregistraion.status && pendingregistraion.data) {
        setRegisterPending(pendingregistraion.data);
      }

      const profile_response = await GetUserStatus({
        id: authResponse.data,
      });
      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }

      const count_response = await StockCount({});
      if (count_response.status && count_response.data) {
        setCount(count_response.data);
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
                title="Track Application Status"
                description="Monitor the progress and status of your submitted applications and requests with real-time updates."
                link="/dashboard/register/department-track-application-status"
              />

              <DashboardCards
                title="Product Requests Management"
                description="View and manage all product requests submitted by users. Update status, approve or reject requests."
                link="/dashboard/register/product-requests"
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

              {count === 0 && (
                <DashboardCards
                  title="Add Stock"
                  description="Add first time stock"
                  link="/dashboard/register/add-stock"
                />
              )}

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
