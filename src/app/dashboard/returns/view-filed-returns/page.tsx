"use client";

import { Button, Input, Drawer } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RadioChangeEvent } from "antd";
import { Radio } from "antd";
import { useState } from "react";

const TrackAppliation = () => {
  enum SearchOption {
    ARN,
    RETURN,
    STATUS,
  }
  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.ARN,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  return (
    <>
      <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-white rounded-full"></div>
                <h1 className="text-2xl font-bold text-white">View Filed Returns</h1>
              </div>
              <Button
                type="primary"
                onClick={() => setDrawerOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Info
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Options */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <Radio.Group onChange={onChange} value={searchOption}>
              <Radio value={SearchOption.ARN}>ARN</Radio>
              <Radio value={SearchOption.RETURN}>Return Filing Period</Radio>
              <Radio value={SearchOption.STATUS}>Status</Radio>
            </Radio.Group>
          </div>

          {/* Table Section */}
          <div className="p-6">
            <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <TableHeader>
                <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    ARN
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Return Type
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Financial Year
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Tax Period
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Date of filing
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Status
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center border p-3 font-semibold text-gray-900">
                    Mode of filing
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="border text-center p-3 font-medium text-gray-900">
                    2461827395
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    Regular
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    2024-2025
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">May</TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    20/06/2024
                  </TableCell>
                  <TableCell className="border text-center p-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Filed
                    </span>
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">ONLINE</TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="border text-center p-3 font-medium text-gray-900">
                    2458327419
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    Regular
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    2024-2025
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">Apr</TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    19/05/2024
                  </TableCell>
                  <TableCell className="border text-center p-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Filed
                    </span>
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">ONLINE</TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="border text-center p-3 font-medium text-gray-900">
                    2678491239
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    Regular
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    2024-2025
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">Mar</TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    20/04/2024
                  </TableCell>
                  <TableCell className="border text-center p-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Filed
                    </span>
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">ONLINE</TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50 transition-colors">
                  <TableCell className="border text-center p-3 font-medium text-gray-900">
                    2684729357
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    Regular
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    2024-2025
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">Feb</TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">
                    18/03/2024
                  </TableCell>
                  <TableCell className="border text-center p-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Filed
                    </span>
                  </TableCell>
                  <TableCell className="border text-center p-3 text-gray-900">ONLINE</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Antd Drawer for Status Info */}
        <Drawer
          title={
            <div className="text-lg font-semibold text-gray-900">
              Meaning of Status
            </div>
          }
          placement="right"
          width={720}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        >
          <div className="space-y-4">
            <Table className="border border-gray-200 rounded-lg overflow-hidden">
              <TableBody>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Pending for Processing
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application filed successfully. Pending with Tax Officer for
                    Processing.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Pending for Clarification
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Notice for seeking clarification issued by officer. File
                    Clarification within 7 working days of date of notice on
                    portal.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Clarification filed-Pending for Order
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Clarification filed successfully by Applicant. Pending with
                    Tax Officer for Order.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Clarification not filed Pending for Order
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Clarification not filed by the Applicant. Pending with Tax
                    Officer for Rejection.*
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Approved
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is Approved. Registration ID and password
                    emailed to Applicant.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Rejected
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is Rejected by tax officer.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Withdrawn
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Application is withdrawn by the Applicant/Tax payer.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-left w-60 p-3 font-semibold text-gray-900 border">
                    Cancelled on Request of Taxpayer
                  </TableCell>
                  <TableCell className="text-left p-3 text-gray-700 border">
                    Registration is cancelled on request to taxpayer.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Drawer>
      </main>
    </>
  );
};

export default TrackAppliation;
