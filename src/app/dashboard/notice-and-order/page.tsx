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
import { Radio, DatePicker, Popover } from "antd";
import { useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";

const ChallanHistory = () => {
  enum SearchOption {
    NOTICE,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.NOTICE
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
  const [open, setOpen] = useState(false);

  const hide = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Notice and Order</div>
          <div className="p-2 bg-gray-50 mt-2 flex flex-col md:flex-row lg:gap-2 lg:items-center">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
            >
              <Radio value={SearchOption.NOTICE}>NOTICE ID</Radio>
              <Radio value={SearchOption.DATE}>DATE</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.NOTICE:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={cpinRef}
                        placeholder={"Enter Notice Id"}
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

          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-center px-2 border">
                  Notice/Demand Order Id
                </TableHead>
                <TableHead className="whitespace-nowrap text-center w-36  px-2 border">
                  Issued By
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2 border">
                  Type
                </TableHead>
                <TableHead className="text-center  px-2 border">
                  Notice / Order Description
                </TableHead>
                <TableHead className="text-center  px-2 border">
                  Date of Issuance
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2 border">
                  Due Date
                </TableHead>
                <TableHead className="text-center  px-2 border">
                  Amount of Demand
                </TableHead>
                <TableHead className="whitespace-nowrap text-center  px-2 border">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center p-2 border">
                  2456721984
                </TableCell>
                <TableCell className="text-center p-2 border">
                  System Generated
                </TableCell>
                <TableCell className="text-center p-2 border">Notice</TableCell>
                <TableCell className="text-left p-2 border">
                  Notice to return defaulter u/s 46 for not filing return
                </TableCell>
                <TableCell className="text-center p-2 border">
                  05/07/2024
                </TableCell>
                <TableCell className="text-center p-2 border">
                  20/06/2024
                </TableCell>
                <TableCell className="text-center p-2 border">NA</TableCell>
                <TableCell className="text-center p-2 border">
                  <Popover
                    content={
                      <div className="flex flex-col gap-2">
                        <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                          Delete
                        </button>
                        <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                          Update
                        </button>
                      </div>
                    }
                    title="Actions"
                    trigger="click"
                    open={open}
                    onOpenChange={handleOpenChange}
                  >
                    <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                      Actions
                    </button>
                  </Popover>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2 border">
                  2678491239
                </TableCell>
                <TableCell className="text-center p-2 border">
                  System Generated
                </TableCell>
                <TableCell className="text-center p-2 border">Notice</TableCell>
                <TableCell className="text-left p-2 border">
                  Notice to return defaulter u/s 46 for not filing return
                </TableCell>
                <TableCell className="text-center p-2 border">
                  05/07/2024
                </TableCell>
                <TableCell className="text-center p-2 border">
                  20/06/2024
                </TableCell>
                <TableCell className="text-center p-2 border">NA</TableCell>
                <TableCell className="text-center p-2 border">
                  <Popover
                    content={
                      <div className="flex flex-col gap-2">
                        <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                          Delete
                        </button>
                        <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                          Update
                        </button>
                      </div>
                    }
                    title="Actions"
                    trigger="click"
                    open={open}
                    onOpenChange={handleOpenChange}
                  >
                    <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                      Actions
                    </button>
                  </Popover>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2 border">
                  2795834210
                </TableCell>
                <TableCell className="text-center p-2 border">
                  System Generated
                </TableCell>
                <TableCell className="text-center p-2 border">Notice</TableCell>
                <TableCell className="text-left p-2 border">
                  Notice to return defaulter u/s 46 for not filing return
                </TableCell>
                <TableCell className="text-center p-2 border">
                  05/07/2024
                </TableCell>
                <TableCell className="text-center p-2 border">
                  20/06/2024
                </TableCell>
                <TableCell className="text-center p-2 border">NA</TableCell>
                <TableCell className="text-center p-2 border">
                  <Popover
                    content={
                      <div className="flex flex-col gap-2">
                        <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                          Delete
                        </button>
                        <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                          Update
                        </button>
                      </div>
                    }
                    title="Actions"
                    trigger="click"
                    open={open}
                    onOpenChange={handleOpenChange}
                  >
                    <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                      Actions
                    </button>
                  </Popover>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2 border">
                  2694753821
                </TableCell>
                <TableCell className="text-center p-2 border">
                  System Generated
                </TableCell>
                <TableCell className="text-center p-2 border">Notice</TableCell>
                <TableCell className="text-left p-2 border">
                  Notice to return defaulter u/s 46 for not filing return
                </TableCell>
                <TableCell className="text-center p-2 border">
                  05/07/2024
                </TableCell>
                <TableCell className="text-center p-2 border">
                  20/06/2024
                </TableCell>
                <TableCell className="text-center p-2 border">NA</TableCell>
                <TableCell className="text-center p-2 border">
                  <Popover
                    content={
                      <div className="flex flex-col gap-2">
                        <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                          Delete
                        </button>
                        <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                          Update
                        </button>
                      </div>
                    }
                    title="Actions"
                    trigger="click"
                    open={open}
                    onOpenChange={handleOpenChange}
                  >
                    <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                      Actions
                    </button>
                  </Popover>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center p-2 border">
                  2684729357
                </TableCell>
                <TableCell className="text-center p-2 border">
                  System Generated
                </TableCell>
                <TableCell className="text-center p-2 border">Notice</TableCell>
                <TableCell className="text-left p-2 border">
                  Notice to return defaulter u/s 46 for not filing return
                </TableCell>
                <TableCell className="text-center p-2 border">
                  05/07/2024
                </TableCell>
                <TableCell className="text-center p-2 border">
                  20/06/2024
                </TableCell>
                <TableCell className="text-center p-2 border">NA</TableCell>
                <TableCell className="text-center p-2 border">
                  <Popover
                    content={
                      <div className="flex flex-col gap-2">
                        <button className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4">
                          Delete
                        </button>
                        <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                          Update
                        </button>
                      </div>
                    }
                    title="Actions"
                    trigger="click"
                    open={open}
                    onOpenChange={handleOpenChange}
                  >
                    <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                      Actions
                    </button>
                  </Popover>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ChallanHistory;
