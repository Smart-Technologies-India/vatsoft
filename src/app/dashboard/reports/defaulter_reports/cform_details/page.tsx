"use client";

import { useEffect, useState } from "react";
import { Spin, Tabs, Table, Button, Drawer, Tag, Empty, Input, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "react-toastify";
import {
  IcOutlineReceiptLong,
  MaterialSymbolsPersonRounded,
  RiMoneyRupeeCircleLine,
} from "@/components/icons";
import GetReturnEntryByType, {
  type ReturnEntryWithRelations,
  type GroupedReturnEntry,
} from "@/action/report/getreturnentrybytype";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import * as XLSX from "xlsx";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatINR = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return inrFormatter.format(numValue || 0);
};

interface DvatGroup {
  dvatId: number;
  dvatName: string;
  dvatTin: string;
  entries: ReturnEntryWithRelations[];
}

const CformDetailsPage = () => {
  const [loading, setLoading] = useState(true);
  const [cformData, setCformData] = useState<GroupedReturnEntry | null>(null);
  const [fformData, setFformData] = useState<GroupedReturnEntry | null>(null);
  const [exportData, setExportData] = useState<GroupedReturnEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnEntryWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("cform");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authResponse = await getAuthenticatedUserId();
        if (!authResponse.status || !authResponse.data) {
          toast.error(authResponse.message);
          return;
        }

        const response = await GetReturnEntryByType();
        if (response.status && response.data) {
          setCformData(response.data.cform);
          setFformData(response.data.fform);
          setExportData(response.data.export);
        }
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupByDvat = (entries: ReturnEntryWithRelations[]): DvatGroup[] => {
    const grouped = new Map<number, DvatGroup>();
    entries.forEach((entry) => {
      const key = entry.dvat.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          dvatId: entry.dvat.id,
          dvatName: entry.dvat.tradename || "Unknown",
          dvatTin: entry.dvat.tinNumber || "",
          entries: [],
        });
      }
      grouped.get(key)!.entries.push(entry);
    });
    return Array.from(grouped.values());
  };

  const getFilteredEntries = (entries: ReturnEntryWithRelations[]) => {
    return entries.filter(
      (entry) =>
        entry.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.seller_tin_number.tin_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        entry.description_of_goods
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  };

  const columns: ColumnsType<ReturnEntryWithRelations> = [
    {
      title: "Invoice No.",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 120,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Invoice Date",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 110,
      render: (date) => new Date(date).toLocaleDateString("en-IN"),
    },
    {
      title: "Seller TIN",
      dataIndex: ["seller_tin_number", "tin_number"],
      key: "seller_tin",
      width: 100,
    },
    {
      title: "Seller Name",
      dataIndex: ["seller_tin_number", "name_of_dealer"],
      key: "seller_name",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "Description",
      dataIndex: "description_of_goods",
      key: "description",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "right" as const,
      render: (qty) => qty || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 110,
      align: "right" as const,
      render: (amount) => formatINR(amount || "0"),
    },
    {
      title: "VAT Amount",
      dataIndex: "vatamount",
      key: "vatamount",
      width: 110,
      align: "right" as const,
      render: (vat) => formatINR(vat || "0"),
    },
    {
      title: "Tax %",
      dataIndex: "tax_percent",
      key: "tax_percent",
      width: 80,
      align: "right" as const,
      render: (tax) => tax ? `${tax}%` : "-",
    },
    {
      title: "Total",
      dataIndex: "total_invoice_number",
      key: "total",
      width: 110,
      align: "right" as const,
      render: (total) => formatINR(total || "0"),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      fixed: "right" as const,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedRecord(record);
            setDrawerOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const renderTabContent = (data: GroupedReturnEntry | null) => {
    if (!data) {
      return (
        <Empty
          description="No data available"
          style={{ marginTop: "50px" }}
        />
      );
    }

    const dvatGroups = groupByDvat(data.entries);
    const filteredEntries = getFilteredEntries(data.entries);

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <IcOutlineReceiptLong className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Records</p>
                <p className="text-xl font-semibold">{data.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <RiMoneyRupeeCircleLine className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Amount</p>
                <p className="text-xl font-semibold">
                  {formatINR(data.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <RiMoneyRupeeCircleLine className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total VAT</p>
                <p className="text-xl font-semibold">
                  {formatINR(data.totalVat)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <MaterialSymbolsPersonRounded className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Unique DVATs</p>
                <p className="text-xl font-semibold">{dvatGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <Space>
            <Input
              placeholder="Search by Invoice No., Seller TIN, or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
            <Button
              onClick={() => {
                const exportData = filteredEntries.map((entry) => ({
                  "Invoice No": entry.invoice_number,
                  "Invoice Date": new Date(entry.invoice_date).toLocaleDateString("en-IN"),
                  "Seller TIN": entry.seller_tin_number.tin_number,
                  "Seller Name": entry.seller_tin_number.name_of_dealer || "-",
                  "DVAT Name": entry.dvat.tradename || "-",
                  "Description": entry.description_of_goods || "-",
                  "Quantity": entry.quantity || "-",
                  "Amount": entry.amount || "0",
                  "VAT Amount": entry.vatamount || "0",
                  "Tax %": entry.tax_percent || "-",
                  "Total": entry.total_invoice_number || "0",
                }));

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Return Entries");
                XLSX.writeFile(workbook, `return_entries_${activeTab}.xlsx`);
                toast.success("Exported successfully");
              }}
            >
              Export to Excel
            </Button>
          </Space>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredEntries}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="small"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="px-5 py-4 min-h-screen bg-gray-50">
      <div className="w-full mx-auto mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Return Entry Details
        </h1>
        <p className="text-sm text-gray-600">
          View and manage return entries grouped by type (C-Form, F-Form, Export)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "cform",
              label: `C-Form (${cformData?.total || 0})`,
              children: renderTabContent(cformData),
            },
            {
              key: "fform",
              label: `F-Form (${fformData?.total || 0})`,
              children: renderTabContent(fformData),
            },
            {
              key: "export",
              label: `Export (${exportData?.total || 0})`,
              children: renderTabContent(exportData),
            },
          ]}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title="Entry Details"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={600}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Invoice Number</p>
                <p className="font-semibold">{selectedRecord.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Invoice Date</p>
                <p className="font-semibold">
                  {new Date(selectedRecord.invoice_date).toLocaleDateString(
                    "en-IN",
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">URN Number</p>
                <p className="font-semibold">{selectedRecord.urn_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Seller TIN</p>
                <p className="font-semibold">
                  {selectedRecord.seller_tin_number.tin_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Seller Name</p>
                <p className="font-semibold">
                  {selectedRecord.seller_tin_number.name_of_dealer || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">DVAT</p>
                <p className="font-semibold">{selectedRecord.dvat.tradename}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="font-semibold">{formatINR(selectedRecord.amount || "0")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">VAT Amount</p>
                  <p className="font-semibold">{formatINR(selectedRecord.vatamount || "0")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tax %</p>
                  <p className="font-semibold">
                    {selectedRecord.tax_percent ? `${selectedRecord.tax_percent}%` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Amount</p>
                  <p className="font-semibold">
                    {formatINR(selectedRecord.total_invoice_number || "0")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Quantity</p>
                  <p className="font-semibold">{selectedRecord.quantity || "-"}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-600">Description</p>
              <p className="font-semibold">{selectedRecord.description_of_goods || "-"}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-600">Remarks</p>
              <p className="font-semibold">{selectedRecord.remarks || "-"}</p>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
};

export default CformDetailsPage;