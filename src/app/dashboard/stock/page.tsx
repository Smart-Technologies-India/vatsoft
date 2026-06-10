"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
import { AddMaterialProvider } from "@/components/forms/addmaterial/addmaterial";
import { CreateStockProvider } from "@/components/forms/createstock/createstock";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  commodity_master,
  dvat04,
  stock,
  tin_number_master,
} from "@prisma/client";
import {
  Alert,
  Button,
  Drawer,
  Modal,
  Pagination,
  Radio,
  RadioChangeEvent,
} from "antd";
import { useRouter } from "next/navigation";
import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { formateDate } from "@/utils/methods";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import CreateMultiDailyPurchase from "@/action/stock/createmultidailypurchase";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

type StockRow = stock & { commodity_master: commodity_master };

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

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master>
  >([]);

  const [tindata, setTindata] = useState<Array<tin_number_master>>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "available" | "all" | "zero"
  >("available");

  const loadAllStocks = async (dvatId: number) => {
    const initialStockResponse = await GetAllStock({
      take: 1,
      skip: 0,
      dvatid: dvatId,
    });

    if (!initialStockResponse.status || !initialStockResponse.data) {
      setStocks([]);
      setPaginatin({
        skip: 0,
        take: 10,
        total: 0,
      });
      return;
    }

    const totalStocks = initialStockResponse.data.total ?? 0;

    if (totalStocks <= 1) {
      setStocks(initialStockResponse.data.result ?? []);
      setPaginatin({
        skip: 0,
        take: 10,
        total: totalStocks,
      });
      return;
    }

    const fullStockResponse = await GetAllStock({
      take: totalStocks,
      skip: 0,
      dvatid: dvatId,
    });

    if (fullStockResponse.status && fullStockResponse.data) {
      setStocks(fullStockResponse.data.result ?? []);
      setPaginatin({
        skip: 0,
        take: 10,
        total: fullStockResponse.data.total,
      });
      return;
    }

    setStocks(initialStockResponse.data.result ?? []);
    setPaginatin({
      skip: 0,
      take: 10,
      total: totalStocks,
    });
  };

  const init = async () => {
    // setLoading(true);
    const dvat = await GetUserDvat04();
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);
      await loadAllStocks(dvat.data.id);
    }
    const commodity_response = await AllCommodityMaster({});

    if (commodity_response.status && commodity_response.data) {
      setCommodityMaster(commodity_response.data);
    }
    const getalltinnumber = await getAllTinNumberMaster();

    if (getalltinnumber.status && getalltinnumber.data) {
      setTindata(getalltinnumber.data);
    }

    // setLoading(false);
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

      const dvat = await GetUserDvat04();
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);
        await loadAllStocks(dvat.data.id);
      }
      const commodity_response = await AllCommodityMaster({});

      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }
      const getalltinnumber = await getAllTinNumberMaster();

      if (getalltinnumber.status && getalltinnumber.data) {
        setTindata(getalltinnumber.data);
      }

      setLoading(false);
    };
    init();
  }, [userid]);

  const [addBox, setAddBox] = useState<boolean>(false);
  const [stockBox, setStockBox] = useState<boolean>(false);
  const [materialBox, setMaterialBox] = useState<boolean>(false);
  // const [commid, setCommid] = useState<number>();

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

  const filteredStocks = useMemo(() => {
    if (stockFilter === "all") {
      return stocks;
    }

    if (stockFilter === "zero") {
      return stocks.filter((val) => val.quantity === 0);
    }

    return stocks.filter((val) => val.quantity !== 0);
  }, [stockFilter, stocks]);

  const columns = useMemo<ColumnDef<StockRow>[]>(
    () => [
      {
        id: "serial",
        header: "Sr. No.",
        enableSorting: false,
        cell: ({ row, table }) =>
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
          row.index +
          1,
      },
      {
        id: "itemId",
        accessorFn: (row) => row.commodity_master.id,
        header: "Item ID",
        cell: ({ row }) => row.original.commodity_master.id,
      },
      {
        id: "productName",
        accessorFn: (row) => row.commodity_master.product_name,
        header: "Product Name",
        cell: ({ row }) => row.original.commodity_master.product_name,
      },
      {
        id: "quantity",
        accessorFn: (row) => row.quantity,
        header:
          quantityCount == "pcs"
            ? dvatdata?.commodity == "FUEL"
              ? "Litres"
              : "Quantity"
            : "Crate",
        cell: ({ row }) =>
          quantityCount == "pcs"
            ? row.original.quantity
            : showCrates(
                row.original.quantity,
                row.original.commodity_master.crate_size,
              ),
      },
      {
        id: "description",
        accessorFn: (row) => row.commodity_master.description || "-",
        header: "Description",
        cell: ({ row }) => row.original.commodity_master.description || "-",
      },
    ],
    [dvatdata?.commodity, quantityCount],
  );

  const table = useReactTable({
    data: filteredStocks,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      return [
        row.original.commodity_master.id,
        row.original.commodity_master.product_name,
        row.original.commodity_master.description,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchValue),
        );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const onChangePageCount = (page: number, pagesize: number) => {
    table.setPageSize(pagesize);
    table.setPageIndex(page - 1);
  };

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, stockFilter, table]);

  // csv section start from here
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [csv, setCsv] = useState<File | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  interface CsvData {
    tin: string;
    invoice_date: string;
    invoice_no: string;
    oidc_code: string;
    quantity: string;
    error: boolean;
    errorname: string | null;
    mrp: string | null;
    crate_size: number | null;
    product_name: string | null;
  }
  const [tabledata, setTableData] = useState<CsvData[]>([]);

  const handleCSVChange = async (
    value: React.ChangeEvent<HTMLInputElement>,
    setFun: (value: SetStateAction<File | null>) => void,
  ) => {
    if (value!.target.files?.length == 0) {
      value.target.value = ""; // Reset input so same file can be selected again
      return;
    }

    if (
      value!.target.files![0].type.endsWith("/csv") ||
      value!.target.files![0].type.endsWith("/vnd.ms-excel")
    ) {
      const file = value!.target.files![0];
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            let groupedData: { [key: string]: number } = {};

            results.data.forEach((value: any) => {
              const key = `${value["invoice_no"]}_${value["oidc_code"]}_${value["quantity"]}`;
              groupedData[key] = (groupedData[key] || 0) + 1;
            });

            // Group by invoice_no for TIN consistency check
            const invoiceTinMap: { [invoiceNo: string]: Set<string> } = {};
            results.data.forEach((row: any) => {
              const inv = row["invoice_no"];
              const tin = row["tin"];
              if (!invoiceTinMap[inv]) invoiceTinMap[inv] = new Set();
              if (tin) invoiceTinMap[inv].add(tin);
            });

            // Find invoice_no with more than one unique TIN
            const invoiceWithMultipleTIN = new Set(
              Object.entries(invoiceTinMap)
                .filter(([_, tins]) => tins.size > 1)
                .map(([inv]) => inv),
            );

            let recatoredata = results.data.map((value: any) => {
              const key = `${value["invoice_no"]}_${value["oidc_code"]}_${value["quantity"]}`;
              const isDuplicate = groupedData[key] > 1;

              const matchedCommodity = commodityMaster.find(
                (commodity) => commodity.oidc_code === value["oidc_code"],
              );

              const isallnull =
                (value["tin"] == null ||
                  value["tin"] == "" ||
                  value["tin"] == undefined) &&
                (value["invoice_date"] == null ||
                  value["invoice_date"] == "" ||
                  value["invoice_date"] == undefined) &&
                (value["invoice_no"] == null ||
                  value["invoice_no"] == "" ||
                  value["invoice_no"] == undefined) &&
                (value["oidc_code"] == null ||
                  value["oidc_code"] == "" ||
                  value["oidc_code"] == undefined) &&
                (value["quantity"] == null ||
                  value["quantity"] == "" ||
                  value["quantity"] == undefined);
              if (isallnull) {
                return {
                  tin: "",
                  invoice_date: "",
                  invoice_no: "",
                  oidc_code: "",
                  quantity: "",
                  error: true,
                  errorname: "All fields are empty",
                  mrp: null,
                  crate_size: null,
                  product_name: null,
                };
              }

              // Mark error if invoice_no has multiple TINs
              const tinError = invoiceWithMultipleTIN.has(value["invoice_no"]);

              const mydata: CsvData = {
                tin: value["tin"],
                invoice_date: value["invoice_date"],
                invoice_no: value["invoice_no"],
                oidc_code: value["oidc_code"],
                quantity: value["quantity"],
                error: !matchedCommodity || isDuplicate || tinError,
                errorname: !matchedCommodity
                  ? "OIDC code not found in commodity master"
                  : isDuplicate
                    ? "Duplicate entry"
                    : tinError
                      ? "Multiple TINs for same invoice no."
                      : null,
                mrp: matchedCommodity ? matchedCommodity.mrp : null,
                crate_size: matchedCommodity
                  ? matchedCommodity.crate_size
                  : null,
                product_name: matchedCommodity
                  ? matchedCommodity.product_name
                  : null,
              };

              return mydata;
            });
            setTableData(recatoredata);

            setIsBulkModalOpen(true);
            setLoading(false);
            value.target.value = ""; // Reset input after successful read
          },
          error: (error: any) => {
            toast.error("Error parsing CSV file");
            setLoading(false);
            value.target.value = ""; // Reset input on error
          },
        });
      };
      reader.onerror = (error: any) => {
        toast.error("Error reading CSV file");
        setLoading(false);
        value.target.value = ""; // Reset input on error
      };
      reader.readAsText(file);
    } else {
      toast.error("Please select an image file.", { theme: "light" });
      value.target.value = ""; // Reset input on invalid file
    }
  };

  // csv section end here

  const handleDownloadStockAsXlsx = () => {
    if (!filteredStocks || filteredStocks.length === 0) {
      toast.error("No data to download");
      return;
    }

    // Prepare data for export
    const exportData = filteredStocks.map((stock, index) => {
      const baseData: any = {
        "Sr. No.": index + 1,
        "Item ID": stock.commodity_master.id,
        "Product Name": stock.commodity_master.product_name,
      };

      // Add quantity or crate based on selection
      if (quantityCount === "pcs") {
        baseData[dvatdata?.commodity === "FUEL" ? "Litres" : "Quantity"] =
          stock.quantity;
      } else {
        baseData["Crate"] = showCrates(
          stock.quantity,
          stock.commodity_master.crate_size,
        );
      }

      return baseData;
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 10 }, // Sr. No.
      { wch: 12 }, // Item ID
      { wch: 25 }, // Product Name
      { wch: 15 }, // Quantity/Crate
    ];
    worksheet["!cols"] = columnWidths;

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `stock_${quantityCount}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, filename);
    toast.success("Stock data downloaded successfully");
  };

  const handleBulkUpload = async () => {
    if (!tabledata || tabledata.length === 0) {
      return toast.error("No data to upload.");
    }

    // If any row has error, prevent upload and show error
    if (tabledata.some((row) => row.error)) {
      toast.error(
        "Please fix all errors in the uploaded data before proceeding.",
      );
      return;
    }

    const entries = tabledata
      .filter((row) => !row.error) // Only process valid rows
      .map((row) => ({
        dvatid: dvatdata!.id,
        commodityid: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code,
        )?.id!,
        quantity: parseInt(row.quantity),
        seller_tin_id: tindata.find((tin) => tin.tin_number === row.tin)?.id!,
        invoice_number: row.invoice_no,
        invoice_date: new Date(row.invoice_date),
        tax_percent: "2",
        // tax_percent: commodityMaster.find(
        //   (commodity) => commodity.oidc_code === row.oidc_code
        // )?.taxable_at!,
        amount: (
          parseFloat(row.quantity) *
          parseFloat(
            commodityMaster.find(
              (commodity) => commodity.oidc_code === row.oidc_code,
            )?.sale_price!,
          )
        ).toFixed(2),
        vatamount: (
          (parseFloat(row.quantity) *
            parseFloat(
              commodityMaster.find(
                (commodity) => commodity.oidc_code === row.oidc_code,
              )?.sale_price!,
            ) *
            2) /
          100
        ).toFixed(2),
        amount_unit: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code,
        )?.sale_price!,
        createdById: userid,
        against_cfrom: false,
        batch_name: null,
      }));

    const response = await CreateMultiDailyPurchase({ entries });

    if (response.status && response.data) {
      toast.success("Bulk upload successful.");
      setIsBulkModalOpen(false);
      await init(); // Refresh data
    } else {
      toast.error(response.message);
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
      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">Bulk Upload</div>
        }
        open={isBulkModalOpen}
        onOk={handleBulkUpload}
        width={1100}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setCsv(null);
          setTableData([]);
        }}
        okText="Upload"
        cancelText="Cancel"
        okButtonProps={{
          className: "bg-blue-600 hover:bg-blue-700",
        }}
      >
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <Table className="border border-gray-200 mt-4">
            <TableHeader>
              <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Sr. No.
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  TIN Number
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Product Name
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  MRP
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Invoice No.
                </TableHead>
                <TableHead className="border border-gray-200 whitespace-nowrap text-center font-semibold text-gray-700 py-3">
                  Invoice Date
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  OIDC Code
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Quantity
                </TableHead>
                <TableHead className="border border-gray-200 text-center font-semibold text-gray-700 py-3">
                  Crate Size
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabledata
                .filter((val) => val.tin != "")
                .map((val: CsvData, index: number) => (
                  <TableRow
                    key={index}
                    className={`${
                      val.error
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {val.tin}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {val.product_name}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm font-medium">
                      {val.mrp}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {val.invoice_no}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {val.invoice_date == null ||
                      val.invoice_date == "" ||
                      val.invoice_date == undefined
                        ? "-"
                        : formateDate(new Date(val.invoice_date))}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm font-mono">
                      {val.oidc_code}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm font-medium">
                      {val.quantity}
                    </TableCell>
                    <TableCell className="p-3 border border-gray-200 text-center text-sm">
                      {val.crate_size}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {tabledata.some((val) => val.errorname) && (
          <Alert
            title={tabledata.find((val) => val.errorname)?.errorname}
            type="error"
            showIcon
            className="mt-4 rounded-lg"
          />
        )}
      </Modal>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setMaterialBox(false);
        }}
        open={materialBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">
            Add Raw Material
          </h2>
        </div>
        <AddMaterialProvider
          userid={userid}
          setAddBox={setMaterialBox}
          init={init}
        />
      </Drawer>
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
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setStockBox(false);
        }}
        open={stockBox}
        size="large"
      >
        <div className="mb-3 pb-2 border-b">
          <h2 className="text-sm font-medium text-gray-900">Add Production Stock</h2>
        </div>
        <CreateStockProvider
          userid={userid}
          setAddBox={setStockBox}
          init={init}
        />
      </Drawer>

      <main className="p-3 bg-gray-50">
        <div className=" mx-auto">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Title Section */}
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Stock Management
                </h1>
              </div>

              <div className="grow"></div>

              {/* Controls Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Quantity Toggle for Non-Fuel */}
                {dvatdata?.commodity != "FUEL" && (
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

                {/* Fuel-specific Upload */}
                {/* {dvatdata?.commodity == "FUEL" && (
                  <div className="flex gap-2 items-center">
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => csvRef.current?.click()}
                    >
                      {csv ? "Change Sheet" : "Upload Sheet"}
                    </Button>
                    <div className="hidden">
                      <input
                        type="file"
                        ref={csvRef}
                        accept="application/vnd.ms-excel, text/csv"
                        onChange={(val) => handleCSVChange(val, setCsv)}
                      />
                    </div>
                    <a
                      download={"vatsoft_purchase.csv"}
                      href="/vatsoft_purchase.csv"
                      className="inline-flex items-center px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                    >
                      Download Sheet
                    </a>
                  </div>
                )} */}

                {/* Manufacturer-specific Buttons */}
                {/* {dvatdata && (dvatdata.commodity == "MANUFACTURER" ) && (
                  <>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setStockBox(true)}
                    >
                      Add Production
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setMaterialBox(true)}
                    >
                      Add Raw Material
                    </Button>
                  </>
                )} */}

                {/* Common Buttons */}
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setAddBox(true)}
                >
                  Add Purchase
                </Button>

                <Button
                  size="small"
                  type="default"
                  onClick={handleDownloadStockAsXlsx}
                >
                  Download Stock
                </Button>

                <Button
                  size="small"
                  type="default"
                  onClick={() => router.push("/dashboard/stock/view_purchase")}
                >
                  View Purchase
                </Button>

                {dvatdata?.commodity == "FUEL" && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => router.push("/dashboard/refinery_sales")}
                  >
                    Refinery Purchase
                  </Button>
                )}
                {/* {dvatdata && (dvatdata.commodity == "MANUFACTURER") && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() =>
                      router.push("/dashboard/stock/manufacturer_purchase")
                    }
                  >
                    Manufacturer Purchase
                  </Button>
                )} */}
              </div>
            </div>
          </div>

          {/* Stock Table Card */}
          {stocks.length != 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="w-full lg:max-w-sm">
                  <Input
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    placeholder="Search by item ID, product name, or description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Filter:</span>
                  <select
                    value={stockFilter}
                    onChange={(event) =>
                      setStockFilter(
                        event.target.value as "available" | "all" | "zero",
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                  >
                    <option value="available">Available Stock</option>
                    <option value="all">All Stock</option>
                    <option value="zero">Zero Quantity</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 lg:ml-auto">
                  Showing {table.getFilteredRowModel().rows.length} of {pagination.total} items
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-gray-50 border-b">
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort();
                          const sortState = header.column.getIsSorted();
                          const alignClass =
                            header.column.id === "productName" ||
                            header.column.id === "description"
                              ? "text-left"
                              : "text-center";

                          return (
                            <TableHead
                              key={header.id}
                              className={`p-2 font-medium text-gray-700 text-xs ${alignClass}`}
                            >
                              {header.isPlaceholder ? null : canSort ? (
                                <button
                                  type="button"
                                  onClick={header.column.getToggleSortingHandler()}
                                  className={`inline-flex items-center gap-1 ${alignClass === "text-left" ? "justify-start" : "justify-center"} w-full`}
                                >
                                  <span>
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {sortState === "asc"
                                      ? "▲"
                                      : sortState === "desc"
                                        ? "▼"
                                        : "↕"}
                                  </span>
                                </button>
                              ) : (
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )
                              )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="border-b hover:bg-gray-50">
                          {row.getVisibleCells().map((cell) => {
                            const alignClass =
                              cell.column.id === "productName" ||
                              cell.column.id === "description"
                                ? "text-left"
                                : "text-center";

                            return (
                              <TableCell
                                key={cell.id}
                                className={`p-2 text-xs ${alignClass}${
                                  cell.column.id === "description"
                                    ? " text-gray-600"
                                    : ""
                                }`}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="p-4 text-center text-sm text-gray-500"
                        >
                          No matching stock records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Section */}
              <div className="px-3 py-2 border-t bg-gray-50">
                <div className="lg:hidden">
                  <Pagination
                    align="center"
                    current={table.getState().pagination.pageIndex + 1}
                    pageSize={table.getState().pagination.pageSize}
                    onChange={onChangePageCount}
                    showSizeChanger
                    total={table.getFilteredRowModel().rows.length}
                    showTotal={(total: number) => `Total ${total} items`}
                  />
                </div>
                <div className="hidden lg:block">
                  <Pagination
                    showQuickJumper
                    align="center"
                    current={table.getState().pagination.pageIndex + 1}
                    pageSize={table.getState().pagination.pageSize}
                    onChange={onChangePageCount}
                    showSizeChanger
                    pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                    total={table.getFilteredRowModel().rows.length}
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
              <p className="text-gray-500 text-sm">No stock available.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
