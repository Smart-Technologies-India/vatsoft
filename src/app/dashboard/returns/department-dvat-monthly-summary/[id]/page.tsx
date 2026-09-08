"use client";

import { Button, Table as AntTable } from "antd";
import type { ColumnType } from "antd/es/table";
import { useEffect, useState } from "react";
import { dvat04 } from "@prisma/client";
import { decryptURLData } from "@/utils/methods";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetDvat04 from "@/action/register/getdvat04";
import GetMonthlySaleAndPurchaseSummary from "@/action/stock/getmonthlysaleandpurchasesummary";
import * as XLSX from "xlsx";

interface MonthlySummary {
  month: number;
  year: number;
  monthName: string;
  salesCount: number;
  purchaseCount: number;
  salesTotalAmount: number;
  salesTotalVat: number;
  purchaseTotalAmount: number;
  purchaseTotalVat: number;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => inrFormatter.format(value);

const DvatMonthlySummary = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const encryptedId = Array.isArray(id) ? id[0] : id;

  const dvatId = parseInt(decryptURLData(encryptedId, router), 10);

  const [isLoading, setLoading] = useState<boolean>(true);
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!dvatId || isNaN(dvatId)) {
        toast.error("Invalid DVAT ID");
        router.back();
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

        // Fetch DVAT04 data
        const dvatResponse = await GetDvat04({ id: dvatId });
        if (dvatResponse.status && dvatResponse.data) {
          setDvatData(dvatResponse.data);
        }

        // Fetch monthly summary data
        const summaryResponse = await GetMonthlySaleAndPurchaseSummary({
          dvatid: dvatId,
        });

        if (summaryResponse.status && summaryResponse.data) {
          setMonthlySummary(summaryResponse.data);
        }
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dvatId]);

  const getTotalSalesAmount = () => {
    return monthlySummary.reduce((sum, m) => sum + m.salesTotalAmount, 0);
  };

  const getTotalSalesVat = () => {
    return monthlySummary.reduce((sum, m) => sum + m.salesTotalVat, 0);
  };

  const getTotalPurchaseAmount = () => {
    return monthlySummary.reduce((sum, m) => sum + m.purchaseTotalAmount, 0);
  };

  const getTotalPurchaseVat = () => {
    return monthlySummary.reduce((sum, m) => sum + m.purchaseTotalVat, 0);
  };

  const exportToExcel = () => {
    try {
      if (monthlySummary.length === 0) {
        toast.error("No data to export");
        return;
      }

      const worksheetData = monthlySummary.map((item) => ({
        Month: `${item.monthName} ${item.year}`,
        "Sales Count": item.salesCount,
        "Sales Amount": item.salesTotalAmount,
        "Sales VAT": item.salesTotalVat,
        "Purchase Count": item.purchaseCount,
        "Purchase Amount": item.purchaseTotalAmount,
        "Purchase VAT": item.purchaseTotalVat,
        "Total Amount": item.salesTotalAmount + item.purchaseTotalAmount,
        "Total VAT": item.salesTotalVat + item.purchaseTotalVat,
      }));

      // Add summary row
      worksheetData.push({
        Month: "TOTAL",
        "Sales Count": monthlySummary.reduce((sum, m) => sum + m.salesCount, 0),
        "Sales Amount": getTotalSalesAmount(),
        "Sales VAT": getTotalSalesVat(),
        "Purchase Count": monthlySummary.reduce(
          (sum, m) => sum + m.purchaseCount,
          0,
        ),
        "Purchase Amount": getTotalPurchaseAmount(),
        "Purchase VAT": getTotalPurchaseVat(),
        "Total Amount": getTotalSalesAmount() + getTotalPurchaseAmount(),
        "Total VAT": getTotalSalesVat() + getTotalPurchaseVat(),
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const columnWidths = [
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Summary");
      XLSX.writeFile(
        workbook,
        `${dvatData?.tradename || "DVAT"}_monthly_summary.xlsx`,
      );
      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Error exporting data");
    }
  };

  const columns: ColumnType<MonthlySummary>[] = [
    {
      title: "Month",
      dataIndex: "monthName",
      key: "month",
      render: (text: string, record) =>
        `${text} ${(record as MonthlySummary).year}`,
    },
    {
      title: "Sales Count",
      dataIndex: "salesCount",
      key: "salesCount",
      align: "right" as const,
    },
    {
      title: "Sales Amount",
      dataIndex: "salesTotalAmount",
      key: "salesTotalAmount",
      align: "right" as const,
      render: (value: number) => formatINR(value),
    },
    {
      title: "Sales VAT",
      dataIndex: "salesTotalVat",
      key: "salesTotalVat",
      align: "right" as const,
      render: (value: number) => formatINR(value),
    },
    {
      title: "Purchase Count",
      dataIndex: "purchaseCount",
      key: "purchaseCount",
      align: "right" as const,
    },
    {
      title: "Purchase Amount",
      dataIndex: "purchaseTotalAmount",
      key: "purchaseTotalAmount",
      align: "right" as const,
      render: (value: number) => formatINR(value),
    },
    {
      title: "Purchase VAT",
      dataIndex: "purchaseTotalVat",
      key: "purchaseTotalVat",
      align: "right" as const,
      render: (value: number) => formatINR(value),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      align: "right" as const,
      render: (_: unknown, record) => {
        const r = record as MonthlySummary;
        return formatINR(r.salesTotalAmount + r.purchaseTotalAmount);
      },
    },
    {
      title: "Total VAT",
      key: "totalVat",
      align: "right" as const,
      render: (_: unknown, record) => {
        const r = record as MonthlySummary;
        return formatINR(r.salesTotalVat + r.purchaseTotalVat);
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <section className="px-5 py-4 min-h-screen bg-gray-50">
      <div className="w-full mx-auto flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Monthly Sales & Purchases Summary
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {dvatData?.tradename} ({dvatData?.tinNumber})
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>Back</Button>
          <Button type="primary" onClick={exportToExcel}>
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Sales Amount</p>
            <p className="text-xl font-semibold text-blue-600">
              {formatINR(getTotalSalesAmount())}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Sales VAT</p>
            <p className="text-xl font-semibold text-blue-600">
              {formatINR(getTotalSalesVat())}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Purchase Amount</p>
            <p className="text-xl font-semibold text-green-600">
              {formatINR(getTotalPurchaseAmount())}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Purchase VAT</p>
            <p className="text-xl font-semibold text-green-600">
              {formatINR(getTotalPurchaseVat())}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <AntTable
          columns={columns}
          dataSource={monthlySummary}
          pagination={false}
          rowKey={(record) => `${record.year}-${record.month}`}
          scroll={{ x: 1200 }}
          size="small"
        />
      </div>
    </section>
  );
};

export default DvatMonthlySummary;
