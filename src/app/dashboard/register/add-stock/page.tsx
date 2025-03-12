"use client";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import { CreateFirstStockProvider } from "@/components/forms/createstock/createstockfirst";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, stock } from "@prisma/client";
import { Button, Drawer, Radio, RadioChangeEvent } from "antd";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AddStock = () => {
  const router = useRouter();
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat = await GetUserDvat04FirstStock();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const [stockBox, setStockBox] = useState<boolean>(false);

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

  interface StockData {
    item: commodity_master;
    quantity: number;
  }

  const [stock, setStock] = useState<StockData[]>([]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setStockBox(false);
        }}
        open={stockBox}
      >
        <p className="text-lg text-left">Add Stock</p>
        <CreateFirstStockProvider
          setAddBox={setStockBox}
          setStock={setStock}
          stock={stock}
        />
      </Drawer>

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
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500"
              onClick={() => {
                setStockBox(true);
              }}
            >
              Add Stock
            </Button>
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
                    <TableHead className="whitespace-nowrap border text-center p-2">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((val: StockData, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="p-2 border text-center">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-2 border text-left">
                        {val.item.product_name}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {quantityCount == "pcs"
                          ? val.quantity
                          : showCrates(val.quantity, val.item.crate_size)}
                      </TableCell>
                      <TableCell className="p-2 border text-left">
                        {val.item.description}
                      </TableCell>
                      <TableCell className="p-2 border text-left">
                        <Button
                          size="small"
                          type="primary"
                          danger
                          onClick={() => {
                            setStock(
                              stock.filter(
                                (item) => item.item.id != val.item.id
                              )
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex mt-2">
                <div className="grow"></div>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={async () => {
                    // setStockBox(true);

                    const created_data = await CreateFirstStock({
                      data: stock,
                      dvatid: dvatdata?.id ?? 0,
                      createdById: userid,
                    });
                    if (created_data.status) {
                      setStock([]);
                      toast.success(created_data.message);
                      router.back();
                    } else {
                      toast.error(created_data.message);
                    }
                  }}
                >
                  Submit
                </Button>
              </div>
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

export default AddStock;
