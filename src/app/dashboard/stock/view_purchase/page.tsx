"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import AcceptSale from "@/action/stock/acceptsell";
import ConvertDvat30A from "@/action/stock/convertdvat30a";
import DeletePurchase from "@/action/stock/deletepurchase";
import GetUserDailyPurchase, {
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";
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
    {},
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
    Array<GroupedDailyPurchase>
  >([]);

  const [selectedGroup, setSelectedGroup] =
    useState<GroupedDailyPurchase | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

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

  return (
    <>
      <Modal
        title="Invoice Details"
        open={isGroupModalOpen}
        onCancel={() => {
          setIsGroupModalOpen(false);
          setSelectedGroup(null);
        }}
        footer={null}
        width={1200}
      >
        {selectedGroup && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold">
                    {selectedGroup.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold">
                    {formateDate(selectedGroup.invoice_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Seller</p>
                  <p className="font-semibold">
                    {selectedGroup.seller_tin_number.name_of_dealer}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center text-xs">
                      Sr. No.
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Product Name
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      {quantityCount == "pcs"
                        ? dvatdata?.commodity == "FUEL"
                          ? "Litres"
                          : "Quantity"
                        : "Crate"}
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Invoice Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Tax Rate
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Taxable Value
                    </TableHead>
                    <TableHead className="border text-center text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup.records.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="p-2 border text-center text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="p-2 border text-left text-xs">
                        {record.commodity_master.product_name}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {quantityCount == "pcs"
                          ? record.quantity
                          : showCrates(
                              record.quantity,
                              record.commodity_master.crate_size,
                            )}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹
                        {(
                          parseFloat(record.amount_unit) * record.quantity +
                          parseFloat(record.vatamount)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.tax_percent}%
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{record.vatamount}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        ₹{record.amount}
                      </TableCell>
                      <TableCell className="p-2 border text-center text-xs">
                        {record.seller_tin_number.tin_number.startsWith("25") ||
                        record.seller_tin_number.tin_number.startsWith("26") ? (
                          record.is_accept ? (
                            <span className="text-xs text-gray-400">
                              Accepted
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                if (!dvatdata)
                                  return toast.error("DVAT not found.");
                                const response = await AcceptSale({
                                  commodityid: record.commodity_master.id,
                                  createdById: userid,
                                  dvatid: dvatdata.id,
                                  quantity: record.quantity,
                                  puchaseid: record.id,
                                  urn: record.urn_number ?? "",
                                });
                                if (response.status && response.data) {
                                  toast.success(response.message);
                                  await init();
                                  setIsGroupModalOpen(false);
                                } else {
                                  toast.error(response.message);
                                }
                              }}
                              className="text-xs bg-rose-500 hover:bg-rose-600 text-white py-1 px-3 rounded"
                            >
                              Accept
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              router.push(
                                `/dashboard/stock/edit_purchase/${encryptURLData(
                                  record.id.toString(),
                                )}`,
                              );
                            }}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                          >
                            Edit
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="font-semibold">
                    ₹{selectedGroup.totalTaxableValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total VAT Amount</p>
                  <p className="font-semibold">
                    ₹{selectedGroup.totalVatAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Invoice Value</p>
                  <p className="font-semibold">
                    ₹{selectedGroup.totalInvoiceValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">Add Purchase</h2>
        </div>
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
        okText="Generate"
        cancelText="Cancel"
      >
        <p className="text-sm text-gray-600 py-2">
          Are you sure you want to Generate DVAT 30/30 A Return?
        </p>
      </Modal>

      <main className="p-3 bg-gray-50">
        <div className=" mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Title Section */}
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Daily Purchase Records
                </h1>
              </div>

              <div className="grow"></div>

              {/* Controls Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {dvatdata!.commodity != "FUEL" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <Radio.Group
                      size="small"
                      onChange={onChange}
                      value={quantityCount}
                      optionType="button"
                    >
                      <Radio.Button value="pcs">Pcs</Radio.Button>
                      <Radio.Button value="crate">Crate</Radio.Button>
                    </Radio.Group>
                  </div>
                )}

                {dailyPurchase.length > 0 && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    Generate DVAT 30/30 A
                  </Button>
                )}

                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setAddBox(true);
                  }}
                >
                  Add Purchase
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {dailyPurchase.length}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Invoice Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹
                {dailyPurchase
                  .reduce((acc, val) => acc + val.totalInvoiceValue, 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                ₹
                {dailyPurchase
                  .reduce((acc, val) => acc + val.totalVatAmount, 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                ₹
                {dailyPurchase
                  .reduce((acc, val) => acc + val.totalTaxableValue, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          {dailyPurchase.some((group) => group.hasPendingAcceptable) && (
            <Alert
              message="Kindly accept pending purchase invoices."
              type="warning"
              className="mb-3"
              showIcon
            />
          )}

          {dailyPurchase.length > 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Count
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice No.
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Date
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Trade Name
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        TIN Number
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice Value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        VAT Amount
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Taxable Value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPurchase.map(
                      (group: GroupedDailyPurchase, index: number) => (
                        <TableRow
                          key={index}
                          className="border-b hover:bg-gray-50"
                        >
                          <TableCell className="p-2 text-center text-xs">
                            {group.count > 1 ? (
                              <button
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsGroupModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {group.count} items
                              </button>
                            ) : (
                              <span>{group.count}</span>
                            )}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.invoice_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {formateDate(group.invoice_date)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.name_of_dealer}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            {group.seller_tin_number.tin_number}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{group.totalInvoiceValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{group.totalVatAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-center text-xs">
                            ₹{group.totalTaxableValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            {group.seller_tin_number.tin_number.startsWith(
                              "25",
                            ) ||
                            group.seller_tin_number.tin_number.startsWith(
                              "26",
                            ) ? (
                              group.hasPendingAcceptable ? (
                                <button
                                  onClick={async () => {
                                    if (group.count === 1) {
                                      if (!dvatdata)
                                        return toast.error("DVAT not found.");
                                      const record = group.records[0];
                                      const response = await AcceptSale({
                                        commodityid: record.commodity_master.id,
                                        createdById: userid,
                                        dvatid: dvatdata.id,
                                        quantity: record.quantity,
                                        puchaseid: record.id,
                                        urn: record.urn_number ?? "",
                                      });
                                      if (response.status && response.data) {
                                        toast.success(response.message);
                                        await init();
                                      } else {
                                        toast.error(response.message);
                                      }
                                    } else {
                                      toast.info(
                                        "Please select a specific record from Show More",
                                      );
                                    }
                                  }}
                                  className="text-sm bg-rose-500 hover:bg-rose-600 text-white py-1 px-3 rounded"
                                >
                                  Accept
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  N/A
                                </span>
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
                                      className="text-sm bg-white border hover:border-rose-500 hover:text-rose-600 text-gray-700 py-1 px-3 rounded"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (group.count === 1) {
                                          router.push(
                                            `/dashboard/stock/edit_purchase/${encryptURLData(
                                              group.records[0].id.toString(),
                                            )}`,
                                          );
                                        } else {
                                          toast.info(
                                            "Please select a specific record from Show More",
                                          );
                                        }
                                      }}
                                      className="text-sm bg-white border hover:border-blue-500 hover:text-blue-600 text-gray-700 py-1 px-3 rounded"
                                    >
                                      Update
                                    </button>
                                  </div>
                                }
                                title="Actions"
                                trigger="click"
                                // open={!!openPopovers[index]}
                                // onOpenChange={(newOpen) =>
                                //   handleOpenChange(newOpen, index)
                                // }
                              >
                                <span className="text-sm text-gray-400">
                                  N/A
                                </span>
                                {/* <button
                                  disabled={true}
                                  className="text-sm bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
                                >
                                  N/A
                                </button> */}
                              </Popover>
                            )}

                            <Modal
                              title="Confirm Deletion"
                              open={deletebox}
                              footer={null}
                            >
                              <p className="mb-4">
                                Are you sure you want to delete this purchase
                                entry?
                              </p>
                              <div className="flex gap-2 justify-end">
                                <button
                                  className="py-1 px-4 border rounded text-sm"
                                  onClick={() => {
                                    setDeleteBox(false);
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    delete_purchase_entry(group.records[0].id)
                                  }
                                  className="py-1 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </Modal>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-3 py-2 border-t bg-gray-50">
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
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm border p-3 text-center">
              <p className="text-gray-500 text-sm">
                No purchase records found.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DocumentWiseDetails;
