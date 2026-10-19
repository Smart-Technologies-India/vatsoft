"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { decryptURLData, encryptURLData } from "@/utils/methods";
import GetReturn01 from "@/action/return/getreturn";
import AddPaymentOnline from "@/action/return/addpaymentonline";
import { returns_01, dvat04, registration } from "@prisma/client";
import { Button, Spin, Card, Divider } from "antd";

const PayChallanOneRupee = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string | string[] }>();
  const returnId: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  const [userid, setUserid] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >(null);

  useEffect(() => {
    const init = async () => {
      try {
        const authResponse = await getAuthenticatedUserId();
        if (!authResponse.status || !authResponse.data) {
          toast.error(authResponse.message);
          router.push("/");
          return;
        }
        setUserid(authResponse.data);

        const returnResponse = await GetReturn01({
          id: returnId,
        });

        if (!returnResponse.status) {
          toast.error(returnResponse.message || "Failed to fetch return data");
          router.push("/");
          return;
        }

        setReturn01(returnResponse.data);
      } catch (error) {
        console.error("Error initializing page:", error);
        toast.error("Error loading page");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handlePayOneRupee = async () => {
    if (!return01) {
      toast.error("Return data not found");
      return;
    }

    setProcessing(true);
    try {
      const response = await AddPaymentOnline({
        returnid: returnId,
        userid: userid,
        amount: 1,
        month: return01.month,
        year: return01.year,
      });

      if (response.status) {
        toast.success("₹1 payment initiated successfully!");

        // Redirect back to preview page after successful payment
        setTimeout(() => {
          router.push(
            `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
              returnId.toString(),
            )}?year=${searchParams.get("year") || ""}&month=${searchParams.get("month") || ""}`,
          );
        }, 1500);
      } else {
        toast.error(response.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error processing payment");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!return01) {
    return (
      <div className="p-4">
        <div className="bg-white p-4 shadow mt-4">
          <h1 className="text-lg font-semibold text-red-600">
            Error: Return data not found
          </h1>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="bg-white p-4 shadow mt-4">
        <div className="bg-blue-500 p-3 text-white mb-4">
          <h1 className="text-lg font-semibold">Pay Outstanding Amount (₹1)</h1>
        </div>

        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-semibold text-gray-700">Company Name:</label>
              <p className="text-gray-900">{return01.dvat04.tradename}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">TIN Number:</label>
              <p className="text-gray-900">{return01.dvat04.tinNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-semibold text-gray-700">Period:</label>
              <p className="text-gray-900">
                {return01.month} {return01.year}
              </p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Return Type:</label>
              <p className="text-gray-900">{return01.return_type}</p>
            </div>
          </div>

          <Divider />

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> You have a pending
              amount of ₹<span className="font-bold text-lg">1</span> to be paid
              to complete your return filing. This is often due to rounding
              differences in tax calculations.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Amount to Pay:</p>
                <p className="text-3xl font-bold text-blue-600">₹1</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Please proceed with payment</p>
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex gap-3 justify-end mt-6">
            <Button
              onClick={() => router.back()}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handlePayOneRupee}
              loading={processing}
              disabled={processing}
            >
              {processing ? "Processing..." : "Pay ₹1 Now"}
            </Button>
          </div>
        </Card>

        <div className="text-xs text-gray-500 mt-4">
          <p>
            * After successful payment, you will be redirected to the return
            preview page
          </p>
          <p>* Payment is processed immediately through the payment gateway</p>
        </div>
      </div>
    </div>
  );
};

export default PayChallanOneRupee;
