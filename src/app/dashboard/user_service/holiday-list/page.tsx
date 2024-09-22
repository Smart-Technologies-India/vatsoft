"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActionState, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import {
  GgInfo,
  MaterialSymbolsClose,
  TablerRefresh,
} from "@/components/icons";
import { Radio, DatePicker } from "antd";

import { Button, Input, InputRef, RadioChangeEvent } from "antd";
const { RangePicker } = DatePicker;

const Refund = () => {
  const router = useRouter();

  const id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  const typeRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };
  const init = async () => {
    setLoading(true);

    // const challan_resposne = await GetUserChallan({
    //   userid: id,
    // });
    // if (challan_resposne.data && challan_resposne.data) {
    //   setChallanData(challan_resposne.data);
    // }
    setSearch(false);
    setLoading(false);
  };

  const typesearch = async () => {
    if (
      typeRef.current?.input?.value == undefined ||
      typeRef.current?.input?.value == null ||
      typeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter type");
    }
    // const search_response = await SearchChallan({
    //   userid: id,
    //   cpin: cpinRef.current?.input?.value,
    // });
    // if (search_response.status && search_response.data) {
    //   setChallanData(search_response.data);
    //   setSearch(true);
    // }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }
  };
  return (
    <main className="p-6">
      <div className="w-full bg-white p-4">
        <div className="bg-blue-500 p-2 text-white">Holiday List</div>
        <div className="p-2 bg-gray-50 mt-2">
          <div className="text-lg my-1">Filter By</div>
          <div className="flex gap-2">
            <Input className="w-60" ref={typeRef} placeholder={"Select year"} />
            <Input
              className="w-60"
              ref={typeRef}
              placeholder={"Select State"}
            />
            <Button onClick={typesearch} type="primary">
              Search
            </Button>
            {isSearch && (
              <Button onClick={init} type="primary">
                Reset
              </Button>
            )}
          </div>
        </div>
        <Table className="border mt-2">
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="whitespace-nowrap border text-center w-1/3">
                Date and Day
              </TableHead>
              <TableHead className="whitespace-nowrap border  text-center w-1/3">
                Description
              </TableHead>
              <TableHead className="whitespace-nowrap border  text-center w-1/3">
                State/Centre
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                className="p-1 border bg-gray-100 px-4 text-left"
                colSpan={3}
              >
                January
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                06/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                14/01/2024, Sunday
              </TableCell>
              <TableCell className="p-2 border text-center">Sunday</TableCell>
              <TableCell className="p-2 border text-center">
                Gujarat/Center
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                20/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                className="p-1 border bg-gray-100 px-4 text-left"
                colSpan={3}
              >
                March
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                06/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                14/01/2024, Sunday
              </TableCell>
              <TableCell className="p-2 border text-center">Sunday</TableCell>
              <TableCell className="p-2 border text-center">
                Gujarat/Center
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="p-2 border text-center">
                20/01/2024, Saturday
              </TableCell>
              <TableCell className="p-2 border text-center">Saturday</TableCell>
              <TableCell className="p-2 border text-center">Centre</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  );
};

export default Refund;
