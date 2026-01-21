"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetAllCommodityMaster from "@/action/commoditymaster/getallcommoditymaster";
import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import UpdateCommodityMaster from "@/action/commoditymaster/updatecommoditymaster";
import { CommodityMasterProvider } from "@/components/forms/commodity/commoditymaster";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, Status } from "@prisma/client";
import { Button, Drawer, Pagination, Popover } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CommodityMaster = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [commodty, setCommodity] = useState<commodity_master[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const init = async () => {
    setLoading(true);
    const commodtiy_resonse = await GetAllCommodityMaster({
      take: 10,
      skip: 0,
    });

    if (commodtiy_resonse.status && commodtiy_resonse.data.result) {
      setCommodity(commodtiy_resonse.data.result);
      setPaginatin({
        skip: commodtiy_resonse.data.skip,
        take: commodtiy_resonse.data.take,
        total: commodtiy_resonse.data.total,
      });
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
      const commodtiy_resonse = await GetAllCommodityMaster({
        take: 10,
        skip: 0,
      });

      if (commodtiy_resonse.status && commodtiy_resonse.data.result) {
        setCommodity(commodtiy_resonse.data.result);
        setPaginatin({
          skip: commodtiy_resonse.data.skip,
          take: commodtiy_resonse.data.take,
          total: commodtiy_resonse.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const [open, setOpen] = useState(false);
  const [comm, setComm] = useState<commodity_master | null>(null);
  const showDrawer = async (id: number) => {
    const data = await GetCommodityMaster({ id: id });

    if (data.status && data.data) {
      setOpen(true);
      setComm(data.data);
    } else {
      toast.error(data.message);
    }
  };
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

  const handleCloseAll = () => {
    setOpenPopovers((prev) =>
      Object.fromEntries(Object.keys(prev).map((key) => [key, false]))
    );
  };
  const commoditystatus = async (id: number, state: Status) => {
    const delete_commodity = await UpdateCommodityMaster({
      id: id,
      updatedById: userid,
      status: state,
    });
    if (delete_commodity.status) {
      toast.success(delete_commodity.message);
      await init();
    } else {
      toast.error(delete_commodity.message);
    }
    handleCloseAll();
  };

  const [addBox, setAddBox] = useState<boolean>(false);
  const [commid, setCommid] = useState<number>();

  const onChangePageCount = async (page: number, pagesize: number) => {
    const commodtiy_resonse = await GetAllCommodityMaster({
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (commodtiy_resonse.status && commodtiy_resonse.data.result) {
      setCommodity(commodtiy_resonse.data.result);
      setPaginatin({
        skip: commodtiy_resonse.data.skip,
        take: commodtiy_resonse.data.take,
        total: commodtiy_resonse.data.total,
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
        <p className="text-lg text-left">
          {commid ? "Update" : "Add"} Commodity
        </p>
        <CommodityMasterProvider
          userid={userid}
          id={commid}
          setAddBox={setAddBox}
          setCommid={setCommid}
          init={init}
        />
      </Drawer>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setOpen(false);
        }}
        open={open}
      >
        <p className="text-lg text-left">Product Info</p>
        <Table className="mt-2">
          <TableBody>
            <TableRow>
              <TableCell className="whitespace-nowrap text-left p-2 border">
                Product Name
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.product_name}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="whitespace-nowrap text-left p-2 border">
                Product Type
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.product_type}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="whitespace-nowrap text-left p-2 border">
                MRP
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.mrp}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="whitespace-nowrap text-left p-2 border">
                Sale Price
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.sale_price}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="whitespace-nowrap text-left p-2 border">
                OIDC Price
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.oidc_price}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="whitespace-nowrap text-left p-2 border">
                OIDC Discount Percent
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.oidc_discount_percent}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="whitespace-nowrap text-left p-2 border">
                Description
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.description}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100">
              <TableCell className="whitespace-nowrap text-left p-2 border">
                Remark
              </TableCell>
              <TableCell className="text-left p-2 border">
                {comm?.remark}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex mt-4">
          <Button
            type="primary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </Drawer>
      <main className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Commodity Master
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your commodity and product listings
                </p>
              </div>
              <Button
                type="primary"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setCommid(undefined);
                  setAddBox(true);
                }}
              >
                + Add Commodity
              </Button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="border-0">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Product Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Product Type
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      MRP
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Sale Price
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Taxable At
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700 w-52">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commodty.map((val: commodity_master, index: number) => (
                    <TableRow key={index} className="hover:bg-gray-50 border-b">
                      <TableCell className="p-3 text-center text-sm">
                        {val.product_name}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm">
                        {val.product_type}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm">
                        {val.mrp}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm">
                        {val.sale_price}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm">
                        {val.taxable_at}%
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="small"
                            type="default"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
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
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>

                          <Popover
                            content={
                              <div className="flex flex-col gap-2">
                                <p className="text-sm">
                                  Are you sure you want to{" "}
                                  {val.status == Status.ACTIVE
                                    ? "deactivate"
                                    : "activate"}{" "}
                                  this commodity?
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
                              val.status == Status.ACTIVE
                                ? "Deactivate Commodity"
                                : "Activate Commodity"
                            }
                            trigger="click"
                            open={!!openPopovers[index]}
                            onOpenChange={(newOpen) =>
                              handleOpenChange(newOpen, index)
                            }
                          >
                            <button
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                val.status == Status.ACTIVE
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {val.status == Status.ACTIVE
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t bg-gray-50 p-4">
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
                  pageSizeOptions={[10, 20, 25, 50, 100]}
                  total={pagination.total}
                  responsive={true}
                  showTotal={(total: number, range: number[]) =>
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
