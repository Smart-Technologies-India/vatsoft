"use client";

import GetChallan from "@/action/challan/getchallan";
import { challan, dvat04, user } from "@prisma/client";
import { getCookie } from "cookies-next";
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

const ChallanData = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const challanid = parseInt(Array.isArray(id) ? id[0] : id);
  const current_user_id: number = parseInt(
    searchParams.get("userid") || getCookie("id") || "0",
    10
  );
  const [isLoading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);

  const toWords = new ToWords();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user_response = await GetUser({
        id: current_user_id,
      });
      if (user_response.data && user_response.status) {
        setUser(user_response.data);
      }
      const dvat_response = await GetUserDvat04({
        userid: current_user_id,
      });
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
  }, [challanid, current_user_id]);

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
    if (!challanData || challanData == null) {
      return toast.error("There is no challan data.");
    }
    const response = await AddChallanPayment({
      id: challanData.id,
      userid: current_user_id,
      bank_name: data.bank_name,
      track_id: data.track_id,
      transaction_id: data.transaction_id,
    });

    if (!response.status) return toast.error(response.message);

    toast.success(response.message);
    router.back();
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-2 mainpdf" id="mainpdf">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Challan</div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-2">
            GST Challan
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">CPIN</p>
              <p className="text-sm  font-medium">{challanData?.cpin}</p>
            </div>
            <div>
              <p className="text-sm">Status</p>
              <p className="text-sm  font-medium">
                {challanData?.challanstatus}
              </p>
            </div>
            <div>
              <p className="text-sm">Challan Generation Date</p>
              <p className="text-sm  font-medium">
                {formatDateTime(new Date(challanData?.createdAt!))}
              </p>
            </div>
            <div>
              <p className="text-sm">Challan Expiry Date</p>
              <p className="text-sm  font-medium">
                {formatDateTime(new Date(challanData?.expire_date!))}
              </p>
            </div>
          </div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Taxpayer
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">Name</p>
              <p className="text-sm  font-medium">
                {user?.firstName} - {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm">Email</p>
              <p className="text-sm  font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm">Mobile</p>
              <p className="text-sm  font-medium">{user?.mobileOne}</p>
            </div>
            <div>
              <p className="text-sm">User TIN Number</p>
              <p className="text-sm  font-medium">{dvat?.tinNumber}</p>
            </div>
            <div>
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{user?.address}</p>
            </div>
          </div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Reason for challan
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4  gap-2  px-4">
            <div>
              <p className="text-sm">Reason for challan</p>
              <p className="text-sm font-medium">
                {capitalcase(challanData?.reason ?? "")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Table className="border mt-2">
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
                  <TableCell className="text-left p-2 border">
                    VAT(0005)
                  </TableCell>
                  <TableCell className="text-center p-2 border ">
                    {challanData?.vat}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Interest(0008)
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.interest}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    CESS(0009)
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {challanData?.cess}
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
                        parseInt(challanData?.total_tax_amount ?? "0")
                      )
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="w-96">
              {challanData?.challanstatus == "PAID" ? (
                <>
                  <div className="p-2 flex flex-col gap-2 border bg-gray-100 mt-2">
                    <div>
                      <p className="text-sm">Bank Name</p>
                      <p className="text-sm  font-medium">
                        {challanData?.bank_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Track Id</p>
                      <p className="text-sm  font-medium">
                        {challanData?.track_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Transaction Id</p>
                      <p className="text-sm  font-medium">
                        {challanData?.transaction_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Transaction Date</p>
                      <p className="text-sm  font-medium">
                        {formateDate(new Date(challanData?.transaction_date!))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2"></div>
                  <Button
                    className="hidden-print"
                    type="primary"
                    onClick={async (e) => {
                      await generatePDF(
                        `/dashboard/payments/saved-challan/${challanid}?sidebar=no&userid=${current_user_id}`
                      );
                    }}
                  >
                    Download Challan
                  </Button>
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit, onFormError)}>
                    <div className="mt-2">
                      <p>Bank Name</p>
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
                      <p>Transaction Id</p>
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
                      <p>Track Id</p>
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
                    <div className="flex  gap-2 mt-2">
                      {/* <div className="grow"></div> */}
                      {/* <Button
                        onClick={(e) => {
                          e.preventDefault();
                          router.back();
                        }}
                      >
                        Back
                      </Button> */}
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
                </>
              )}
            </div>
          </div>
          {challanData?.remark == null ||
          challanData?.remark == undefined ||
          challanData?.remark == "" ? (
            <></>
          ) : (
            <div className="mt-2 bg-gray-100 p-2 rounded-md">
              <p>Remark</p>
              <Separator />
              <p>{challanData?.remark}</p>
            </div>
          )}

          <div className="p-2">
            <p className="text-center text-xl font-semibold">Form DVAT 20</p>
            <p className="mt-2 text-sm">
              (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu Value
              Added Tax Rules, 2021)
            </p>
            <p className="mt-3 text-sm">
              Challan for the Dadra and Nagar Haveli and Daman and Diu Value
              Added Regulation, 2005
            </p>
            <p className="mt-3 text-sm">Credited: Consolidated Fund of India</p>
            <p className="mt-3 text-sm">
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
