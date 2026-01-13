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

const LiquorCommodityPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  interface DvatData {
    id: number;
    name: string;
    total_quantity: number;
    total_amount: number;
    count: number;
    office: string;
  }

  const [dvatData, setDvatData] = useState<Array<DvatData>>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const response = await LiquorCommodityReport();
      if (response.status == true && response.data) {
        setDvatData(response.data);
        setTotal(
          response.data.reduce((acc, item) => acc + item.total_amount, 0)
        );
      }
      setLoading(false);
    };
    init();
  }, [userid]);

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
          <div className="bg-blue-500 p-2 text-white flex">
            <p>Top Selling Liquor Commodities</p>
            <div className="grow"></div>
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

export default LiquorCommodityPage;
