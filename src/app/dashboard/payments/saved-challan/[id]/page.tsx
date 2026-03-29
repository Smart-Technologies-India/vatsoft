"use client";

import GetChallan from "@/action/challan/getchallan";
import { challan, dvat04, user } from "@prisma/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToWords } from "to-words";
import {
  capitalcase,
  decryptURLData,
  encryptURLData,
  formatDateTime,
  formateDate,
  generatePDF,
  onFormError,
} from "@/utils/methods";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import {
  SubmitPaymentForm,
  SubmitPaymentSchema,
} from "@/schema/subtmitpayment";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { toast } from "react-toastify";
import AddChallanPayment from "@/action/challan/addchallanpayment";
import GetUser from "@/action/user/getuser";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { Button } from "antd";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { customAlphabet } from "nanoid";

const ChallanData = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const challanid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );
  const [userid, setUserid] = useState<number>(0);

  // const current_user_id: number = parseInt(
  //   searchParams.get("userid") || getCookie("id") || "0",
  //   10
  // );
  const [isLoading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);

  const toWords = new ToWords();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const current_user_id = searchParams.get("userid")
        ? parseInt(searchParams.get("userid")!)
        : authResponse.data;

      const user_response = await GetUser({
        id: current_user_id,
      });
      if (user_response.data && user_response.status) {
        setUser(user_response.data);
      }
      const dvat_response = await GetUserDvat04();
      if (dvat_response.data && dvat_response.status) {
        setDvat(dvat_response.data);
      }

      const challan_resposne = await GetChallan({
        id: challanid,
      });
      if (challan_resposne.data && challan_resposne.data) {
        setChallanData(challan_resposne.data);
      }

      setLoading(false);
    };
    init();
  }, [challanid, userid]);

  const [challanData, setChallanData] = useState<challan | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmitPaymentForm>({
    resolver: valibotResolver(SubmitPaymentSchema),
  });

  const onSubmit = async (data: SubmitPaymentForm) => {
    const nanoid = customAlphabet("1234567890abcdef", 10);

    const uniqueid: string = nanoid();
    if (!challanData || challanData == null) {
      return toast.error("There is no challan data.");
    }
    const response = await AddChallanPayment({
      id: challanData.id,
      userid: userid,
      // bank_name: data.bank_name,
      // track_id: data.track_id,
      // transaction_id: data.transaction_id,
    });

    if (!response.status) return toast.error(response.message);

    router.push(
      `/payamount?xlmnx=${challanData?.total_tax_amount}&ynboy=${uniqueid}&zgvfz=${response.data?.id}_${dvat?.id}_0_DEMAND`,
    );

    // toast.success(response.message);
    // router.back();
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="mainpdf min-h-screen bg-gray-100 p-3 md:p-6" id="mainpdf">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="rounded-t-2xl border-b border-dashed border-gray-300 bg-gray-50 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500">
                  VAT DDDNH • PAYMENT RECEIPT
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                  Challan Receipt
                </h1>
                <p className="mt-1 text-sm text-gray-600">Form DVAT 20</p>
              </div>
              <div className="rounded-md border border-gray-300 bg-white px-3 py-2 text-right">
                <p className="text-xs text-gray-500">Receipt Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatDateTime(new Date())}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-dashed border-gray-300 bg-gray-50/70 px-5 py-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">CPIN</p>
              <p className="text-sm font-semibold text-gray-900">
                {challanData?.cpin}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Payment Status</p>
              <p className="text-sm font-semibold text-gray-900">
                {challanData?.paymentstatus || "CREATED"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Generated On</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDateTime(new Date(challanData?.createdAt!))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Expiry Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDateTime(new Date(challanData?.expire_date!))}
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                Taxpayer Details
              </div>
              <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} - {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.mobileOne}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">TIN Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {dvat?.tinNumber}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{user?.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                Challan Information
              </div>
              <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Reason for Challan</p>
                  <p className="text-sm font-medium text-gray-900">
                    {capitalcase(challanData?.reason ?? "")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Mode</p>
                  <p className="text-sm font-medium text-gray-900">
                    {challanData?.paymentmode || "ONLINE"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              <Table className="border border-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="whitespace-nowrap text-center px-2 border"></TableHead>
                  <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                    Tax (&#x20b9;)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-left p-2 border">VAT</TableCell>
                  <TableCell className="text-center p-2 border ">
                    {challanData?.vat}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Interest
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.interest}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Late Fees
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.latefees}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Penalty
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.penalty}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">Others</TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.others}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total Challan Amount:
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.total_tax_amount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total Challan Amount (In Words):
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {capitalcase(
                      toWords.convert(
                        parseInt(challanData?.total_tax_amount ?? "0"),
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                {challanData?.paymentstatus == "PAID" ? (
                  <>
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Payment Confirmation
                      </p>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Bank Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {challanData?.bank_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Track Id</p>
                          <p className="text-sm font-medium text-gray-900">
                            {challanData?.track_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Transaction Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formateDate(new Date(challanData?.transaction_date!))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        className="hidden-print w-full"
                        type="primary"
                        onClick={async (e) => {
                          await generatePDF(
                            `/dashboard/payments/saved-challan/${encryptURLData(
                              challanid.toString(),
                            )}?sidebar=no&userid=${userid}`,
                          );
                        }}
                      >
                        Download Challan
                      </Button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit, onFormError)}>
                    <p className="text-sm font-semibold text-gray-800">
                      Complete Payment
                    </p>
                    <div className="mt-3">
                      <p className="text-sm">Bank Name</p>
                      <input
                        className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                          errors.bank_name
                            ? "border-red-500"
                            : "hover:border-blue-500"
                        }`}
                        placeholder="Bank Name"
                        {...register("bank_name")}
                        type="text"
                      />
                      {errors.bank_name && (
                        <p className="text-xs text-red-500">
                          {errors.bank_name.message?.toString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">Transaction Id</p>
                      <input
                        className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500 ${
                          errors.transaction_id
                            ? "border-red-500"
                            : "hover:border-blue-500"
                        }`}
                        placeholder="Transaction id"
                        {...register("transaction_id")}
                      />
                      {errors.transaction_id && (
                        <p className="text-xs text-red-500">
                          {errors.transaction_id.message?.toString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">Track Id</p>
                      <input
                        className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                          errors.track_id
                            ? "border-red-500"
                            : "hover:border-blue-500"
                        }`}
                        placeholder="Track Id"
                        {...register("track_id")}
                      />
                      {errors.track_id && (
                        <p className="text-xs text-red-500">
                          {errors.track_id.message?.toString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.preventDefault();
                          reset({});
                        }}
                      >
                        Reset
                      </Button>
                      <input
                        type="submit"
                        value={"Pay Challan"}
                        className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
                      />
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {challanData?.remark == null ||
          challanData?.remark == undefined ||
          challanData?.remark == "" ? (
            <></>
          ) : (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">Remark</p>
              <Separator />
              <p className="mt-2 text-sm text-gray-800">{challanData?.remark}</p>
            </div>
          )}

          <div className="mt-4 rounded-b-2xl border-t border-dashed border-gray-300 bg-gray-50 px-5 py-4">
            <p className="text-center text-lg font-semibold text-gray-800">
              Form DVAT 20
            </p>
            <p className="mt-2 text-sm text-gray-700">
              (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu Value
              Added Tax Rules, 2021)
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Challan for the Dadra and Nagar Haveli and Daman and Diu Value
              Added Regulation, 2005
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Credited: Consolidated Fund of India
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Head: 0040, Value Added Tax Receipt - Value Added Tax Receipt
            </p>
            {/* <p className="text-sm">
              <span className="font-semibold">Note:</span>
              For taxpayer filing VAT on quarterly basis:
            </p>
            <p className="text-sm mt-1">
              1. To make payment for the first (M1) and second (M2) months of
              the quarter, please select reason as &lsquo;Monthly Payment for
              Quarterly Return&lsquo; and the relevant period (financial year,
              month) and choose whether to pay through 35% challan or
              self-assessment challan.
            </p>
            <p className="text-sm mt-1">
              2. To make payment for the third month of the Quarter (M3), please
              use &apos;Create Challan&apos; option in payment Table-6 of Form
              VAT Quarterly. An auto- populated challan amounting to liabilities
              for the quarter net off credit utilization and existing cash
              balance can be generated and used to offset liabilities.
            </p> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallanData;
