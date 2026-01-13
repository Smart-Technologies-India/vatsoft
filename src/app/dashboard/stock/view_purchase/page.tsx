"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AcceptSale from "@/action/stock/acceptsell";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetUserDailyPurchase from "@/action/stock/getuserdailypurchase";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
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
  Alert,
  Button,
  Drawer,
  Modal,
  Pagination,
  Popover,
  Radio,
  RadioChangeEvent,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const DocumentWiseDetails = () => {
  const router = useRouter();
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

  const [userid, setUserid] = useState<number>(0);

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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04({
        userid: authResponse.data,
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

  const [addBox, setAddBox] = useState<boolean>(false);

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

  const sortedDailyPurchase = [...dailyPurchase].sort((a, b) => {
    // Acceptable if TIN starts with 25/26 and not accepted yet
    const aAcceptable =
      (a.seller_tin_number.tin_number.startsWith("25") ||
        a.seller_tin_number.tin_number.startsWith("26")) &&
      !a.is_accept;
    const bAcceptable =
      (b.seller_tin_number.tin_number.startsWith("25") ||
        b.seller_tin_number.tin_number.startsWith("26")) &&
      !b.is_accept;
    // Sort acceptable to top
    if (aAcceptable === bAcceptable) return 0;
    return aAcceptable ? -1 : 1;
  });

  const hasPendingAcceptable = dailyPurchase.some(
    (val) =>
      (val.seller_tin_number.tin_number.startsWith("25") ||
        val.seller_tin_number.tin_number.startsWith("26")) &&
      !val.is_accept
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
        size="large"
      >
        <p className="text-lg text-left">Add Purchase</p>
        <DailyPurchaseMasterProvider
          userid={userid}
          setAddBox={setAddBox}
          init={init}
        />
      </Drawer>
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
          {/* Alert for pending accept */}

          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Daily Purchase</p>
            <div className="grow"></div>
            <div className="flex gap-2 items-center">
              {dvatdata!.commodity != "FUEL" && (
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
              )}
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
          </div>

          <div className="flex gap-2 mt-2 flex-wrap">
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total number of invoice</p>
              <p className="text-lg font-semibold leading-3">
                {new Set(dailyPurchase.map((val) => val.invoice_number)).size}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              {/* <p className="text-sm">Total taxable value</p> */}
              <p className="text-sm">Total invoice value</p>
              <p className="text-lg font-semibold leading-3">
                {dailyPurchase
                  .reduce(
                    (acc, val) =>
                      acc + parseFloat(val.amount_unit) * val.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total tax</p>
              <p className="text-lg font-semibold leading-3">
                {dailyPurchase
                  .reduce((acc, val) => acc + parseFloat(val.vatamount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total taxable value</p>
              <p className="text-lg font-semibold leading-3">
                {dailyPurchase
                  .reduce((acc, val) => acc + parseFloat(val.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
          {hasPendingAcceptable && (
            <Alert
              message="Kindly accept pending purchase invoice."
              type="warning"
              className="mt-2"
              showIcon
            />
          )}

          {dailyPurchase.length > 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center">
                      Invoice no.
                    </TableHead>
                    <TableHead className="border whitespace-nowrap text-center">
                      Invoice Date
                    </TableHead>

                    <TableHead className="border text-center">
                      Trade Name
                    </TableHead>
                    <TableHead className="border text-center">
                      TIN Number
                    </TableHead>
                    <TableHead className="w-64 border text-center">
                      Product Name
                    </TableHead>
                    <TableHead className="w-20 border text-center">
                      {/* Quantity */}
                      {quantityCount == "pcs"
                        ? dvatdata?.commodity == "FUEL"
                          ? "Litres"
                          : "Qty"
                        : "Crate"}
                    </TableHead>

                    <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>
                    <TableHead className="border text-center">
                      Rate of Tax
                    </TableHead>
                    <TableHead className="border text-center">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center">
                      Taxable Value (&#x20b9;)
                    </TableHead>

                    <TableHead className="w-28 border text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDailyPurchase.map(
                    (
                      val: daily_purchase & {
                        commodity_master: commodity_master;
                        seller_tin_number: tin_number_master;
                      },
                      index: number
                    ) => (
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {val.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {formateDate(val.invoice_date)}
                        </TableCell>

                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.tin_number}
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
                          {(parseFloat(val.amount_unit) * val.quantity).toFixed(
                            2
                          )}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.vatamount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.amount}
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
                                className="text-sm bg-white border border-rose-500 text-rose-500 py-1 px-4"
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
                                      router.push(
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
              <Alert
                style={{
                  marginTop: "10px",
                  padding: "8px",
                }}
                type="error"
                showIcon
                description="There is no daily purchase"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentWiseDetails;
