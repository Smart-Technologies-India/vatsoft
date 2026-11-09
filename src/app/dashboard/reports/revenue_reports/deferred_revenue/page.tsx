"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { user, SelectOffice } from "@prisma/client";
import { Spin, Select, Button, Table } from "antd";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import DeferredRevenueReport, {
  DeferredRevenueData,
} from "@/action/report/deferredRevenueReport";
import DeferredRevenueReportLiquor from "@/action/report/deferredRevenueReportLiquor";
import DeferredRevenueReportNonLiquor from "@/action/report/deferredRevenueReportNonLiquor";
import { toast } from "react-toastify";

const DeferredRevenueReportPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<DeferredRevenueData[]>([]);
  const [liquorReportData, setLiquorReportData] = useState<any[]>([]);
  const [nonLiquorReportData, setNonLiquorReportData] = useState<any[]>([]);
  const [monthNames, setMonthNames] = useState<string[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<
    SelectOffice | undefined
  >(undefined);
  const [financialYear, setFinancialYear] = useState<string>("");

  // Calculate current financial year
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 3) {
      // April or later
      return `${year}-${year + 1}`;
    } else {
      // January to March
      return `${year - 1}-${year}`;
    }
  };

  useEffect(() => {
    const init = async () => {
      // Initialize financial year if not already set
      if (!financialYear) {
        setFinancialYear(getCurrentFinancialYear());
        return; // Exit and wait for the financialYear state to update
      }

      setLoading(true);

      try {
        // Fetch authenticated user
        const authResponse = await getAuthenticatedUserId();
        if (!authResponse.status || !authResponse.data) {
          toast.error(authResponse.message);
          router.push("/");
          return;
        }

        const userResponse = await GetUser({ id: authResponse.data });
        if (userResponse.status && userResponse.data) {
          setUser(userResponse.data);

          // Set office filter based on role
          const filterOffice = [
            "VATOFFICER",
            "DY_COMMISSIONER",
            "JOINT_COMMISSIONER",
          ].includes(userResponse.data.role)
            ? (userResponse.data.selectOffice ?? undefined)
            : selectedOffice;

          // Fetch main report
          const reportResponse = await DeferredRevenueReport({
            selectOffice: filterOffice,
            financialYear,
          });

          if (reportResponse.status && reportResponse.data) {
            setReportData(reportResponse.data);
            setMonthNames(reportResponse.monthNames);
          } else {
            toast.error(reportResponse.message || "Failed to load data");
          }

          // Fetch fuel report
          const liquorResponse = await DeferredRevenueReportLiquor({
            selectOffice: filterOffice,
            financialYear,
          });

          if (liquorResponse.status && liquorResponse.data) {
            setLiquorReportData(liquorResponse.data);
          }

          // Fetch liquor report
          const nonLiquorResponse = await DeferredRevenueReportNonLiquor({
            selectOffice: filterOffice,
            financialYear,
          });

          if (nonLiquorResponse.status && nonLiquorResponse.data) {
            setNonLiquorReportData(nonLiquorResponse.data);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [selectedOffice, financialYear]);

  const getCellColor = (
    transactionMonth: string,
    forMonth: string,
    value: number,
  ) => {
    if (value === 0) return "bg-gray-50";

    if (transactionMonth === forMonth) {
      return "bg-green-100"; // Same month - Green
    } else if (
      monthNames.indexOf(transactionMonth) < monthNames.indexOf(forMonth)
    ) {
      return "bg-orange-100"; // Earlier transaction - Orange (deferred)
    } else {
      return "bg-red-100"; // Later transaction - Red (exception)
    }
  };

  const createColumns = (reportType?: "fuel" | "liquor") => [
    {
      title: "Transaction Month",
      dataIndex: "transactionMonth",
      key: "transactionMonth",
      fixed: "left" as const,
      width: 150,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    ...monthNames.map((month) => ({
      title: month,
      key: month,
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: DeferredRevenueData) => {
        const value = record.forMonths[month] || 0;
        const color = getCellColor(record.transactionMonth, month, value);

        if (value === 0) {
          return <div className={`${color} p-2 rounded text-center`}>-</div>;
        }

        const url = reportType 
          ? `/dashboard/reports/revenue_reports/deferred_revenue/details?transactionMonth=${encodeURIComponent(
              record.transactionMonth,
            )}&forMonth=${encodeURIComponent(month)}&office=${encodeURIComponent(selectedOffice || "")}&type=${reportType}`
          : `/dashboard/reports/revenue_reports/deferred_revenue/details?transactionMonth=${encodeURIComponent(
              record.transactionMonth,
            )}&forMonth=${encodeURIComponent(month)}&office=${encodeURIComponent(selectedOffice || "")}`;

        return (
          <div
            className={`${color} p-2 rounded text-center cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => {
              router.push(url);
            }}
          >
            <span className="font-semibold">
              ₹
              {value.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        );
      },
    })),
    {
      title: "Total",
      key: "total",
      width: 120,
      fixed: "right" as const,
      align: "center" as const,
      render: (_: unknown, record: DeferredRevenueData) => (
        <span className="font-semibold">
          ₹
          {(record.total ?? 0).toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
  ];

  const columns = createColumns();

  // Calculate column totals
  const columnTotals: { [month: string]: number } = {};
  monthNames.forEach((month) => {
    columnTotals[month] = reportData.reduce(
      (sum, row) => sum + (row.forMonths[month] || 0),
      0,
    );
  });

  const grandTotal = Object.values(columnTotals).reduce(
    (sum, val) => sum + val,
    0,
  );

  const dataSource = [
    ...reportData,
    {
      transactionMonth: "Total",
      forMonths: columnTotals,
      total: grandTotal,
      key: "total-row",
    } as any,
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Deferred Revenue Report (FY {financialYear})</h1>
        <p className="text-gray-600 mb-4">
          Shows the transaction date vs the month the payment was for. Helps
          identify deferred revenue and payment patterns.
        </p>

        <div className="flex flex-col bg-white p-4 rounded border border-gray-200 text-sm gap-4">
          <div>
            <p>
              <strong>Color Legend:</strong>
            </p>
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
                <span>Same Month (Green)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Deferred (Orange)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border border-red-300 rounded"></div>
                <span>Exception/Late Payment (Red)</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium mb-1">Financial Year</label>
              <Select
                placeholder="Select Financial Year"
                value={financialYear}
                onChange={(value) => setFinancialYear(value)}
                options={[
                  { label: "2025-2026", value: "2025-2026" },
                  { label: "2026-2027", value: "2026-2027" },
                  { label: "2027-2028", value: "2027-2028" },
                ]}
                style={{ width: 200 }}
              />
            </div>
            {["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
              user?.role || "",
            ) ? (
              <div>
                <label className="block text-sm font-medium mb-1">Office</label>
                <Select
                  disabled
                  value={user?.selectOffice}
                  style={{ width: 200 }}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Office</label>
                <Select
                  placeholder="Select Office"
                  value={selectedOffice}
                  onChange={(value) => setSelectedOffice(value as SelectOffice)}
                  options={[
                    {
                      label: "Dadra & Nagar Haveli",
                      value: "Dadra_Nagar_Haveli",
                    },
                    { label: "Daman", value: "DAMAN" },
                    { label: "Diu", value: "DIU" },
                  ]}
                  style={{ width: 200 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white p-8 rounded border border-gray-300 text-center">
          <p className="text-gray-600">
            No data available for the selected filters
          </p>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            bordered
            size="small"
            rowKey={(record) => record.transactionMonth}
            rowClassName={(record) =>
              record.transactionMonth === "Total" ? "bg-gray-200 font-bold" : ""
            }
          />
        </div>
      )}

      {/* Fuel Commodity Table */}
      {liquorReportData.length > 0 && (
        <div className="bg-white rounded shadow overflow-x-auto mt-8">
          <h2 className="text-xl font-bold p-4 text-amber-700">
            Fuel Commodity Records
          </h2>
          <Table
            columns={createColumns("fuel")}
            dataSource={liquorReportData}
            pagination={false}
            bordered
            size="small"
            rowKey={(record) => `fuel-${record.transactionMonth}`}
            rowClassName={(record) =>
              record.transactionMonth === "Total" ? "bg-gray-200 font-bold" : ""
            }
          />
        </div>
      )}

      {/* Liquor Commodity Table */}
      {nonLiquorReportData.length > 0 && (
        <div className="bg-white rounded shadow overflow-x-auto mt-8">
          <h2 className="text-xl font-bold p-4 text-green-700">
            Liquor Commodity Records
          </h2>
          <Table
            columns={createColumns("liquor")}
            dataSource={nonLiquorReportData}
            pagination={false}
            bordered
            size="small"
            rowKey={(record) => `liquor-${record.transactionMonth}`}
            rowClassName={(record) =>
              record.transactionMonth === "Total" ? "bg-gray-200 font-bold" : ""
            }
          />
        </div>
      )}
    </div>
  );
};

export default DeferredRevenueReportPage;
