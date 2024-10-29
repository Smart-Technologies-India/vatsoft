"use client";

import { dvat04, refunds, Role, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
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
import { FieldErrors, useForm } from "react-hook-form";
import {
  SubmitPaymentForm,
  SubmitPaymentSchema,
} from "@/schema/subtmitpayment";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { Button } from "antd";
import GetRefunds from "@/action/refund/getrefunds";
import AddRefundsPayment from "@/action/refund/addrefundspayment";
import GetUser from "@/action/user/getuser";

const RefundsData = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const refundsid = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router)
  );
  const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);

  const toWords = new ToWords();

  const [currentUser, setCurrentUser] = useState<user | null>();

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const refunds_resposne = await GetRefunds({
        id: refundsid,
      });
      if (refunds_resposne.data && refunds_resposne.data) {
        setRefundsData(refunds_resposne.data);
        setUser(refunds_resposne.data.createdBy);

        const dvat_response = await GetUserDvat04({
          userid: refunds_resposne.data.createdBy.id,
        });
        if (dvat_response.data && dvat_response.status) {
          setDvat(dvat_response.data);
        }
      }

      const current_user_response = await GetUser({
        id: current_user_id,
      });

      if (current_user_response.status && current_user_response.data) {
        setCurrentUser(current_user_response.data);
      }

      setLoading(false);
    };
    init();
  }, [refundsid, current_user_id]);

  const [refundsData, setRefundsData] = useState<refunds | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmitPaymentForm>({
    resolver: valibotResolver(SubmitPaymentSchema),
  });

  const onSubmit = async (data: SubmitPaymentForm) => {
    if (!refundsData || refundsData == null) {
      return toast.error("There is no refunds data.");
    }
    const response = await AddRefundsPayment({
      id: refundsData.id,
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
      <div className="p-2" id="mainpdf">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Refunds</div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-2">
            GST Refunds
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">CPIN</p>
              <p className="text-sm  font-medium">{refundsData?.cpin}</p>
            </div>
            <div>
              <p className="text-sm">Status</p>
              <p className="text-sm  font-medium">
                {refundsData?.refundsstatus}
              </p>
            </div>
            <div>
              <p className="text-sm">Refunds Generation Date</p>
              <p className="text-sm  font-medium">
                {formatDateTime(new Date(refundsData?.createdAt!))}
              </p>
            </div>
            <div>
              <p className="text-sm">Refunds Expiry Date</p>
              <p className="text-sm  font-medium">
                {formatDateTime(new Date(refundsData?.expire_date!))}
              </p>
            </div>
          </div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Taxpayer
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
            <div>
              <p className="text-sm">User TIN Number</p>
              <p className="text-sm  font-medium">{dvat?.tinNumber}</p>
            </div>
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
              <p className="text-sm">Reason for Refunds</p>
              <p className="text-sm font-medium">
                {capitalcase(refundsData?.reason ?? "")}
              </p>
            </div>
            <div className="col-span-3">
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{user?.address}</p>
            </div>
          </div>

          <div className="p-1 bg-gray-50 grid grid-cols-4  gap-2  px-4"></div>

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
                    {refundsData?.vat}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Interest(0008)
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {refundsData?.interest}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    CESS(0009)
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {refundsData?.cess}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Penalty
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {refundsData?.penalty}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">Others</TableCell>
                  <TableCell className="text-center p-2 border">
                    {refundsData?.others}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total Refunds Amount:
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {refundsData?.total_tax_amount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left p-2 border">
                    Total Refunds Amount (In Words):
                  </TableCell>
                  <TableCell className="text-center p-2 border">
                    {capitalcase(
                      toWords.convert(
                        parseInt(refundsData?.total_tax_amount ?? "0")
                      )
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="w-96">
              {refundsData?.refundsstatus == "PAID" ? (
                <>
                  <div className="p-2 flex flex-col gap-2 border bg-gray-100 mt-2">
                    <div>
                      <p className="text-sm">Bank Name</p>
                      <p className="text-sm  font-medium">
                        {refundsData?.bank_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Track Id</p>
                      <p className="text-sm  font-medium">
                        {refundsData?.track_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Transaction Id</p>
                      <p className="text-sm  font-medium">
                        {refundsData?.transaction_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Transaction Date</p>
                      <p className="text-sm  font-medium">
                        {formateDate(new Date(refundsData?.transaction_date!))}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-2 hidden-print"
                    type="primary"
                    onClick={() =>
                      generatePDF(
                        `/dashboard/payments/refunds/${encryptURLData(
                          refundsData.id.toString()
                        )}?sidebar=no`
                      )
                    }
                  >
                    Download receipt
                  </Button>
                </>
              ) : currentUser?.role == Role.USER ? (
                <>
                  <div className="p-2 flex flex-col gap-2 border bg-gray-100 mt-2">
                    <p>Your request is pending from the department side.</p>
                  </div>
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
                      {/* <div className="grow"></div>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          router.back();
                        }}
                      >
                        Back
                      </Button> */}
                      <Button
                        className="hidden-print"
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
                        value={"Pay Refunds"}
                        className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer hidden-print"
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4 mt-2">
            <div>
              <p className="text-sm">Previous CPIN</p>
              <p className="text-sm  font-medium">
                {refundsData?.oldcpin ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm">Previous Grievance Number</p>
              <p className="text-sm  font-medium">
                {refundsData?.old_grievance_number ?? "N/A"}
              </p>
            </div>
          </div>
          {refundsData?.remark == null ||
          refundsData?.remark == undefined ||
          refundsData?.remark == "" ? (
            <></>
          ) : (
            <div className="mt-2 bg-gray-100 p-2 rounded-md">
              <p>Remark</p>
              <Separator />
              <p>{refundsData?.remark}</p>
            </div>
          )}

          <div className="">
            <p className="text-xs border p-2 bg-gray-100 mt-2">
              Note: You may view the Electronic Liability Register that displays
              your liabilities/ dues of Returns and other than Returns. Hence,
              you may save this Refund Application and navigate to the dashboard
              to settle the dues first, or may proceed here to file the
              application. Please note that the recoverable dues shall be
              deducted from the gross amount to be paid from the Return Amount
              claimed in the refund application received, by the Refund
              Processing officer before processing the refund.
            </p>
            <Separator />
            <p className="text-left text-black text-lg mt-2">
              Upload Supporting Documents
            </p>
            <p className="text-xs border p-2 bg-gray-100">
              Note: In case you seek to change the preference of the bank
              account wnich is not appearing in the drop down list, please add
              bank account by filing non-core amendment of registration form.
            </p>
            <p className="text-xs border p-2 bg-gray-100 mt-2">
              Note: Taxpayers are expected to upload supporting documents while
              filing refund application.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RefundsData;
