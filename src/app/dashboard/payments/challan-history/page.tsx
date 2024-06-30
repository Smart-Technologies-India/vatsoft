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
import { useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { MaterialSymbolsClose } from "@/components/icons";

const ChallanHistory = () => {
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

  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Challan History</div>
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
                      <Button type="primary">Search</Button>
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2">
                      <RangePicker onChange={onChangeDate} />
                      <Button type="primary">Search</Button>
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>

          <div className="text-blue-400 bg-blue-500 bg-opacity-10 border border-blue-300 mt-2 text-sm p-2 flex gap-2 items-center">
            <p className="flex-1">Search Result Based on Date range</p>
            <MaterialSymbolsClose className="text-xl cursor-pointer" />
          </div>
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
                  Amount ()
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2">
                  Mode
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2">
                  Challan Reason
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2">
                  Expire Date
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2">
                  Desposit Date
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2">
                  Desposit Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2">
                  07AKBPG2465L1Z5
                </TableCell>
                <TableCell className="text-center p-2">
                  20/06/2024 14:02:33
                </TableCell>
                <TableCell className="text-center p-2">39,310</TableCell>
                <TableCell className="text-center p-2">E-Payment</TableCell>
                <TableCell className="text-center p-2">AOP</TableCell>
                <TableCell className="text-center p-2">05/07/2024</TableCell>
                <TableCell className="text-center p-2">20/06/2024</TableCell>
                <TableCell className="text-center p-2">PAID</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ChallanHistory;
