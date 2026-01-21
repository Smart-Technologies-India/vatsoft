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
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                Notice and Order
              </h1>
              <p className="text-sm text-gray-500 mt-2 ml-4">
                View and manage all notices and demand orders
              </p>
            </div>
          </div>
        </div>

        {/* Search Section Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Search by:</span>
              <Radio.Group
                onChange={onChange}
                value={searchOption}
                className="flex gap-2"
              >
                <Radio value={SearchOption.NOTICE}>
                  <span className="text-sm">Notice ID</span>
                </Radio>
                <Radio value={SearchOption.DATE}>
                  <span className="text-sm">Date</span>
                </Radio>
              </Radio.Group>
            </div>
            
            {(() => {
              switch (searchOption) {
                case SearchOption.NOTICE:
                  return (
                    <div className="flex gap-2 flex-1">
                      <Input
                        className="max-w-xs"
                        ref={cpinRef}
                        placeholder="Enter Notice Id"
                      />
                      <Button type="primary" className="bg-blue-500 hover:bg-blue-600">Search</Button>
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2 flex-1">
                      <RangePicker onChange={onChangeDate} />
                      <Button type="primary" className="bg-blue-500 hover:bg-blue-600">Search</Button>
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>

        {/* Results Table Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="border-0">
              <TableHeader>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
                  <TableHead className="text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Notice/Demand Order Id
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center w-36 px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Issued By
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Type
                  </TableHead>
                  <TableHead className="text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Notice / Order Description
                  </TableHead>
                  <TableHead className="text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Date of Issuance
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Due Date
                  </TableHead>
                  <TableHead className="text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Amount of Demand
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center px-3 py-3 border border-gray-200 font-semibold text-gray-700">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-center p-3 border border-gray-200 font-medium text-gray-900">
                    2456721984
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Notice
                    </span>
                  </TableCell>
                  <TableCell className="text-left p-3 border border-gray-200 text-gray-700">
                    Notice to return defaulter u/s 46 for not filing return
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    05/07/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    20/06/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="text-gray-500 font-medium">NA</span>
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
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
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-center p-3 border border-gray-200 font-medium text-gray-900">
                    2678491239
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Notice
                    </span>
                  </TableCell>
                  <TableCell className="text-left p-3 border border-gray-200 text-gray-700">
                    Notice to return defaulter u/s 46 for not filing return
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    05/07/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    20/06/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="text-gray-500 font-medium">NA</span>
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
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
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-center p-3 border border-gray-200 font-medium text-gray-900">
                    2795834210
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Notice
                    </span>
                  </TableCell>
                  <TableCell className="text-left p-3 border border-gray-200 text-gray-700">
                    Notice to return defaulter u/s 46 for not filing return
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    05/07/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    20/06/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="text-gray-500 font-medium">NA</span>
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
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
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-center p-3 border border-gray-200 font-medium text-gray-900">
                    2694753821
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Notice
                    </span>
                  </TableCell>
                  <TableCell className="text-left p-3 border border-gray-200 text-gray-700">
                    Notice to return defaulter u/s 46 for not filing return
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    05/07/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    20/06/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="text-gray-500 font-medium">NA</span>
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
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
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="text-center p-3 border border-gray-200 font-medium text-gray-900">
                    2684729357
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Notice
                    </span>
                  </TableCell>
                  <TableCell className="text-left p-3 border border-gray-200 text-gray-700">
                    Notice to return defaulter u/s 46 for not filing return
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    05/07/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200 text-gray-700">
                    20/06/2024
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
                    <span className="text-gray-500 font-medium">NA</span>
                  </TableCell>
                  <TableCell className="text-center p-3 border border-gray-200">
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
      </div>
    </>
  );
};

export default ChallanHistory;
