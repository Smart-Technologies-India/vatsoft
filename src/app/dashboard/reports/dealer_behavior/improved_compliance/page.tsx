"use client";
import { FluentMdl2Home, MaterialSymbolsKeyboardArrowUpRounded } from "@/components/icons";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin, Badge } from "antd";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import ImprovedCompliance from "@/action/report/improvedcompliance";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

ChartJS.register(...registerables);

const ImprovedComplianceReport = () => {
  interface DealerComplianceData {
    id: number;
    tinNumber: string;
    name: string;
    tradename: string;
    commodity: string;
    selectOffice: string;
    contact_one: string;
    previousDefaultCount: number;
    currentComplianceMonths: number;
    improvementScore: number;
    lastDefaultDate: string;
    consecutiveFilings: number;
  }

  const [reportData, setReportData] = useState<DealerComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<
    "Dadra_Nagar_Haveli" | "DAMAN" | "DIU" | undefined
  >(undefined);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const response = await ImprovedCompliance({
        selectOffice: city,
        improvementPeriod: 6,
      });
      if (response.status && response.data) {
        setReportData(response.data);
      } else {
        toast.error(response.message || "Failed to load data");
        setReportData([]);
      }
      setLoading(false);
    };
    init();
  }, [city]);

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;

    const worksheetData = [
      ["Dealers With Improved Compliance Report"],
      ["Previous defaulters who are now filing regularly"],
      [""],
      [
        "TIN Number",
        "Dealer Name",
        "Trade Name",
        "Commodity",
        "District",
        "Contact",
        "Previous Defaults (6-12 months ago)",
        "Current Compliant Months (Last 6 months)",
        "Consecutive Filings",
        "Improvement Score",
        "Last Default Date",
      ],
    ];

    reportData.forEach((dealer) => {
      worksheetData.push([
        dealer.tinNumber,
        dealer.name,
        dealer.tradename,
        dealer.commodity,
        dealer.selectOffice,
        dealer.contact_one,
        dealer.previousDefaultCount.toString(),
        dealer.currentComplianceMonths.toString(),
        dealer.consecutiveFilings.toString(),
        dealer.improvementScore.toFixed(2) + "%",
        dealer.lastDefaultDate,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Improved Compliance");
    XLSX.writeFile(wb, `Improved_Compliance_Dealers.xlsx`);
    toast.success("Report exported successfully!");
  };

  const topImprovedDealers = reportData.slice(0, 10);

  const chartData: any = {
    labels: topImprovedDealers.map((d) => d.name.substring(0, 20)),
    datasets: [
      {
        label: "Improvement Score (%)",
        data: topImprovedDealers.map((d) => d.improvementScore),
        backgroundColor: "#10b981",
        borderColor: "#059669",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return "Improvement: " + context.parsed.x.toFixed(2) + "%";
          },
        },
      },
    },
  };

  const onCityChange = (e: RadioChangeEvent) => {
    setCity(e.target.value);
  };

  const citys = [
    { label: "All", value: undefined },
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  const getCommodityColor = (commodity: string) => {
    switch (commodity) {
      case "FUEL":
        return "blue";
      case "LIQUOR":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Dealers With Improved Compliance
          </h1>
          <p className="text-sm text-gray-600">
            Previous defaulters who are now filing returns regularly
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={exportToExcel}
            disabled={!reportData || reportData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              District
            </label>
            <Radio.Group
              options={citys}
              onChange={onCityChange}
              value={city}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : reportData && reportData.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Improved Dealers</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.length}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Former defaulters now compliant
                  </p>
                </div>
                <MaterialSymbolsKeyboardArrowUpRounded className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Average Improvement</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.length > 0
                      ? (
                          reportData.reduce((sum, d) => sum + d.improvementScore, 0) /
                          reportData.length
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Compliance rate increase
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Defaults Overcome</p>
                  <p className="text-3xl font-bold mt-1">
                    {reportData.reduce(
                      (sum, d) => sum + d.previousDefaultCount,
                      0
                    )}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Past defaults now resolved
                  </p>
                </div>
                <FluentMdl2Home className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Most Improved Dealers
            </h2>
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      TIN Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dealer Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Trade Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Previous Defaults
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Current Compliance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Consecutive Filings
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Improvement
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Last Default
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((dealer, index) => {
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {dealer.tinNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {dealer.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dealer.tradename}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Badge
                            color={getCommodityColor(dealer.commodity)}
                            text={dealer.commodity}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {dealer.selectOffice === "Dadra_Nagar_Haveli"
                            ? "DNH"
                            : dealer.selectOffice}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {dealer.previousDefaultCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {dealer.currentComplianceMonths} months
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dealer.consecutiveFilings}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-1 text-green-600 font-semibold">
                            <MaterialSymbolsKeyboardArrowUpRounded className="w-4 h-4" />
                            +{dealer.improvementScore.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {dealer.lastDefaultDate !== "N/A"
                            ? new Date(dealer.lastDefaultDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow-sm mt-6">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No improved dealers found</p>
            <p className="text-gray-400 text-sm mt-2">
              All dealers are either consistently compliant or still defaulting
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default ImprovedComplianceReport;
