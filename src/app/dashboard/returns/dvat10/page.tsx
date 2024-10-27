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
import { capitalcase } from "@/utils/methods";
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
  return01: returns_01;
  notice: order_notice;
};
const Dvat10Page = () => {
  const router = useRouter();
  const searchParam = useSearchParams();
  const toWords = new ToWords();

  const [data, setData] = useState<ResponseType | null>(null);
  useEffect(() => {
    const id: string | null = searchParam.get("id");
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
      <div className="p-2" id="mainpdf">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">DVAT 10 Notice</div>
          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-2">
            Details Of Taxpayer
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">User TIN Number</p>
              <p className="text-sm  font-medium">{data?.dvat?.tinNumber}</p>
            </div>
            <div>
              <p className="text-sm">Name</p>
              <p className="text-sm  font-medium">
                {data?.user?.firstName} - {data?.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm">Email</p>
              <p className="text-sm  font-medium">{data?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm">Mobile</p>
              <p className="text-sm  font-medium">{data?.user?.mobileOne}</p>
            </div>
            <div>
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{data?.user?.address}</p>
            </div>
          </div>
          <div className="p-2 bg-gray-50 mt-2 flex gap-10">
            <div>
              <p className="text-sm">Ref Number</p>
              <p className="text-sm  font-medium">
                {(data?.notice.ref_no ?? "").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm">Reason For Notice</p>
              <p className="text-sm  font-medium">
                {getReason(data?.notice.dvat24_reason!)}
              </p>
            </div>

            <div>
              <p className="text-sm">Status</p>
              <p className="text-sm  font-medium">
                {capitalcase(data?.notice.status ?? "")}
              </p>
            </div>

            <div>
              <p className="text-sm">Issue Date</p>
              <p className="text-sm  font-medium">
                {dayjs(data?.notice.issue_date).format("DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-sm">Due Date</p>
              <p className="text-sm  font-medium">
                {dayjs(data?.notice.due_date).format("DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-center">
                Tax Period From - To
              </p>
              <p className="text-sm font-medium  text-center">
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

          <div className="flex gap-4">
            <div className="shrink-0 p-2 w-96">
              <p className="text-center text-xl font-semibold">Form DVAT 10</p>
              <p className="mt-2 text-sm">
                (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                Value Added Tax Rules, 2021)
              </p>
              <p className="mt-3 text-sm">
                Notice to return defaulter u/s 32 for not filing return. Type of
                Return: DVAT-16
              </p>
              {data?.notice.remark != null &&
                data?.notice.remark != undefined &&
                data?.notice.remark != "" && (
                  <div className="bg-gray-100 rounded-md p-2 mt-2">
                    <p>Remark</p>
                    <p>{data?.notice.remark}</p>
                  </div>
                )}

              {/* <div className="w-full flex gap-2 mt-2">
                <div className="grow"></div>
                <Button
                  onClick={() => {
                    router.back();
                  }}
                >
                  Back
                </Button>
              </div> */}
            </div>
            <div>
              <p className="mt-3 text-sm">
                1. Being a registered Seller, you are required to furnish return
                for the Sales made or received and to discharge resultant tax
                liability for the aforesaid tax period by due date. It has been
                noticed that you have not filed the said return till date.
              </p>
              <p className="mt-3 text-sm">
                2. You are, therefore, requested to furnish the said return
                within 15 days failing which the tax liability may be assessed
                u/s 32 of the regulation, based on the relevant material
                available with this office. Please note that in addition to tax
                so assessed, you will also be liable to pay interest and penalty
                as per provisions of the regulation.
              </p>
              <p className="mt-3 text-sm">
                3. Please note that no further communication will be issued for
                assessing the liability.
              </p>
              <p className="mt-3 text-sm">
                4. The notice shall be deemed to have been withdrawn in case the
                return referred above, is filed by you before issue of the
                assessment order.
              </p>
              <p className="mt-3 text-sm">
                5. This is a system generated notice and will not require
                signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dvat10Page;
