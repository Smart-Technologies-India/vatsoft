"use client";
import GetUserDvat04FirstStock from "@/action/dvat/getuserdvatfirststock";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import CreateSaveStock from "@/action/save_stock/addsavestock";
import DeleteSaveStock from "@/action/save_stock/deletesavestock";
import GetSaveStock from "@/action/save_stock/getsavestock";
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
import {
  Alert,
  Button,
  Drawer,
  Modal,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
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

      const getdata = await GetSaveStock({});

      if (getdata.status && getdata.data) {
        setStock(
          getdata.data.map((item) => {
            return {
              id: item.id,
              item: item.commodity_master,
              quantity: item.quantity,
            };
          })
        );
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
    id: number | null;
    item: commodity_master;
    quantity: number;
  }

  const [stock, setStock] = useState<StockData[]>([]);

  const [open, setOpen] = useState(false);

  const hide = () => {
    setOpen(false);
  };

  const submit = async () => {
    setOpen(false);

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
  };

  const savedata = async () => {
    const created_data = await CreateSaveStock({
      data: stock,
      dvatid: dvatdata?.id ?? 0,
      createdById: userid,
    });
    if (created_data.status) {
      toast.success(created_data.message);
    } else {
      toast.error(created_data.message);
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
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setStockBox(false);
        }}
        size="large"
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
                  {dvatdata?.commodity == "FUEL" ? "Litre" : "Pcs"}
                </Radio.Button>
                <Radio.Button className="w-20 text-center" value="crate">
                  Crate
                </Radio.Button>
              </Radio.Group>
            </div>
            {dvatdata?.status == "PENDINGPROCESSING" &&
            stock.filter((val) => val.item.id == 748).length <= 0 ? (
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
            ) : null}
          </div>
          {dvatdata?.status == "VERIFICATION" ? (
            <>
              <div className="mt-4"></div>
              <Alert
                message="Kindly submit DVAT registration before adding stock."
                type="error"
                showIcon
              />
            </>
          ) : null}

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
                          onClick={async () => {
                            setStock(
                              stock.filter(
                                (item) => item.item.id != val.item.id
                              )
                            );
                            if (val.id != null) {
                              await DeleteSaveStock({
                                id: val.id,
                              });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex mt-2 gap-2">
                <div className="grow"></div>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={async () => {
                    setOpen(true);
                    // setStockBox(true);
                  }}
                >
                  Submit
                </Button>
                {stock.filter((val) => val.item.id == 748).length <= 0 ? (
                  <Button
                    size="small"
                    type="primary"
                    className="bg-blue-500 hover:bg-blue-500"
                    onClick={savedata}
                  >
                    Save
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
              <p className="flex-1">There is no stock.</p>
            </div>
          )}
        </div>
      </main>

      <Modal title="Confirmation" open={open} footer={null} closeIcon={false}>
        <div>
          <p>
            I, {dvatdata?.tradename}, holding TIN number {dvatdata?.tinNumber},
            hereby acknowledge that the details entered in the VAT registration
            form after logging in on the portal at www.dddnhvat.com and the
            opening stock data submitted as on 1st January 2025 have been filled
            by me. I confirm that the information provided is accurate and known
            to me to the best of my knowledge. I take full responsibility for
            the accuracy and completeness of the data provided.
          </p>
        </div>
        <div className="flex  gap-2 mt-2">
          <div className="grow"></div>
          <button
            className="py-1 rounded-md border px-4 text-sm text-gray-600"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </button>
          <button
            onClick={submit}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          >
            Submit
          </button>
        </div>
      </Modal>
    </>
  );
};

export default AddStock;
