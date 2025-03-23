"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AcceptSale from "@/action/stock/acceptsell";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetUserDailyPurchase from "@/action/stock/getuserdailypurchase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encryptURLData, formateDate } from "@/utils/methods";
import {
  commodity_master,
  daily_purchase,
  dvat04,
  tin_number_master,
} from "@prisma/client";
import {
  Button,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { value } from "valibot";

const DocumentWiseDetails = () => {
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

  const [dailyPurchase, setDailyPurchase] = useState<
    Array<
      daily_purchase & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
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
      const daily_purchase_response = await GetUserDailyPurchase({
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
        setDailyPurchase(daily_purchase_response.data.result);
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
        const daily_purchase_response = await GetUserDailyPurchase({
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
          setDailyPurchase(daily_purchase_response.data.result);
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const daily_purchase_response = await GetUserDailyPurchase({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_purchase_response.status && daily_purchase_response.data.result) {
      setDailyPurchase(daily_purchase_response.data.result);
      setPaginatin({
        skip: daily_purchase_response.data.skip,
        take: daily_purchase_response.data.take,
        total: daily_purchase_response.data.total,
      });
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Convertto30a = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }
    const response = await ConvertDvat30A({
      createdById: userid,
      dvatid: dvatdata.id,
    });

    if (response.status && response.data) {
      toast.success(response.message);
      setIsModalOpen(false);
      await init();
    } else {
      toast.error(response.message);
    }
  };

  const [deletebox, setDeleteBox] = useState<boolean>(false);
  const delete_purchase_entry = async (id: number) => {
    const response = await DeletePurchase({
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
      <Modal
        title="Generate DVAT 30/30 A"
        open={isModalOpen}
        onOk={Convertto30a}
        onCancel={() => {
          setIsModalOpen(false);
        }}
      >
        <p>Are you sure you want to Generate DVAT 30/30 A Return?</p>
      </Modal>

      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Daily Purchase</p>
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
            {/* {dvatdata &&
              (dvatdata.commodity == "OIDC" ||
                dvatdata.commodity == "FUEL") && ( */}
            {dailyPurchase.length > 0 && (
              <Button
                size="small"
                type="primary"
                className="bg-blue-500 hover:bg-blue-500 px-2"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                Generate DVAT 30/30 A
              </Button>
            )}

            {/* )} */}
          </div>

          {dailyPurchase.length > 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center">
                      TIN Number
                    </TableHead>
                    <TableHead className="border text-center">
                      Trade Name
                    </TableHead>

                    <TableHead className="w-64 border text-center">
                      Product Name
                    </TableHead>
                    <TableHead className="w-20 border text-center">
                      {/* Quantity */}
                      {quantityCount == "pcs" ? "Qty" : "Crate"}
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice no.
                    </TableHead>
                    <TableHead className="border whitespace-nowrap text-center">
                      Invoice Date
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>
                    <TableHead className="border text-center">
                      Total taxable percentage
                    </TableHead>
                    <TableHead className="border text-center">
                      VAT Amount
                    </TableHead>
                    <TableHead className="w-28 border text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyPurchase.map(
                    (
                      val: daily_purchase & {
                        commodity_master: commodity_master;
                        seller_tin_number: tin_number_master;
                      },
                      index: number
                    ) => (
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {/* {val.quantity} */}
                          {quantityCount == "pcs"
                            ? val.quantity
                            : showCrates(
                                val.quantity,
                                val.commodity_master.crate_size
                              )}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {formateDate(val.invoice_date)}
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
                          {val.seller_tin_number.tin_number.startsWith("25") ||
                          val.seller_tin_number.tin_number.startsWith("26") ? (
                            val.is_accept ? (
                              <>NA</>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (!dvatdata)
                                    return toast.error("DVAT not found.");
                                  const response = await AcceptSale({
                                    commodityid: val.commodity_master.id,
                                    createdById: userid,
                                    dvatid: dvatdata.id,
                                    quantity: val.quantity,
                                    puchaseid: val.id,
                                    urn: val.urn_number ?? "",
                                  });
                                  if (response.status && response.data) {
                                    toast.success(response.message);
                                    await init();
                                  } else {
                                    toast.error(response.message);
                                  }
                                }}
                                className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4"
                              >
                                Accept
                              </button>
                            )
                          ) : (
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
                          )}

                          <Modal
                            title="Confirmation"
                            open={deletebox}
                            footer={null}
                            closeIcon={false}
                          >
                            <div>
                              <p>
                                Are you sure you want to delete this purchase
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
                                onClick={() => delete_purchase_entry(val.id)}
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

export default DocumentWiseDetails;
