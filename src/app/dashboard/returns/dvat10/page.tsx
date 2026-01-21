"use client";
import GetNotice from "@/action/notice_order/getnotice";

import { capitalcase, decryptURLData } from "@/utils/methods";
import {
  dvat04,
  Dvat24Reason,
  order_notice,
  returns_01,
  user,
} from "@prisma/client";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ToWords } from "to-words";

type ResponseType = {
  user: user;
  dvat: dvat04;
  return01: returns_01;
  notice: order_notice;
};
const Dvat10Page = () => {
  const router = useRouter();
  const searchParam = useSearchParams();
  const toWords = new ToWords();

  const [data, setData] = useState<ResponseType | null>(null);
  useEffect(() => {
    const id: string = decryptURLData(searchParam.get("id") ?? "", router);

    const init = async () => {
      if (!id) {
        return router.back();
      }

      const response = await GetNotice({
        id: parseInt(id),
      });
      if (response.data && response.status && response.data.return01) {
        setData({
          dvat: response.data.dvat,
          notice: response.data.notice,
          return01: response.data.return01,
          user: response.data.user,
        });
      }
    };
    init();
  }, [router, searchParam]);

  const getTotalAmount = (): number => {
    const vat = parseFloat(data?.notice?.tax ?? "0");
    const interest = parseFloat(data?.notice?.interest ?? "0");

    const total: number =
      (isNaN(vat) ? 0 : vat) + (isNaN(interest) ? 0 : interest);

    return total;
  };
  const getReason = (reason: Dvat24Reason): string => {
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
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4" id="mainpdf">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                DVAT 10 Notice
              </h1>
              <p className="text-sm text-gray-500 mt-2 ml-4">
                Notice to return defaulter u/s 32 for not filing return
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-3">
            <p className="text-sm font-semibold text-white">Details Of Taxpayer</p>
          </div>
          <div className="p-6 bg-linear-to-r from-gray-50 to-blue-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">User TIN Number</p>
              <p className="text-sm font-semibold text-gray-900">{data?.dvat?.tinNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Name</p>
              <p className="text-sm font-semibold text-gray-900">
                {data?.user?.firstName} - {data?.user?.lastName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm font-semibold text-gray-900">{data?.user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Mobile</p>
              <p className="text-sm font-semibold text-gray-900">{data?.user?.mobileOne}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Address</p>
              <p className="text-sm font-semibold text-gray-900">{data?.user?.address}</p>
            </div>
          </div>
          
          <div className="p-6 bg-white border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Ref Number</p>
              <p className="text-sm font-semibold text-gray-900">
                {(data?.notice.ref_no ?? "").toUpperCase()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Reason For Notice</p>
              <p className="text-sm font-semibold text-gray-900">
                {getReason(data?.notice.dvat24_reason!)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Status</p>
              <p className="text-sm font-semibold text-gray-900">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {capitalcase(data?.notice.status ?? "")}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Issue Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {dayjs(data?.notice.issue_date).format("DD/MM/YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Due Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {dayjs(data?.notice.due_date).format("DD/MM/YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium text-center">
                Tax Period From - To
              </p>
              <p className="text-sm font-semibold text-gray-900 text-center">
                {dayjs(new Date(data?.notice.tax_period_from!)).format(
                  "DD/MM/YYYY"
                )}{" "}
                -{" "}
                {dayjs(new Date(data?.notice.tax_period_to!)).format(
                  "DD/MM/YYYY"
                )}
              </p>
            </div>
          </div>

          <div className="p-6 bg-linear-to-r from-gray-50 to-blue-50 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-center text-lg font-bold text-gray-900 mb-2">Form DVAT 10</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                  Value Added Tax Rules, 2021)
                </p>
                <p className="mt-3 text-xs text-gray-700 leading-relaxed">
                  Notice to return defaulter u/s 32 for not filing return. Type of
                  Return: DVAT-16
                </p>
                {data?.notice.remark != null &&
                  data?.notice.remark != undefined &&
                  data?.notice.remark != "" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                      <p className="text-xs font-semibold text-amber-900 mb-1">Remark</p>
                      <p className="text-xs text-amber-800">{data?.notice.remark}</p>
                    </div>
                  )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">1.</span> Being a registered Seller, you are required to furnish return
                  for the Sales made or received and to discharge resultant tax
                  liability for the aforesaid tax period by due date. It has been
                  noticed that you have not filed the said return till date.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">2.</span> You are, therefore, requested to furnish the said return
                  within 15 days failing which the tax liability may be assessed
                  u/s 32 of the regulation, based on the relevant material
                  available with this office. Please note that in addition to tax
                  so assessed, you will also be liable to pay interest and penalty
                  as per provisions of the regulation.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">3.</span> Please note that no further communication will be issued for
                  assessing the liability.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">4.</span> The notice shall be deemed to have been withdrawn in case the
                  return referred above, is filed by you before issue of the
                  assessment order.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">5.</span> This is a system generated notice and will not require
                  signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dvat10Page;
