"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
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
import { Button, Drawer, Pagination } from "antd";
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

  // const [open, setOpen] = useState(false);
  // const [comm, setComm] = useState<commodity_master | null>(null);
  // const showDrawer = async (id: number) => {
  //   const data = await GetCommodityMaster({ id: id });

  //   if (data.status && data.data) {
  //     setOpen(true);
  //     setComm(data.data);
  //   } else {
  //     toast.error(data.message);
  //   }
  // };
  // const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
  //   {}
  // );
  // const handleOpenChange = (newOpen: boolean, index: number) => {
  //   setOpenPopovers((prev) => ({
  //     ...prev,
  //     [index]: newOpen,
  //   }));
  // };

  // const handelClose = (index: number) => {
  //   setOpenPopovers((prev) => ({
  //     ...prev,
  //     [index]: false,
  //   }));
  // };

  // const handleCloseAll = () => {
  //   setOpenPopovers((prev) =>
  //     Object.fromEntries(Object.keys(prev).map((key) => [key, false]))
  //   );
  // };
  // const commoditystatus = async (id: number, state: Status) => {
  //   const delete_commodity = await UpdateCommodityMaster({
  //     id: id,
  //     updatedById: userid,
  //     status: state,
  //   });
  //   if (delete_commodity.status) {
  //     toast.success(delete_commodity.message);
  //     await init();
  //   } else {
  //     toast.error(delete_commodity.message);
  //   }
  //   handleCloseAll();
  // };

  const [addBox, setAddBox] = useState<boolean>(false);
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
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">Add Stock</p>
        <DailyPurchaseMasterProvider
          userid={userid}
          // id={commid}
          setAddBox={setAddBox}
          // setCommid={setCommid}
          init={init}
        />
      </Drawer>

      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Stock</p>
            <div className="grow"></div>
            {/* {dvatdata &&
              (dvatdata.commodity == "OIDC" ||
                dvatdata.commodity == "FUEL") && ( */}
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                // setCommid(undefined);
                setAddBox(true);
              }}
            >
              Add
            </Button>
            {/* )} */}

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
                      Qty
                    </TableHead>
                    <TableHead className="whitespace-nowrap border text-center p-2">
                      Description
                    </TableHead>

                    {/* <TableHead className="whitespace-nowrap border text-center p-2">
                  Sale Price
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Taxable At
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2 w-52">
                  Action
                </TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map(
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
                          {val.quantity}
                        </TableCell>
                        <TableCell className="p-2 border text-left">
                          {val.commodity_master.description}
                        </TableCell>

                        {/* <TableCell className="p-2 border text-center">
                    {val.sale_price}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.taxable_at}%
                  </TableCell>
                  <TableCell className="p-2 text-center grid grid-cols-3 gap-2">
                    <Button
                      size="small"
                      type="primary"
                      className="bg-blue-500 hover:bg-blue-500 w-14"
                      onClick={() => {
                        showDrawer(val.id);
                      }}
                    >
                      View
                    </Button>
                    <button
                      onClick={() => {
                        setCommid(val.id);
                        setAddBox(true);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-400 w-14 text-white rounded-sm"
                    >
                      Edit
                    </button>

                    <Popover
                      content={
                        <div className="flex flex-col gap-2">
                          <p>
                            Are you sure you want to{" "}
                            {val.status == Status.ACTIVE
                              ? "Inactive"
                              : "Active"}{" "}
                            this Commodity
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => {
                                commoditystatus(
                                  val.id,
                                  val.status == Status.ACTIVE
                                    ? Status.INACTIVE
                                    : Status.ACTIVE
                                );
                              }}
                            >
                              YES
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                handelClose(index);
                              }}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      }
                      title={
                        val.status == Status.ACTIVE ? "Inactive" : "Active"
                      }
                      trigger="click"
                      open={!!openPopovers[index]} // Open state for each row
                      onOpenChange={(newOpen) =>
                        handleOpenChange(newOpen, index)
                      }
                    >
                      <button
                        className={`${
                          val.status == Status.ACTIVE
                            ? "bg-rose-500 hover:bg-rose-500"
                            : "bg-emerald-500 hover:bg-emerald-500"
                        }  w-14 text-white rounded-sm text-sm`}
                      >
                        {val.status == Status.ACTIVE ? "Inactive" : "Active"}
                      </button>
                    </Popover>
                  </TableCell> */}
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
