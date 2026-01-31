"use client";
import { useRouter } from "next/navigation";

interface CowReportResponse {
  beneficiary_code: string;
  name: string;
  cowtagno: string;
  cowname: string;
  alias: string;
  sex: string;
  birthdate: Date | null;
  weight: number | null;
  daily_milk_produce: number;
  no_of_calves: number;
  bull_calves: number;
  heifer_calves: number;
  cowstatus: string;
  death_date: Date | null;
  death_reason: string | null;
  Beneficiary_Contact: string;
  beneficiary_type: string;
  cow_count: number | null;
  mother_id: number | null;
  mother_cowtagno: string | null;
}

interface UserReportResponse {
  beneficiary_code: string;
  name: string;
  alias: string;
  contact: string;
  contact_two: string | null;
  beneficiary_type: string;
  address: string;
  village: string;
  district: string;
  status: string;
  loan_id: number | null;
  amount: number | null;
  start_date: Date | null;
  end_date: Date | null;
  emi_amount: number | null;
  emi_date: Date | null;
  number_of_cows: number;
  no_of_calves: number;
  alive_cows: number;
  sold_cows: number;
  dead_cows: number;
  number_of_female_calves: number;
  number_of_male_calves: number;
}

const ReportsPage = () => {
  const router = useRouter();
  return (
    <div className="p-6">
      <h1>A. Compliance and Defaulter Report</h1>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Defaulter Analysis Report - Identifies dealers who have not filed
            returns this month, repeatedly missed filings, or have defaulted 3+
            times in the past year
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            // onClick={userExportToExcel}
            onClick={() => {
              router.push(
                "/dashboard/reports/defaulter_reports/defaulter_analysis",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Inactive Dealers (No Return filed in last 6 months)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            // onClick={userExportToExcel}
            onClick={() => {
              router.push(
                "/dashboard/reports/defaulter_reports/inactive_dealers",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            {/* Dealers With Outstanding Penalty / Interest / Late Fee Dues */}
            Interest / Late Penalty Collected
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/defaulter_reports/penalty_collected",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">Dealers Who Filed Returns After Deadline</p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/defaulter_reports/afterdeathline",
              );
            }}
          >
            View Report
          </button>
        </div>

        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Dealers With Outstanding Demand Penalty / Interest Dues
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/defaulter_reports/demand_penalty",
              );
            }}
          >
            View Report
          </button>
        </div>
      </div>
      <hr className="my-4" />
      <h1>B. Revenue Reports</h1>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            District-Wise Revenue Report (Dadra & Nager Haveli/Daman/Diu)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/revenue_reports/district_wise");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">Category-wise Revenue(Liquor / Petroleum)</p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/revenue_reports/category_wise");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Monthly Revenue Trend (Graph showing revenue over each month)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/revenue_reports/monthly_revenue");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Yearly Comparison Report (e.g., FY 2023-24 FY 2024-25)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/revenue_reports/yearly_comparison",
              );
            }}
          >
            View Report
          </button>
        </div>
      </div>
      <hr className="my-4" />
      <h1>C. Commodity Reports</h1>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Top Selling Commodities in Petroleum (e.g., Petrol, Diesel, CNG,
            PNG, Additives)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/commodity_reports/petroleum");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">Top Selling Commodities in Liquor</p>
          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/commodity_reports/liquor");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            District-wise Commodity Revenue Split (e.g, how much Diesel sold in
            Diu)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/commodity_reports/districtwise");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Commodity Sales Growth Report (Month-on-Month or Year-on-Year)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/commodity_reports/sales_growth");
            }}
          >
            View Report
          </button>
        </div>
      </div>
      <hr className="my-4" />
      <h1>D. Dealer Behavior & Profiling</h1>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            List of New Dealers Registered This Month/Year
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/dealer_behavior/new_dealers");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Dealers With improved Compliance (previous defaulters now regular)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/dealer_behavior/improved_compliance",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Dealers Consistently Compliant (no defaults in 12 months)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/dealer_behavior/dealers_consistently_compliant",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Top 10 Highest Revenue-Contributing Dealers per District/Category
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/dealer_behavior/top_revenue_dealers",
              );
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Dealer Type-wise Revenue (Petroleum Dealers vs Liquor Dealers)
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push(
                "/dashboard/reports/dealer_behavior/dealer_type_revenue",
              );
            }}
          >
            View Report
          </button>
        </div>
      </div>
      <hr className="my-4" />
      <h1>E. Operational Reports for Admin Review</h1>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Summary of Notices Issued., Orders Generated, and Status
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/user_service/department-notice_order");
            }}
          >
            View Report
          </button>
        </div>
        <div className="p-2 rounded shadow bg-white relative pb-8">
          <p className="text-sm">
            Return Filing Timeline Summary - Filed ON Time vs Late
          </p>

          <button
            className="bg-blue-500 text-white mt-2 block text-sm font-semibold absolute bottom-0 right-0 px-2 py-1 rounded-tl-lg"
            onClick={() => {
              router.push("/dashboard/reports/admin_review/timelinesummary");
            }}
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
