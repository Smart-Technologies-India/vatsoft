"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GetVatpaidRefinerySales, {
  VatpaidRefineryInvoice,
} from "@/action/refinery_sale/getvatpaidrefinerysales";

const RefineryDashboard = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<VatpaidRefineryInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetVatpaidRefinerySales().then((res) => {
      if (res.status && res.data) {
        setInvoices(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 text-sm">Dispatch</h2>
        <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5">
          {invoices.length} {invoices.length === 1 ? "period" : "periods"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {invoices.map((invoice) => (
          <div
            key={`${invoice.invoice_number}_${invoice.buyer.id}`}
            className="border border-gray-200 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="text-xs text-gray-700 leading-5">
              <div className="font-medium">{invoice.buyer.tin_number}</div>
              <div>{invoice.buyer.name_of_dealer}</div>
              {invoice.buyer.state && (
                <div className="text-gray-500">{invoice.buyer.state}</div>
              )}
            </div>
            <div className="text-xs text-gray-700 leading-5 flex-1 px-6">
              {invoice.items.map((item) => (
                <div key={item.id}>
                  {item.commodity_master.product_name} -{" "}
                  {item.quantity.toLocaleString("en-IN")} {item.amount_unit}
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                router.push(
                  `/dashboard/refinery/sale/dispatch/${invoice.items[0].id}`,
                )
              }
              className="text-sm text-blue-600 border border-gray-200 hover:border-blue-400 rounded px-4 py-1"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefineryDashboard;
