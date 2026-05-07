"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04 } from "@prisma/client";
import { Button, Input, Pagination } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const CommodityMasterPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [commodityList, setCommodityList] = useState<commodity_master[]>([]);
  const [searchText, setSearchText] = useState("");
  const [userCommodityType, setUserCommodityType] = useState<
    dvat04["commodity"] | null
  >(null);
  const [pagination, setPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });

  const init = async () => {
    setIsLoading(true);

    const [dvatResponse, commodityResponse] = await Promise.all([
      GetUserDvat04Anx({}),
      AllCommodityMaster({}),
    ]);

    if (dvatResponse.status && dvatResponse.data) {
      setUserCommodityType(dvatResponse.data.commodity ?? null);
    } else {
      toast.error(dvatResponse.message);
    }

    if (commodityResponse.status && commodityResponse.data) {
      setCommodityList(
        [...commodityResponse.data].sort((left, right) => left.id - right.id),
      );
    } else {
      toast.error(commodityResponse.message);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const loadPage = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }

      await init();
    };

    loadPage();
  }, [router]);

  const visibleCommodity = useMemo(() => {
    if (userCommodityType === "LIQUOR") {
      return commodityList.filter((item) => item.product_type === "LIQUOR");
    }

    if (userCommodityType === "FUEL") {
      return commodityList.filter((item) => item.product_type === "FUEL");
    }

    return [];
  }, [commodityList, userCommodityType]);

  const filteredCommodity = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return visibleCommodity;
    }

    return visibleCommodity.filter((item) => {
      return (
        item.id.toString().includes(normalizedSearch) ||
        item.product_name.toLowerCase().includes(normalizedSearch) ||
        (item.pack_type ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchText, visibleCommodity]);

  const paginatedCommodity = useMemo(() => {
    return filteredCommodity.slice(
      pagination.skip,
      pagination.skip + pagination.take,
    );
  }, [filteredCommodity, pagination.skip, pagination.take]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      skip: 0,
      total: filteredCommodity.length,
    }));
  }, [filteredCommodity]);

  const isLiquorUser = userCommodityType === "LIQUOR";
  const isFuelUser = userCommodityType === "FUEL";
  const pageTitle = isLiquorUser
    ? "Liquor Commodity Master"
    : isFuelUser
      ? "Fuel Commodity Master"
      : "Commodity Master";

  const exportToExcel = () => {
    if (filteredCommodity.length === 0) {
      toast.error("No commodity master data available to export.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    if (isLiquorUser) {
      const liquorRows = filteredCommodity.map((item) => ({
        ID: item.id,
        "Product Name": item.product_name,
        "Pcs/Crate": item.crate_size,
        "Pack Type": item.pack_type ?? "-",
      }));
      const liquorSheet = XLSX.utils.json_to_sheet(liquorRows);
      XLSX.utils.book_append_sheet(workbook, liquorSheet, "Liquor Commodity");
    }

    if (isFuelUser) {
      const fuelRows = filteredCommodity.map((item) => ({
        ID: item.id,
        Name: item.product_name,
      }));
      const fuelSheet = XLSX.utils.json_to_sheet(fuelRows);
      XLSX.utils.book_append_sheet(workbook, fuelSheet, "Fuel Commodity");
    }

    XLSX.writeFile(
      workbook,
      `commodity_master_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Commodity master exported successfully!");
  };

  const onChangePageCount = (page: number, pageSize: number) => {
    setPagination({
      take: pageSize,
      skip: pageSize * (page - 1),
      total: filteredCommodity.length,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {pageTitle}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Search, browse, and export commodity master data for your DVAT
                commodity type.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by ID, product name, or pack type"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                allowClear
                className="w-full sm:w-80"
              />
              <Button type="primary" onClick={exportToExcel}>
                Export to Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">
              {pageTitle}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-center p-3 font-semibold text-gray-700">
                    ID
                  </TableHead>
                  <TableHead className="text-center p-3 font-semibold text-gray-700">
                    {isFuelUser ? "Name" : "Product Name"}
                  </TableHead>
                  {isLiquorUser && (
                    <>
                      <TableHead className="text-center p-3 font-semibold text-gray-700">
                        Pcs/Crate
                      </TableHead>
                      <TableHead className="text-center p-3 font-semibold text-gray-700">
                        Pack Type
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCommodity.length > 0 ? (
                  paginatedCommodity.map((item) => (
                    <TableRow key={item.id} className="border-b hover:bg-gray-50">
                      <TableCell className="p-3 text-center text-sm">
                        {item.id}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm">
                        {item.product_name}
                      </TableCell>
                      {isLiquorUser && (
                        <>
                          <TableCell className="p-3 text-center text-sm">
                            {item.crate_size}
                          </TableCell>
                          <TableCell className="p-3 text-center text-sm">
                            {item.pack_type ?? "-"}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isLiquorUser ? 4 : 2}
                      className="p-4 text-center text-sm text-gray-500"
                    >
                      No commodity master data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t bg-gray-50">
            <div className="lg:hidden">
              <Pagination
                align="center"
                current={Math.floor(pagination.skip / pagination.take) + 1}
                pageSize={pagination.take}
                onChange={onChangePageCount}
                showSizeChanger
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                total={pagination.total}
                showTotal={(total) => `Total ${total} items`}
              />
            </div>
            <div className="hidden lg:block">
              <Pagination
                align="center"
                current={Math.floor(pagination.skip / pagination.take) + 1}
                pageSize={pagination.take}
                onChange={onChangePageCount}
                showQuickJumper
                showSizeChanger
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                total={pagination.total}
                responsive
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CommodityMasterPage;