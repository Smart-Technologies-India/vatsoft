"use client";
// import GetUserDvat04 from "@/action/dvat/getuserdvat";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import DeleteSale from "@/action/stock/deletesale";
import GetUserDailySale from "@/action/stock/getuserdailysale";
import { DailySaleProvider } from "@/components/forms/dailysale/dailysale";
import Papa from "papaparse";
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
  daily_sale,
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
import { SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

const DocumentWiseDetails = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
            setIsLoading(false);
            value.target.value = ""; // Reset input after successful read
          },
          error: (error: any) => {
            toast.error("Error parsing CSV file");
            setIsLoading(false);
            value.target.value = ""; // Reset input on error
          },
        });
      };
      reader.onerror = (error: any) => {
        toast.error("Error reading CSV file");
        setIsLoading(false);
        value.target.value = ""; // Reset input on error
      };
      reader.readAsText(file);
    } else {
      toast.error("Please select an image file.", { theme: "light" });
      value.target.value = ""; // Reset input on invalid file
    }
  };

  // csv section end here

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master>
  >([]);

  const [tindata, setTindata] = useState<Array<tin_number_master>>([]);

  const route = useRouter();
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

  const [dailySale, setDailySale] = useState<
    Array<
      daily_sale & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      }
    >
  >([]);

  //   const [name, setName] = useState<string>("");

  const [userid, setUserid] = useState<number>(0);

  const init = async () => {
    // setLoading(true);

    const dvat_response = await GetUserDvat04Anx({
      userid: userid,
    });

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      const daily_sale_response = await GetUserDailySale({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (daily_sale_response.status && daily_sale_response.data.result) {
        setPaginatin({
          skip: daily_sale_response.data.skip,
          take: daily_sale_response.data.take,
          total: daily_sale_response.data.total,
        });
        setDailySale(daily_sale_response.data.result);
      }
    }
    // setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04Anx({
        userid: userid,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_sale_response = await GetUserDailySale({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setPaginatin({
            skip: daily_sale_response.data.skip,
            take: daily_sale_response.data.take,
            total: daily_sale_response.data.total,
          });
          setDailySale(daily_sale_response.data.result);
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
      setIsLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const daily_sale_response = await GetUserDailySale({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_sale_response.status && daily_sale_response.data.result) {
      setDailySale(daily_sale_response.data.result);
      setPaginatin({
        skip: daily_sale_response.data.skip,
        take: daily_sale_response.data.take,
        total: daily_sale_response.data.total,
      });
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const Convertto31 = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }

    const response = await ConvertDvat31({
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
  const delete_sale_entry = async (id: number) => {
    const response = await DeleteSale({
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

  // 1 crate 2 pcs
  const showCrates = (quantity: number, crate_size: number): string => {
    // return "";

    const crates = Math.floor(quantity / crate_size);
    const pcs = quantity % crate_size;
    if (crates == 0) return `${pcs} Pcs`;
    if (pcs == 0) return `${crates} Crate`;
    return `${crates} Crate ${pcs} Pcs`;
  };

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
      <Modal
        title="Generate DVAT 31/31 A Return"
        open={isModalOpen}
        onOk={Convertto31}
        onCancel={() => {
          setIsModalOpen(false);
          setCsv(null);
        }}
      >
        <p>Are you sure you want to generate DVAT 31/31 A Return?</p>
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
          <h2 className="text-sm font-medium text-gray-900">
            Sale Invoice
          </h2>
        </div>
        <DailySaleProvider userid={userid} setAddBox={setAddBox} init={init} />
      </Drawer>
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">Daily Sale</h1>
              </div>
              <div className="grow"></div>
              <div className="flex flex-wrap gap-2 items-center">
                {dvatdata?.commodity != "FUEL" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">View:</span>
                    <Radio.Group
                      size="small"
                      onChange={onChange}
                      value={quantityCount}
                      optionType="button"
                    >
                      <Radio.Button value="pcs">
                        Pcs
                      </Radio.Button>
                      <Radio.Button value="crate">
                        Crate
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                    )}
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
                  Download Sheet
                </a>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setAddBox(true);
                  }}
                >
                  Add
                </Button>

                {dailySale.length > 0 && (
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    Generate DVAT 31/31 A
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
              <p className="text-lg font-medium text-gray-900">
                {new Set(dailySale.map((val) => val.invoice_number)).size}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Taxable Value</p>
              <p className="text-lg font-medium text-gray-900">
                {dailySale
                  .reduce(
                    (acc, val) =>
                      acc + parseFloat(val.amount_unit) * val.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {dailySale
                  .reduce((acc, val) => acc + parseFloat(val.vatamount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Sale Price</p>
              <p className="text-lg font-medium text-gray-900">
                {dailySale
                  .reduce((acc, val) => acc + parseFloat(val.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          {dailySale.length > 0 ? (
            <div className="bg-white rounded shadow-sm border p-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice no.
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
                        Product Name
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        {quantityCount == "pcs"
                          ? dvatdata?.commodity == "FUEL"
                            ? "Litres"
                            : "Qty"
                          : "Crate"}
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Taxable Value
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Rate of Tax
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        VAT Amount
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Invoice value (₹)
                      </TableHead>
                      <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                        Actions
                      </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySale.map(
                    (
                      val: daily_sale & {
                        commodity_master: commodity_master;
                        seller_tin_number: tin_number_master;
                      },
                      index: number
                    ) => (
                      <TableRow key={index} className="border-b hover:bg-gray-50">
                        <TableCell className="p-2 text-center text-xs">
                          {val.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {formateDate(val.invoice_date)}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
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
                        <TableCell className="p-2 text-center text-xs">
                          {(parseFloat(val.amount_unit) * val.quantity).toFixed(
                            2
                          )}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.vatamount}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.amount}
                        </TableCell>
                        <TableCell className="p-2 text-center text-xs">
                          {val.is_accept ? (
                            "NA"
                          ) : (
                            <>
                              <Popover
                                content={
                                  <div className="flex flex-col gap-2">
                                    {/* <button
                                      onClick={() => {
                                        setDeleteBox(true);
                                        handelClose(index);
                                      }}
                                      className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4"
                                    >
                                      Delete
                                    </button> */}
                                    <button
                                      onClick={() => {
                                        route.push(
                                          `/dashboard/stock/edit_sale/${encryptURLData(
                                            val.id.toString()
                                          )}`
                                        );
                                      }}
                                      className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4"
                                    >
                                      Update
                                    </button>
                                  </div>
                                }
                                title="Actions"
                                trigger="click"
                                open={!!openPopovers[index]} // Open state for each row
                                onOpenChange={(newOpen) =>
                                  handleOpenChange(newOpen, index)
                                }
                              >
                                <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                                  Actions
                                </button>
                              </Popover>
                            </>
                          )}

                          <Modal
                            title="Confirmation"
                            open={deletebox}
                            footer={null}
                            closeIcon={false}
                          >
                            <div>
                              <p>
                                Are you sure you want to delete this Sale entry
                              </p>
                            </div>
                            <div className="flex  gap-2 mt-2">
                              <div className="grow"></div>
                              <button
                                className="py-1 rounded-md border px-4 text-sm text-gray-600"
                                onClick={() => {
                                  setDeleteBox(false);
                                }}
                              >
                                Close
                              </button>
                              <button
                                onClick={() => delete_sale_entry(val.id)}
                                className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </Modal>
                        </TableCell>
                      </TableRow>
                    )
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
              <p className="text-gray-500 text-sm">There is no daily sale.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DocumentWiseDetails;
