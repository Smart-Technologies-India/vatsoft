"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decryptURLData } from "@/utils/methods";
import { commodity_master, dvat04, stock } from "@prisma/client";
import { Alert, Pagination } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CommodityMaster = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const userid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router)
  );

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [stocks, setStocks] = useState<
    Array<stock & { commodity_master: commodity_master }>
  >([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat = await GetUserDvat04();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);

        const stock_response = await GetAllStock({
          take: 10,
          skip: 0,
          dvatid: dvat.data.id,
        });

        if (stock_response.status && stock_response.data.result) {
          setStocks(stock_response.data.result);
          setPaginatin({
            skip: stock_response.data.skip,
            take: stock_response.data.take,
            total: stock_response.data.total,
          });
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata) return toast.error("Dvat not found.");
    const stock_resonse = await GetAllStock({
      take: pagesize,
      skip: pagesize * (page - 1),
      dvatid: dvatdata.id,
    });

    if (stock_resonse.status && stock_resonse.data.result) {
      setStocks(stock_resonse.data.result);
      setPaginatin({
        skip: stock_resonse.data.skip,
        take: stock_resonse.data.take,
        total: stock_resonse.data.total,
      });
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-white rounded-full"></div>
              <h1 className="text-2xl font-bold text-white">Stock Management</h1>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {stocks.length != 0 ? (
            <>
              {/* Table Section */}
              <div className="p-6">
                <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                      <TableHead className="whitespace-nowrap w-14 border text-center p-3 font-semibold text-gray-900">
                        Sr. No.
                      </TableHead>
                      <TableHead className="whitespace-nowrap w-56 border text-center p-3 font-semibold text-gray-900">
                        Product Name
                      </TableHead>
                      <TableHead className="whitespace-nowrap border text-center p-3 font-semibold text-gray-900">
                        Qty
                      </TableHead>
                      <TableHead className="whitespace-nowrap border text-center p-3 font-semibold text-gray-900">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map(
                      (
                        val: stock & { commodity_master: commodity_master },
                        index: number
                      ) => (
                        <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="p-3 border text-center text-gray-900">
                            {index + 1 + pagination.skip}
                          </TableCell>
                          <TableCell className="p-3 border text-left font-medium text-gray-900">
                            {val.commodity_master.product_name}
                          </TableCell>
                          <TableCell className="p-3 border text-center text-gray-900">
                            {val.quantity}
                          </TableCell>
                          <TableCell className="p-3 border text-left text-gray-700">
                            {val.commodity_master.description}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Section */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="lg:hidden">
                  <Pagination
                    align="center"
                    defaultCurrent={1}
                    onChange={onChangePageCount}
                    showSizeChanger
                    total={pagination.total}
                    showTotal={(total: number) => `Total ${total} items`}
                  />
                </div>
                <div className="hidden lg:block">
                  <Pagination
                    showQuickJumper
                    align="center"
                    defaultCurrent={1}
                    onChange={onChangePageCount}
                    showSizeChanger
                    pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                    total={pagination.total}
                    responsive={true}
                    showTotal={(total: number, range: number[]) =>
                      `${range[0]}-${range[1]} of ${total} items`
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-6">
              <Alert
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                }}
                type="error"
                showIcon
                description="There is no stock."
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
