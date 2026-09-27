"use client";

import { useEffect, useState } from "react";
import { Spin, Tabs, Table, Button, Drawer, Empty, Input, Space } from "antd";
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

interface ReturnIdGroup {
  returns_01Id: number;
  returns_01: any;
  entries: ReturnEntryWithRelations[];
  totalQuantity: number;
  totalAmount: string;
  totalVat: string;
  totalTax: string;
}

const CformDetailsPage = () => {
  const [loading, setLoading] = useState(true);
  const [cformData, setCformData] = useState<GroupedReturnEntry | null>(null);
  const [fformData, setFformData] = useState<GroupedReturnEntry | null>(null);
  const [exportData, setExportData] = useState<GroupedReturnEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<ReturnEntryWithRelations | null>(null);
  const [selectedReturnGroup, setSelectedReturnGroup] =
    useState<ReturnIdGroup | null>(null);
  const [isReturnGroupModalOpen, setIsReturnGroupModalOpen] = useState(false);
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

  const groupByReturnId = (
    entries: ReturnEntryWithRelations[],
  ): ReturnIdGroup[] => {
    const grouped = new Map<number, ReturnIdGroup>();
    entries.forEach((entry) => {
      const key = entry.returns_01Id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          returns_01Id: key,
          returns_01: entry.returns_01,
          entries: [],
          totalQuantity: 0,
          totalAmount: "0",
          totalVat: "0",
          totalTax: "0",
        });
      }
      grouped.get(key)!.entries.push(entry);
    });

    // Calculate totals for each group
    grouped.forEach((group) => {
      group.totalQuantity = group.entries.reduce(
        (sum, e) => sum + (e.quantity || 0),
        0,
      );
      group.totalAmount = group.entries
        .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0)
        .toString();
      group.totalVat = group.entries
        .reduce((sum, e) => sum + parseFloat(e.vatamount || "0"), 0)
        .toString();
      group.totalTax = group.entries
        .reduce((sum, e) => sum + parseFloat(e.tax_percent || "0"), 0)
        .toString();
    });

    return Array.from(grouped.values());
  };

  const getFilteredEntries = (entries: ReturnEntryWithRelations[]) => {
    return entries.filter(
      (entry) =>
        entry.returns_01?.dvat04?.tinNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        entry.returns_01?.dvat04?.tradename
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  };

  const groupedColumns: ColumnsType<ReturnIdGroup> = [
    {
      title: "Return ID",
      dataIndex: "returns_01Id",
      key: "returns_01Id",
      width: 100,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Buyer TIN",
      key: "buyer_tin",
      width: 120,
      render: (_, record) => record.returns_01.dvat04.tinNumber || "-",
    },
    {
      title: "Buyer Name",
      key: "buyer_name",
      width: 200,
      render: (_, record) => record.returns_01.dvat04.tradename || "-",
    },
    {
      title: "Total Amount",
      key: "total_amount",
      width: 200,
      render: (_, record) =>
        formatINR(
          (
            parseFloat(record.totalAmount || "0") +
            parseFloat(record.totalVat || "0")
          ).toString() || "0",
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedReturnGroup(record);
            setIsReturnGroupModalOpen(true);
          }}
        >
          View Items
        </Button>
      ),
    },
  ];

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
      render: (tax) => (tax ? `${tax}%` : "-"),
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

  const renderTabContent = (
    data: GroupedReturnEntry | null,
    isGroupedView: boolean = false,
  ) => {
    if (!data) {
      return (
        <Empty description="No data available" style={{ marginTop: "50px" }} />
      );
    }

    const dvatGroups = groupByDvat(data.entries);
    const filteredEntries = getFilteredEntries(data.entries);
    const returnIdGroups = groupByReturnId(filteredEntries);

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
                <p className="text-xl font-semibold">
                  {isGroupedView
                    ? returnIdGroups.length
                    : filteredEntries.length}
                </p>
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
              placeholder="Search by Buyer TIN or Buyer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
            <Button
              onClick={() => {
                const exportData = filteredEntries.map((entry) => ({
                  "Invoice No": entry.invoice_number,
                  "Invoice Date": new Date(
                    entry.invoice_date,
                  ).toLocaleDateString("en-IN"),
                  "Seller TIN": entry.seller_tin_number.tin_number,
                  "Seller Name": entry.seller_tin_number.name_of_dealer || "-",
                  "DVAT Name": entry.dvat.tradename || "-",
                  Description: entry.description_of_goods || "-",
                  Quantity: entry.quantity || "-",
                  Amount: entry.amount || "0",
                  "VAT Amount": entry.vatamount || "0",
                  "Tax %": entry.tax_percent || "-",
                  Total: entry.total_invoice_number || "0",
                }));

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(
                  workbook,
                  worksheet,
                  "Return Entries",
                );
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
          {isGroupedView ? (
            <Table
              columns={groupedColumns as any}
              dataSource={returnIdGroups}
              rowKey="returns_01Id"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredEntries}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
            />
          )}
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
          View and manage return entries grouped by type (C-Form, F-Form,
          Export)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "cform",
              label: `C-Form (${groupByReturnId(getFilteredEntries(cformData?.entries || [])).length || 0})`,
              children: renderTabContent(cformData, true),
            },
            {
              key: "fform",
              label: `F-Form (${groupByReturnId(getFilteredEntries(fformData?.entries || [])).length || 0})`,
              children: renderTabContent(fformData, true),
            },
            {
              key: "export",
              label: `Export (${groupByReturnId(getFilteredEntries(exportData?.entries || [])).length || 0})`,
              children: renderTabContent(exportData, true),
            },
          ]}
        />
      </div>

      {/* Return Group Modal */}
      {selectedReturnGroup && (
        <Drawer
          title={`Return ID: ${selectedReturnGroup.returns_01Id} - Items Details`}
          placement="right"
          onClose={() => {
            setIsReturnGroupModalOpen(false);
            setSelectedReturnGroup(null);
          }}
          open={isReturnGroupModalOpen}
          width={900}
        >
          <div className="space-y-4">
            {/* Header Info */}
            <div className="p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Return ID</p>
                  <p className="font-semibold">
                    {selectedReturnGroup.returns_01Id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Return Type</p>
                  <p className="font-semibold">
                    {selectedReturnGroup.returns_01?.return_type || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Month/Year</p>
                  <p className="font-semibold">
                    {selectedReturnGroup.returns_01?.month || "-"} /{" "}
                    {selectedReturnGroup.returns_01?.year || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Sr. No.
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Invoice No.
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Seller TIN
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Seller Name
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Quantity
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      VAT Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Tax %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturnGroup.entries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{idx + 1}</td>
                      <td className="border border-gray-300 p-2">
                        {entry.invoice_number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {entry.seller_tin_number.tin_number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {entry.seller_tin_number.name_of_dealer}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {entry.quantity || "-"}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatINR(entry.amount || "0")}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatINR(entry.vatamount || "0")}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {entry.tax_percent ? `${entry.tax_percent}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Total Quantity</p>
                  <p className="font-semibold">
                    {selectedReturnGroup.totalQuantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="font-semibold">
                    {formatINR(selectedReturnGroup.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    {formatINR(selectedReturnGroup.totalVat)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      )}

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
                  <p className="font-semibold">
                    {formatINR(selectedRecord.amount || "0")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">VAT Amount</p>
                  <p className="font-semibold">
                    {formatINR(selectedRecord.vatamount || "0")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tax %</p>
                  <p className="font-semibold">
                    {selectedRecord.tax_percent
                      ? `${selectedRecord.tax_percent}%`
                      : "-"}
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
                  <p className="font-semibold">
                    {selectedRecord.quantity || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-600">Description</p>
              <p className="font-semibold">
                {selectedRecord.description_of_goods || "-"}
              </p>
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
