"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import numberWithIndianFormat from "@/utils/methods";
import { Alert, Radio, RadioChangeEvent } from "antd";
import DistrictWiseCommodityReport from "@/action/report/districtwisecommodityreport";

const DistrictWiseCommodityPage = () => {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - i,
  );

  interface DvatData {
    id: number;
    name: string;
    total_quantity: number;
    total_amount: number;
    count: number;
    office: string;
  }

  const [dvatData, setDvatData] = useState<Array<DvatData>>([]);

  const [city, setCity] = useState<"Dadra_Nagar_Haveli" | "DAMAN" | "DIU">(
    "Dadra_Nagar_Haveli",
  );
  const citys = [
    { label: "DNH", value: "Dadra_Nagar_Haveli" },
    { label: "DD", value: "DAMAN" },
    { label: "DIU", value: "DIU" },
  ];
  const onCityChange = async (e: RadioChangeEvent) => {
    setCity(e.target.value);
    setLoading(true);
    const response = await DistrictWiseCommodityReport({
      office: e.target.value,
      month: selectedMonth,
      year: selectedYear,
    });
    if (response.status == true && response.data) {
      setDvatData(response.data);
      setTotal(response.data.reduce((acc, item) => acc + item.total_amount, 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const response = await DistrictWiseCommodityReport({
        office: city,
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.status == true && response.data) {
        setDvatData(response.data);
        setTotal(
          response.data.reduce((acc, item) => acc + item.total_amount, 0),
        );
      }
      setLoading(false);
    };
    init();
  }, [city, selectedMonth, selectedYear]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-3 py-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            <p className="text-lg font-semibold">Top Selling Commodities</p>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 border-b">
            <label className="text-sm font-medium text-gray-700">
              Filter by:
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="grow"></div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">District:</label>
              <Radio.Group
                options={citys}
                size="small"
                value={city}
                onChange={onCityChange}
                optionType="button"
                buttonStyle="solid"
              />
            </div>
          </div>
          {dvatData.length > 0 ? (
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    District
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    Commodity Name
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    Total Volume
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    Total Sales
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    No. of Transactions
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-2">
                    Market Share(%)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dvatData
                  .sort((a, b) => b.total_amount - a.total_amount)
                  .map((val: DvatData, index: number) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="border text-center p-2">
                          {val.office}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.name}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.total_quantity}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {numberWithIndianFormat(val.total_amount)}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {val.count}
                        </TableCell>
                        <TableCell className="border text-center p-2">
                          {total > 0
                            ? ((val.total_amount / total) * 100).toFixed(2)
                            : "0.00"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-2">
              <Alert message="No data available" type="error" showIcon />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DistrictWiseCommodityPage;
