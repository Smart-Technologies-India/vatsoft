"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetDvat04ByTin from "@/action/dvat/getdvatbytin";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";
import { Alert, Button, Drawer, Input, Select, DatePicker, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, SetStateAction } from "react";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";

const AddSale = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [searchTin, setSearchTin] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [csv, setCsv] = useState<File | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>([]);
  const [tindata, setTindata] = useState<tin_number_master[]>([]);

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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

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
  }, []);

  const searchDvat = async () => {
    if (!searchTin || searchTin.trim() === "") {
      toast.error("Please enter TIN number");
      return;
    }

    setIsSearching(true);
    const dvat = await GetDvat04ByTin({ tinNumber: searchTin });
    if (dvat.status && dvat.data) {
      setDvatData(dvat.data);
      toast.success("DVAT record found");
    } else {
      toast.error(dvat.message || "DVAT record not found");
      setDvatData(null);
    }
    setIsSearching(false);
  };

  const [saleBox, setSaleBox] = useState<boolean>(false);
  const [quantityType, setQuantityType] = useState<"pcs" | "crate">("pcs");

  interface SaleData {
    item: commodity_master;
    quantity: number;
    net_amount: number;
    invoice_number: string;
    invoice_date: string;
    buyer_tin: string;
    buyer_tin_id: number;
  }

  const [sales, setSales] = useState<SaleData[]>([]);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const submit = async () => {
    setOpen(false);
    setAgreed(false);

    const entries = sales.map((sale) => ({
      dvatid: dvatdata?.id ?? 0,
      commodityid: sale.item.id,
      quantity: sale.quantity,
      seller_tin_id: sale.buyer_tin_id,
      invoice_number: sale.invoice_number,
      invoice_date: new Date(sale.invoice_date),
      tax_percent: sale.item.taxable_at || "0",
      amount: sale.net_amount.toString(),
      vatamount: ((sale.net_amount * parseFloat(sale.item.taxable_at || "0")) / 100).toFixed(2),
      amount_unit: (sale.net_amount / sale.quantity).toFixed(2),
      createdById: userid,
      against_cfrom: false,
    }));

    const created_data = await CreateMultiDailySale({
      entries: entries,
    });

    if (created_data.status) {
      setSales([]);
      toast.success(created_data.message);
      setDvatData(null);
      setSearchTin("");
    } else {
      toast.error(created_data.message);
    }
  };

  const showCrates = (quantity: number, crate_size: number): string => {
    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

  const handleCSVChange = async (
    value: React.ChangeEvent<HTMLInputElement>,
    setFun: (value: SetStateAction<File | null>) => void
  ) => {
    if (value!.target.files?.length == 0) {
      value.target.value = "";
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

            const invoiceTinMap: { [invoiceNo: string]: Set<string> } = {};
            results.data.forEach((row: any) => {
              const inv = row["invoice_no"];
              const tin = row["tin"];
              if (!invoiceTinMap[inv]) invoiceTinMap[inv] = new Set();
              if (tin) invoiceTinMap[inv].add(tin);
            });

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
            value.target.value = "";
          },
          error: (error: any) => {
            toast.error("Error parsing CSV file");
            setLoading(false);
            value.target.value = "";
          },
        });
      };
      reader.onerror = (error: any) => {
        toast.error("Error reading CSV file");
        setLoading(false);
        value.target.value = "";
      };
      reader.readAsText(file);
    } else {
      toast.error("Please select a CSV file.");
      value.target.value = "";
    }
  };

  const handleBulkUpload = async () => {
    if (!dvatdata) {
      return toast.error("Please search and select a DVAT record first.");
    }

    if (!tabledata || tabledata.length === 0) {
      return toast.error("No data to upload.");
    }

    if (tabledata.some((row) => row.error)) {
      toast.error(
        "Please fix all errors in the uploaded data before proceeding."
      );
      return;
    }

    const entries = tabledata
      .filter((row) => !row.error)
      .map((row) => ({
        dvatid: dvatdata!.id,
        commodityid: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code
        )?.id!,
        quantity: parseInt(row.quantity),
        seller_tin_id: tindata.find((tin) => tin.tin_number === row.tin)?.id!,
        invoice_number: row.invoice_no,
        invoice_date: new Date(row.invoice_date),
        tax_percent: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code
        )?.taxable_at!,
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
            parseFloat(
              commodityMaster.find(
                (commodity) => commodity.oidc_code === row.oidc_code
              )?.taxable_at!
            )) /
          100
        ).toFixed(2),
        amount_unit: commodityMaster.find(
          (commodity) => commodity.oidc_code === row.oidc_code
        )?.sale_price!,
        createdById: userid,
        against_cfrom: true,
      }));

    const response = await CreateMultiDailySale({ entries });

    if (response.status && response.data) {
      toast.success("Bulk upload successful.");
      setIsBulkModalOpen(false);
      setTableData([]);
      setCsv(null);
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
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setSaleBox(false);
        }}
        size="large"
        open={saleBox}
      >
        <p className="text-lg text-left mb-4">Add Multiple Sale Invoices</p>
        <MultipleSaleForm
          setAddBox={setSaleBox}
          setSales={setSales}
          sales={sales}
          dvatdata={dvatdata}
          quantityType={quantityType}
          tindata={tindata}
        />
      </Drawer>

      <main className="w-full p-4">
        <div className="bg-white px-4 py-2 mt-2">
          <p className="text-2xl font-semibold mb-4">Add Sale Invoices</p>

          {/* Search DVAT Section */}
          {!dvatdata && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-lg font-semibold mb-3">
                Search DVAT by TIN Number
              </p>
              <div className="flex gap-2">
                <Input
                  size="large"
                  placeholder="Enter TIN Number"
                  value={searchTin}
                  onChange={(e) => setSearchTin(e.target.value)}
                  onPressEnter={searchDvat}
                  className="flex-1"
                />
                <Button
                  size="large"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={searchDvat}
                  loading={isSearching}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* DVAT Details Section */}
          {dvatdata && (
            <>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Trade Name</p>
                    <p className="text-lg font-semibold">
                      {dvatdata.tradename}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TIN Number</p>
                    <p className="text-lg font-semibold">
                      {dvatdata.tinNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commodity</p>
                    <p className="text-lg font-semibold">
                      {dvatdata.commodity}
                    </p>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setDvatData(null);
                      setSales([]);
                      setSearchTin("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <p className="text-lg font-semibold items-center">
                  Sale Invoices
                </p>
                <div className="grow"></div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">Quantity Type:</span>
                  <Select
                    value={quantityType}
                    onChange={(value) => setQuantityType(value)}
                    style={{ width: 120 }}
                    options={[
                      {
                        value: "pcs",
                        label:
                          dvatdata?.commodity === "FUEL" ? "Litre" : "Pcs",
                      },
                      { value: "crate", label: "Crate" },
                    ]}
                  />
                </div>
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
                  download={"vatsoft_sale.csv"}
                  href="/vatsoft_sale.csv"
                  className="inline-flex items-center px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  Download Template
                </a>
                <Button
                  size="small"
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-500"
                  onClick={() => {
                    setSaleBox(true);
                  }}
                >
                  Add Sale Invoices
                </Button>
              </div>

              <Alert
                message="Note: Add all sale invoices with products and quantities. Once submitted, changes cannot be made."
                type="warning"
                showIcon
              />

              {sales.length != 0 ? (
                <>
                  <Table className="border mt-2">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="whitespace-nowrap w-14 border text-center p-2">
                          Sr. No.
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Invoice No.
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Invoice Date
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Buyer TIN
                        </TableHead>
                        <TableHead className="whitespace-nowrap w-56 border text-center p-2">
                          Product Name
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Quantity
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Net Amount
                        </TableHead>
                        <TableHead className="whitespace-nowrap border text-center p-2">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((val: SaleData, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="p-2 border text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {val.invoice_number}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {dayjs(val.invoice_date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {val.buyer_tin}
                          </TableCell>
                          <TableCell className="p-2 border text-left">
                            {val.item.product_name}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            {quantityType === "pcs"
                              ? val.quantity
                              : showCrates(val.quantity, val.item.crate_size)}
                          </TableCell>
                          <TableCell className="p-2 border text-right">
                            ₹{val.net_amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 border text-center">
                            <Button
                              size="small"
                              type="primary"
                              danger
                              onClick={() => {
                                setSales(sales.filter((_, i) => i !== index));
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex mt-2 gap-2">
                    <div className="grow"></div>
                    <Button
                      size="small"
                      type="primary"
                      className="bg-blue-500 hover:bg-blue-500"
                      onClick={() => {
                        setOpen(true);
                      }}
                    >
                      Submit All ({sales.length})
                    </Button>
                  </div>
                </>
              ) : (
                <Alert
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                  }}
                  type="error"
                  showIcon
                  description="There are no sale invoices. Click 'Add Sale Invoices' to add items."
                />
              )}
            </>
          )}
        </div>
      </main>

      <Modal title="Confirmation" open={open} footer={null} closeIcon={false}>
        <div>
          <p>
            You are about to submit {sales.length} sale invoice(s) for{" "}
            {dvatdata?.tradename} (TIN: {dvatdata?.tinNumber}). Please confirm
            that all the information is accurate.
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="agreeCheckbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
          <label
            htmlFor="agreeCheckbox"
            className="text-sm text-gray-700 font-medium cursor-pointer select-none"
          >
            I confirm that all sale invoice information provided is accurate and
            complete.
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <div className="grow"></div>
          <button
            className="py-2 rounded-md border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setOpen(false);
              setAgreed(false);
            }}
          >
            Close
          </button>
          {agreed && (
            <button
              onClick={submit}
              className="py-2 rounded-md bg-blue-500 hover:bg-blue-600 px-4 text-sm text-white transition-colors shadow-sm"
            >
              Submit
            </button>
          )}
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        title="Bulk Upload Sale Data"
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setCsv(null);
        }}
        width={1200}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsBulkModalOpen(false);
              setCsv(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            className="bg-blue-500"
            onClick={handleBulkUpload}
            disabled={tabledata.some((row) => row.error)}
          >
            Upload All
          </Button>,
        ]}
      >
        {tabledata.filter((row) => row.error).length > 0 && (
          <Alert
            message={`${tabledata.filter((row) => row.error).length} error(s) found. Please fix them before uploading.`}
            type="error"
            showIcon
            className="mb-3"
          />
        )}
        <div className="overflow-x-auto">
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap border text-center p-2">Sr.</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">TIN</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">Invoice Date</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">Invoice No</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">OIDC Code</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">Product</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">Quantity</TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabledata.map((row, index) => (
                <TableRow key={index} className={row.error ? "bg-red-50" : ""}>
                  <TableCell className="p-2 border text-center">{index + 1}</TableCell>
                  <TableCell className="p-2 border text-center">{row.tin}</TableCell>
                  <TableCell className="p-2 border text-center">{row.invoice_date}</TableCell>
                  <TableCell className="p-2 border text-center">{row.invoice_no}</TableCell>
                  <TableCell className="p-2 border text-center">{row.oidc_code}</TableCell>
                  <TableCell className="p-2 border text-left">{row.product_name || "-"}</TableCell>
                  <TableCell className="p-2 border text-center">{row.quantity}</TableCell>
                  <TableCell className="p-2 border text-center">
                    {row.error ? (
                      <span className="text-red-600 text-xs">{row.errorname}</span>
                    ) : (
                      <span className="text-green-600 text-xs">✓ Valid</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Modal>
    </>
  );
};

export default AddSale;

// Multiple Sale Form Component
interface MultipleSaleFormProps {
  setSales: React.Dispatch<React.SetStateAction<any[]>>;
  sales: any[];
  setAddBox: React.Dispatch<React.SetStateAction<boolean>>;
  dvatdata: dvat04 | null;
  quantityType: "pcs" | "crate";
  tindata: tin_number_master[];
}

const MultipleSaleForm = (props: MultipleSaleFormProps) => {
  const [commodityMaster, setCommodityMaster] = useState<commodity_master[]>(
    []
  );
  const [filteredProducts, setFilteredProducts] = useState<commodity_master[]>(
    []
  );
  const [searchText, setSearchText] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [invoiceStart, setInvoiceStart] = useState<string>("");
  const [buyerTin, setBuyerTin] = useState<string>("");
  const [selectedBuyerTin, setSelectedBuyerTin] = useState<tin_number_master | null>(null);
  const [filteredTins, setFilteredTins] = useState<tin_number_master[]>([]);
  const [showTinDropdown, setShowTinDropdown] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<
    Map<
      number,
      { quantity: string; net_amount: string; invoice_number: string }
    >
  >(new Map());

  useEffect(() => {
    const init = async () => {
      const commodity_response = await AllCommodityMaster({});
      if (commodity_response.status && commodity_response.data) {
        let products = commodity_response.data;
        if (props.dvatdata?.commodity == "FUEL") {
          products = products.filter((val) => val.product_type == "FUEL");
        } else {
          products = products.filter((val) => val.product_type != "FUEL");
        }
        setCommodityMaster(products);
        setFilteredProducts(products);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredProducts(commodityMaster);
    } else {
      const filtered = commodityMaster.filter(
        (product) =>
          product.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, commodityMaster]);

  useEffect(() => {
    if (buyerTin.trim() === "") {
      setFilteredTins([]);
      setShowTinDropdown(false);
      return;
    }
    const filtered = props.tindata.filter((tin) =>
      tin.tin_number.toLowerCase().includes(buyerTin.toLowerCase()) ||
      tin.name_of_dealer?.toLowerCase().includes(buyerTin.toLowerCase())
    );
    setFilteredTins(filtered);
    setShowTinDropdown(filtered.length > 0);
  }, [buyerTin, props.tindata]);

  const generateInvoiceNumber = (index: number): string => {
    if (!invoiceStart || !selectedMonth) return "";
    const startNum = parseInt(invoiceStart);
    if (isNaN(startNum)) return "";
    const monthYear = selectedMonth.format("MMYYYY");
    return `${startNum + index}/${monthYear}`;
  };

  const handleCheckboxChange = (productId: number, checked: boolean) => {
    const newSelected = new Map(selectedProducts);
    if (checked) {
      const currentSize = newSelected.size;
      const invoiceNum = generateInvoiceNumber(currentSize);
      newSelected.set(productId, {
        quantity: "",
        net_amount: "",
        invoice_number: invoiceNum,
      });
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChange = (productId: number, quantity: string) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, quantity });
      setSelectedProducts(newSelected);
    }
  };

  const handleNetAmountChange = (productId: number, net_amount: string) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, net_amount });
      setSelectedProducts(newSelected);
    }
  };

  useEffect(() => {
    if (selectedMonth && invoiceStart) {
      const newSelected = new Map(selectedProducts);
      let index = 0;
      for (const [productId, data] of newSelected.entries()) {
        const invoiceNum = generateInvoiceNumber(index);
        newSelected.set(productId, { ...data, invoice_number: invoiceNum });
        index++;
      }
      setSelectedProducts(newSelected);
    }
  }, [selectedMonth, invoiceStart]);

  const handleSubmit = () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    if (!invoiceStart || invoiceStart.trim() === "") {
      toast.error("Please enter starting invoice number");
      return;
    }

    if (!selectedBuyerTin) {
      toast.error("Please select buyer TIN number");
      return;
    }

    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const newSaleItems: any[] = [];

    for (const [productId, data] of selectedProducts.entries()) {
      if (!data.quantity || data.quantity === "0") {
        toast.error("Please enter quantity for all selected products");
        return;
      }

      if (!data.net_amount || data.net_amount === "0") {
        toast.error("Please enter net amount for all selected products");
        return;
      }

      const commodityItem = commodityMaster.find((c) => c.id === productId);
      if (!commodityItem) continue;

      // Calculate quantity based on type
      const quantity =
        props.quantityType === "pcs"
          ? parseInt(data.quantity)
          : parseInt(data.quantity) * commodityItem.crate_size;

      newSaleItems.push({
        item: commodityItem,
        quantity: quantity,
        net_amount: parseFloat(data.net_amount),
        invoice_number: data.invoice_number,
        invoice_date: selectedMonth.format("YYYY-MM-DD"),
        buyer_tin: selectedBuyerTin.tin_number,
        buyer_tin_id: selectedBuyerTin.id,
      });
    }

    if (newSaleItems.length > 0) {
      props.setSales([...props.sales, ...newSaleItems]);
      toast.success(`${newSaleItems.length} sale invoice(s) added`);
      props.setAddBox(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Month and Invoice Configuration */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-semibold mb-2">Invoice Configuration</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium mb-1">
              Select Month
            </label>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date)}
              className="w-full"
              format="MMMM YYYY"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Start Invoice No.
            </label>
            <Input
              placeholder="e.g., 1001"
              value={invoiceStart}
              onChange={(e) => setInvoiceStart(e.target.value)}
              type="number"
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs font-medium mb-1">
            Buyer TIN Number <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Search buyer by TIN or name"
            value={buyerTin}
            onChange={(e) => {
              setBuyerTin(e.target.value);
              setSelectedBuyerTin(null);
            }}
            onFocus={() => buyerTin && setShowTinDropdown(true)}
            className={selectedBuyerTin ? "border-green-500" : ""}
            suffix={
              selectedBuyerTin ? (
                <span className="text-green-600 text-xs">✓</span>
              ) : null
            }
          />
          {showTinDropdown && filteredTins.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredTins.map((tin) => (
                <div
                  key={tin.id}
                  onClick={() => {
                    setSelectedBuyerTin(tin);
                    setBuyerTin(tin.tin_number);
                    setShowTinDropdown(false);
                  }}
                  className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                >
                  <p className="text-sm font-medium">{tin.tin_number}</p>
                  {tin.name_of_dealer && (
                    <p className="text-xs text-gray-600">{tin.name_of_dealer}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {selectedBuyerTin && (
            <p className="text-xs text-green-600 mt-1">
              Selected: {selectedBuyerTin.name_of_dealer || selectedBuyerTin.tin_number}
            </p>
          )}
        </div>
        {selectedMonth && invoiceStart && (
          <p className="text-xs text-gray-600 mt-2">
            Invoice Format: {invoiceStart}/{selectedMonth.format("MMYYYY")}
          </p>
        )}
      </div>

      {/* Search Box */}
      <div className="mb-3">
        <Input
          size="large"
          placeholder="Search products..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<span className="text-gray-400">🔍</span>}
          allowClear
        />
      </div>

      {/* Product List */}
      <div
        className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2"
        style={{ maxHeight: "calc(100vh - 400px)" }}
      >
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No products found
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const productData = selectedProducts.get(product.id);

              return (
                <div
                  key={product.id}
                  className={`p-2 rounded-lg border bg-white ${
                    isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        handleCheckboxChange(product.id, e.target.checked)
                      }
                      className="mt-1 w-4 h-4 shrink-0 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      disabled={!selectedMonth || !invoiceStart || !selectedBuyerTin}
                    />

                    {/* Product Info and Inputs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.product_name}
                          </p>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {product.description}
                            </p>
                          )}
                        </div>
                        {isSelected && productData?.invoice_number && (
                          <span className="text-xs font-medium text-blue-600 shrink-0">
                            {productData.invoice_number}
                          </span>
                        )}
                      </div>

                      {/* Quantity and Amount Inputs - Only show if selected */}
                      {isSelected && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Quantity ({props.quantityType})
                            </label>
                            <Input
                              size="small"
                              type="number"
                              placeholder="Qty"
                              value={productData?.quantity}
                              onChange={(e) =>
                                handleQuantityChange(product.id, e.target.value)
                              }
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Net Amount (₹)
                            </label>
                            <Input
                              size="small"
                              type="number"
                              placeholder="Amount"
                              value={productData?.net_amount}
                              onChange={(e) =>
                                handleNetAmountChange(
                                  product.id,
                                  e.target.value
                                )
                              }
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary and Actions */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            {selectedProducts.size} invoice(s) selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => props.setAddBox(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            type="primary"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={
              selectedProducts.size === 0 || !selectedMonth || !invoiceStart || !selectedBuyerTin
            }
          >
            Add Selected ({selectedProducts.size})
          </Button>
        </div>
      </div>
    </div>
  );
};

