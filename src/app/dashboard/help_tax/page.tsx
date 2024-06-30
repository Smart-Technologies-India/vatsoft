"use client";

import DashboardCards from "@/components/dashboard/cards/dashboardcard";

const Page = () => {
  return (
    <>
      <main className="bg-gradient-to-l py-4 mx-4 rounded-md mt-4">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
          <DashboardCards
            title="News and Updates"
            description="Stay informed with the latest news and updates from the VAT department."
            link="/dashboard/help_tax"
          />
          <DashboardCards
            title="Help and FAQ"
            description="Access a comprehensive collection of frequently asked questions and helpful resources."
            link="/dashboard/help_tax"
          />
          <DashboardCards
            title="About Us"
            description="Learn more about the VAT department, its mission, and its services."
            link="/dashboard/help_tax"
          />
          <DashboardCards
            title="Contact Us"
            description="Find contact information and reach out to the VAT department for assistance."
            link="/dashboard/help_tax"
          />
        </div>
      </main>
    </>
  );
};
export default Page;
