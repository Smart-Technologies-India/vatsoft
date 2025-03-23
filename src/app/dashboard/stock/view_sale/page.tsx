"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import DeleteSale from "@/action/stock/deletesale";
import GetUserDailySale from "@/action/stock/getuserdailysale";
import { DailySaleProvider } from "@/components/forms/dailysale/dailysale";
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
  daily_sale,
  dvat04,
  tin_number_master,
} from "@prisma/client";
import {
  Button,
  Drawer,
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

  const [dailySale, setDailySale] = useState<
    Array<
      daily_sale & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      }
    >
  >([]);

  //   const [name, setName] = useState<string>("");

  const userid: number = parseInt(getCookie("id") ?? "0");

  const init = async () => {
    // setLoading(true);

    const dvat_response = await GetUserDvat04({
      userid: userid,
    });

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      const daily_sale_response = await GetUserDailySale({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (daily_sale_response.status && daily_sale_response.data.result) {
        setPaginatin({
          skip: daily_sale_response.data.skip,
          take: daily_sale_response.data.take,
          total: daily_sale_response.data.total,
        });
        setDailySale(daily_sale_response.data.result);
      }
    }
    // setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat_response = await GetUserDvat04({
        userid: userid,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_sale_response = await GetUserDailySale({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setPaginatin({
            skip: daily_sale_response.data.skip,
            take: daily_sale_response.data.take,
            total: daily_sale_response.data.total,
          });
          setDailySale(daily_sale_response.data.result);
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const daily_sale_response = await GetUserDailySale({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_sale_response.status && daily_sale_response.data.result) {
      setDailySale(daily_sale_response.data.result);
      setPaginatin({
        skip: daily_sale_response.data.skip,
        take: daily_sale_response.data.take,
        total: daily_sale_response.data.total,
      });
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Convertto31 = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }
    const response = await ConvertDvat31({
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
  const delete_sale_entry = async (id: number) => {
    const response = await DeleteSale({
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
        title="Generate DVAT 31/31 A Return"
        open={isModalOpen}
        onOk={Convertto31}
        onCancel={() => {
          setIsModalOpen(false);
        }}
      >
        <p>Are you sure you want to generate DVAT 31/31 A Return?</p>
      </Modal>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">Sale Invoice</p>
        <DailySaleProvider userid={userid} setAddBox={setAddBox} init={init} />
      </Drawer>
      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Daily Sale</p>
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
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                setAddBox(true);
              }}
            >
              Add
            </Button>

            {dailySale.length > 0 && (
              <Button
                size="small"
                type="primary"
                className="bg-blue-500 hover:bg-blue-500 px-2"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                Generate DVAT 31/31 A
              </Button>
            )}
          </div>

          {dailySale.length > 0 ? (
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
                  {dailySale.map(
                    (
                      val: daily_sale & {
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
                          {val.is_accept ? (
                            "NA"
                          ) : (
                            <>
                              <Popover
                                content={
                                  <div className="flex flex-col gap-2">
                                    {/* <button
                                      onClick={() => {
                                        setDeleteBox(true);
                                        handelClose(index);
                                      }}
                                      className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4"
                                    >
                                      Delete
                                    </button> */}
                                    <button
                                      onClick={() => {
                                        route.push(
                                          `/dashboard/stock/edit_sale/${encryptURLData(
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
                            </>
                          )}

                          <Modal
                            title="Confirmation"
                            open={deletebox}
                            footer={null}
                            closeIcon={false}
                          >
                            <div>
                              <p>
                                Are you sure you want to delete this Sale entry
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
                                onClick={() => delete_sale_entry(val.id)}
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
                There is no daily sale
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentWiseDetails;
