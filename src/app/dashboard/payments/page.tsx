"use client";

import DashboardCards from "@/components/dashboard/cards/dashboardcard";

const Page = () => {
  return (
    <>
      <main className="bg-gradient-to-l py-4 mx-4 rounded-md mt-4">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
          <DashboardCards
            title="Challan History"
            description="View the history of all your VAT payment challans and their statuses."
            link="/dashboard/payments/challan-history"
          />
          <DashboardCards
            title="Create Challan"
            description="Payment of pending interest and penalty."
            link="/dashboard/payments/saved-challan"
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
            title="Refunds"
            description="Apply for and monitor the status of your VAT refund claims."
            link="/dashboard/payments/refunds"
          />
        </div>
      </main>
    </>
  );
};
export default Page;
