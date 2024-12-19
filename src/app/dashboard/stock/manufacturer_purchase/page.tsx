"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import DeleteManufacture from "@/action/stock/deletemanufacture";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetManufacturerPurchase from "@/action/stock/getmanufacturerpurchase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encryptURLData } from "@/utils/methods";
import {
  commodity_master,
  dvat04,
  manufacturer_purchase,
} from "@prisma/client";
import { Modal, Pagination, Popover } from "antd";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ManufacturerStockData = () => {
  const route = useRouter();
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {}
  );
  const handleOpenChange = (newOpen: boolean, index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: newOpen,
    }));
  };

  const handelClose = (index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: false,
    }));
  };
  const [isLoading, setLoading] = useState<boolean>(true);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [manufacturerPurchase, setManufacturerPurchase] = useState<
    Array<
      manufacturer_purchase & {
        commodity_master: commodity_master;
      }
    >
  >([]);

  //   const [name, setName] = useState<string>("");

  const userid: number = parseInt(getCookie("id") ?? "0");

  const init = async () => {
    setLoading(true);
    const dvat_response = await GetUserDvat04({
      userid: userid,
    });

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      const daily_purchase_response = await GetManufacturerPurchase({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (
        daily_purchase_response.status &&
        daily_purchase_response.data.result
      ) {
        setPaginatin({
          skip: daily_purchase_response.data.skip,
          take: daily_purchase_response.data.take,
          total: daily_purchase_response.data.total,
        });
        setManufacturerPurchase(daily_purchase_response.data.result);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const dvat_response = await GetUserDvat04({
        userid: userid,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_purchase_response = await GetManufacturerPurchase({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (
          daily_purchase_response.status &&
          daily_purchase_response.data.result
        ) {
          setPaginatin({
            skip: daily_purchase_response.data.skip,
            take: daily_purchase_response.data.take,
            total: daily_purchase_response.data.total,
          });
          setManufacturerPurchase(daily_purchase_response.data.result);
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const daily_purchase_response = await GetManufacturerPurchase({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_purchase_response.status && daily_purchase_response.data.result) {
      setManufacturerPurchase(daily_purchase_response.data.result);
      setPaginatin({
        skip: daily_purchase_response.data.skip,
        take: daily_purchase_response.data.take,
        total: daily_purchase_response.data.total,
      });
    }
  };

  const [deletebox, setDeleteBox] = useState<boolean>(false);
  const delete_manufacture_entry = async (id: number) => {
    const response = await DeleteManufacture({
      id: id,
      deletedById: userid,
    });
    if (response.data && response.status) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }

    await init();
    setDeleteBox(false);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">
              Manufacturer Purchase
            </p>
            <div className="grow"></div>
          </div>

          {manufacturerPurchase.length > 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-64 border text-center">
                      Product Name
                    </TableHead>
                    <TableHead className="w-20 border text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>
                    <TableHead className="border text-center">
                      Total taxable percentage
                    </TableHead>
                    <TableHead className="border text-center">
                      Vat Amount
                    </TableHead>
                    <TableHead className="w-28 border text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manufacturerPurchase.map(
                    (
                      val: manufacturer_purchase & {
                        commodity_master: commodity_master;
                      },
                      index: number
                    ) => (
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {val.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.quantity}
                        </TableCell>

                        <TableCell className="p-2 border text-center">
                          {val.amount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.vatamount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          <Popover
                            content={
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setDeleteBox(true);
                                    handelClose(index);
                                  }}
                                  className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => {
                                    route.push(
                                      `/dashboard/stock/edit_purchase/${encryptURLData(
                                        val.id.toString()
                                      )}`
                                    );
                                  }}
                                  className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4"
                                >
                                  Update
                                </button>
                              </div>
                            }
                            title="Actions"
                            trigger="click"
                            open={!!openPopovers[index]} // Open state for each row
                            onOpenChange={(newOpen) =>
                              handleOpenChange(newOpen, index)
                            }
                          >
                            <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                              Actions
                            </button>
                          </Popover>
                          <Modal
                            title="Confirmation"
                            open={deletebox}
                            footer={null}
                            closeIcon={false}
                          >
                            <div>
                              <p>
                                Are you sure you want to delete this manufacture
                                entry
                              </p>
                            </div>
                            <div className="flex  gap-2 mt-2">
                              <div className="grow"></div>
                              <button
                                className="py-1 rounded-md border px-4 text-sm text-gray-600"
                                onClick={() => {
                                  setDeleteBox(false);
                                }}
                              >
                                Close
                              </button>
                              <button
                                onClick={() => delete_manufacture_entry(val.id)}
                                className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </Modal>
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
            <>
              <p className="bg-rose-500 bg-opacity-10 rounded text-rose-500 mt-2 px-2 py-1 border border-rose-500">
                There is no daily purchase
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ManufacturerStockData;
