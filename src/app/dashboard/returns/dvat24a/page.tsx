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
const Dvat24APage = () => {
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
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">DVAT 24-A Notice</div>
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
          </div>

          <div className="flex gap-4">
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap text-center px-2 border">
                    Payment of account of
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                    Tax (&#x20b9;)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-left p-2 border">Tax</TableCell>
                  <TableCell className="text-center p-2 border ">
                    <p>{data?.notice.tax}</p>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Penalty
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    <p>{data?.notice.interest}</p>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total Tax Amount:
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {getTotalAmount()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total amount paid (in words): Rupees
                  </TableCell>
                  <TableCell className="text-left p-2 border">
                    {toWords.convert(getTotalAmount())}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="w-96 shrink-0 p-2">
              <p className="text-center text-xl font-semibold">Form DVAT 24A</p>
              <p className="mt-2 text-sm">
                (See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu
                Value Added Tax Rules, 2021)
              </p>
              <p className="mt-3 text-sm">
                Notice of assessment of penalty under section 33.
              </p>

              {data?.notice.remark != null &&
                data?.notice.remark != undefined &&
                data?.notice.remark != "" && (
                  <div className="bg-gray-100 rounded-md p-2 mt-2">
                    <p>Remark</p>
                    <p>{data?.notice.remark}</p>
                  </div>
                )}

              <div className="w-full flex gap-2 mt-2">
                <div className="grow"></div>
                <Button
                  type="primary"
                  onClick={() => {
                    router.push(
                      `/dashboard/payments/saved-challan/${data?.notice.challanId}`
                    );
                  }}
                >
                  {data?.notice.status == "PAID" ? "View Challan" : "Pay"}
                </Button>
                {/* <Button
                  onClick={() => {
                    router.back();
                  }}
                >
                  Back
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dvat24APage;
