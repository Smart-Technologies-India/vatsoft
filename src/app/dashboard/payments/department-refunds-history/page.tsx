"use client";

import { Button, Input } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { Radio, DatePicker } from "antd";
import { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { refunds } from "@prisma/client";
import { getCookie } from "cookies-next";
import { formateDate } from "@/utils/methods";
import Link from "next/link";
import { toast } from "react-toastify";
import SearchRefunds from "@/action/refund/searchrefunds";
import GetAllRefunds from "@/action/refund/getallrefunds";

const RefundsHistory = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  enum SearchOption {
    CPIN,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.CPIN
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const cpinRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };

  const [refundsData, setRefundsData] = useState<refunds[]>([]);
  const init = async () => {
    setLoading(true);

    const refunds_resposne = await GetAllRefunds({});
    if (refunds_resposne.data && refunds_resposne.data) {
      setRefundsData(refunds_resposne.data);
    }
    setSearch(false);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const refunds_resposne = await GetAllRefunds({});

      if (refunds_resposne.data && refunds_resposne.data) {
        setRefundsData(refunds_resposne.data);
      }

      setLoading(false);
    };
    init();
  }, []);

  const cpinsearch = async () => {
    if (
      cpinRef.current?.input?.value == undefined ||
      cpinRef.current?.input?.value == null ||
      cpinRef.current?.input?.value == ""
    ) {
      return toast.error("Enter cpin");
    }
    const search_response = await SearchRefunds({
      cpin: cpinRef.current?.input?.value,
    });
    if (search_response.status && search_response.data) {
      setRefundsData(search_response.data);
      setSearch(true);
    }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    const search_response = await SearchRefunds({
      fromdate: searchDate[0]?.toDate(),
      todate: searchDate[1]?.toDate(),
    });
    if (search_response.status && search_response.data) {
      setRefundsData(search_response.data);
      setSearch(true);
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
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Refunds History</div>
          <div className="p-2 bg-gray-50 mt-2">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
            >
              <Radio value={SearchOption.CPIN}>CPIN</Radio>
              <Radio value={SearchOption.DATE}>DATE</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.CPIN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={cpinRef}
                        placeholder={"Enter CPIN"}
                      />
                      <Button onClick={cpinsearch} type="primary">
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2">
                      <RangePicker onChange={onChangeDate} />
                      <Button type="primary" onClick={datesearch}>
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>

          {refundsData.length == 0 && (
            <div className="text-rose-400 bg-rose-500 bg-opacity-10 border border-rose-300 mt-2 text-sm p-2 flex gap-2 items-center">
              <p className="flex-1">There is no refunds.</p>
            </div>
          )}

          {refundsData.length > 0 && (
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap text-center px-2">
                    CPIN
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center w-36  px-2">
                    Created On
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center  px-2">
                    Amount
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center  px-2">
                    Mode
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center  px-2">
                    Expire Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center  px-2">
                    Deposit Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center  px-2">
                    Deposit Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundsData.map((val: refunds, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-center p-2">
                      <Link
                        className="text-blue-500"
                        href={`/dashboard/payments/refunds/${val.id}`}
                      >
                        {val.cpin}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {formateDate(new Date(val.createdAt))}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {val.total_tax_amount}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {val.paymentmode ?? "-"}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {formateDate(new Date(val.expire_date))}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {val.transaction_date
                        ? formateDate(new Date(val.transaction_date))
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {val.refundsstatus}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
};

export default RefundsHistory;
