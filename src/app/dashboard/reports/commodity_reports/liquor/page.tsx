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
import numberWithIndianFormat, { encryptURLData } from "@/utils/methods";
import LiquorCommodityReport from "@/action/report/liquorcommodityreport";
import { Alert } from "antd";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { user } from "@prisma/client";
import GetUser from "@/action/user/getuser";

const LiquorCommodityPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [user, setUser] = useState<user | null>(null);
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
    vatamount: number;
  }

  const [dvatData, setDvatData] = useState<Array<DvatData>>([]);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      
      const userResponse = await GetUser({ id: authResponse.data });
      if (userResponse.status && userResponse.data) {
        setUser(userResponse.data);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (userid === 0 || !user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Determine filter office based on role
      const filterOffice = ["VATOFFICER", "DY_COMMISSIONER", "JOINT_COMMISSIONER"].includes(user.role)
        ? user.selectOffice ?? undefined
        : undefined;
      
      const response = await LiquorCommodityReport(selectedMonth, selectedYear, filterOffice);
      if (response.status == true && response.data) {
        setDvatData(response.data);
        setTotal(
          response.data.reduce((acc, item) => acc + item.total_amount, 0),
        );
      } else {
        setDvatData([]);
        setTotal(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [userid, user, selectedMonth, selectedYear]);

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
            <p className="text-lg font-semibold">
              Top Selling Liquor Commodities
            </p>
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
                    VAT Amount
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
                          <TableCell className="border text-center p-2">
                            {val.office == "Dadra_Nagar_Haveli"
                              ? "Dadra & Nagar Haveli"
                              : val.office}
                          </TableCell>
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
                          {numberWithIndianFormat(val.vatamount)}
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

export default LiquorCommodityPage;
