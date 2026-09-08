"use client";
import { useEffect, useState } from "react";
import {
  Spin,
  DatePicker,
  Input,
  Button,
  Table,
  Tag,
  Drawer,
  Divider,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import { toast } from "react-toastify";
import { SelectOffice, user } from "@prisma/client";
import {
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiMoneyRupeeCircleLine,
  Fa6RegularBuilding,
} from "@/components/icons";
import GetAllCFormReports from "@/action/cform/getallcformreports";
import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import numberWithIndianFormat from "@/utils/methods";
import * as XLSX from "xlsx";
import { format } from "date-fns";

ChartJS.register(...registerables);

interface CFormReportData {
  id: number;
  srNo: string;
  dateOfIssue: Date;
  sellerTinNo: string;
  sellerName: string;
  sellerAddress: string;
  amount: string;
  fromPeriod: Date;
  toPeriod: Date;
  cformType: string;
  officeOfIssue: string | null;
  purchaserName: string | null;
  purchaserTin: string | null;
  purchaserAddress: string | null;
  purchaserCommodity: string | null;
}

interface SummaryData {
  totalCForms: number;
  totalAmount: number;
  topSellers: Array<{
    name: string;
    tin: string;
    count: number;
    totalAmount: number;
  }>;
  topCommodities: Array<{
    name: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

const CFormReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [cformData, setCFormData] = useState<CFormReportData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CFormReportData | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<user | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<SelectOffice | "ALL">(
    "ALL",
  );

  // Filter states
  const [filters, setFilters] = useState({
    sellerName: "",
    sellerTin: "",
    purchaserTin: "",
  });

  // Initialize user and set default office
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const authResponse = await getAuthenticatedUserId();
        if (authResponse.status && authResponse.data) {
          const userResponse = await GetUser({ id: authResponse.data });
          if (userResponse.status && userResponse.data) {
            setUser(userResponse.data);
            // Set default office based on user role
            if (
              ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
                userResponse.data.role,
              )
            ) {
              setSelectedOffice(userResponse.data.selectOffice ?? "ALL");
            }
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initializeUser();
  }, []);

  // Fetch data when office changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const office = selectedOffice === "ALL" ? undefined : selectedOffice;
        const response = await GetAllCFormReports({
          office: office,
        });
        if (response.status && response.data) {
          setCFormData(response.data.allCForms);
          setSummary(response.data.summary);
        } else {
          toast.error(response.message || "Failed to fetch C-Form reports");
        }
      } catch (error) {
        toast.error("Error fetching C-Form reports");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedOffice]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredData = cformData.filter((item) => {
    const matchesSellerName = item.sellerName
      .toLowerCase()
      .includes(filters.sellerName.toLowerCase());
    const matchesSellerTin = item.sellerTinNo
      .toLowerCase()
      .includes(filters.sellerTin.toLowerCase());
    const matchesPurchaserTin = (item.purchaserTin || "")
      .toLowerCase()
      .includes(filters.purchaserTin.toLowerCase());
    return matchesSellerName && matchesSellerTin && matchesPurchaserTin;
  });

  const exportToExcel = () => {
    if (cformData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const worksheetData = [
      ["C-Form Reports - Complete Data"],
      [""],
      ["Summary Statistics"],
      ["Total C-Forms", summary?.totalCForms.toString() ?? "0"],
      ["Total Amount (₹)", numberWithIndianFormat(summary?.totalAmount ?? 0)],
      [""],
      ["Detailed C-Form Records"],
      [
        "Date of Issue",
        "SR No",
        "Seller Name",
        "Seller TIN",
        "Seller Address",
        "Amount (₹)",
        "Purchaser Name",
        "Purchaser TIN",
        "Purchaser Address",
        "Commodity Type",
        "C-Form Type",
        "Office of Issue",
      ],
    ];

    cformData.forEach((item) => {
      worksheetData.push([
        format(new Date(item.dateOfIssue), "dd-MMM-yyyy"),
        item.srNo,
        item.sellerName,
        item.sellerTinNo,
        item.sellerAddress,
        item.amount,
        item.purchaserName || "N/A",
        item.purchaserTin || "N/A",
        item.purchaserAddress || "N/A",
        item.purchaserCommodity || "N/A",
        item.cformType,
        item.officeOfIssue || "N/A",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "C-Form Reports");
    XLSX.writeFile(
      wb,
      `CForm_Reports_${format(new Date(), "dd-MMM-yyyy")}.xlsx`,
    );
  };

  const columns: ColumnsType<CFormReportData> = [
    {
      title: "Date",
      dataIndex: "dateOfIssue",
      key: "dateOfIssue",
      render: (date: Date) => format(new Date(date), "dd-MMM-yyyy"),
      width: 100,
    },
    {
      title: "SR No",
      dataIndex: "srNo",
      key: "srNo",
      width: 80,
    },
    {
      title: "Seller Name",
      dataIndex: "sellerName",
      key: "sellerName",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Seller TIN",
      dataIndex: "sellerTinNo",
      key: "sellerTinNo",
      width: 100,
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      render: (amount: string) =>
        numberWithIndianFormat(parseFloat(amount) || 0),
      align: "right" as const,
    },
    {
      title: "Purchaser Name",
      dataIndex: "purchaserName",
      key: "purchaserName",
      render: (text: string | null) => text || "N/A",
    },
    {
      title: "Purchaser TIN",
      dataIndex: "purchaserTin",
      key: "purchaserTin",
      render: (text: string | null) => (
        <span className="font-semibold text-blue-600">{text || "N/A"}</span>
      ),
      width: 120,
    },
    {
      title: "Valid Period",
      dataIndex: "fromPeriod",
      key: "period",
      render: (_: Date, record: CFormReportData) => (
        <span>
          {format(new Date(record.fromPeriod), "MMM")} to{" "}
          {format(new Date(record.toPeriod), "MMM-yyyy")}
        </span>
      ),
      width: 200,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: CFormReportData) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedRecord(record);
            setDrawerOpen(true);
          }}
        >
          View
        </Button>
      ),
      width: 70,
    },
  ];

  // Chart data - Top Sellers
  const topSellersData = {
    labels: summary?.topSellers.map((s) => s.name) ?? [],
    datasets: [
      {
        label: "Count of C-Forms",
        data: summary?.topSellers.map((s) => s.count) ?? [],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart data - Top Commodities
  const topCommoditiesData = {
    labels: summary?.topCommodities.map((c) => c.name) ?? [],
    datasets: [
      {
        label: "Count",
        data: summary?.topCommodities.map((c) => c.count) ?? [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data - Monthly Trend
  const monthlyTrendData = {
    labels: summary?.monthlyTrend.map((m) => m.month) ?? [],
    datasets: [
      {
        label: "C-Forms Count",
        data: summary?.monthlyTrend.map((m) => m.count) ?? [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Amount (₹ in lakhs)",
        data:
          summary?.monthlyTrend.map((m) => Math.round(m.amount / 100000)) ?? [],
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading C-Form Reports..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">C-Form Reports</h1>
      <p className="text-gray-600 mb-6">
        Comprehensive analysis of all C-Form transactions
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">
                Total C-Forms
              </p>
              <p className="text-2xl font-bold mt-1">
                {summary?.totalCForms ?? 0}
              </p>
            </div>
            <IcOutlineReceiptLong className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">
                Total Amount
              </p>
              <p className="text-2xl font-bold mt-1">
                ₹ {numberWithIndianFormat(summary?.totalAmount ?? 0)}
              </p>
            </div>
            <RiMoneyRupeeCircleLine className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">
                Unique Sellers
              </p>
              <p className="text-2xl font-bold mt-1">
                {Object.keys(summary?.topSellers ?? []).length}
              </p>
            </div>
            <Fa6RegularBuilding className="text-4xl text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Commodities</p>
              <p className="text-2xl font-bold mt-1">
                {summary?.topCommodities.length ?? 0}
              </p>
            </div>
            <MaterialSymbolsPersonRounded className="text-4xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Sellers Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Top 10 Sellers</h2>
          <div style={{ position: "relative", height: "300px" }}>
            <Bar
              data={topSellersData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y" as const,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Top Commodities Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Distribution by Commodity</h2>
          <div style={{ position: "relative", height: "300px" }}>
            <Pie
              data={topCommoditiesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right" as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Monthly Trend</h2>
        <div style={{ position: "relative", height: "300px" }}>
          <Line
            data={monthlyTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Office Filter */}
      {user &&
        !["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(
          user.role,
        ) && (
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700">
                Filter by Office:
              </label>
              <Select
                value={selectedOffice}
                onChange={(value) => {
                  setSelectedOffice(value);
                }}
                style={{ width: 250 }}
              >
                <Select.Option value="ALL">All Offices</Select.Option>
                <Select.Option value={SelectOffice.DAMAN}>DAMAN</Select.Option>
                <Select.Option value={SelectOffice.DIU}>DIU</Select.Option>
                <Select.Option value={SelectOffice.Dadra_Nagar_Haveli}>
                  DNH (Dadra & Nagar Haveli)
                </Select.Option>
              </Select>
              {selectedOffice !== "ALL" && (
                <span className="text-sm text-gray-600">
                  Showing data for:{" "}
                  <span className="font-semibold">
                    {selectedOffice === SelectOffice.Dadra_Nagar_Haveli
                      ? "DNH"
                      : selectedOffice}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

      {/* Filters and Export */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Filters & Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Filter by Seller Name"
            value={filters.sellerName}
            onChange={(e) => handleFilterChange("sellerName", e.target.value)}
          />
          <Input
            placeholder="Filter by Seller TIN"
            value={filters.sellerTin}
            onChange={(e) => handleFilterChange("sellerTin", e.target.value)}
          />
          <Input
            placeholder="Filter by Purchaser TIN"
            value={filters.purchaserTin}
            onChange={(e) => handleFilterChange("purchaserTin", e.target.value)}
          />
          <Button
            type="primary"
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600"
          >
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">All C-Form Records</h2>
        <Table
          columns={columns}
          dataSource={filteredData.map((item) => ({ ...item, key: item.id }))}
          pagination={{ pageSize: 20, total: filteredData.length }}
          size="small"
          scroll={{ x: 1400 }}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title="C-Form Details"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Date of Issue</p>
              <p className="font-semibold">
                {format(new Date(selectedRecord.dateOfIssue), "dd-MMM-yyyy")}
              </p>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">SR No</p>
                <p className="font-semibold">{selectedRecord.srNo}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">C-Form Type</p>
                <Tag
                  color={
                    selectedRecord.cformType === "ORIGINAL" ? "green" : "blue"
                  }
                >
                  {selectedRecord.cformType}
                </Tag>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-bold mb-2">Seller Information</h3>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-semibold mb-2">
                  {selectedRecord.sellerName}
                </p>

                <p className="text-gray-600 text-sm">TIN</p>
                <p className="font-semibold mb-2">
                  {selectedRecord.sellerTinNo}
                </p>

                <p className="text-gray-600 text-sm">Address</p>
                <p className="font-semibold">{selectedRecord.sellerAddress}</p>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-bold mb-2">Purchaser Information</h3>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-semibold mb-2">
                  {selectedRecord.purchaserName || "N/A"}
                </p>

                <p className="text-gray-600 text-sm">TIN</p>
                <p className="font-semibold mb-2">
                  {selectedRecord.purchaserTin || "N/A"}
                </p>

                <p className="text-gray-600 text-sm">Address</p>
                <p className="font-semibold mb-2">
                  {selectedRecord.purchaserAddress || "N/A"}
                </p>

                <p className="text-gray-600 text-sm">Commodity Type</p>
                <p className="font-semibold">
                  {selectedRecord.purchaserCommodity || "N/A"}
                </p>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Amount (₹)</p>
                <p className="text-lg font-bold text-green-600">
                  {numberWithIndianFormat(
                    parseFloat(selectedRecord.amount) || 0,
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Office of Issue</p>
                <p className="font-semibold">
                  {selectedRecord.officeOfIssue || "N/A"}
                </p>
              </div>
            </div>

            <Divider />

            <div>
              <p className="text-gray-600 text-sm">Valid From</p>
              <p className="font-semibold">
                {format(new Date(selectedRecord.fromPeriod), "dd-MMM-yyyy")}
              </p>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Valid Till</p>
              <p className="font-semibold">
                {format(new Date(selectedRecord.toPeriod), "dd-MMM-yyyy")}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CFormReportsPage;
