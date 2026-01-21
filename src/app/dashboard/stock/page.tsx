"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllStock from "@/action/stock/getallstock";
import { AddMaterialProvider } from "@/components/forms/addmaterial/addmaterial";
import { CreateStockProvider } from "@/components/forms/createstock/createstock";
import { DailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/dailypurchase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { formateDate } from "@/utils/methods";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import CreateMultiDailyPurchase from "@/action/stock/createmultidailypurchase";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";


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

  const [stocks, setStocks] = useState<
    Array<stock & { commodity_master: commodity_master }>
  >([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master>
  >([]);

  const [tindata, setTindata] = useState<Array<tin_number_master>>([]);

  const init = async () => {
    // setLoading(true);
    const dvat = await GetUserDvat04({
      userid: userid,
    });
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);

      const stock_response = await GetAllStock({
        take: 10,
        skip: 0,
        dvatid: dvat.data.id,
      });

      if (stock_response.status && stock_response.data.result) {
        setStocks(stock_response.data.result);
        setPaginatin({
          skip: stock_response.data.skip,
          take: stock_response.data.take,
          total: stock_response.data.total,
        });
      }
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

      const dvat = await GetUserDvat04({
        userid: authResponse.data,
      });
      if (dvat.status && dvat.data) {
        setDvatData(dvat.data);

        const stock_response = await GetAllStock({
          take: 10,
          skip: 0,
          dvatid: dvat.data.id,
        });

        if (stock_response.status && stock_response.data.result) {
          setStocks(stock_response.data.result);
          setPaginatin({
            skip: stock_response.data.skip,
            take: stock_response.data.take,
            total: stock_response.data.total,
          });
        }
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

  const onChangePageCount = async (page: number, pagesize: number) => {
    if (!dvatdata) return toast.error("Dvat not found.");
    const stock_resonse = await GetAllStock({
      take: pagesize,
      skip: pagesize * (page - 1),
      dvatid: dvatdata.id,
    });

    if (stock_resonse.status && stock_resonse.data.result) {
      setStocks(stock_resonse.data.result);
      setPaginatin({
        skip: stock_resonse.data.skip,
        take: stock_resonse.data.take,
        total: stock_resonse.data.total,
      });
    }
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
    setFun: (value: SetStateAction<File | null>) => void
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
                .map(([inv]) => inv)
            );

            let recatoredata = results.data.map((value: any) => {
              const key = `${value["invoice_no"]}_${value["oidc_code"]}_${value["quantity"]}`;
              const isDuplicate = groupedData[key] > 1;

              const matchedCommodity = commodityMaster.find(
                (commodity) => commodity.oidc_code === value["oidc_code"]
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

  const handleBulkUpload = async () => {
    if (!tabledata || tabledata.length === 0) {
      return toast.error("No data to upload.");
    }

    // If any row has error, prevent upload and show error
    if (tabledata.some((row) => row.error)) {
      toast.error(
        "Please fix all errors in the uploaded data before proceeding."
      );
      return;
    }

    const entries = tabledata
      .filter((row) => !row.error) // Only process valid rows
      .map((row) => ({
        dvatid: dvatdata!.id,
        commodityid: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code
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
              (commodity) => commodity.oidc_code === row.oidc_code
            )?.sale_price!
          )
        ).toFixed(2),
        vatamount: (
          (parseFloat(row.quantity) *
            parseFloat(
              commodityMaster.find(
                (commodity) => commodity.oidc_code === row.oidc_code
              )?.sale_price!
            ) *
            2) /
          100
        ).toFixed(2),
        amount_unit: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code
        )?.sale_price!,
        createdById: userid,
        against_cfrom: false,
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
            message={tabledata.find((val) => val.errorname)?.errorname}
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
          <h2 className="text-sm font-medium text-gray-900">
            Add Purchase
          </h2>
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
          <h2 className="text-sm font-medium text-gray-900">
            Add Stock
          </h2>
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
                {dvatdata?.commodity == "FUEL" && (
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
                )}

                {/* Manufacturer-specific Buttons */}
                {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
                  <>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setStockBox(true)}
                    >
                      Add Stock
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setMaterialBox(true)}
                    >
                      Add Raw Material
                    </Button>
                  </>
                )}

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
                  onClick={() => router.push("/dashboard/stock/view_purchase")}
                >
                  View Purchase
                </Button>

                {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() =>
                      router.push("/dashboard/stock/manufacturer_purchase")
                    }
                  >
                    Manufacturer Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stock Table Card */}
          {stocks.length != 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Sr. No.
                      </TableHead>
                      <TableHead className="text-left p-2 font-medium text-gray-700 text-xs">
                        Product Name
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        {quantityCount == "pcs"
                          ? dvatdata?.commodity == "FUEL"
                            ? "Litres"
                            : "Quantity"
                          : "Crate"}
                      </TableHead>
                      <TableHead className="text-left p-2 font-medium text-gray-700 text-xs">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks
                      .filter((val) => val.quantity != 0)
                      .map(
                        (
                          val: stock & { commodity_master: commodity_master },
                          index: number
                        ) => (
                          <TableRow
                            key={index}
                            className="border-b hover:bg-gray-50"
                          >
                            <TableCell className="p-2 text-center text-xs">
                              {index + 1 + pagination.skip}
                            </TableCell>
                            <TableCell className="p-2 text-left text-xs">
                              {val.commodity_master.product_name}
                            </TableCell>
                            <TableCell className="p-2 text-center text-xs">
                              {quantityCount == "pcs"
                                ? val.quantity
                                : showCrates(
                                    val.quantity,
                                    val.commodity_master.crate_size
                                  )}
                            </TableCell>
                            <TableCell className="p-2 text-left text-xs text-gray-600">
                              {val.commodity_master.description || "-"}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Section */}
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
              <p className="text-gray-500 text-sm">No stock available.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
