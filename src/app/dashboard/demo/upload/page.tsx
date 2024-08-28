"use client";
import { SetStateAction, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CsvData {
  id: string;
  amount: string;
  name: string;
}

const UploadFile = () => {
  const [csv, setCsv] = useState<File | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CsvData[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startCSV = async () => {
    setIsLoading(true);
    if (csv == null) {
      toast.error("Select an csv to continue");
      setIsLoading(false);
      return;
    }

    let csvFile: File = csv;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const data = event.target?.result;
      if (data) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let recatoredata = jsonData.map((value: any) => {
          const mydata: CsvData = {
            amount: value["amount"],
            id: value["id"],
            name: value["name"],
          };

          return mydata;
        });

        setCsvData(recatoredata);
        // Do something with jsonData
      }
      setIsLoading(false);
    };
    reader.readAsBinaryString(csvFile);

    // if (csvFile.type.endsWith("/csv")) {
    //   // Read the CSV file
    //   const reader = new FileReader();
    //   reader.onload = () => {
    //     const text = reader.result as string;
    //     Papa.parse(text, {
    //       header: true,
    //       complete: (results) => {
    //         // console.log(results.data);
    //         // Process the CSV data as needed

    //         let recatoredata = results.data.map((value: any) => {
    //           const mydata: PaymentData = {
    //             amount: value[" Amount"],
    //             uid: value[" UTR ID"],
    //           };

    //           return mydata;
    //         });
    //         setCsvData(recatoredata);

    //         setIsLoading(false);
    //       },
    //       error: (error: any) => {
    //         toast.error("Error parsing CSV file");
    //         setIsLoading(false);
    //       },
    //     });
    //   };
    //   reader.onerror = (error: any) => {
    //     toast.error("Error reading CSV file");
    //     setIsLoading(false);
    //   };
    //   reader.readAsText(csvFile);
    // } else {
    //   try {
    //     const reader = new FileReader();
    //     reader.onload = (event: ProgressEvent<FileReader>) => {
    //       const data = event.target?.result;
    //       if (data) {
    //         const workbook = XLSX.read(data, { type: "binary" });
    //         const sheetName = workbook.SheetNames[0];
    //         const worksheet = workbook.Sheets[sheetName];
    //         const jsonData = XLSX.utils.sheet_to_json(worksheet);

    //         let recatoredata = jsonData
    //           .map((value: any) => {
    //             if (value.hasOwnProperty("__EMPTY_4")) {
    //               if (value["__EMPTY_4"].startsWith("UPI/")) {
    //                 const mydata: PaymentData = {
    //                   amount: value["__EMPTY_8"],
    //                   uid: value["__EMPTY_4"].toString().split("/")[1],
    //                 };
    //                 return mydata;
    //               }
    //             }
    //             return undefined;
    //           })
    //           .filter((item): item is PaymentData => item !== undefined);

    //         setCsvData(recatoredata);
    //         // Do something with jsonData
    //       }
    //       setIsLoading(false);
    //     };
    //     reader.readAsBinaryString(csvFile);
    //   } catch (error) {
    //     toast.error("Error reading file");
    //     setIsLoading(false);
    //   }
    // }

    setIsLoading(false);
  };

  const handleCSVChange = async (
    value: React.ChangeEvent<HTMLInputElement>,
    setFun: (value: SetStateAction<File | null>) => void
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

      setFun((val) => file);
    } else {
      toast.error("Please select a xlsx file.", { theme: "light" });
    }
  };

  return (
    <>
      <main className="py-6 px-4">
        <div className="hidden">
          <input
            type="file"
            ref={csvRef}
            accept="application/vnd.ms-excel, text/csv,  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(val) => handleCSVChange(val, setCsv)}
          />
        </div>
        <div className="bg-white p-4 rounded-md w-full flex gap-4">
          <h1>Upload your file here</h1>
          <div className="grow"></div>

          <button
            onClick={() => csvRef.current?.click()}
            className="bg-emerald-500 px-4 py-1 rounded-md text-white text-sm"
          >
            {csv ? "Change Sheet" : "Upload Sheet"}
          </button>
          {csv && (
            <>
              <button
                className="bg-blue-500 px-4 py-1 rounded-md text-white text-sm"
                onClick={startCSV}
              >
                Scan CSV
              </button>
              <button
                className="bg-red-500 px-4 py-1 rounded-md text-white text-sm"
                onClick={() => {
                  setCsv(null);
                  setCsvData([]);
                }}
              >
                RESET
              </button>
            </>
          )}
        </div>
        <div className="w-full bg-white p-4 mt-4 rounded-md">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap w-64 border">
                  Id
                </TableHead>
                <TableHead className="whitespace-nowrap border">Name</TableHead>
                <TableHead className="whitespace-nowrap border">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvData.map((val: CsvData, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    {val.id}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.name}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
};
export default UploadFile;
