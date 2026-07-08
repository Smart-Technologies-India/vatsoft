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
import { Button, Drawer, Pagination, Popover, Input, Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const CommodityMaster = () => {
  const router = useRouter();

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [comm, setComm] = useState<commodity_master | null>(null);
  const [allProductTypes, setAllProductTypes] = useState<string[]>([]);

  // Fetch data with current filters and pagination
  const fetchCommodities = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      setLoading(true);
      try {
        const skip = (page - 1) * pageSize;
        const response = await GetAllCommodityMaster({
          take: pageSize,
          skip,
          searchTerm: searchTerm.trim(),
          productType: selectedProductType,
        });

        if (response.status && response.data?.result) {
          setCommodity(response.data.result);
          setPaginatin({
            skip: response.data.skip || 0,
            take: response.data.take || pageSize,
            total: response.data.total || 0,
          });
        } else {
          toast.error(response.message || "Failed to load commodities");
          setCommodity([]);
          setPaginatin({ take: pageSize, skip: 0, total: 0 });
        }
      } catch (error) {
        toast.error("Error loading commodities");
        setCommodity([]);
        setPaginatin({ take: pageSize, skip: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedProductType],
  );

  // Fetch all product types for the filter dropdown
  const fetchAllProductTypes = useCallback(async () => {
    try {
      const response = await GetAllCommodityMaster({
        take: 1000,
        skip: 0,
      });

      if (response.status && response.data?.result) {
        const types = Array.from(
          new Set(
            response.data.result
              .map((item) => item.product_type as string | null)
              .filter(
                (type): type is string => type !== null && type !== undefined,
              ),
          ),
        ).sort();
        setAllProductTypes(types);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      // setUserid(authResponse.data);
      await fetchAllProductTypes();
      await fetchCommodities(1, 10);
    };

    init();
  }, [router, fetchAllProductTypes, fetchCommodities]);

  // When search or filter changes, reset to page 1
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleProductTypeChange = useCallback((value: string) => {
    setSelectedProductType(value);
  }, []);

  // Trigger fetch when search/filter changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommodities(1, pagination.take);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedProductType, fetchCommodities, pagination.take]);

  const showDrawer = async (id: number) => {
    try {
      const data = await GetCommodityMaster({ id: id });
      if (data.status && data.data) {
        setOpen(true);
        setComm(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error loading commodity details");
    }
  };

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

  const handleCloseAll = () => {
    setOpenPopovers((prev) =>
      Object.fromEntries(Object.keys(prev).map((key) => [key, false])),
    );
  };

  const commoditystatus = async (id: number, state: Status) => {
    try {
      const delete_commodity = await UpdateCommodityMaster({
        id: id,
        status: state,
      });
      if (delete_commodity.status) {
        toast.success(delete_commodity.message);
        await fetchCommodities(
          Math.floor(pagination.skip / pagination.take) + 1,
          pagination.take,
        );
      } else {
        toast.error(delete_commodity.message);
      }
    } catch (error) {
      toast.error("Error updating commodity status");
    }
    handleCloseAll();
  };

  const [addBox, setAddBox] = useState<boolean>(false);
  const [commid, setCommid] = useState<number>();

  const handlePageChange = (page: number, pageSize: number) => {
    fetchCommodities(page, pageSize);
  };

  const currentPage = Math.floor(pagination.skip / pagination.take) + 1;

  if (isLoading && commodty.length === 0)
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
          id={commid}
          setAddBox={setAddBox}
          setCommid={setCommid}
          init={() =>
            fetchCommodities(
              Math.floor(pagination.skip / pagination.take) + 1,
              pagination.take,
            )
          }
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
                Id
              </TableCell>
              <TableCell className="text-left p-2 border">{comm?.id}</TableCell>
            </TableRow>
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
            {/* Search and Filter */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Search by product name, type or description"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="md:col-span-2"
                  allowClear
                />
                <Select
                  value={selectedProductType}
                  onChange={handleProductTypeChange}
                  options={[
                    { value: "all", label: "All Product Types" },
                    ...allProductTypes.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table className="border-0">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Id
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Product Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Pcs/Crate
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      MRP
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Pack Type
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700">
                      Pack Size
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center p-3 font-semibold text-gray-700 w-52">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 text-center">
                        <div className="flex justify-center items-center">
                          <div className="text-gray-500">Loading...</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : commodty.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 text-center">
                        <div className="text-gray-500">
                          No commodities found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    commodty.map((val: commodity_master, index: number) => (
                      <TableRow
                        key={val.id}
                        className="hover:bg-gray-50 border-b"
                      >
                        <TableCell className="p-3 text-center text-sm">
                          {val.id}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm">
                          {val.product_name}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm">
                          {val.crate_size}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm">
                          {val.mrp}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm">
                          {val.pack_type}
                        </TableCell>
                        <TableCell className="p-3 text-center text-sm">
                          {val.pack_size}
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
                                            : Status.ACTIVE,
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t bg-gray-50 p-4">
              <div className="lg:hidden">
                <Pagination
                  align="center"
                  current={currentPage}
                  onChange={handlePageChange}
                  showSizeChanger
                  total={pagination.total}
                  pageSize={pagination.take}
                  showTotal={(total: number) => `Total ${total} items`}
                />
              </div>
              <div className="hidden lg:block">
                <Pagination
                  showQuickJumper
                  align="center"
                  current={currentPage}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSize={pagination.take}
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
