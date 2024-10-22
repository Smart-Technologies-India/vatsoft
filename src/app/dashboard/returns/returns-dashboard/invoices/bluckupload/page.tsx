"use client";
import AddReturnInvoice from "@/action/return/addreturninvoice";
import SearchTin from "@/action/tin_number/searchtin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { record31Schema } from "@/schema/record31";
import { handleNumberChange } from "@/utils/methods";
import {
  CategoryOfEntry,
  DvatType,
  Quarter,
  ReturnType,
  SaleOf,
} from "@prisma/client";
import { Button, DatePicker, Input, InputRef, Select } from "antd";
import { getCookie } from "cookies-next";
import dayjs, { Dayjs } from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { safeParse } from "valibot";
import * as XLSX from "xlsx";
type TinData = {
  name: string;
  id: number;
};
const BulkUpload = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();

  const route = useRouter();
  const [raw, setraw] = useState(0);
  const [errorline, setErrorLine] = useState<number[]>([]);

  const csvRef = useRef<HTMLInputElement>(null);

  const countref = useRef<HTMLInputElement>(null);

  interface DataPayload {
    vatno: string;
    master_name: TinData;
    category_of_entry: CategoryOfEntry | undefined;
    invoice_no: string;
    invoice_date: Date | undefined;
    invoice_value: string;
    nature_of_sale: SaleOf | undefined;
    remark: string;
    goods_taxable: string;
    description: string;
    taxable_value: string;
    vat_amount: string;
  }

  const [data, setData] = useState<DataPayload[]>([]);

  const handleCSVChange = async (
    value: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (value!.target.files?.length == 0) return;

    if (
      value!.target.files![0].type.endsWith("/csv") ||
      value!.target.files![0].type.endsWith(
        "/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) ||
      value!.target.files![0].type.endsWith("/vnd.ms-excel")
    ) {
      // convert image to grayscale
      const file = value!.target.files![0];

      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const data = event.target?.result;

        if (data) {
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setErrorLine([]);

          let recatoredata: DataPayload[] = await Promise.all(
            await jsonData.map(async (value: any, index: number) => {
              const date_value: string = value["date"];

              const tinresponse = await SearchTin({
                tinumber: value["vatno"],
              });

              let mastername: TinData = {
                name: "",
                id: 0,
              };

              if (tinresponse.status && tinresponse.data) {
                mastername = {
                  name: tinresponse.data.name_of_dealer,
                  id: tinresponse.data.id,
                };
              } else {
                setErrorLine((val) => [...(val ?? []), index]);
              }

              const mydata: DataPayload = {
                vatno: value["vatno"],
                master_name: mastername,
                category_of_entry: "INVOICE" as CategoryOfEntry,
                invoice_no: value["invoiceno"],
                invoice_date: undefined,
                invoice_value: "test",
                nature_of_sale: "EXEMPTED_GOODS" as SaleOf,
                remark: value["remarks"],
                goods_taxable: value["goods"],
                taxable_value: value["taxable_value"],
                description: value["description"],
                vat_amount: (
                  (parseFloat(value["goods"].toString()) *
                    parseFloat(value["taxable_value"].toString())) /
                  100
                ).toFixed(2),
              };

              return mydata;
            })
          );

          setraw(recatoredata.length);
          setData(recatoredata);

          // setCsvData(recatoredata);
          // Do something with jsonData
        }
      };
      reader.readAsBinaryString(file);

      // setFun((val) => file);
    } else {
      toast.error("Please select a xlsx file.", { theme: "light" });
    }
  };

  const submitfile = async () => {
    if (errorline.length > 0) {
      toast.error("First fix all errors");
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i].invoice_date == null || data[i].invoice_date == undefined) {
        toast.error("Select invoice date");
        return;
      }

      const result = safeParse(record31Schema, {
        rr_number: "",
        return_type: ReturnType.ORIGINAL,
        year: searchParams.get("year")?.toString(),
        quarter: searchParams.get("quarter") as Quarter,
        month: searchParams.get("month")?.toString(),
        total_tax_amount: data[i].vat_amount,
        dvat_type: DvatType.DVAT_31,
        urn_number: "",
        invoice_number: data[i].invoice_no,
        total_invoice_number: data[i].invoice_value,
        invoice_date: data[i].invoice_date!.toISOString(),
        seller_tin_numberId: data[i].master_name.id,
        category_of_entry: data[i].category_of_entry,
        sale_of: data[i].nature_of_sale,
        place_of_supply: 25,
        tax_percent: data[i].goods_taxable.toString(),
        amount: data[i].taxable_value.toString(),
        vatamount: data[i].vat_amount,
        description_of_goods: data[i].description,
      });

      if (result.success) {
        const e_line: number[] = errorline.filter((val) => val != i);
        setErrorLine(e_line);
      } else {
        let errorMessage = "";
        if (result.issues[0].input) {
          errorMessage = result.issues[0].message;
        } else {
          errorMessage = result.issues[0].path![0].key + " is required";
        }
        toast.error(errorMessage);
        setErrorLine((val) => [...val, i]);
      }
    }

    if (errorline.length > 0) return;

    let completed = 0;

    for (let i = 0; i < data.length; i++) {
      const recordresponse = await AddReturnInvoice({
        createdById: id,
        rr_number: "",
        returnType: ReturnType.ORIGINAL,
        year: searchParams.get("year")?.toString()!,
        quarter: searchParams.get("quarter") as Quarter,
        month: searchParams.get("month")?.toString()!,
        total_tax_amount: data[i].vat_amount,
        dvat_type: DvatType.DVAT_31,
        urn_number: "",
        invoice_number: data[i].invoice_no,
        total_invoice_number: data[i].invoice_value,
        invoice_date: new Date(data[i].invoice_date!),
        seller_tin_numberId: data[i].master_name.id,
        category_of_entry: data[i].category_of_entry,
        sale_of: data[i].nature_of_sale,
        place_of_supply: 25,
        tax_percent: data[i].goods_taxable.toString(),
        amount: data[i].taxable_value.toString(),
        vatamount: data[i].vat_amount,
        description_of_goods: data[i].description,
        remark: data[i].remark,
        quantity: 1,
      });
      if (recordresponse.status) {
        completed += 1;
      } else {
        toast.error(recordresponse.message);
      }
    }
    toast.success(`${completed} Record 31-A added successfully`);
    route.back();
  };

  return (
    <>
      <div className="bg-white p-2 shadow mt-2">
        <div className="bg-blue-500 p-2 text-white">Bulk Upload</div>

        {raw == 0 && (
          <>
            <div className="flex gap-4 px-2">
              <div>
                <h1 className="mt-4 text-sm">Enter Number of Entries</h1>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    ref={countref}
                    className="w-60 rounded-sm border hover:border-blue-500 outline-none px-2 text-gray-600"
                    onChange={handleNumberChange}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      const count = parseInt(countref.current?.value!);
                      setraw(count);
                      let data: DataPayload[] = [];
                      for (let i = 0; i < count; i++) {
                        let payload: DataPayload = {
                          category_of_entry: undefined,
                          description: "",
                          goods_taxable: "",
                          invoice_date: undefined,
                          invoice_no: "",
                          invoice_value: "",
                          master_name: {
                            name: "",
                            id: 0,
                          },
                          nature_of_sale: undefined,
                          remark: "",
                          taxable_value: "",
                          vat_amount: "0",
                          vatno: "",
                        };
                        data.push(payload);
                      }
                      setData(data);
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
              <div className="grow"></div>
              <div>
                <h1 className="mt-4 text-sm">Upload your sheet here</h1>
                <div className="hidden">
                  <input
                    type="file"
                    ref={csvRef}
                    accept="application/vnd.ms-excel, text/csv,  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(val) => handleCSVChange(val)}
                  />
                </div>
                <Button
                  type="primary"
                  className="mt-1"
                  onClick={() => csvRef.current?.click()}
                  // className="bg-emerald-500 px-4 rounded-md text-white text-sm mt-1 py-2"
                >
                  Upload Sheet
                </Button>
              </div>
            </div>
          </>
        )}

        {raw !== 0 && (
          <>
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="border text-center py-1 h-2 text-xs px-2">
                    Sr. NO.
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    VAT NO.
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    Master Name
                  </TableHead>
                  <TableHead className="border text-center py-1 h-6 text-xs px-2">
                    Category of Entry
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    Invoice no.
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    Invoice Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    Invoice Value
                  </TableHead>

                  <TableHead className="border text-center py-1 h-6 text-xs px-2">
                    Nature of sale transaction
                  </TableHead>

                  <TableHead className="border text-center py-1 h-6 text-xs">
                    Goods Taxable (%)
                  </TableHead>

                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs">
                    Taxable value
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs">
                    VAT amount
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs">
                    Description
                  </TableHead>
                  <TableHead className="whitespace-nowrap border text-center py-1 h-6 text-xs px-2">
                    Remark
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: raw })
                  .fill(0)
                  .map((val: any, index: number) => (
                    <TableRow
                      key={index}
                      className={`${
                        errorline?.includes(index) &&
                        "bg-rose-500  bg-opacity-10"
                      }`}
                    >
                      <TableCell className="p-1 border text-center">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          value={data[index].vatno}
                          className="w-28"
                          onChange={async (e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              vatno: value.replace(/[^0-9]/g, ""),
                            };

                            const master_name = await SearchTin({
                              tinumber: value,
                            });

                            if (master_name.status && master_name.data) {
                              updatedData[index] = {
                                ...updatedData[index],
                                master_name: {
                                  name: master_name.data.name_of_dealer,
                                  id: master_name.data.id,
                                },
                              };

                              const e_line: number[] = errorline.filter(
                                (val) => val != index
                              );
                              setErrorLine(e_line);
                            } else {
                              updatedData[index] = {
                                ...updatedData[index],
                                master_name: {
                                  name: "",
                                  id: 0,
                                },
                              };

                              setErrorLine((val) => [...val, index]);
                            }

                            setData(updatedData);
                          }}
                          onPaste={async (
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            for (let i = 0; i < rows.length; i++) {
                              const targetIndex = index + i;
                              if (targetIndex < updatedData.length) {
                                const vatno = rows[i][0].replace(/[^0-9]/g, "");
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  vatno: vatno,
                                };

                                const master_name = await SearchTin({
                                  tinumber: vatno,
                                });

                                if (master_name.status && master_name.data) {
                                  updatedData[targetIndex] = {
                                    ...updatedData[targetIndex],
                                    master_name: {
                                      name: master_name.data.name_of_dealer,
                                      id: master_name.data.id,
                                    },
                                  };

                                  const e_line: number[] = errorline.filter(
                                    (val) => val != targetIndex
                                  );
                                  setErrorLine(e_line);
                                } else {
                                  updatedData[targetIndex] = {
                                    ...updatedData[targetIndex],
                                    master_name: {
                                      name: "",
                                      id: 0,
                                    },
                                  };

                                  setErrorLine((val) => [...val, targetIndex]);
                                }
                              }
                            }

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          value={data[index].master_name.name}
                          className="w-32"
                          disabled={true}
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              master_name: { name: value, id: 0 },
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  master_name: { name: row[0], id: 0 },
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Select
                          value={data[index].category_of_entry}
                          className="block w-24"
                          placeholder="Select Category"
                          onChange={(value: CategoryOfEntry) => {
                            if (!value) return;
                            const res: DataPayload[] = data;
                            res[index].category_of_entry = value;
                            setData(res);
                          }}
                          options={[
                            { value: "INVOICE", label: "Invoice" },
                            { value: "CREDIT_NOTE", label: "Credit Note" },
                            { value: "DEBIT_NOTE", label: "Debit Note" },
                            {
                              value: "GOODS_RETURNED",
                              label: "Goods Returned",
                            },
                            { value: "CASH_MEMO", label: "Cash Memo" },
                            {
                              value: "FREIGHT_CHARGES",
                              label: "Freight charges",
                            },
                            {
                              value: "SALE_CANCELLED",
                              label: "Sale Cancelled",
                            },
                          ]}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          value={data[index].invoice_no}
                          className="w-24"
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              invoice_no: value,
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  invoice_no: row[0],
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <DatePicker
                          value={
                            data[index].invoice_date == undefined ||
                            data[index].invoice_date == null
                              ? undefined
                              : dayjs(data[index].invoice_date)
                          }
                          className="w-28"
                          onChange={(
                            dates: Dayjs | null,
                            dateStrings: string | string[]
                          ) => {
                            if (!dates) return;
                            const date: Date = dates.toDate();

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              invoice_date: date,
                            };

                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          value={data[index].invoice_value}
                          className="w-24"
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              invoice_value: value.replace(/[^0-9]/g, ""),
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  invoice_value: row[0].replace(/[^0-9]/g, ""),
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center w-36">
                        <Select
                          value={data[index].nature_of_sale}
                          className="block w-24"
                          placeholder="Select"
                          onChange={(value: SaleOf) => {}}
                          options={[
                            {
                              value: "EXEMPTED_GOODS",
                              label: "Sale of Exempted Goods Listed in Sch 1",
                            },
                            {
                              value: "PROCESSED_GOODS",
                              label:
                                "Sale of Goods Mfg or Processed of Assembled by Eligible Unit",
                            },
                            {
                              value: "GOODS_TAXABLE",
                              label: "Sale of Goods Taxable at",
                            },
                            {
                              value: "NONCREDITABLE",
                              label: "Sale of Non Creditable Goods",
                            },
                            {
                              value: "LABOUR",
                              label: "Labour Charges Received",
                            },
                            { value: "OTHER", label: "Any other" },
                            {
                              value: "TAXABLE",
                              label: "Taxable sales at other rates",
                            },
                            {
                              value: "WORKS_CONTRACT",
                              label: "Works Contract",
                            },
                          ]}
                        />
                      </TableCell>

                      <TableCell className="p-1 border text-center">
                        <Select
                          value={data[index].goods_taxable}
                          className="block w-20"
                          placeholder="Select"
                          onChange={(val: any) => {
                            if (!val) return;

                            const res: DataPayload[] = data;

                            res[index].goods_taxable = val.value;

                            res[index].vat_amount = (
                              parseFloat(val.value) *
                              parseFloat(res[index].taxable_value)
                            ).toFixed(2);
                            setData(res);
                          }}
                          options={[
                            {
                              value: "0",
                              label: "0%",
                            },
                            {
                              value: "1",
                              label: "1%",
                            },
                            {
                              value: "2",
                              label: "2%",
                            },
                            {
                              value: "4",
                              label: "4%",
                            },
                            {
                              value: "5",
                              label: "5%",
                            },
                            {
                              value: "6",
                              label: "6%",
                            },
                            {
                              value: "12.5",
                              label: "12.5%",
                            },
                            {
                              value: "12.75",
                              label: "12.75%",
                            },
                            {
                              value: "13.5",
                              label: "13.5%",
                            },
                            {
                              value: "15",
                              label: "15%",
                            },
                            {
                              value: "20",
                              label: "20%",
                            },
                          ]}
                        />
                      </TableCell>

                      <TableCell className="p-1 border text-center">
                        <Input
                          value={data[index].taxable_value}
                          className="w-24"
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              taxable_value: value.replace(/[^0-9]/g, ""),
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  taxable_value: row[0].replace(/[^0-9]/g, ""),
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          className="w-24"
                          value={data[index].vat_amount}
                          disabled
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          className="w-32"
                          value={data[index].description}
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              description: value,
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  description: row[0],
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 border text-center">
                        <Input
                          className="w-32"
                          value={data[index].remark}
                          onChange={(e) => {
                            const value = e.target.value;

                            const updatedData = [...data];
                            updatedData[index] = {
                              ...updatedData[index],
                              remark: value,
                            };

                            setData(updatedData);
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>
                          ) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            const rows: string[][] = pasteData
                              .split("\n")
                              .map((row) => row.split("\t"));

                            // Create a copy of the existing data
                            const updatedData = [...data];

                            // Update the data array with the pasted values
                            rows.forEach((row, rowIndex) => {
                              const targetIndex = index + rowIndex;
                              if (targetIndex < updatedData.length) {
                                updatedData[targetIndex] = {
                                  ...updatedData[targetIndex],
                                  remark: row[0],
                                };
                              }
                            });

                            // Update the state with the modified data
                            setData(updatedData);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {!isSubmitting && (
              <div className="flex mt-2 gap-2">
                <div className="grow"></div>

                <button
                  className="text-sm text-white bg-[#172e57] py-1 px-4"
                  onClick={submitfile}
                >
                  Submit
                </button>
                {/* <button
                  className="text-sm border hover:border-blue-500 hover:text-blue-500 bg-white text-[#172e57] py-1 px-4"
                  onClick={() => route.back()}
                >
                  Back
                </button> */}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default BulkUpload;
