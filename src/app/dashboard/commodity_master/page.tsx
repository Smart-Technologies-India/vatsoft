"use client";
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
import { Button, Drawer, Popover } from "antd";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CommodityMaster = () => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const [commodty, setCommodity] = useState<commodity_master[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const init = async () => {
    setLoading(true);
    const commodtiy_resonse = await GetAllCommodityMaster({});

    if (commodtiy_resonse.status && commodtiy_resonse.data) {
      setCommodity(commodtiy_resonse.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const commodtiy_resonse = await GetAllCommodityMaster({});

      if (commodtiy_resonse.status && commodtiy_resonse.data) {
        setCommodity(commodtiy_resonse.data);
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
      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold">Commodity</p>
            <div className="grow"></div>
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                setCommid(undefined);
                setAddBox(true);
              }}
            >
              Add
            </Button>
          </div>
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Product Name
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Product Type
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  MRP
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Sale Price
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Taxable At
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2 w-52">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commodty.map((val: commodity_master, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    {val.product_name}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.product_type}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.mrp}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
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
                      <button className={`${val.status == Status.ACTIVE?"bg-rose-500 hover:bg-rose-500":"bg-emerald-500 hover:bg-emerald-500"}  w-14 text-white rounded-sm text-sm`}>
                        {val.status == Status.ACTIVE ? "Inactive" : "Active"}
                      </button>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
