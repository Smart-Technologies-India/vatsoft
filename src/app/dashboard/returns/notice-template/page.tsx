"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decryptURLData, formateDate } from "@/utils/methods";
import GetNotice from "@/action/notice_order/getnotice";
import { Button } from "antd";
import { MdiDownload } from "@/components/icons";
import { toast } from "react-toastify";

const NoticeTemplate = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam: string = searchParams.get("id") ?? "0";
  const noticeId: string = decryptURLData(idParam, router);
  const [noticeData, setNoticeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      if (!noticeId) {
        setTimeout(() => {
          setLoading(false);
          toast.error("No Notice found.");
        }, 1000);
        return;
      }
      const response = await GetNotice({ id: parseInt(noticeId) });
      if (response.status) {
        setNoticeData(response.data);
      } else {
        toast.error(response.message || "Failed to get notice.");
      }

      // Add 1000ms delay before hiding loading
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    fetchNotice();
  }, [noticeId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!noticeData) return <div className="p-8">Notice not found</div>;

  const notice = noticeData.notice;
  const dvatInfo = noticeData.dvat;

  const handleDownload = () => {
    window.print();
  };

  return (
    <div>
      <style>{`
     @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
          }
          .print-container {
            width: 100%;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
            display: flex;
            flex-direction: column;
            height: 100vh;
            page-break-inside: avoid;
          }
          .print-container > div:last-child {
            margin-top: auto;
          }
          .no-print {
            display: none !important;
          }
          .download-toolbar {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          td, th {
            border: 1px solid black;
            padding: 6px;
          }
          h2 {
            margin: 2px 0;
            font-size: 13px;
          }
          p {
            margin: 3px 0;
          }
          .text-center {
            text-align: center;
          }
          .text-justify {
            text-align: justify;
          }
          .font-bold {
            font-weight: bold;
          }
          .border-b-2 {
            border-bottom: 2px solid black;
          }
          .border-t-2 {
            border-top: 2px solid black;
          }
          .space-y-4 > p {
            margin: 6px 0;
          }
          .space-y-1 > p {
            margin: 2px 0;
          }
        }
        @page {
          size: A4;
          margin: 12mm 15mm 25mm 15mm;
        }
        @media print {
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        }
      `}</style>

      {/* Download Toolbar */}
      <div className="download-toolbar bg-white border-b border-gray-300 p-4 flex gap-2 sticky top-0 z-10">
        <Button
          type="primary"
          icon={<MdiDownload className="w-4 h-4" />}
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          Print/Download PDF
        </Button>
      </div>

      <div className="print-container w-full max-w-4xl mx-auto p-8 bg-white print:p-0 flex flex-col print:min-h-screen">
        {/* Header */}
        <div className="text-center mb-2 print:mb-1 border-b-2 border-black pb-2 print:pb-1">
          <h2 className="font-bold text-lg print:text-sm">
            UT Administration of
          </h2>
          <h2 className="font-bold text-lg print:text-sm">
            Dadra and Nagar Haveli and Daman and Diu
          </h2>
          <p className="font-bold text-sm print:text-xs">
            (Department of Value Added Tax)
          </p>
          <p className="text-sm print:text-xs">
            District Secretariat &quot;A&quot; - Wing, 2nd Floor,
          </p>
          <p className="text-sm print:text-xs">Silvassa - 396230.</p>
        </div>
        {/* Notice Info */}
        <div className="flex justify-between mb-2 print:mb-1 text-sm print:text-xs">
          <div>
            <span className="font-bold">
              No.VATO/Return Defaulter/
              {dvatInfo.commodity == "FUEL" ? "PETROL" : "LIQUOR"}/
            </span>{" "}
            {notice.ref_no}
          </div>
          <div>
            <span className="font-bold">Date: </span>
            {formateDate(notice.issue_date)}
          </div>
        </div>

        {/* Notice Title */}
        <div className="text-center font-bold mb-2 print:mb-1 underline print:text-xs">
          <p>NOTICE TO RETURN DEFAULTER U/S 32 FOR NOT FILING RETURN.</p>
        </div>

        {/* Tax Period Table */}
        <div className="mb-3 print:mb-2">
          <table className="w-full border-collapse print:text-xs">
            <tbody>
              <tr>
                <td className="border border-black p-2 print:p-1 font-bold w-1/2">
                  Tax period
                </td>
                <td className="border border-black p-2 print:p-1 w-1/2">
                  {notice.tax_period_from && notice.tax_period_to
                    ? `${new Date(notice.tax_period_from).toLocaleDateString()} - ${new Date(notice.tax_period_to).toLocaleDateString()}`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 print:p-1 font-bold">
                  Type of Return
                </td>
                <td className="border border-black p-2 print:p-1">
                  {dvatInfo.compositionScheme ? "DVAT-17" : "DVAT-16"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notice Body */}
        <div className="text-justify text-sm print:text-xs leading-relaxed mb-3 print:mb-2 space-y-4 print:space-y-2">
          <p>
            Whereas, you are registered dealer under Dadra and Nagar Haveli
            Value Added Tax Regulation, 2005.
          </p>

          <p>
            And whereas, you are required to furnish return for the Sale made or
            received and to discharge resultant tax liability for the aforesaid
            tax period by due date. It has been noticed that you have not filed
            the said return till date.
          </p>

          <p>
            Now therefore, You are requested to furnish the said return within
            07 (Seven) days failing which the [tax liability] may be assessed
            u/s 32 of the said Regulation, based on the relevant material
            available with this office. Please note that in addition to tax so
            assessed, you will also be liable to pay interest and penalty as per
            provisions of the Act.
          </p>

          <p>
            Please note that no further communication will be issued for
            assessing the liability.
          </p>

          <p>
            The notice shall be deemed to have been withdrawn in case the return
            referred above, is filed by you before issue of the assessment
            order.
          </p>
        </div>

        <div className="flex w-full ">
          <div className="grow"></div>
          {/* Signature Section */}
          <div className="mt-4 print:mt-2">
            <div className="mb-3 print:mb-2">
              <div className="h-8 print:h-6"></div>
              <p className="font-bold text-sm print:text-xs">
                Value Added Tax Officer
              </p>
              <p className="font-bold text-sm print:text-xs">
                Dadra and Nagar Haveli
              </p>
              <p className="font-bold text-sm print:text-xs">Silvassa.</p>
            </div>

            {/* Recipient Address */}
          </div>
        </div>
        <div className="mt-3 print:mt-2 text-sm print:text-xs space-y-1 print:space-y-0">
          <p>
            <span className="font-bold">To</span>
          </p>
          <p className="font-bold">
            M/s {dvatInfo?.tradename || "Business Name"}
          </p>
          <p>Tin No : {dvatInfo?.tinNumber || "N/A"}</p>
          <p>
            Add : {dvatInfo?.buildingNumber} {dvatInfo?.area}{" "}
            {dvatInfo?.address}
          </p>
          <p>
            {dvatInfo?.city} - {dvatInfo?.pincode}
          </p>
        </div>

        {/* Additional Info */}
        {notice.description && (
          <div className="mt-4 print:mt-2 pt-2 print:pt-1 border-t-2 border-gray-300 text-sm print:text-xs">
            <p className="font-bold mb-1 print:mb-0">Description:</p>
            <p>{notice.description}</p>
          </div>
        )}

        {/* Computer generated notice disclaimer */}
        <div className="text-center text-sm print:text-xs print:mt-auto print:pt-4">
          <p className="font-bold">
            This is a computer generated notice, hence no signature is required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoticeTemplate;
