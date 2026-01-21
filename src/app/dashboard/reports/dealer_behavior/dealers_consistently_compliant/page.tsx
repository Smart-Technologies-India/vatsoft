"use client";
import numberWithIndianFormat from "@/utils/methods";
import { Radio, RadioChangeEvent, Spin, Badge, Table, Input } from "antd";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import DealersConsistentlyCompliant from "@/action/report/dealers_consistently_compliance";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { SelectOffice } from "@prisma/client";

ChartJS.register(...registerables);

const DealersConsistentlyCompliantReport = () => {
  interface DealerData {
    dvat04: {
      id: number;
      tinNumber: string | null;
      name: string | null;
      tradename: string | null;
      selectOffice: string | null;
      contact_one: string | null;
      address: string | null;
      commodity: string | null;
    };
    lastfiling: string;
    pending: number;
    isLate: boolean;
  }

  const [reportData, setReportData] = useState<DealerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<SelectOffice>("Dadra_Nagar_Haveli");
  const [searchTin, setSearchTin] = useState("");
  const [searchTradename, setSearchTradename] = useState("");
  const [skip, setSkip] = useState(0);
  const [take] = useState(100);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const response = await DealersConsistentlyCompliant({
        dept: city,
        skip: skip,
        take: take,
        arnnumber: searchTin || undefined,
        tradename: searchTradename || undefined,
      });
      if (response.status && response.data && response.data.result && Array.isArray(response.data.result)) {
        setReportData(response.data.result);
        setTotal(response.data.total || 0);
      } else {
        toast.error(response.message || "Failed to load data");
        setReportData([]);
        setTotal(0);
      }
      setLoading(false);
    };
    init();
  }, [city, skip, searchTin, searchTradename]);

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const worksheetData = [
      ["Dealers Consistently Compliant Report"],
      ["Dealers with no defaults in the last 12 months"],
      [""],
      [
        "TIN Number",
        "Dealer Name",
        "Trade Name",
        "Commodity",
        "District",
        "Contact",
        "Address",
        "Last Filing",
        "Filed Returns (Last 6 months)",
      ],
    ];

    reportData.forEach((dealer) => {
      worksheetData.push([
        dealer.dvat04.tinNumber || "N/A",
        dealer.dvat04.name || "N/A",
        dealer.dvat04.tradename || "N/A",
        dealer.dvat04.commodity || "N/A",
        dealer.dvat04.selectOffice || "N/A",
        dealer.dvat04.contact_one || "N/A",
        dealer.dvat04.address || "N/A",
        dealer.lastfiling,
        dealer.pending.toString(),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consistently Compliant");
    XLSX.writeFile(wb, `Dealers_Consistently_Compliant_${city}.xlsx`);
    toast.success("Report exported successfully!");
  };

  const topCompliantDealers = Array.isArray(reportData) ? reportData.slice(0, 10) : [];

  const chartData: any = {
    labels: topCompliantDealers.map((d) => (d.dvat04.tradename || "N/A").substring(0, 20)),
    datasets: [
      {
        label: "Filed Returns (Last 6 months)",
        data: topCompliantDealers.map((d) => d.pending),
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
        max: 6,
        ticks: {
          font: {
            size: 11,
          },
          stepSize: 1,
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
            return "Filed Returns: " + context.parsed.x + " / 6 months";
          },
        },
      },
    },
  };

  const onCityChange = (e: RadioChangeEvent) => {
    setCity(e.target.value);
    setSkip(0);
  };

  const citys = [
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];

  const getCommodityColor = (commodity: string | null) => {
    switch (commodity) {
      case "FUEL":
        return "blue";
      case "LIQUOR":
        return "orange";
      default:
        return "gray";
    }
  };

  const handleSearch = () => {
    setSkip(0);
  };

  const handleReset = () => {
    setSearchTin("");
    setSearchTradename("");
    setSkip(0);
  };

  return (
    <main className="p-6">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="grow">
          <h1 className="text-2xl font-semibold">
            Dealers Consistently Compliant
          </h1>
          <p className="text-sm text-gray-600">
            Dealers with no defaults in the last 12 months
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
        <div className="flex flex-col gap-4">
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

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                TIN Number
              </label>
              <Input
                placeholder="Enter TIN Number"
                value={searchTin}
                onChange={(e) => setSearchTin(e.target.value)}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Trade Name / Dealer Name
              </label>
              <Input
                placeholder="Enter Trade Name or Dealer Name"
                value={searchTradename}
                onChange={(e) => setSearchTradename(e.target.value)}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Search
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600">Total Compliant Dealers</div>
              <div className="text-2xl font-bold text-green-600">
                {numberWithIndianFormat(total)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600">Average Returns Filed</div>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.length > 0
                  ? (
                      reportData.reduce((sum, d) => sum + d.pending, 0) /
                      reportData.length
                    ).toFixed(1)
                  : "0"}{" "}
                / 6
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
            <h2 className="text-lg font-semibold mb-4">
              Top 10 Most Compliant Dealers
            </h2>
            <div style={{ height: "400px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm mt-4 p-4">
            <h2 className="text-lg font-semibold mb-4">
              All Compliant Dealers ({numberWithIndianFormat(total)})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left text-sm">#</th>
                    <th className="border p-2 text-left text-sm">TIN Number</th>
                    <th className="border p-2 text-left text-sm">Dealer Name</th>
                    <th className="border p-2 text-left text-sm">Trade Name</th>
                    <th className="border p-2 text-left text-sm">Commodity</th>
                    <th className="border p-2 text-left text-sm">District</th>
                    <th className="border p-2 text-left text-sm">Contact</th>
                    <th className="border p-2 text-left text-sm">Last Filing</th>
                    <th className="border p-2 text-center text-sm">
                      Filed Returns
                      <br />
                      <span className="text-xs text-gray-500">(Last 6 months)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border p-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    reportData.map((dealer, index) => (
                      <tr key={dealer.dvat04.id} className="hover:bg-gray-50">
                        <td className="border p-2 text-sm">{skip + index + 1}</td>
                        <td className="border p-2 text-sm">
                          {dealer.dvat04.tinNumber || "N/A"}
                        </td>
                        <td className="border p-2 text-sm">{dealer.dvat04.name || "N/A"}</td>
                        <td className="border p-2 text-sm">
                          {dealer.dvat04.tradename || "N/A"}
                        </td>
                        <td className="border p-2 text-sm">
                          <Badge
                            color={getCommodityColor(dealer.dvat04.commodity)}
                            text={dealer.dvat04.commodity || "N/A"}
                          />
                        </td>
                        <td className="border p-2 text-sm">
                          {dealer.dvat04.selectOffice || "N/A"}
                        </td>
                        <td className="border p-2 text-sm">
                          {dealer.dvat04.contact_one || "N/A"}
                        </td>
                        <td className="border p-2 text-sm">{dealer.lastfiling}</td>
                        <td className="border p-2 text-center text-sm">
                          <span className="inline-flex items-center justify-center w-12 h-8 bg-green-100 text-green-700 rounded font-semibold">
                            {dealer.pending} / 6
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > take && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setSkip(Math.max(0, skip - take))}
                  disabled={skip === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded">
                  {skip / take + 1} / {Math.ceil(total / take)}
                </span>
                <button
                  onClick={() => setSkip(skip + take)}
                  disabled={skip + take >= total}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default DealersConsistentlyCompliantReport;
