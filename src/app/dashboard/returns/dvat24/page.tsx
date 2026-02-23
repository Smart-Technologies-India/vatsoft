"use client";
import GetNotice from "@/action/notice_order/getnotice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { capitalcase, decryptURLData, encryptURLData } from "@/utils/methods";
import {
  dvat04,
  Dvat24Reason,
  order_notice,
  returns_01,
  user,
} from "@prisma/client";
import { Button } from "antd";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ToWords } from "to-words";

type ResponseType = {
  user: user;
  dvat: dvat04;
  return01: returns_01 | null;
  notice: order_notice;
};
const Dvat24Page = () => {
  const router = useRouter();
  const searchParam = useSearchParams();
  const toWords = new ToWords();

  const [data, setData] = useState<ResponseType | null>(null);
  useEffect(() => {
    const init = async () => {
      const idParam = searchParam.get("id");

      if (!idParam) {
        return router.back();
      }

      const id: string = decryptURLData(idParam, router);

      if (!id) {
        return router.back();
      }
      const response = await GetNotice({
        id: parseInt(id),
      });

      if (response.status && response.data) {
        setData({
          dvat: response.data.dvat,
          notice: response.data.notice,
          return01: response.data.return01,
          user: response.data.user,
        });
      } else {
        console.log(
          "Response failed - status:",
          response.status,
          "data:",
          response.data,
        );
      }
    };
    init();
  }, [router, searchParam]);

  const getTotalAmount = (): number => {
    const vat = parseFloat(data?.notice?.tax ?? "0");
    const interest = parseFloat(data?.notice?.interest ?? "0");
    const penalty = parseFloat(data?.notice?.penalty ?? "0");
    const latefees = parseFloat(data?.notice?.latefees ?? "0");
    const others = parseFloat(data?.notice?.others ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) +
      (isNaN(interest) ? 0 : interest) +
      (isNaN(penalty) ? 0 : penalty) +
      (isNaN(latefees) ? 0 : latefees) +
      (isNaN(others) ? 0 : others);

    return total;
  };
  const getReason = (reason: Dvat24Reason | undefined): string => {
    switch (reason) {
      case Dvat24Reason.INCOMPLETEFURNISHED:
        return "In Complete Furnished";
      case Dvat24Reason.INCORRECTRETURN:
        return "In Correct Return";
      case Dvat24Reason.NOTCOMPLYRETURN:
        return "In Comply Return";
      case Dvat24Reason.NOTFURNISHED:
        return "Not Furnished ";
      default:
        return "In Complete Furnished";
    }
  };
  return (
    <>
      <div
        className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4"
        id="mainpdf"
      >
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-white rounded-full"></div>
              <h1 className="text-2xl font-bold text-white">DVAT 24 Notice</h1>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Taxpayer Details Section */}
          <div className="border-b border-gray-200">
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Details Of Taxpayer
              </h2>
            </div>
          </div>
          <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                User TIN Number
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.dvat?.tinNumber}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.user?.firstName} - {data?.user?.lastName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.user?.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Mobile
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.user?.mobileOne}
              </p>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Address
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.user?.address}
              </p>
            </div>
          </div>
          {/* Notice Details Section */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ref Number
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {capitalcase(data?.notice.ref_no ?? "").toUpperCase()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reason For Notice
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {getReason(data?.notice.dvat24_reason)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    data?.notice.status === "PAID"
                      ? "bg-green-100 text-green-800"
                      : data?.notice.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {capitalcase(data?.notice.status ?? "")}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Issue Date
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {dayjs(data?.notice.issue_date).format("DD/MM/YYYY")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Due Date
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {dayjs(data?.notice.due_date).format("DD/MM/YYYY")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tax Period From - To
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {dayjs(new Date(data?.notice.tax_period_from!)).format(
                    "DD/MM/YYYY",
                  )}{" "}
                  -{" "}
                  {dayjs(new Date(data?.notice.tax_period_to!)).format(
                    "DD/MM/YYYY",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Table and Form Section */}
          <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex-1">
              <Table className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50">
                    <TableHead className="whitespace-nowrap text-center px-4 py-3 border font-semibold text-gray-900">
                      Payment of account of
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center px-4 py-3 w-60 border font-semibold text-gray-900">
                      Tax (&#x20b9;)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Tax
                    </TableCell>
                    <TableCell className="text-center px-4 py-3 border font-semibold text-gray-900">
                      {data?.notice.tax}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Interest
                    </TableCell>
                    <TableCell className="text-center px-4 py-3 border font-semibold text-gray-900">
                      {data?.notice.interest}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Penalty
                    </TableCell>
                    <TableCell className="text-center px-4 py-3 border font-semibold text-gray-900">
                      {data?.notice.penalty}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Late Fees
                    </TableCell>
                    <TableCell className="text-center px-4 py-3 border font-semibold text-gray-900">
                      {data?.notice.latefees}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Others
                    </TableCell>
                    <TableCell className="text-center px-4 py-3 border font-semibold text-gray-900">
                      {data?.notice.others}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors bg-blue-50">
                    <TableCell className="text-left px-4 py-3 border font-semibold text-gray-900">
                      Total Tax Amount:
                    </TableCell>
                    <TableCell className="px-4 py-3 border text-center font-bold text-blue-600">
                      {getTotalAmount()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-blue-50 transition-colors">
                    <TableCell className="text-left px-4 py-3 border font-medium text-gray-900">
                      Total amount paid (in words): Rupees
                    </TableCell>
                    <TableCell className="text-left px-4 py-3 border font-semibold text-gray-900">
                      {capitalcase(toWords.convert(getTotalAmount()))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="lg:w-96 shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Form DVAT 24
                  </h3>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                    (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                    Value Added Tax Rules, 2021)
                  </p>
                  <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                    Notice of default assessment of tax and interest under
                    section 32.
                  </p>
                </div>

                {data?.notice.remark != null &&
                  data?.notice.remark != undefined &&
                  data?.notice.remark != "" && (
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Remark
                      </p>
                      <p className="text-sm text-gray-900">
                        {data?.notice.remark}
                      </p>
                    </div>
                  )}

                <div className="w-full flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    type="primary"
                    size="large"
                    className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-md"
                    onClick={() => {
                      router.push(
                        `/dashboard/payments/saved-challan/${encryptURLData(
                          data?.notice.challanId!.toString() ?? "",
                        )}`,
                      );
                    }}
                  >
                    {data?.notice.status == "PAID" ? "View Challan" : "Pay"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dvat24Page;
