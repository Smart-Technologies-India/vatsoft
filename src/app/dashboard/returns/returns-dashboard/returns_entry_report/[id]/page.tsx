"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import getReturnsEntriesByMonth from "@/action/return/getreturnsentriesbymonth";
import { reverseGroupReturns } from "@/action/return/reversegroupreturns";
import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import {
  dvat04,
  returns_01,
  returns_entry,
  tin_number_master,
  commodity_master,
  state,
} from "@prisma/client";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { Table, Button, Spin, Input, Space, Modal, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, FilePdfOutlined, FileExcelOutlined, DeleteOutlined } from "@ant-design/icons";
import ServerTime from "@/action/servertime";

type ReturnsEntryWithRelations = returns_entry & {
  seller_tin_number: tin_number_master;
  commodity_master: commodity_master | null;
  state: state | null;
};

type DvAt04Type = dvat04;

interface GroupedReturnsEntry {
  groupKey: string;
  invoice_date: Date;
  invoice_number: string;
  tin_number: string;
  trade_name: string;
  dvat_type: string;
  records: ReturnsEntryWithRelations[];
  totalQuantity: number;
  totalAmount: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
}

const formatIndianNumber = (value: string | number | null | undefined) => {
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat((value ?? "0").toString().replaceAll(",", "")) || 0;

  return numericValue.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const ReturnsEntryReportPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = useParams<{
    id: string | string[];
  }>();

  // Get month and year from query parameters
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const [loading, setLoading] = useState<boolean>(true);
  const [dvat04Data, setDvat04Data] = useState<DvAt04Type | null>(null);
  const [returns01Data, setReturns01Data] = useState<returns_01 | null>(null);
  const [returnsEntries, setReturnsEntries] = useState<
    ReturnsEntryWithRelations[]
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedReturnsEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [searchTerms, setSearchTerms] = useState({
    invoiceNo: "",
    tinNumber: "",
    name: "",
  });

  const encryptedId = Array.isArray(id) ? id[0] : id;

  const dvatId = useMemo(() => {
    const decrypted = decryptURLData(encryptedId, router);
    const parsed = parseInt(decrypted, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [encryptedId, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!dvatId) {
        setLoading(false);
        toast.error("Invalid DVAT ID");
        return;
      }

      try {
        setLoading(true);
        const authResponse = await getAuthenticatedUserId();
        if (!authResponse.status || !authResponse.data) {
          toast.error(authResponse.message);
          router.push("/");
          return;
        }

        // Fetch current month/year if not provided in query params
        const currentDate = new Date(ServerTime().data as Date);
        const fetchMonth =
          monthParam ||
          currentDate.toLocaleString("default", { month: "long" });
        const fetchYear = yearParam || currentDate.getFullYear().toString();

        const response = await getReturnsEntriesByMonth({
          dvatid: dvatId,
          month: fetchMonth,
          year: fetchYear,
        });

        if (!response.status || !response.data) {
          toast.info("No data found for this period");
          setDvat04Data(null);
          setReturns01Data(null);
          setReturnsEntries([]);
          return;
        }

        setDvat04Data(response.data.dvat04);
        setReturns01Data(response.data.returns_01);
        setReturnsEntries(response.data.returns_entry);
      } catch {
        toast.error("Unable to load data");
        setDvat04Data(null);
        setReturns01Data(null);
        setReturnsEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dvatId, monthParam, yearParam]);

  const getTableData = (entries: ReturnsEntryWithRelations[]) => {
    return entries.map((item, index) => ({
      key: item.id,
      serialNo: index + 1,
      invoiceNumber: item.invoice_number || "-",
      invoiceDate: item.invoice_date ? formateDate(item.invoice_date) : "-",
      sellerTin: item.seller_tin_number?.tin_number || "-",
      name: item.seller_tin_number?.name_of_dealer || "-",
      commodity: item.commodity_master?.product_name || "-",
      quantity: item.quantity || "-",
      amount: formatIndianNumber(item.amount),
      vatAmount: formatIndianNumber(item.vatamount),
      description: item.description_of_goods || "-",
      remarks: item.remarks || "-",
    }));
  };

  const groupedReturnsEntries = useMemo(() => {
    const groups: Record<string, GroupedReturnsEntry> = {};

    for (const row of returnsEntries) {
      const groupKey = [
        formateDate(row.invoice_date),
        row.invoice_number,
        row.seller_tin_number.tin_number,
      ].join("|");

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          invoice_date: row.invoice_date,
          invoice_number: row.invoice_number,
          tin_number: row.seller_tin_number.tin_number,
          trade_name: row.seller_tin_number.name_of_dealer || "-",
          dvat_type: row.dvat_type || "DVAT_30",
          records: [],
          totalQuantity: 0,
          totalAmount: 0,
          totalVatAmount: 0,
          totalInvoiceValue: 0,
        };
      }

      groups[groupKey].records.push(row);
      groups[groupKey].totalQuantity += row.quantity || 0;
      groups[groupKey].totalAmount += parseFloat(row.amount || "0") || 0;
      groups[groupKey].totalVatAmount += parseFloat(row.vatamount || "0") || 0;
      groups[groupKey].totalInvoiceValue +=
        (parseFloat(row.amount || "0") || 0) +
        (parseFloat(row.vatamount || "0") || 0);
    }

    return Object.values(groups);
  }, [returnsEntries]);

  const getReturnsEntryColumns = (): ColumnsType<any> => [
    {
      title: "S.No",
      dataIndex: "serialNo",
      key: "serialNo",
      width: 60,
      align: "center",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Invoice Number",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 120,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="p-2">
          <Input
            placeholder="Search Invoice No"
            value={(selectedKeys[0] as string) || ""}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            className="mb-2"
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record.invoiceNumber
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase()),
    },
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 110,
    },
    {
      title: "Seller TIN",
      dataIndex: "sellerTin",
      key: "sellerTin",
      width: 100,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="p-2">
          <Input
            placeholder="Search TIN"
            value={(selectedKeys[0] as string) || ""}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            className="mb-2"
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record.sellerTin
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase()),
    },
    {
      title: "Dealer Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="p-2">
          <Input
            placeholder="Search Dealer Name"
            value={(selectedKeys[0] as string) || ""}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            className="mb-2"
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record.name
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase()),
    },
    {
      title: "Commodity",
      dataIndex: "commodity",
      key: "commodity",
      width: 120,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      align: "right",
    },
    {
      title: "VAT Amount (₹)",
      dataIndex: "vatAmount",
      key: "vatAmount",
      width: 140,
      align: "right",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 150,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
    },
  ];

  const getGroupedColumns = (): ColumnsType<any> => [
    {
      title: "S.No",
      key: "serialNo",
      width: 60,
      align: "center",
      render: (_, __, index) => <span className="font-medium">{index + 1}</span>,
    },
    {
      title: "Invoice Number",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "Invoice Date",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 110,
      render: (date) => formateDate(date),
    },
    {
      title: "Seller TIN",
      dataIndex: "tin_number",
      key: "tin_number",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "Dealer Name",
      dataIndex: "trade_name",
      key: "trade_name",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "Items Count",
      dataIndex: "records",
      key: "itemsCount",
      width: 100,
      align: "center",
      render: (records) => records?.length || 0,
    },
    {
      title: "DVAT Type",
      dataIndex: "dvat_type",
      key: "dvat_type",
      width: 120,
      align: "center",
      render: (value) => (
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded font-semibold text-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Invoice Total (₹)",
      dataIndex: "totalInvoiceValue",
      key: "totalInvoiceValue",
      width: 150,
      align: "right",
      render: (value) => formatIndianNumber(value || 0),
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record: GroupedReturnsEntry) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedGroup(record);
              setIsModalOpen(true);
            }}
          >
            View
          </Button>
          <Popconfirm
            title="Reverse Returns for this Invoice?"
            description={`This will delete all return entries for invoice ${record.invoice_number} and update the corresponding daily records. This action cannot be undone.`}
            onConfirm={() => handleReverseGroup(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="default"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Reverse
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];


  const handleReverseGroup = async (group: GroupedReturnsEntry) => {
    try {
      if (!returns01Data) {
        toast.error("Returns filing data not found");
        return;
      }

      const result = await reverseGroupReturns(
        returns01Data.id,
        group.invoice_number,
        group.dvat_type
      );

      if (result.success) {
        toast.success(result.message);
        // Refresh the page to reload the data
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to reverse returns");
      }
    } catch (error) {
      console.error("Error reversing group returns:", error);
      toast.error("Failed to reverse returns");
    }
  };

  const handleExportToExcel = () => {
    if (returnsEntries.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const data = getTableData(returnsEntries);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Returns-${monthParam}-${yearParam}`,
    );
    XLSX.writeFile(
      workbook,
      `Returns_Entry_${monthParam}_${yearParam}_${new Date().getTime()}.xlsx`,
    );
  };

  const handleExportToPDF = async () => {
    if (returnsEntries.length === 0) {
      toast.warning("No data to export");
      return;
    }

    // For now, export as Excel for PDF-like functionality
    // If you need actual PDF, consider using a library like jsPDF or pdfkit
    handleExportToExcel();
    toast.info("Exported as Excel file. You can open in Excel and print as PDF.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Loading returns entry data..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {dvat04Data && (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Returns Entry Report
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {monthParam} {yearParam}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded p-4">
                <p className="text-gray-600 text-sm">TIN Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {dvat04Data.tinNumber}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-gray-600 text-sm">Trade Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {dvat04Data.tradename}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-gray-600 text-sm">Return Filing Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {returns01Data?.status || "-"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleExportToExcel}
              >
                Export to Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleExportToPDF}
              >
                Export to PDF
              </Button>
              <Button onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </>
        )}

        {returnsEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Grouped by Invoice Number ({groupedReturnsEntries.length} invoice(s))
              </h2>
            </div>
            <Table
              columns={getGroupedColumns()}
              dataSource={groupedReturnsEntries.map((group, idx) => ({
                ...group,
                key: group.groupKey,
              }))}
              pagination={{
                pageSize: 10,
                total: groupedReturnsEntries.length,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
              }}
              scroll={{ x: 1500 }}
              className="border rounded"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No returns entry data available for this period
            </p>
          </div>
        )}

        <Modal
          title={selectedGroup ? `Invoice ${selectedGroup.invoice_number} Details` : "Details"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedGroup(null);
          }}
          width={1200}
          footer={[
            <Button key="close" onClick={() => {
              setIsModalOpen(false);
              setSelectedGroup(null);
            }}>
              Close
            </Button>,
          ]}
        >
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-gray-600 text-sm">Invoice Number</p>
                  <p className="font-semibold text-gray-900">{selectedGroup.invoice_number}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Invoice Date</p>
                  <p className="font-semibold text-gray-900">{formateDate(selectedGroup.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Seller TIN</p>
                  <p className="font-semibold text-gray-900">{selectedGroup.tin_number || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Dealer Name</p>
                  <p className="font-semibold text-gray-900">{selectedGroup.trade_name || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded">
                <div>
                  <p className="text-gray-600 text-sm">DVAT Type</p>
                  <p className="font-bold text-lg text-blue-600 px-3 py-1 bg-blue-100 rounded inline-block">
                    {selectedGroup.dvat_type || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Items</p>
                  <p className="font-bold text-lg text-blue-600">{selectedGroup.records?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Invoice Total</p>
                  <p className="font-bold text-lg text-blue-600">₹{formatIndianNumber(selectedGroup.totalInvoiceValue || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">&nbsp;</p>
                  <p className="text-gray-500 text-sm">&nbsp;</p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Return Items Details</h3>
                <Table
                  columns={getReturnsEntryColumns()}
                  dataSource={getTableData(selectedGroup.records).map((item) => ({
                    ...item,
                    key: item.key,
                  }))}
                  pagination={{
                    pageSize: 5,
                    total: selectedGroup.records?.length || 0,
                    showSizeChanger: true,
                  }}
                  scroll={{ x: 1000 }}
                  size="small"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ReturnsEntryReportPage;
