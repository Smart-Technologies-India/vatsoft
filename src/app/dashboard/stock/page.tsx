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
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { formateDate } from "@/utils/methods";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import CreateMultiDailyPurchase from "@/action/stock/createmultidailypurchase";

const CommodityMaster = () => {
  const router = useRouter();
  const userid: number = parseFloat(getCookie("id") ?? "0");

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
        title="Bulk Upload"
        open={isBulkModalOpen}
        onOk={handleBulkUpload}
        width={1000}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setCsv(null);
          setTableData([]);
        }}
      >
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="border text-center">Sr. No.</TableHead>
              <TableHead className="border text-center">TIN Number</TableHead>
              <TableHead className="border text-center">Product Name</TableHead>
              <TableHead className="border text-center">MRP</TableHead>
              <TableHead className="border text-center">Invoice no.</TableHead>
              <TableHead className="border whitespace-nowrap text-center">
                Invoice Date
              </TableHead>

              <TableHead className="border text-center">OIDC Code</TableHead>
              <TableHead className="border text-center">Quantity</TableHead>
              <TableHead className="border text-center">Crate Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tabledata
              .filter((val) => val.tin != "")
              .map((val: CsvData, index: number) => (
                <TableRow
                  key={index}
                  className={`${val.error ? "bg-red-200" : ""}`}
                >
                  <TableCell className="p-2 border text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.tin}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.product_name}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.mrp}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.invoice_no}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.invoice_date == null ||
                    val.invoice_date == "" ||
                    val.invoice_date == undefined
                      ? ""
                      : formateDate(new Date(val.invoice_date))}
                  </TableCell>

                  <TableCell className="p-2 border text-center">
                    {val.oidc_code}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.quantity}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.crate_size}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {/* if errorname exist show error name */}
        {tabledata.some((val) => val.errorname) && (
          <Alert
            message={tabledata.find((val) => val.errorname)?.errorname}
            type="error"
            showIcon
            className="mt-2"
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
        <p className="text-lg text-left">Add Raw Material</p>
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
        <p className="text-lg text-left">Add Purchase</p>
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
        <p className="text-lg text-left">Add Stock</p>
        <CreateStockProvider
          userid={userid}
          setAddBox={setStockBox}
          init={init}
        />
      </Drawer>

      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Stock</p>
            <div className="grow"></div>
            {dvatdata?.commodity != "FUEL" && (
              <div className="flex gap-2 items-center">
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
            )}

            {dvatdata?.commodity == "FUEL" && (
              <div className="flex gap-2 items-center">
                <Button
                  size="small"
                  type="primary"
                  onClick={() => csvRef.current?.click()}
                  className="bg-blue-500 hover:bg-blue-500 w-24 text-white"
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
                  className="bg-blue-500 hover:bg-blue-500 w-24 text-white rounded shadow px-2 text-sm h-6 text-center grid place-items-start pt-[2px]"
                >
                  Download Sheet
                </a>
              </div>
            )}

            {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
              <>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={() => {
                    setStockBox(true);
                  }}
                >
                  Add Stock
                </Button>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={() => {
                    setMaterialBox(true);
                  }}
                >
                  Add Raw Material
                </Button>
              </>
            )}
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

            <Button
              size="small"
              type="primary"
              onClick={() => {
                router.push("/dashboard/stock/view_purchase");
              }}
              className="bg-blue-500 text-white hover:bg-blue-500  rounded text-sm px-2"
            >
              View Purchase
            </Button>
            {dvatdata && dvatdata.commodity == "MANUFACTURER" && (
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  router.push("/dashboard/stock/manufacturer_purchase");
                }}
                className="bg-blue-500 text-white hover:bg-blue-500  rounded text-sm px-2"
              >
                Manufacturer Purchase
              </Button>
            )}
          </div>
          {stocks.length != 0 ? (
            <>
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
                      {quantityCount == "pcs"
                        ? dvatdata?.commodity == "FUEL"
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
                  {stocks
                    .filter((val) => val.quantity != 0)
                    .map(
                      (
                        val: stock & { commodity_master: commodity_master },
                        index: number
                      ) => (
                        <TableRow key={index}>
                          <TableCell className="p-2 border text-center">
                            {index + 1 + pagination.skip}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            {val.commodity_master.product_name}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {quantityCount == "pcs"
                              ? val.quantity
                              : showCrates(
                                  val.quantity,
                                  val.commodity_master.crate_size
                                )}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            {val.commodity_master.description}
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
            <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
              <p className="flex-1">There is no stock.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CommodityMaster;
