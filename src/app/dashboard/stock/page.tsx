"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
import { AddMaterialProvider } from "@/components/forms/addmaterial/addmaterial";
import { CreateStockProvider } from "@/components/forms/createstock/createstock";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, stock } from "@prisma/client";
import { Button, Drawer, Pagination, Radio, RadioChangeEvent } from "antd";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CommodityMaster = () => {
  const router = useRouter();
  const userid: number = parseFloat(getCookie("id") ?? "0");

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
  const init = async () => {
    // setLoading(true);
    const dvat = await GetUserDvat04({
      userid: userid,
    });
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
    // setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat = await GetUserDvat04({
        userid: userid,
      });
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

  const [addBox, setAddBox] = useState<boolean>(false);
  const [stockBox, setStockBox] = useState<boolean>(false);
  const [materialBox, setMaterialBox] = useState<boolean>(false);
  // const [commid, setCommid] = useState<number>();

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
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setMaterialBox(false);
        }}
        open={materialBox}
      >
        <p className="text-lg text-left">Add Raw Material</p>
        <AddMaterialProvider
          userid={userid}
          setAddBox={setMaterialBox}
          init={init}
        />
      </Drawer>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">Add Purchase</p>
        <DailyPurchaseMasterProvider
          userid={userid}
          setAddBox={setAddBox}
          init={init}
        />
      </Drawer>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setStockBox(false);
        }}
        open={stockBox}
      >
        <p className="text-lg text-left">Add Stock</p>
        <CreateStockProvider
          userid={userid}
          setAddBox={setStockBox}
          init={init}
        />
      </Drawer>

      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Stock</p>
            <div className="grow"></div>
            <div className="flex gap-2 items-center">
              {/* <div className="p-1 rounded grow text-center bg-gray-100">
          {commoditymaster.crate_size} Pcs/Crate
        </div> */}
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
            {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
              <>
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
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={() => {
                    setMaterialBox(true);
                  }}
                >
                  Add Raw Material
                </Button>
              </>
            )}
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500"
              onClick={() => {
                // setCommid(undefined);
                setAddBox(true);
              }}
            >
              Add Purchase
            </Button>

            <Button
              size="small"
              type="primary"
              onClick={() => {
                router.push("/dashboard/stock/view_purchase");
              }}
              className="bg-blue-500 text-white hover:bg-blue-500  rounded text-sm px-2"
            >
              View Purchase
            </Button>
            {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  router.push("/dashboard/stock/manufacturer_purchase");
                }}
                className="bg-blue-500 text-white hover:bg-blue-500  rounded text-sm px-2"
              >
                Manufacturer Purchase
              </Button>
            )}
          </div>
          {stocks.length != 0 ? (
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
                  {stocks
                    .filter((val) => val.quantity != 0)
                    .map(
                      (
                        val: stock & { commodity_master: commodity_master },
                        index: number
                      ) => (
                        <TableRow key={index}>
                          <TableCell className="p-2 border text-center">
                            {index + 1 + pagination.skip}
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
              <div className="mt-2"></div>
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

export default CommodityMaster;
