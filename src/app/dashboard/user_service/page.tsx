"use client";

import DashboardCards from "@/components/dashboard/cards/dashboardcard";

const Page = () => {
  return (
    <>
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
        <div className=" grid grid-cols-3 justify-between items-center py-1  mx-auto gap-4">
          <DashboardCards
            title="View/Download certificate"
            description="Access and download your VAT registration certificate."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="My Application"
            description="View and manage all your submitted VAT-related applications."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="View Notice and Order"
            description="Check any notices and orders issued by the VAT department."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="My Profile"
            description="Update and manage your personal and business profile information."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="My Registration"
            description="Review the details of your VAT registration and make necessary updates."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="Search HSN Code"
            description="Find the Harmonized System of Nomenclature (HSN) code for goods and services."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="Holiday List"
            description="View the list of official holidays recognized by the VAT department."
            link="/dashboard/user_service"
          />
          <DashboardCards
            title="Locate VAT Practitioner"
            description="Find a registered VAT practitioner to assist with your VAT compliance."
            link="/dashboard/user_service"
          />
        </div>
      </main>
    </>
  );
};
export default Page;
