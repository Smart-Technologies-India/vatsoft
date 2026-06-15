"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateFirstStock from "@/action/firststock/firststockcreat";
import GetDepartmentFirstStockByDvatId from "@/action/firststock/getdepartmentfirststockbydvatid";
import GetCommodityOpeningStockSummary, {
  CommodityOpeningStockSummary,
} from "@/action/firststock/getcommodityopeningstocksummary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, first_stock } from "@prisma/client";
import { Alert, Input, Modal, Radio, Select } from "antd";
import type { RadioChangeEvent } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { decryptURLData } from "@/utils/methods";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const RegistrationStatusFirstStockPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const idString = Array.isArray(id) ? id[0] : id;
  const dvat04Id = parseInt(decryptURLData(idString, router), 10);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quantityCount, setQuantityCount] = useState<string>("pcs");
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);
  const [stock, setStock] = useState<
    Array<first_stock & { commodity_master: commodity_master }>
  >([]);
  const [isAddStockModalOpen, setIsAddStockModalOpen] =
    useState<boolean>(false);
  const [isAddingStock, setIsAddingStock] = useState<boolean>(false);
  const [commodityOptions, setCommodityOptions] = useState<commodity_master[]>(
    [],
  );
  const [selectedCommodityId, setSelectedCommodityId] = useState<
    number | undefined
  >(undefined);
  // const [selectedPackType, setSelectedPackType] = useState<string | undefined>(
  //   undefined,
  // );
  const [noOfPieces, setNoOfPieces] = useState<string>("");
  const [commodityOpeningSummary, setCommodityOpeningSummary] =
    useState<CommodityOpeningStockSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>("");

  const fetchFirstStockData = useCallback(async () => {
    if (!dvat04Id || Number.isNaN(dvat04Id)) {
      toast.error("Invalid dealer id.");
      router.back();
      return;
    }

    setIsLoading(true);
    const response = await GetDepartmentFirstStockByDvatId({ dvat04Id });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsLoading(false);
      return;
    }

    setDvatData(response.data.dvat04);
    setStock(response.data.stock);
    setIsLoading(false);
  }, [dvat04Id, router]);

  useEffect(() => {
    const init = async () => {
      await fetchFirstStockData();
    };

    init();
  }, [fetchFirstStockData]);

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setQuantityCount(value);
  };

  const showCrates = (quantity: number, crateSize: number): string => {
    const crates = Math.floor(quantity / crateSize);
    const pcs = quantity % crateSize;

    if (crates === 0) return `${pcs} Pcs`;
    if (pcs === 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const isFuelDealer = dvatData?.commodity === "FUEL";

  const filteredCommodityOptions = useMemo(() => {
    if (!dvatData) {
      return commodityOptions;
    }

    return isFuelDealer
      ? commodityOptions.filter((item) => item.product_type === "FUEL")
      : commodityOptions.filter((item) => item.product_type !== "FUEL");
  }, [commodityOptions, dvatData, isFuelDealer]);

  const openAddStockModal = useCallback(async () => {
    const commodityResponse = await AllCommodityMaster({});

    if (!commodityResponse.status || !commodityResponse.data) {
      toast.error(commodityResponse.message);
      return;
    }

    setCommodityOptions(commodityResponse.data);
    setSelectedCommodityId(undefined);
    setNoOfPieces("");
    setCommodityOpeningSummary(null);
    setSummaryError("");
    setIsAddStockModalOpen(true);
  }, []);

  const closeAddStockModal = useCallback(() => {
    setIsAddStockModalOpen(false);
    setSelectedCommodityId(undefined);
    setNoOfPieces("");
    setIsAddingStock(false);
    setCommodityOpeningSummary(null);
    setSummaryError("");
    setIsSummaryLoading(false);
  }, []);

  const packTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          filteredCommodityOptions
            .map((item) => item.pack_type)
            .filter((value): value is NonNullable<typeof value> =>
              Boolean(value),
            ),
        ),
      ),
    [filteredCommodityOptions],
  );

  const modalCommodityOptions = useMemo(() => {
    return filteredCommodityOptions;
  }, [filteredCommodityOptions]);

  const selectedCommodity = useMemo(
    () => commodityOptions.find((item) => item.id === selectedCommodityId),
    [commodityOptions, selectedCommodityId],
  );

  const submitAddStock = useCallback(async () => {
    if (!dvatData) {
      toast.error("Dealer data is not available.");
      return;
    }

    const quantityValue = Number(noOfPieces);
    if (!selectedCommodityId) {
      toast.error("Please select a commodity.");
      return;
    }

    if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
      toast.error("Please enter a valid no of pieces.");
      return;
    }

    const authResponse = await getAuthenticatedUserId();
    if (!authResponse.status || !authResponse.data) {
      toast.error(authResponse.message);
      return;
    }

    if (!selectedCommodity) {
      toast.error("Commodity not found.");
      return;
    }

    setIsAddingStock(true);
    const response = await CreateFirstStock({
      data: [
        {
          item: selectedCommodity,
          quantity: quantityValue,
        },
      ],
      dvatid: dvatData.id,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsAddingStock(false);
      return;
    }

    toast.success(response.message);
    closeAddStockModal();
    await fetchFirstStockData();
  }, [
    closeAddStockModal,
    dvatData,
    fetchFirstStockData,
    noOfPieces,
    selectedCommodity,
    selectedCommodityId,
  ]);

  useEffect(() => {
    const fetchCommodityOpeningSummary = async () => {
      if (!isAddStockModalOpen || !dvatData?.id || !selectedCommodityId) {
        setCommodityOpeningSummary(null);
        setSummaryError("");
        return;
      }

      setIsSummaryLoading(true);
      setSummaryError("");

      const response = await GetCommodityOpeningStockSummary({
        dvat04Id: dvatData.id,
        commodityMasterId: selectedCommodityId,
      });

      if (!response.status || !response.data) {
        setCommodityOpeningSummary(null);
        setSummaryError(response.message || "Unable to fetch stock summary.");
        setIsSummaryLoading(false);
        return;
      }

      setCommodityOpeningSummary(response.data);
      setIsSummaryLoading(false);
    };

    fetchCommodityOpeningSummary();
  }, [dvatData?.id, isAddStockModalOpen, selectedCommodityId]);

  const exportAsExcel = useCallback(() => {
    if (stock.length === 0) {
      toast.error("No stock data available to export.");
      return;
    }

    const excelRows = stock.map((item, index) => ({
      "Sr. No.": index + 1,
      "Product Name": item.commodity_master.product_name,
      Qty: item.quantity,
      "Display Quantity":
        quantityCount === "pcs"
          ? String(item.quantity)
          : showCrates(item.quantity, item.commodity_master.crate_size),
      Description: item.commodity_master.description ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "First Stock");

    const safeTradeName = (dvatData?.tradename ?? "dealer")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    XLSX.writeFile(workbook, `first_stock_${safeTradeName}.xlsx`);
  }, [dvatData?.tradename, quantityCount, stock]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                First Stock Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {dvatData?.tradename}{" "}
                {dvatData?.tinNumber ? `(${dvatData.tinNumber})` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={openAddStockModal}
              >
                Add Stock
              </button>
              <button
                type="button"
                className="rounded-md border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                onClick={exportAsExcel}
              >
                Export Excel
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => router.back()}
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {stock.length > 0 ? (
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
                    {quantityCount === "pcs"
                      ? dvatData?.commodity === "FUEL"
                        ? "Litres"
                        : "Qty"
                      : "Crate"}
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center p-2">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="p-2 border text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="p-2 border text-left">
                      {item.commodity_master.product_name}
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {quantityCount === "pcs"
                        ? item.quantity
                        : showCrates(
                            item.quantity,
                            item.commodity_master.crate_size,
                          )}
                    </TableCell>
                    <TableCell className="p-2 border text-left">
                      {item.commodity_master.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert
              style={{
                marginTop: "10px",
                padding: "8px",
              }}
              type="error"
              showIcon
              description="There is no stock."
            />
          )}
        </div>
      </div>

      <Modal
        title="Add Opening Stock"
        open={isAddStockModalOpen}
        onCancel={closeAddStockModal}
        onOk={submitAddStock}
        okText="Add"
        confirmLoading={isAddingStock}
      >
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Commodity</p>
            <Select
              showSearch
              className="w-full"
              placeholder="Select commodity"
              value={selectedCommodityId}
              onChange={(value) => setSelectedCommodityId(value)}
              options={modalCommodityOptions.map((item) => ({
                value: item.id,
                label: item.product_name,
              }))}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            {selectedCommodity ? (
              <div className="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-700 space-y-1">
                <div>
                  <span className="font-medium">PET Type:</span>{" "}
                  {selectedCommodity.pack_type || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  {selectedCommodity.description || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Crate Size:</span>{" "}
                  {selectedCommodity.crate_size
                    ? `${selectedCommodity.crate_size} pcs`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Product Type:</span>{" "}
                  {selectedCommodity.product_type || "N/A"}
                </div>
              </div>
            ) : null}

            {selectedCommodityId ? (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-gray-700 space-y-2">
                <p className="font-medium text-blue-900">Existing Data Check</p>

                {isSummaryLoading ? (
                  <p>Checking records...</p>
                ) : summaryError ? (
                  <p className="text-red-600">{summaryError}</p>
                ) : commodityOpeningSummary ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border rounded p-2">
                        <p className="text-gray-500">First Stock Qty</p>
                        <p className="font-semibold text-gray-900">
                          {commodityOpeningSummary.firstStockQuantity}
                        </p>
                      </div>
                      <div className="bg-white border rounded p-2">
                        <p className="text-gray-500">Stock Qty</p>
                        <p className="font-semibold text-gray-900">
                          {commodityOpeningSummary.stockQuantity}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border rounded p-2">
                        <p className="text-gray-500">In Daily Sale</p>
                        <p className="font-semibold text-gray-900">
                          {commodityOpeningSummary.existsInDailySale
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                      <div className="bg-white border rounded p-2">
                        <p className="text-gray-500">In Daily Purchase</p>
                        <p className="font-semibold text-gray-900">
                          {commodityOpeningSummary.existsInDailyPurchase
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No records found.</p>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">
              No of Pieces
            </p>
            <Input
              value={noOfPieces}
              onChange={(event) =>
                setNoOfPieces(event.target.value.replace(/[^0-9]/g, ""))
              }
              maxLength={10}
              placeholder={isFuelDealer ? "Enter litres" : "Enter no of pieces"}
            />
            {selectedCommodity ? (
              <p className="mt-1 text-xs text-gray-500">
                Crate size for selected commodity:{" "}
                {selectedCommodity.crate_size} pcs
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default RegistrationStatusFirstStockPage;
