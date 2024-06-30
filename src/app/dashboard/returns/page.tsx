"use client";

import DashboardCards from "@/components/dashboard/cards/dashboardcard";

const Page = () => {
  return (
    <>
      <main className="bg-gradient-to-l py-4 mx-4 rounded-md mt-4">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
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
            title="View Filed Returns"
            description="Review all your previously filed VAT returns and access detailed records and receipts."
            link="/dashboard/returns/view-filed-returns"
          />
          <DashboardCards
            title="Return Compliance"
            description="Check your VAT return compliance status and ensure all filings meet regulatory requirements."
            link="/dashboard/returns/returns-dashboard"
          />
        </div>
      </main>
    </>
  );
};
export default Page;
