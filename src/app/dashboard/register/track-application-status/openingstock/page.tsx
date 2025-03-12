"use client";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import GetFirstStock from "@/action/firststock/getfirststock";
import { CreateFirstStockProvider } from "@/components/forms/createstock/createstockfirst";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, first_stock, stock } from "@prisma/client";
import { Button, Drawer, Radio, RadioChangeEvent } from "antd";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const OpeningStock = () => {
  const router = useRouter();
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [isLoading, setLoading] = useState<boolean>(true);
  const [stock, setStock] = useState<
    Array<first_stock & { commodity_master: commodity_master }>
  >([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat = await GetUserDvat04FirstStock();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
      }

      const first_stock = await GetFirstStock({});
      if (first_stock.status && first_stock.data) {
        setStock(first_stock.data);
      }

      setLoading(false);
    };
    init();
  }, [userid]);

  const [quantityCount, setQuantityCount] = useState("pcs");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  // 1 crate 2 pcs
  const showCrates = (quantity: number, crate_size: number): string => {
    // return "";

    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Stock</p>
            <div className="grow"></div>
            <div className="flex gap-2 items-center">
              <Radio.Group
                size="small"
                onChange={onChange}
                value={quantityCount}
                optionType="button"
              >
                <Radio.Button className="w-20 text-center" value="pcs">
                  Pcs
                </Radio.Button>
                <Radio.Button className="w-20 text-center" value="crate">
                  Crate
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
          {stock.length != 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="whitespace-nowrap w-14 border text-center p-2">
                      Sr. No.
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-56 border text-center p-2">
                      Product Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap border text-center p-2">
                      {quantityCount == "pcs" ? "Qty" : "Crate"}
                    </TableHead>
                    <TableHead className="whitespace-nowrap border text-center p-2">
                      Description
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map(
                    (
                      val: first_stock & { commodity_master: commodity_master },
                      index: number
                    ) => (
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2 border text-left">
                          {val.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {quantityCount == "pcs"
                            ? val.quantity
                            : showCrates(
                                val.quantity,
                                val.commodity_master.crate_size
                              )}
                        </TableCell>
                        <TableCell className="p-2 border text-left">
                          {val.commodity_master.description}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
              <p className="flex-1">There is no stock.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default OpeningStock;
