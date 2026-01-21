"use client";

import { Button, Input, Radio, DatePicker, Drawer } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InputRef, RadioChangeEvent } from "antd";
import { useRef, useState } from "react";
const { RangePicker } = DatePicker;
import type { Dayjs } from "dayjs";
import { MaterialSymbolsClose } from "@/components/icons";

const TrackAppliation = () => {
  enum SearchOption {
    ARN,
    SRN_FRN,
    SUBMISSION,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const arnRef = useRef<InputRef>(null);
  const srnRef = useRef<InputRef>(null);

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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Application For Filing Clarification
                </h1>
              </div>
              <div className="grow"></div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="small" type="primary" onClick={() => setDrawerOpen(true)}>
                  Info
                </Button>

                <Drawer
                  title="Meaning of status"
                  placement="right"
                  onClose={() => setDrawerOpen(false)}
                  open={drawerOpen}
                  width={720}
                >
                  <Table className="border">
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Pending for Processing
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application filed successfully. Pending with Tax Officer
                          for Processing.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Pending for Clarification
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Notice for seeking clarification issued by officer. File
                          Clarification within 7 working days of date of notice on
                          portal.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Clarification filed-Pending for Order
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Clarification filed successfully by Applicant. Pending
                          with Tax Officer for Order.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Clarification not filed Pending for Order
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Clarification not filed by the Applicant. Pending with
                          Tax Officer for Rejection.*
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Approved
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is Approved. Registration ID and possward
                          emailed to Applicant.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Rejected
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is Rejected by tax officer.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Withdrawn
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Application is withdrawn by the Applicant/Tax payer.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-left w-60 p-2 text-xs font-medium">
                          Cancelled on Request of Taxpayer
                        </TableCell>
                        <TableCell className="text-left p-2 text-xs">
                          Registration is cancelled on request to taxpayer.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Drawer>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              size="small"
            >
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.SRN_FRN}>SRN/FRN</Radio>
              <Radio value={SearchOption.SUBMISSION}>Submission Period</Radio>
            </Radio.Group>
            <div className="mt-3"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.ARN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={arnRef}
                        placeholder={"Enter ARN Number"}
                        size="small"
                      />
                      <Button type="primary" size="small">Search</Button>
                    </div>
                  );
                case SearchOption.SRN_FRN:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={srnRef}
                        placeholder={"Enter SRN/FRN Number"}
                        size="small"
                      />
                      <Button type="primary" size="small">Search</Button>
                    </div>
                  );
                case SearchOption.SUBMISSION:
                  return (
                    <div className="flex gap-2">
                      <RangePicker onChange={onChangeDate} size="small" />
                      <Button type="primary" size="small">Search</Button>
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
          <div className="text-blue-700 bg-blue-50 border border-blue-200 mb-3 text-xs p-2 rounded flex gap-2 items-center">
            <p className="flex-1">Search Result Based on Date range</p>
            <MaterialSymbolsClose className="text-lg cursor-pointer" />
          </div>
          
          <div className="bg-white rounded shadow-sm border p-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">ARN</TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Form No.
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Form Description
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Submission Date
                    </TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">Status</TableHead>
                    <TableHead className="text-center p-2 font-medium text-gray-700 text-xs">
                      Assigned To
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b hover:bg-gray-50">
                    <TableCell className="text-center p-2 text-xs">
                      AKBPG2465L1Z5
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">VAT-04</TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      Application For new Registration
                    </TableCell>
                    <TableCell className="text-center p-2 text-xs">11-Jun-24</TableCell>
                    <TableCell className="text-center p-2 text-xs">Approved</TableCell>
                    <TableCell className="text-center p-2 text-xs">
                      Rahul Sharma
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default TrackAppliation;
