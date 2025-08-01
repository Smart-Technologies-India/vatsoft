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
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import CreateMultiDailySale from "@/action/stock/createmultidailysale";
import getAllTinNumberMaster from "@/action/tin_number/getalltinnumber";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";

const DocumentWiseDetails = () => {
  // csv section start from here
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

  const userid: number = parseInt(getCookie("id") ?? "0");

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

      const dvat_response = await GetUserDvat04Anx   ({
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
        <p className="text-lg text-left">Sale Invoice</p>
        <DailySaleProvider userid={userid} setAddBox={setAddBox} init={init} />
      </Drawer>
      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Daily Sale</p>
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
            <div>
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
            </div>
            <a
              download={"vatsoft_sale.csv"}
              href="/vatsoft_sale.csv"
              className="bg-blue-500 hover:bg-blue-500 w-24 text-white rounded shadow px-2 text-sm  h-6 text-center grid place-items-start pt-[2px]"
            >
              Download Sheet
            </a>
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                setAddBox(true);
              }}
            >
              Add
            </Button>

            {dailySale.length > 0 && (
              <Button
                size="small"
                type="primary"
                className="bg-blue-500 hover:bg-blue-500 px-2"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                Generate DVAT 31/31 A
              </Button>
            )}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total number of invoice</p>
              <p className="text-lg font-semibold leading-3">
                {new Set(dailySale.map((val) => val.invoice_number)).size}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total taxable value</p>
              <p className="text-lg font-semibold leading-3">
                {dailySale
                  .reduce(
                    (acc, val) =>
                      acc + parseFloat(val.amount_unit) * val.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total tax</p>
              <p className="text-lg font-semibold leading-3">
                {dailySale
                  .reduce((acc, val) => acc + parseFloat(val.vatamount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md flex-1">
              <p className="text-sm">Total sale price</p>
              <p className="text-lg font-semibold leading-3">
                {dailySale
                  .reduce((acc, val) => acc + parseFloat(val.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          {dailySale.length > 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center">
                      Invoice no.
                    </TableHead>
                    <TableHead className="border whitespace-nowrap text-center">
                      Invoice Date
                    </TableHead>

                    <TableHead className="border text-center">
                      Trade Name
                    </TableHead>
                    <TableHead className="border text-center">
                      TIN Number
                    </TableHead>
                    <TableHead className="w-64 border text-center">
                      Product Name
                    </TableHead>
                    <TableHead className="w-20 border text-center">
                      {quantityCount == "pcs"
                        ? dvatdata?.commodity == "FUEL"
                          ? "Litres"
                          : "Qty"
                        : "Crate"}
                    </TableHead>

                    {/* <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>
                    <TableHead className="border text-center">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center">
                      Total taxable percentage
                    </TableHead> */}
                    <TableHead className="border text-center">
                      Taxable Value
                    </TableHead>
                    <TableHead className="border text-center">
                      Rate of Tax
                    </TableHead>
                    <TableHead className="border text-center">
                      VAT Amount
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>

                    <TableHead className="w-28 border text-center">
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
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {val.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {formateDate(val.invoice_date)}
                        </TableCell>

                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {/* {val.quantity} */}
                          {quantityCount == "pcs"
                            ? val.quantity
                            : showCrates(
                                val.quantity,
                                val.commodity_master.crate_size
                              )}
                        </TableCell>

                        {/* <TableCell className="p-2 border text-center">
                          {parseFloat(val.amount)}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.vatamount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.tax_percent}%
                        </TableCell>
                        */}
                        <TableCell className="p-2 border text-center">
                          {(parseFloat(val.amount_unit) * val.quantity).toFixed(
                            2
                          )}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.vatamount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.amount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
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
            <>
              <p className="bg-rose-500 bg-opacity-10 rounded text-rose-500 mt-2 px-2 py-1 border border-rose-500">
                There is no daily sale
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentWiseDetails;
