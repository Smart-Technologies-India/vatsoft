"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import getPdfReturn from "@/action/return/getpdfreturn";
import getReturnEntryReportById from "@/action/return/getreturnentryreportbyid";
import { decryptURLData, formateDate, generatePDF } from "@/utils/methods";
import {
  dvat04,
  DvatType,
  Quarter,
  returns_01,
  returns_entry,
  state,
  tin_number_master,
} from "@prisma/client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { Tabs, Table, Button, Spin, Input, Space } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

type ReturnEntryWithRelations = returns_entry & {
  seller_tin_number: tin_number_master;
  state: state | null;
};

type Return01WithDvat = returns_01 & {
  dvat04: dvat04;
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

const PurchaseSaleReportByIdPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string | string[] }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [return01, setReturn01] = useState<Return01WithDvat | null>(null);
  const [entries, setEntries] = useState<ReturnEntryWithRelations[]>([]);
  const [searchTerms, setSearchTerms] = useState({
    dvat31: { invoiceNo: "", tinNumber: "", name: "" },
    dvat31A: { invoiceNo: "", tinNumber: "", name: "" },
    dvat30: { invoiceNo: "", tinNumber: "", name: "" },
    dvat30A: { invoiceNo: "", tinNumber: "", name: "" },
  });

  const encryptedId = Array.isArray(id) ? id[0] : id;

  const returnId = useMemo(() => {
    const decrypted = decryptURLData(encryptedId, router);
    const parsed = parseInt(decrypted, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [encryptedId, router]);

  const nonNilEntries = useMemo(
    () => entries.filter((item) => !item.isnil),
    [entries],
  );

  const dvat31Entries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_31),
    [nonNilEntries],
  );
  const dvat31AEntries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_31_A),
    [nonNilEntries],
  );
  const dvat30Entries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_30),
    [nonNilEntries],
  );
  const dvat30AEntries = useMemo(
    () => nonNilEntries.filter((item) => item.dvat_type === DvatType.DVAT_30_A),
    [nonNilEntries],
  );

  const getQuarterForMonth = (month: string): Quarter | undefined => {
    const monthToQuarterMap: { [key: string]: Quarter } = {
      January: Quarter.QUARTER4,
      February: Quarter.QUARTER4,
      March: Quarter.QUARTER4,
      April: Quarter.QUARTER1,
      May: Quarter.QUARTER1,
      June: Quarter.QUARTER1,
      July: Quarter.QUARTER2,
      August: Quarter.QUARTER2,
      September: Quarter.QUARTER2,
      October: Quarter.QUARTER3,
      November: Quarter.QUARTER3,
      December: Quarter.QUARTER3,
    };

    return monthToQuarterMap[month] || undefined;
  };

  const getQuarterMonths = (selectedQuarter: Quarter): string[] => {
    const quarterMonthsMap: Record<Quarter, string[]> = {
      QUARTER1: ["April", "May", "June"],
      QUARTER2: ["July", "August", "September"],
      QUARTER3: ["October", "November", "December"],
      QUARTER4: ["January", "February", "March"],
    };

    return quarterMonthsMap[selectedQuarter] ?? [];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!returnId) {
        setLoading(false);
        toast.error("Invalid return id");
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
        const authenticatedUserId = authResponse.data;

        const response = await getReturnEntryReportById({
          id: returnId,
        });

        if (!response.status || !response.data) {
          toast.error(response.message || "Unable to load return data");
          setReturn01(null);
          setEntries([]);
          return;
        }

        setReturn01(response.data.returns_01);

        const currentEntries = (response.data.returns_entry ??
          []) as ReturnEntryWithRelations[];
        const filingFrequency =
          response.data.returns_01.dvat04?.frequencyFilings;
        const baseMonth = response.data.returns_01.month;
        const baseYear = response.data.returns_01.year;

        if (filingFrequency === "QUARTERLY" && baseMonth && baseYear) {
          const effectiveQuarter = getQuarterForMonth(baseMonth);
          const quarterMonths = effectiveQuarter
            ? getQuarterMonths(effectiveQuarter).filter(
                (month) => month !== baseMonth,
              )
            : [];

          const quarterResponses = await Promise.all(
            quarterMonths.map((month) =>
              getPdfReturn({
                year: baseYear,
                month,
              }),
            ),
          );

          const mergedEntries = [...currentEntries];

          quarterResponses.forEach((quarterResponse: any) => {
            if (quarterResponse.status && quarterResponse.data) {
              mergedEntries.push(
                ...(quarterResponse.data
                  .returns_entry as ReturnEntryWithRelations[]),
              );
            }
          });

          const uniqueEntries = Array.from(
            new Map(mergedEntries.map((entry) => [entry.id, entry])).values(),
          );

          setEntries(uniqueEntries);
        } else {
          setEntries(currentEntries);
        }
      } catch {
        toast.error("Unable to load return data");
        setReturn01(null);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [returnId]);

  const getTaxPeriod = (): string => {
    if (!return01) return "";
    const year: string = return01.year;
    if (return01?.dvat04.frequencyFilings == "QUARTERLY") {
      switch (return01.month) {
        case "June":
          return `April (${year}) - June (${year})`;
        case "September":
          return `July (${year}) - September (${year})`;
        case "December":
          return `October (${year}) - December (${year})`;
        case "March":
          return `January (${year}) - March (${year})`;
        default:
          return `April (${year}) - June (${year})`;
      }
    } else {
      return `${return01.month} ${year}`;
    }
  };

  const getTableData = (sectionEntries: ReturnEntryWithRelations[]) => {
    return sectionEntries.map((item, index) => ({
      key: item.id,
      serialNo: index + 1,
      invoiceNumber: item.invoice_number || "-",
      invoiceDate: item.invoice_date ? formateDate(item.invoice_date) : "-",
      sellerTin: item.seller_tin_number?.tin_number || "-",
      name: item.seller_tin_number?.name_of_dealer || "-",
      quantity: item.quantity ?? 0,
      taxPercent: item.tax_percent || "0",
      amount: parseFloat(item.amount || "0") || 0,
      vatAmount: parseFloat(item.vatamount || "0") || 0,
      total: parseFloat(item.total_invoice_number || "0") || 0,
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

  const getSummaryData = (sectionEntries: ReturnEntryWithRelations[]) => {
    const taxSummary = sectionEntries.reduce(
      (acc, item) => {
        const taxPercent = item.tax_percent || "0";
        const amount = parseFloat(item.amount || "0") || 0;
        const vatAmount = parseFloat(item.vatamount || "0") || 0;
        const totalValue = parseFloat(item.total_invoice_number || "0") || 0;

        if (!acc[taxPercent]) {
          acc[taxPercent] = {
            invoiceNumbers: new Set<string>(),
            totalInvoiceValue: 0,
            totalAmount: 0,
            totalVatAmount: 0,
          };
        }

        if (item.invoice_number) {
          acc[taxPercent].invoiceNumbers.add(item.invoice_number);
        }
        acc[taxPercent].totalInvoiceValue += totalValue;
        acc[taxPercent].totalAmount += amount;
        acc[taxPercent].totalVatAmount += vatAmount;

        return acc;
      },
      {} as Record<
        string,
        {
          invoiceNumbers: Set<string>;
          totalInvoiceValue: number;
          totalAmount: number;
          totalVatAmount: number;
        }
      >,
    );

    return Object.entries(taxSummary)
      .sort(([taxA], [taxB]) => parseFloat(taxA) - parseFloat(taxB))
      .map(([taxPercent, summary]) => ({
        key: `summary-${taxPercent}`,
        description: `Total (Tax % ${taxPercent})`,
        invoices: summary.invoiceNumbers.size,
        taxPercent: taxPercent,
        totalAmount: summary.totalAmount,
        totalVatAmount: summary.totalVatAmount,
        total: summary.totalInvoiceValue,
      }));
  };

  const downloadExcel = () => {
    if (loading) {
      toast.info("Please wait until data is loaded");
      return;
    }

    if (nonNilEntries.length === 0) {
      toast.info("No data available to export");
      return;
    }

    const toRows = (
      sectionTitle: string,
      sectionEntries: ReturnEntryWithRelations[],
    ) =>
      sectionEntries.map((item, index) => ({
        "S.No": index + 1,
        Section: sectionTitle,
        "Invoice No": item.invoice_number || "-",
        "Invoice Date": item.invoice_date
          ? formateDate(item.invoice_date)
          : "-",
        "Seller TIN": item.seller_tin_number?.tin_number || "-",
        Name: item.seller_tin_number?.name_of_dealer || "-",
        Quantity: item.quantity ?? 0,
        "Tax %": item.tax_percent || "0",
        Amount: Number(parseFloat(item.amount || "0") || 0),
        "VAT Amount": Number(parseFloat(item.vatamount || "0") || 0),
        Total: Number(parseFloat(item.total_invoice_number || "0") || 0),
      }));

    const workbook = XLSX.utils.book_new();

    const localSalesRows = toRows("DVAT_31 - Sales Local", dvat31Entries);
    const interSalesRows = toRows(
      "DVAT_31_A - Sales Inter State",
      dvat31AEntries,
    );
    const localPurchaseRows = toRows("DVAT_30 - Purchase Local", dvat30Entries);
    const interPurchaseRows = toRows(
      "DVAT_30_A - Purchase Inter State",
      dvat30AEntries,
    );

    const summaryRows = [
      {
        Section: "DVAT_31 - Sales Local",
        Entries: dvat31Entries.length,
        "Taxable Amount": dvat31Entries.reduce(
          (sum, item) => sum + (parseFloat(item.amount || "0") || 0),
          0,
        ),
        "VAT Amount": dvat31Entries.reduce(
          (sum, item) => sum + (parseFloat(item.vatamount || "0") || 0),
          0,
        ),
        "Invoice Total": dvat31Entries.reduce(
          (sum, item) =>
            sum + (parseFloat(item.total_invoice_number || "0") || 0),
          0,
        ),
      },
      {
        Section: "DVAT_31_A - Sales Inter State",
        Entries: dvat31AEntries.length,
        "Taxable Amount": dvat31AEntries.reduce(
          (sum, item) => sum + (parseFloat(item.amount || "0") || 0),
          0,
        ),
        "VAT Amount": dvat31AEntries.reduce(
          (sum, item) => sum + (parseFloat(item.vatamount || "0") || 0),
          0,
        ),
        "Invoice Total": dvat31AEntries.reduce(
          (sum, item) =>
            sum + (parseFloat(item.total_invoice_number || "0") || 0),
          0,
        ),
      },
      {
        Section: "DVAT_30 - Purchase Local",
        Entries: dvat30Entries.length,
        "Taxable Amount": dvat30Entries.reduce(
          (sum, item) => sum + (parseFloat(item.amount || "0") || 0),
          0,
        ),
        "VAT Amount": dvat30Entries.reduce(
          (sum, item) => sum + (parseFloat(item.vatamount || "0") || 0),
          0,
        ),
        "Invoice Total": dvat30Entries.reduce(
          (sum, item) =>
            sum + (parseFloat(item.total_invoice_number || "0") || 0),
          0,
        ),
      },
      {
        Section: "DVAT_30_A - Purchase Inter State",
        Entries: dvat30AEntries.length,
        "Taxable Amount": dvat30AEntries.reduce(
          (sum, item) => sum + (parseFloat(item.amount || "0") || 0),
          0,
        ),
        "VAT Amount": dvat30AEntries.reduce(
          (sum, item) => sum + (parseFloat(item.vatamount || "0") || 0),
          0,
        ),
        "Invoice Total": dvat30AEntries.reduce(
          (sum, item) =>
            sum + (parseFloat(item.total_invoice_number || "0") || 0),
          0,
        ),
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(localSalesRows),
      "DVAT_31",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(interSalesRows),
      "DVAT_31_A",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(localPurchaseRows),
      "DVAT_30",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(interPurchaseRows),
      "DVAT_30_A",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      "Summary",
    );

    XLSX.writeFile(workbook, "purchase_sale_report.xlsx");
  };

  const RenderTabContent = ({
    entries,
    tabKey,
  }: {
    entries: ReturnEntryWithRelations[];
    tabKey: "dvat31" | "dvat31A" | "dvat30" | "dvat30A";
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
          item.name
            .toLowerCase()
            .includes(searchTermsForTab.name.toLowerCase()));

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
          <Space wrap>
            <h4 className="font-semibold text-sm mb-3">Search Filters</h4>
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
      label: "DVAT_31 - Sales Local",
      children: <RenderTabContent entries={dvat31Entries} tabKey="dvat31" />,
    },
    {
      key: "2",
      label: "DVAT_31_A - Sales Inter State",
      children: <RenderTabContent entries={dvat31AEntries} tabKey="dvat31A" />,
    },
    {
      key: "3",
      label: "DVAT_30 - Purchase Local",
      children: <RenderTabContent entries={dvat30Entries} tabKey="dvat30" />,
    },
    {
      key: "4",
      label: "DVAT_30_A - Purchase Inter State",
      children: <RenderTabContent entries={dvat30AEntries} tabKey="dvat30A" />,
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
          onClick={() => generatePDF(pathname, "purchase_sale_report.pdf")}
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
        <h1 className="text-center text-sm leading-4">
          Company Name : {return01?.dvat04?.tradename ?? "-"} : TIN Number :{" "}
          {return01?.dvat04?.tinNumber ?? "-"} Period ({getTaxPeriod()})
        </h1>

        <table border={1} className="w-full mx-auto mt-4">
          <tbody>
            <tr>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[33%]">
                Return Id: {return01?.id ?? "-"}
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[33%]">
                RR No: {return01?.rr_number || "-"}
              </td>
              <td className="border border-black px-2 leading-4 text-[0.7rem] w-[33%]">
                Return Type: {return01?.return_type ?? "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mx-auto mt-5">
          {/* <h2 className="font-semibold text-sm mb-4">Returns Entry Data</h2> */}

          <Spin spinning={loading} tip="Loading...">
            {nonNilEntries.length === 0 ? (
              <p className="text-sm text-gray-500">
                No entry data found for this return id.
              </p>
            ) : (
              <Tabs items={tabItems} />
            )}
          </Spin>
        </div>
      </main>
    </section>
  );
};

export default PurchaseSaleReportByIdPage;
