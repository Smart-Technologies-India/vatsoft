"use client";

import GetChallan, { ChallanWithReturn } from "@/action/challan/getchallan";
import { dvat04 } from "@prisma/client";
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
} from "@/utils/methods";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";
import AddChallanPayment from "@/action/challan/addchallanpayment";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetUser from "@/action/user/getuser";
import { Button } from "antd";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import ServerTime from "@/action/servertime";

const parseLiquorRemark = (remark?: string | null) => {
  const value = remark ?? "";
  return {
    invoiceNo: value.match(/INVOICE_NO:([^#]*)/)?.[1] ?? "N/A",
    sellerTin: value.match(/SELLER_TIN:([^#]*)/)?.[1] ?? "N/A",
  };
};

const LiquorSaleChallan = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const challanid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );
  const [userid, setUserid] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isUserRole, setIsUserRole] = useState<boolean>(false);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
  const [challanData, setChallanData] = useState<ChallanWithReturn | null>(
    null,
  );
  const [isOnlineProcessing, setIsOnlineProcessing] = useState(false);

  const toWords = new ToWords({ localeCode: "en-IN" });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const loggedInUserResponse = await GetUser({ id: authResponse.data });
      setIsUserRole(
        !!loggedInUserResponse.status &&
          (loggedInUserResponse.data?.role ?? "").toUpperCase() === "USER",
      );

      const dvat_response = await GetUserDvat04();
      if (dvat_response.data && dvat_response.status) {
        setDvat(dvat_response.data);
      }

      const challan_response = await GetChallan({ id: challanid });
      if (challan_response.status && challan_response.data) {
        setChallanData(challan_response.data);
      }

      setLoading(false);
    };
    init();
  }, [challanid]);

  const onOnlinePayment = async () => {
    if (!challanData) {
      return toast.error("There is no challan data.");
    }
    if (new Date(challanData.expire_date) < new Date()) {
      return toast.error(
        "This challan has expired. Click 'Pay VAT' on the invoice again to generate a new one.",
      );
    }
    setIsOnlineProcessing(true);
    try {
      const response = await AddChallanPayment({
        id: challanData.id,
        userid: userid,
      });

      if (!response.status) return toast.error(response.message);
      if (!response.data?.order_id) {
        return toast.error("Unable to initialize payment session.");
      }

      router.push(
        `/payamount?pi=${encodeURIComponent(response.data.order_id)}`,
      );
    } finally {
      setIsOnlineProcessing(false);
    }
  };

  const downloadChallan = async () => {
    await generatePDF(
      `/dashboard/stock/liquor-challan/${encryptURLData(
        challanid.toString(),
      )}?sidebar=no&userid=${userid}`,
    );
  };

  const isPrintMode = searchParams.get("sidebar") === "no";
  const { invoiceNo, sellerTin } = parseLiquorRemark(challanData?.remark);
  const isPaid = challanData?.paymentstatus === "PAID";

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  if (!challanData)
    return (
      <div className="h-screen w-full grid place-items-center text-xl text-gray-600 bg-gray-200">
        Challan not found.
      </div>
    );

  /* ─── PRINT / PDF LAYOUT ─────────────────────────────────── */
  if (isPrintMode) {
    const labelStyle = { fontSize: "9px", color: "#666" };
    const sectionHeader = {
      backgroundColor: "#e8e8e8",
      padding: "4px 8px",
      fontWeight: "bold",
      fontSize: "10px",
      borderBottom: "1px solid #ccc",
    } as const;
    const box = {
      border: "1px solid #ccc",
      borderRadius: "4px",
      marginBottom: "6px",
    };

    return (
      <>
        <style>{`
          @page { size: A4 portrait; margin: 12mm 14mm; }
          @media print {
            html, body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          body { font-family: Arial, sans-serif; }
        `}</style>

        <div
          style={{
            width: "100%",
            fontSize: "11px",
            color: "#111",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              borderBottom: "2px solid #000",
              paddingBottom: "6px",
              marginBottom: "6px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "9px", letterSpacing: "1px", color: "#555" }}
            >
              GOVERNMENT OF INDIA
            </div>
            <div
              style={{ fontSize: "14px", fontWeight: "bold", marginTop: "2px" }}
            >
              Dadra &amp; Nagar Haveli and Daman &amp; Diu Value Added Tax
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold" }}>
              FORM DVAT 20 — LIQUOR SALE VAT CHALLAN
            </div>
            <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>
              (See Rule 28 of the DDDNH Value Added Tax Rules, 2021)
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "4px",
              border: "1px solid #ccc",
              padding: "6px",
              marginBottom: "6px",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div>
              <div style={labelStyle}>CPIN</div>
              <div style={{ fontWeight: "bold" }}>{challanData.cpin}</div>
            </div>
            <div>
              <div style={labelStyle}>Payment Status</div>
              <div style={{ fontWeight: "bold" }}>
                {challanData.paymentstatus || "CREATED"}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Generated On</div>
              <div style={{ fontWeight: "bold" }}>
                {formatDateTime(new Date(challanData.createdAt))}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Expiry Date</div>
              <div style={{ fontWeight: "bold" }}>
                {formatDateTime(new Date(challanData.expire_date))}
              </div>
            </div>
          </div>

          <div style={box}>
            <div style={sectionHeader}>TAXPAYER DETAILS</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "4px",
                padding: "6px",
              }}
            >
              <div>
                <div style={labelStyle}>TIN Number</div>
                <div style={{ fontWeight: "600" }}>{dvat?.tinNumber}</div>
              </div>
              <div>
                <div style={labelStyle}>Name</div>
                <div style={{ fontWeight: "600" }}>
                  {dvat?.tradename ?? "N/A"}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Mobile</div>
                <div style={{ fontWeight: "600" }}>
                  {dvat?.contact_one ?? "N/A"}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Email</div>
                <div style={{ fontWeight: "600" }}>{dvat?.email ?? "N/A"}</div>
              </div>
              <div style={{ gridColumn: "span 4" }}>
                <div style={labelStyle}>Address</div>
                <div style={{ fontWeight: "600" }}>
                  {dvat?.address ?? "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div style={box}>
            <div style={sectionHeader}>CHALLAN INFORMATION</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "4px",
                padding: "6px",
              }}
            >
              <div>
                <div style={labelStyle}>Reason for Challan</div>
                <div style={{ fontWeight: "600" }}>Liquor Sale VAT</div>
              </div>
              <div>
                <div style={labelStyle}>Invoice No.</div>
                <div style={{ fontWeight: "600" }}>{invoiceNo}</div>
              </div>
              <div>
                <div style={labelStyle}>Seller TIN Number</div>
                <div style={{ fontWeight: "600" }}>{sellerTin}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 220px",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <div style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#e8e8e8" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 8px",
                        borderBottom: "1px solid #ccc",
                        borderRight: "1px solid #ccc",
                      }}
                    >
                      Payment on account of
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "4px 8px",
                        borderBottom: "1px solid #ccc",
                        width: "120px",
                      }}
                    >
                      Tax (&#x20b9;)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["VAT", challanData.vat],
                    ["Interest", challanData.interest],
                    ["Late Fees", challanData.latefees],
                    ["Penalty", challanData.penalty],
                  ].map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #eee" }}>
                      <td
                        style={{
                          padding: "4px 8px",
                          borderRight: "1px solid #ccc",
                        }}
                      >
                        {label}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {val}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold" }}>
                    <td
                      style={{
                        padding: "4px 8px",
                        borderRight: "1px solid #ccc",
                        borderTop: "1px solid #ccc",
                      }}
                    >
                      Total Challan Amount
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                        borderTop: "1px solid #ccc",
                      }}
                    >
                      {challanData.total_tax_amount}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: "4px 8px",
                        borderTop: "1px solid #eee",
                        fontSize: "10px",
                      }}
                    >
                      <span style={{ color: "#555" }}>Amount in words: </span>
                      <strong>
                        {capitalcase(
                          toWords.convert(
                            parseInt(challanData.total_tax_amount ?? "0"),
                          ),
                        )}{" "}
                        Rupees Only
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "6px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "10px",
                  marginBottom: "6px",
                  borderBottom: "1px solid #ddd",
                  paddingBottom: "4px",
                }}
              >
                {isPaid ? "PAYMENT CONFIRMATION" : "PAYMENT DETAILS"}
              </div>
              {(isPaid
                ? [
                    {
                      label: "Bank Name",
                      value: challanData.bank_name || "N/A",
                    },
                    { label: "Track ID", value: challanData.track_id || "N/A" },
                    {
                      label: "Transaction Date",
                      value: challanData.transaction_date
                        ? formateDate(new Date(challanData.transaction_date))
                        : "N/A",
                    },
                  ]
                : [
                    { label: "Payment Mode", value: "ONLINE" },
                    {
                      label: "Payable Amount",
                      value: challanData.total_tax_amount,
                    },
                  ]
              ).map((item) => (
                <div key={item.label} style={{ marginBottom: "6px" }}>
                  <div style={labelStyle}>{item.label}</div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "500",
                      color: "#333",
                      paddingTop: "2px",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...box, padding: "6px" }}>
            <span style={{ fontWeight: "bold", fontSize: "9px" }}>
              Remark:{" "}
            </span>
            <span style={{ fontSize: "10px" }}>
              Liquor Sale VAT — Invoice No: {invoiceNo}, Seller TIN: {sellerTin}
            </span>
          </div>

          <div
            style={{
              borderTop: "1px solid #ccc",
              paddingTop: "6px",
              fontSize: "9px",
              color: "#444",
            }}
          >
            <div>
              Challan for the Dadra and Nagar Haveli and Daman and Diu Value
              Added Tax Regulation, 2005
            </div>
            <div style={{ marginTop: "2px" }}>
              Credited: Consolidated Fund of India
            </div>
            <div style={{ marginTop: "2px" }}>
              Head: 0040, Value Added Tax Receipt — Value Added Tax Receipt
            </div>
          </div>
        </div>
      </>
    );
  }
  /* ─── END PRINT LAYOUT ───────────────────────────────────── */

  return (
    <div className="mainpdf min-h-screen bg-gray-100 p-3 md:p-6" id="mainpdf">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="rounded-t-2xl border-b border-dashed border-gray-300 bg-gray-50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500">
                VAT DDDNH • LIQUOR SALE VAT
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                Challan Receipt
              </h1>
              <p className="mt-1 text-sm text-gray-600">Form DVAT 20</p>
            </div>
            <div className="rounded-md border border-gray-300 bg-white px-3 py-2 text-right">
              <p className="text-xs text-gray-500">Receipt Date</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDateTime(ServerTime().data as Date)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-dashed border-gray-300 bg-gray-50/70 px-5 py-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">CPIN</p>
            <p className="text-sm font-semibold text-gray-900">
              {challanData.cpin}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Status</p>
            <p className="text-sm font-semibold text-gray-900">
              {challanData.paymentstatus || "CREATED"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Generated On</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDateTime(new Date(challanData.createdAt))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expiry Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDateTime(new Date(challanData.expire_date))}
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
                  {dvat?.tradename ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {dvat?.email ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-sm font-medium text-gray-900">
                  {dvat?.contact_one ?? "N/A"}
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
                <p className="text-sm font-medium text-gray-900">
                  {dvat?.address ?? "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
              Challan Information
            </div>
            <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Reason for Challan</p>
                <p className="text-sm font-medium text-gray-900">
                  Liquor Sale VAT
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Mode</p>
                <p className="text-sm font-medium text-gray-900">
                  {challanData.paymentmode || "ONLINE"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoice No.</p>
                <p className="text-sm font-medium text-gray-900">{invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Seller TIN Number</p>
                <p className="text-sm font-medium text-gray-900">{sellerTin}</p>
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
                {[
                  ["VAT", challanData.vat],
                  ["Interest", challanData.interest],
                  ["Late Fees", challanData.latefees],
                  ["Penalty", challanData.penalty],
                  ["Total Challan Amount:", challanData.total_tax_amount],
                  [
                    "Total Challan Amount (In Words):",
                    capitalcase(
                      toWords.convert(
                        parseInt(challanData.total_tax_amount ?? "0"),
                      ),
                    ),
                  ],
                ].map(([label, val]) => (
                  <TableRow key={label}>
                    <TableCell className="text-left p-2 border">
                      {label}
                    </TableCell>
                    <TableCell className="text-center p-2 border">
                      {val}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              {isPaid ? (
                <>
                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Payment Confirmation
                    </p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Bank Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {challanData.bank_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Track Id</p>
                        <p className="text-sm font-medium text-gray-900">
                          {challanData.track_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          Transaction Date
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {challanData.transaction_date
                            ? formateDate(
                                new Date(challanData.transaction_date),
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button
                      className="w-full"
                      type="primary"
                      onClick={downloadChallan}
                    >
                      Download Challan
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() =>
                        router.push("/dashboard/stock/view_purchase")
                      }
                    >
                      Back to Purchases
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-900">
                    Online Payment
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    You will be redirected to the payment gateway to pay the VAT
                    for this liquor sale invoice.
                  </p>

                  <div className="mt-3 flex items-center justify-between rounded-md bg-white p-2 border border-blue-100">
                    <span className="text-sm text-gray-600">
                      Payable Amount
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {challanData.total_tax_amount ?? "0"}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 justify-end">
                    <Button
                      disabled={isOnlineProcessing}
                      onClick={downloadChallan}
                    >
                      Download Challan
                    </Button>
                    {isUserRole && (
                      <Button
                        type="primary"
                        disabled={isOnlineProcessing}
                        onClick={onOnlinePayment}
                      >
                        {isOnlineProcessing ? "Redirecting..." : "Pay Online"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Remark</p>
            <Separator />
            <p className="mt-2 text-sm text-gray-800">
              Liquor Sale VAT — Invoice No: {invoiceNo}, Seller TIN: {sellerTin}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-b-2xl border-t border-dashed border-gray-300 bg-gray-50 px-5 py-4">
          <p className="text-center text-lg font-semibold text-gray-800">
            Form DVAT 20
          </p>
          <p className="mt-2 text-sm text-gray-700">
            (See Rule 28 of the Dadra and Nagar Haveli and Daman and Diu Value
            Added Tax Rules, 2021)
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Challan for the Dadra and Nagar Haveli and Daman and Diu Value Added
            Regulation, 2005
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Credited: Consolidated Fund of India
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Head: 0040, Value Added Tax Receipt - Value Added Tax Receipt
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiquorSaleChallan;
