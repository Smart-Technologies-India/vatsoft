"use client";

import { Alert, Button, Pagination, Table as AntTable, Tag } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { dvat04 } from "@prisma/client";
import { decryptURLData, formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetDvat04 from "@/action/register/getdvat04";
import GetDvatChallan, {
  type DvatChallanWithRelations,
} from "@/action/challan/getdvatchallan";
import * as XLSX from "xlsx";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => inrFormatter.format(value);

const parseAmount = (value: string | null | undefined) =>
  Number.parseFloat(value ?? "0") || 0;

type ChallanGroupKey = "all" | "pending" | "paid";

const DvatChallanHistory = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const encryptedId = Array.isArray(id) ? id[0] : id;

  const dvatId = parseInt(decryptURLData(encryptedId, router), 10);

  const [isLoading, setLoading] = useState<boolean>(true);
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);
  const [challans, setChallans] = useState<DvatChallanWithRelations[]>([]);

  const [pagination, setPagination] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [selectedGroup, setSelectedGroup] = useState<ChallanGroupKey>("all");

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

        // Fetch challans for this DVAT
        const response = await GetDvatChallan({
          dvatid: dvatId,
          skip: pagination.skip,
          take: pagination.take,
        });

        if (response.status && response.data?.result) {
          setChallans((response.data.result as DvatChallanWithRelations[]) || []);
          setPagination((prev) => ({
            ...prev,
            total: response.data.total ?? 0,
          }));
        }
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dvatId, pagination.skip, pagination.take]);

  const filteredChallans = challans.filter((challan) => {
    if (selectedGroup === "all") return true;
    if (selectedGroup === "paid") return challan.paymentstatus === "PAID";
    if (selectedGroup === "pending") return challan.paymentstatus !== "PAID";
    return true;
  });

  const getTotalAmount = () => {
    return filteredChallans.reduce(
      (sum, challan) => sum + parseAmount(challan.total_tax_amount),
      0,
    );
  };

  const exportToExcel = () => {
    try {
      if (filteredChallans.length === 0) {
        toast.error("No data to export");
        return;
      }

      const worksheetData = filteredChallans
        .filter((challan) => parseAmount(challan.total_tax_amount) !== 0)
        .map((challan) => {
          const returnPeriod =
            challan.returns_01 && (challan.returns_01.month || challan.returns_01.quarter)
              ? `${challan.returns_01.month || challan.returns_01.quarter} ${challan.returns_01.year}`
              : "-";

          return {
            "TIN Number": challan.dvat.tinNumber,
            "Trade Name": challan.dvat.tradename ?? "-",
            "Return Period": returnPeriod,
            CPIN: challan.cpin,
            "Transaction Id": challan.track_id,
            "Order Id": challan.order_id,
            "Payment Status": challan.paymentstatus,
            VAT: parseAmount(challan.vat),
            Interest: parseAmount(challan.interest),
            Penalty: parseAmount(challan.penalty),
            "Late Fees": parseAmount(challan.latefees),
            Others: parseAmount(challan.others),
            "Total Amount": challan.total_tax_amount,
            "Transaction Date": challan.transaction_date
              ? formateDate(new Date(challan.transaction_date))
              : "-",
          };
        });

      if (worksheetData.length === 0) {
        toast.error("No data to export after filtering");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const columnWidths = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Challans");
      XLSX.writeFile(
        workbook,
        `${dvatData?.tradename || "DVAT"}_challans.xlsx`,
      );
      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Error exporting data");
    }
  };

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
            Challan History
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
          <div
            onClick={() => setSelectedGroup("all")}
            className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
              selectedGroup === "all"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-xs text-gray-600 mb-1">All Challans</p>
            <p className="text-xl font-semibold text-gray-900">
              {challans.length}
            </p>
          </div>
          <div
            onClick={() => setSelectedGroup("paid")}
            className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
              selectedGroup === "paid"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-xs text-gray-600 mb-1">Paid</p>
            <p className="text-xl font-semibold text-green-600">
              {challans.filter((c) => c.paymentstatus === "PAID").length}
            </p>
          </div>
          <div
            onClick={() => setSelectedGroup("pending")}
            className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
              selectedGroup === "pending"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-xl font-semibold text-orange-600">
              {challans.filter((c) => c.paymentstatus !== "PAID").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Amount</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatINR(getTotalAmount())}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                  CPIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                  Return Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  VAT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  Interest
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  Penalty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  Late Fees
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  Others
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No challans found
                  </td>
                </tr>
              ) : (
                filteredChallans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {challan.cpin}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {challan.returns_01
                        ? `${challan.returns_01.month || challan.returns_01.quarter} ${challan.returns_01.year}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatINR(parseAmount(challan.vat))}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatINR(parseAmount(challan.interest))}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatINR(parseAmount(challan.penalty))}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatINR(parseAmount(challan.latefees))}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatINR(parseAmount(challan.others))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatINR(parseAmount(challan.total_tax_amount))}
                    </td>
                    <td className="px-4 py-3">
                      <Tag
                        color={
                          challan.paymentstatus === "PAID"
                            ? "green"
                            : "orange"
                        }
                      >
                        {challan.paymentstatus}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {challan.transaction_date
                        ? formateDate(new Date(challan.transaction_date))
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredChallans.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredChallans.length} of {pagination.total} records
            </p>
            <Pagination
              current={Math.floor(pagination.skip / pagination.take) + 1}
              pageSize={pagination.take}
              total={pagination.total}
              onChange={(page) => {
                setPagination((prev) => ({
                  ...prev,
                  skip: (page - 1) * prev.take,
                }));
              }}
              showSizeChanger
              pageSizeOptions={[10, 20, 50]}
              onShowSizeChange={(current, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  take: pageSize,
                  skip: 0,
                }));
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default DvatChallanHistory;
