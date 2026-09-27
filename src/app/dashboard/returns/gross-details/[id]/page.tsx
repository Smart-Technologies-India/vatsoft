/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { decryptURLData } from "@/utils/methods";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Table, Spin, Tag, Select } from "antd";
import type { SortOrder } from "antd/es/table/interface";
import { returns_01, dvat04 } from "@prisma/client";
import GetAllReturnByDvat from "@/action/return/getallreturnbydvat";
import GetDvat04 from "@/action/register/getdvat04";
import { getCurrentUserId } from "@/lib/auth";

interface ReturnDataType extends returns_01 {
  dvat04: {
    id: number;
    tinNumber: string | null;
    tradename: string | null;
    name: string | null;
    compositionScheme: boolean | null;
    frequencyFilings: string;
  };
  gto_amount?: string;
}

const GtoDetailsPage = () => {
  const { id } = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const dvat04id = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);
  const [returnData, setReturnData] = useState<ReturnDataType[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [summary, setSummary] = useState({
    totalReturns: 0,
    totalVat: 0,
    totalGross: 0,
    paidReturns: 0,
    pendingReturns: 0,
  });

  const quarters = [
    { value: "QUARTER1", label: "Quarter 1 [Apr - Jun]" },
    { value: "QUARTER2", label: "Quarter 2 [Jul - Sep]" },
    { value: "QUARTER3", label: "Quarter 3 [Oct - Dec]" },
    { value: "QUARTER4", label: "Quarter 4 [Jan - Mar]" },
  ];

  const quarterMonths: { [key: string]: string[] } = {
    QUARTER1: ["April", "May", "June"],
    QUARTER2: ["July", "August", "September"],
    QUARTER3: ["October", "November", "December"],
    QUARTER4: ["January", "February", "March"],
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const userid = await getCurrentUserId();
      if (!userid) {
        setIsLoading(false);
        router.back();
        return;
      }

      // Fetch DVAT data
      const dvatResponse = await GetDvat04({
        id: dvat04id,
      });
      if (dvatResponse.status && dvatResponse.data) {
        setDvatData(dvatResponse.data);
      }

      // Fetch all returns for this DVAT
      const returnResponse = await GetAllReturnByDvat({
        dvatid: dvat04id,
      });
      if (returnResponse.status && returnResponse.data) {
        setReturnData(returnResponse.data.returns as ReturnDataType[]);
        setSummary(returnResponse.data.summary);

        // Set default year to the first year in data
        const years = Array.from(
          new Set(returnResponse.data.returns.map((r) => r.year)),
        );
        if (years.length > 0) {
          setSelectedYear(years[0] as string);
        }
      }

      setIsLoading(false);
    };

    init();
  }, [dvat04id]);

  // Calculate filtered summary based on selected year and quarter
  useEffect(() => {
    const filteredData = returnData.filter((ret) => {
      const yearMatch = !selectedYear || ret.year === selectedYear;
      const quarterMatch =
        !selectedQuarter ||
        quarterMonths[selectedQuarter]?.includes(ret.month || "");
      return yearMatch && quarterMatch;
    });

    let totalVat = 0;
    let totalGross = 0;
    let paidReturns = 0;
    let pendingReturns = 0;

    filteredData.forEach((ret) => {
      totalVat += parseFloat(ret.vatamount || "0");
      totalGross += parseFloat(ret.gto_amount || "0");
      if (ret.status === "PAID") {
        paidReturns += 1;
      } else if (ret.status === "DUE" || ret.status === "INACTIVE") {
        pendingReturns += 1;
      }
    });

    setSummary({
      totalReturns: filteredData.length,
      totalVat,
      totalGross,
      paidReturns,
      pendingReturns,
    });
  }, [selectedYear, selectedQuarter, returnData]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }

  // Columns for returns table
  const monthOrder: { [key: string]: number } = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const sortByYearAndMonth = (a: ReturnDataType, b: ReturnDataType) => {
    const yearA = parseInt(a.year || "0");
    const yearB = parseInt(b.year || "0");
    if (yearA !== yearB) {
      return yearA - yearB; // Sort by year ascending
    }
    const monthA = monthOrder[a.month || "January"] || 0;
    const monthB = monthOrder[b.month || "January"] || 0;
    return monthA - monthB; // Sort by month ascending
  };

  const returnColumns = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      width: 120,
      render: (text: string) => <span>{text}</span>,
      sorter: sortByYearAndMonth,
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: 100,
      render: (text: string) => <span>{text}</span>,
      sorter: sortByYearAndMonth,
      defaultSortOrder: "ascend" as SortOrder,
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (text: string) => {
        const colorMap: { [key: string]: string } = {
          PAID: "green",
          DUE: "red",
          LATE: "orange",
          INACTIVE: "default",
        };
        return <Tag color={colorMap[text] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Gross Amount",
      dataIndex: "gto_amount",
      key: "gto_amount",
      width: 130,
      render: (text: string) =>
        `₹ ${parseFloat(text || "0").toLocaleString("en-IN", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}`,
    },
    {
      title: "VAT Amount",
      dataIndex: "vatamount",
      key: "vatamount",
      width: 130,
      render: (text: string) =>
        `₹ ${parseFloat(text || "0").toLocaleString("en-IN", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}`,
    },

    {
      title: "Filing Date",
      dataIndex: "filing_datetime",
      key: "filing_datetime",
      width: 150,
      render: (date: Date) =>
        date ? new Date(date).toLocaleDateString("en-IN") : "N/A",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GTO Details</h1>
            <p className="text-sm text-gray-600 mt-1">
              {dvatData?.tradename} • TIN: {dvatData?.tinNumber}
            </p>
          </div>
          <Button type="primary" size="small" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <p className="text-xs text-gray-600">Total Returns</p>
          <p className="text-xl font-bold text-blue-600">
            {summary.totalReturns}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded border border-green-100">
          <p className="text-xs text-gray-600">Total VAT</p>
          <p className="text-lg font-bold text-green-600">
            ₹
            {summary.totalVat.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-amber-50 p-3 rounded border border-amber-100">
          <p className="text-xs text-gray-600">Total Gross</p>
          <p className="text-lg font-bold text-amber-600">
            ₹
            {summary.totalGross.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded border border-gray-200 flex flex-row gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Year
            </label>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Select Year"
              options={Array.from(new Set(returnData.map((r) => r.year)))
                .sort()
                .reverse()
                .map((year) => ({
                  value: year,
                  label: year,
                }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Quarter
            </label>
            <Select
              className="w-52 block"
              value={selectedQuarter}
              onChange={setSelectedQuarter}
              placeholder="Select Quarter"
              allowClear
              options={quarters}
            />
          </div>
        </div>
      </div>

      {/* Returns Summary Table */}
      <div className="bg-white rounded border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Return History
          </h2>
        </div>
        {returnData.length === 0 ||
        !returnData.some((ret) => {
          const yearMatch = !selectedYear || ret.year === selectedYear;
          const quarterMatch =
            !selectedQuarter ||
            quarterMonths[selectedQuarter]?.includes(ret.month || "");
          return yearMatch && quarterMatch;
        }) ? (
          <div className="p-8 text-center text-gray-500">No returns found</div>
        ) : (
          <Table
            columns={returnColumns as any}
            dataSource={[...returnData]
              .filter((ret) => {
                const yearMatch = !selectedYear || ret.year === selectedYear;
                const quarterMatch =
                  !selectedQuarter ||
                  quarterMonths[selectedQuarter]?.includes(ret.month || "");
                return yearMatch && quarterMatch;
              })
              .sort(sortByYearAndMonth)
              .map((ret, index) => ({
                ...ret,
                key: ret.id || index,
              }))}
            pagination={{
              pageSize: 15,
              pageSizeOptions: ["15", "25", "50"],
              size: "small",
            }}
            scroll={{ x: 1000 }}
            size="small"
            bordered={false}
          />
        )}
      </div>
    </div>
  );
};

export default GtoDetailsPage;
