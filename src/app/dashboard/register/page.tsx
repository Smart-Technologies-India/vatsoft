"use client";

import DashboardCards from "@/components/dashboard/cards/dashboardcard";

const Page = () => {
  return (
    <>
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
          <DashboardCards
            title="New Registration"
            description="Initiate the process of registering a new taxpayer account for VAT compliance."
            link="/dashboard/new-registration/registeruser"
          />
          <DashboardCards
            title="Track Application Status"
            description="Monitor the progress and status of your submitted applications and requests with real-time updates."
            link="/dashboard/register/track-application-status"
          />
          <DashboardCards
            title="Application For Filing Clarification"
            description="Submit a request to provide or seek clarification regarding an existing VAT application or filing."
            link="/dashboard/register/applicatin_for_filing_clarification"
          />
          <DashboardCards
            title="Amendment of Registration Core Fields"
            description="Modify critical details in your VAT registration, including business name, type, or ownership changes."
            link="/dashboard/new-registration/registeruser"
          />
          <DashboardCards
            title="Amendment of Registration Non-Core Fields"
            description="Update non-essential information in your VAT registration, such as contact details or business address."
            link="/dashboard/new-registration/registeruser"
          />
          <DashboardCards
            title="Application to Opt for Composition levy"
            description="Apply to join the composition levy scheme, allowing for a simplified VAT payment method with lower compliance burdens."
            link="/dashboard/new-registration/registeruser"
          />
          <DashboardCards
            title="Application for Withdrawal from Composition levy"
            description="Apply to discontinue participation in the composition levy scheme and return to standard VAT payment."
            link="/dashboard/new-registration/registeruser"
          />
          <DashboardCards
            title="Application for Cancellation of Registration"
            description="Request the cancellation of your VAT registration if your business is closing or no longer requires VAT registration."
            link="/dashboard/new-registration/registeruser"
          />
        </div>
      </main>
    </>
  );
};
export default Page;
