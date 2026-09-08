"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import getDailySaleAndPurchaseByMonth from "@/action/return/getdailysaleandpurchasebymonth";
import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import {
  dvat04,
  daily_sale,
  daily_purchase,
  tin_number_master,
  commodity_master,
} from "@prisma/client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { Tabs, Table, Button, Spin, Input, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

type DailySaleWithRelations = daily_sale & {
  seller_tin_number: tin_number_master;
  commodity_master: commodity_master;
};

type DailyPurchaseWithRelations = daily_purchase & {
  seller_tin_number: tin_number_master;
  commodity_master: commodity_master;
};

type DvAt04Type = dvat04 & {
  createdBy: any;
};

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

const DailyPurchaseSaleReportPage = () => {
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
  const [dailySales, setDailySales] = useState<DailySaleWithRelations[]>([]);
  const [dailyPurchases, setDailyPurchases] = useState<
    DailyPurchaseWithRelations[]
  >([]);

  const [searchTerms, setSearchTerms] = useState({
    sales: { invoiceNo: "", tinNumber: "", name: "" },
    purchases: { invoiceNo: "", tinNumber: "", name: "" },
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
        const currentDate = new Date();
        const fetchMonth =
          monthParam ||
          currentDate.toLocaleString("default", { month: "long" });
        const fetchYear = yearParam || currentDate.getFullYear().toString();

        const response = await getDailySaleAndPurchaseByMonth({
          dvatid: dvatId,
          month: fetchMonth,
          year: fetchYear,
        });

        if (!response.status || !response.data) {
          toast.info("No data found for this period");
          setDvat04Data(null);
          setDailySales([]);
          setDailyPurchases([]);
          return;
        }

        setDvat04Data(response.data.dvat04);
        setDailySales(response.data.daily_sale);
        setDailyPurchases(response.data.daily_purchase);
      } catch {
        toast.error("Unable to load data");
        setDvat04Data(null);
        setDailySales([]);
        setDailyPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dvatId, monthParam, yearParam]);

  const getTableData = (
    entries: DailySaleWithRelations[] | DailyPurchaseWithRelations[],
  ) => {
    return entries.map((item, index) => ({
      key: item.id,
      serialNo: index + 1,
      invoiceNumber: item.invoice_number || "-",
      invoiceDate: item.invoice_date ? formateDate(item.invoice_date) : "-",
      sellerTin: item.seller_tin_number?.tin_number || "-",
      name: item.seller_tin_number?.name_of_dealer || "-",
      commodity: item.commodity_master?.product_name || "-",
      quantity: item.quantity ?? 0,
      taxPercent: item.tax_percent || "0",
      amount: parseFloat(item.amount || "0") || 0,
      vatAmount: parseFloat(item.vatamount || "0") || 0,
      total: (parseFloat(item.amount || "0") || 0) + (parseFloat(item.vatamount || "0") || 0),
    }));
  };

  const getTableColumns = (): ColumnsType<any> => [
    {
      title: "#",
      dataIndex: "serialNo",
      key: "serialNo",
      width: 50,
      align: "center",
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      align: "center",
    },
    {
      title: "Invoice Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      align: "center",
    },
    {
      title: "Seller TIN",
      dataIndex: "sellerTin",
      key: "sellerTin",
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    {
      title: "Commodity",
      dataIndex: "commodity",
      key: "commodity",
      align: "center",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Tax %",
      dataIndex: "taxPercent",
      key: "taxPercent",
      align: "center",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (value) => formatIndianNumber(value),
    },
    {
      title: "VAT Amount",
      dataIndex: "vatAmount",
      key: "vatAmount",
      align: "right",
      render: (value) => formatIndianNumber(value),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (value) => formatIndianNumber(value),
    },
  ];

  const getSummaryData = (
    entries: DailySaleWithRelations[] | DailyPurchaseWithRelations[],
  ) => {
    const taxSummary = entries.reduce(
      (acc, item) => {
        const taxPercent = item.tax_percent || "0";
        const amount = parseFloat(item.amount || "0") || 0;
        const vatAmount = parseFloat(item.vatamount || "0") || 0;

        if (!acc[taxPercent]) {
          acc[taxPercent] = {
            invoiceNumbers: new Set<string>(),
            totalAmount: 0,
            totalVatAmount: 0,
          };
        }

        if (item.invoice_number) {
          acc[taxPercent].invoiceNumbers.add(item.invoice_number);
        }
        acc[taxPercent].totalAmount += amount;
        acc[taxPercent].totalVatAmount += vatAmount;

        return acc;
      },
      {} as Record<
        string,
        {
          invoiceNumbers: Set<string>;
          totalAmount: number;
          totalVatAmount: number;
        }
      >,
    );

    return Object.entries(taxSummary)
      .sort(([taxA], [taxB]) => parseFloat(taxA) - parseFloat(taxB))
      .map(([taxPercent, summary]) => ({
        key: `summary-${taxPercent}`,
        taxPercent: taxPercent,
        invoices: summary.invoiceNumbers.size,
        totalAmount: summary.totalAmount,
        totalVatAmount: summary.totalVatAmount,
        total: summary.totalAmount + summary.totalVatAmount,
      }));
  };

  const downloadExcel = () => {
    if (loading) {
      toast.info("Please wait until data is loaded");
      return;
    }

    if (dailySales.length === 0 && dailyPurchases.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const toRows = (
      sectionTitle: string,
      entries: DailySaleWithRelations[] | DailyPurchaseWithRelations[],
    ) =>
      entries.map((item, index) => ({
        "S.No": index + 1,
        Section: sectionTitle,
        "Invoice No": item.invoice_number || "-",
        "Invoice Date": item.invoice_date ? formateDate(item.invoice_date) : "-",
        "Seller TIN": item.seller_tin_number?.tin_number || "-",
        Name: item.seller_tin_number?.name_of_dealer || "-",
        Commodity: item.commodity_master?.product_name || "-",
        Quantity: item.quantity ?? 0,
        "Tax %": item.tax_percent || "0",
        Amount: Number(parseFloat(item.amount || "0") || 0),
        "VAT Amount": Number(parseFloat(item.vatamount || "0") || 0),
        Total: Number((parseFloat(item.amount || "0") || 0) + (parseFloat(item.vatamount || "0") || 0)),
      }));

    const workbook = XLSX.utils.book_new();

    const salesRows = toRows("Daily Sales", dailySales);
    const purchaseRows = toRows("Daily Purchases", dailyPurchases);

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(salesRows),
      "Sales",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(purchaseRows),
      "Purchases",
    );

    XLSX.writeFile(workbook, "daily_purchase_sale_report.xlsx");
  };

  const RenderTabContent = ({
    entries,
    tabKey,
  }: {
    entries: DailySaleWithRelations[] | DailyPurchaseWithRelations[];
    tabKey: "sales" | "purchases";
  }) => {
    if (entries.length === 0) {
      return <p className="text-sm text-gray-500">No entries found.</p>;
    }

    const tableData = getTableData(entries);
    const summaryData = getSummaryData(entries);

    // Filter table data based on search terms
    const searchTermsForTab = searchTerms[tabKey];
    const filteredData = tableData.filter((item) => {
      const invoiceMatch =
        searchTermsForTab.invoiceNo === "" ||
        (item.invoiceNumber &&
          item.invoiceNumber
            .toLowerCase()
            .includes(searchTermsForTab.invoiceNo.toLowerCase()));
      const tinMatch =
        searchTermsForTab.tinNumber === "" ||
        (item.sellerTin &&
          item.sellerTin
            .toLowerCase()
            .includes(searchTermsForTab.tinNumber.toLowerCase()));
      const nameMatch =
        searchTermsForTab.name === "" ||
        (item.name &&
          item.name.toLowerCase().includes(searchTermsForTab.name.toLowerCase()));

      return invoiceMatch && tinMatch && nameMatch;
    });

    const handleSearchChange = (
      field: "invoiceNo" | "tinNumber" | "name",
      value: string,
    ) => {
      setSearchTerms((prev) => ({
        ...prev,
        [tabKey]: {
          ...prev[tabKey],
          [field]: value,
        },
      }));
    };

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-3">Search Filters</h4>
          <Space wrap>
            <Input
              placeholder="Search by Invoice No"
              prefix={<SearchOutlined />}
              value={searchTermsForTab.invoiceNo}
              onChange={(e) => handleSearchChange("invoiceNo", e.target.value)}
              style={{ width: 200 }}
            />
            <Input
              placeholder="Search by TIN Number"
              prefix={<SearchOutlined />}
              value={searchTermsForTab.tinNumber}
              onChange={(e) => handleSearchChange("tinNumber", e.target.value)}
              style={{ width: 200 }}
            />
            <Input
              placeholder="Search by Name"
              prefix={<SearchOutlined />}
              value={searchTermsForTab.name}
              onChange={(e) => handleSearchChange("name", e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-2">
            Showing {filteredData.length} of {tableData.length} entries
          </p>
          <Table
            columns={getTableColumns()}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            size="small"
            bordered
            scroll={{ x: 1200 }}
          />
        </div>

        {summaryData.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3">Tax Summary</h4>
            <Table
              columns={[
                {
                  title: "Tax Rate",
                  dataIndex: "taxPercent",
                  key: "taxPercent",
                  align: "center",
                },
                {
                  title: "Total Invoices",
                  dataIndex: "invoices",
                  key: "invoices",
                  align: "center",
                },
                {
                  title: "Taxable Amount",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  align: "right",
                  render: (value) => formatIndianNumber(value),
                },
                {
                  title: "VAT Amount",
                  dataIndex: "totalVatAmount",
                  key: "totalVatAmount",
                  align: "right",
                  render: (value) => formatIndianNumber(value),
                },
                {
                  title: "Total",
                  dataIndex: "total",
                  key: "total",
                  align: "right",
                  render: (value) => formatIndianNumber(value),
                },
              ]}
              dataSource={summaryData}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        )}
      </div>
    );
  };

  const tabItems = [
    {
      key: "1",
      label: "Daily Sales",
      children: <RenderTabContent entries={dailySales} tabKey="sales" />,
    },
    {
      key: "2",
      label: "Daily Purchases",
      children: <RenderTabContent entries={dailyPurchases} tabKey="purchases" />,
    },
  ];

  return (
    <section className="px-5 py-4">
      <div className="w-full mx-auto flex items-center gap-3 mb-4 no-print">
        <button
          onClick={() => router.back()}
          className="py-1 px-4 border text-xs rounded bg-white text-gray-700"
        >
          Back
        </button>
        <button
          onClick={() => generatePDF(pathname, "daily_purchase_sale_report.pdf")}
          className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
        >
          Download PDF
        </button>
        <button
          onClick={downloadExcel}
          className="py-1 px-4 border text-white text-xs rounded bg-emerald-700"
        >
          Download Excel
        </button>
      </div>

      <main className="bg-white p-4 w-full mx-auto border border-black">
        <div className="border border-black py-2 mt-4 mx-auto leading-3">
          <p className="text-center font-semibold text-xs leading-4">
            DEPARTMENT OF VALUE ADDED TAX
          </p>
          <p className="text-center font-semibold text-xs leading-4">
            UT Administration of Dadra & Nagar Haveli and Daman & Diu
          </p>
          <p className="text-center font-semibold text-xs leading-4">
            Daily Sales & Purchase Report
          </p>
        </div>
        <div className="mt-4 border border-black py-2 w-full">
          <h1 className="text-center text-sm leading-4">
            Company Name : {dvat04Data?.tradename ?? "-"}
          </h1>
          <p className="text-center text-xs leading-4">
            TIN Number : {dvat04Data?.tinNumber ?? "-"}
          </p>
        </div>

        <table border={1} className="w-full mx-auto mt-4">
          <tbody>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                TIN Number
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                {dvat04Data?.tinNumber ?? "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                Trade Name
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[50%]">
                {dvat04Data?.tradename || "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mx-auto mt-5">
          <h2 className="font-semibold text-sm mb-4">Daily Transaction Data</h2>

          <Spin spinning={loading} tip="Loading...">
            {dailySales.length === 0 && dailyPurchases.length === 0 ? (
              <p className="text-sm text-gray-500">No transaction data found.</p>
            ) : (
              <Tabs items={tabItems} />
            )}
          </Spin>
        </div>
      </main>
    </section>
  );
};

export default DailyPurchaseSaleReportPage;
