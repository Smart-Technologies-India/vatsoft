"use client";

import GetRefineryPriceLast7Days, {
  RefineryPriceCommodityOption,
  RefineryPriceDayData,
} from "@/action/refinery_price/getrefineryprices";
import AddRefineryDayPrice from "@/action/refinery_price/upsertrefineryprice";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

const formatPrice = (value: number | null) =>
  value !== null ? value.toFixed(2) : "—";

const trendFromDayPrices = (dayPrices: (number | null)[]): string => {
  const nonNull = dayPrices.filter((v): v is number => v !== null);
  if (nonNull.length < 2) return "N/A";
  const delta = nonNull[nonNull.length - 1] - nonNull[nonNull.length - 2];
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
};

const formatDateDDMMYYYY = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

const parseDDMMYYYYToApiDate = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export default function DealerMasterPricePage() {
  const [dayLabels, setDayLabels] = useState<string[]>([]);
  const [categories, setCategories] = useState<RefineryPriceDayData[]>([]);
  const [commodityOptions, setCommodityOptions] = useState<
    RefineryPriceCommodityOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(0);
  const [newPrice, setNewPrice] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    formatDateDDMMYYYY(new Date()),
  );
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const response = await GetRefineryPriceLast7Days();
    if (response.status && response.data) {
      setDayLabels(response.data.dayLabels);
      setCategories(response.data.categories);
      setCommodityOptions(response.data.commodityOptions);
      if (!selectedCommodityId && response.data.commodityOptions.length > 0) {
        setSelectedCommodityId(response.data.commodityOptions[0].id);
      }
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  }, [selectedCommodityId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  const handleAddPrice = async () => {
    const parsed = parseFloat(newPrice);

    if (!selectedCommodityId) {
      toast.error("Select commodity.");
      return;
    }

    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter valid price greater than 0.");
      return;
    }

    const effectiveDateForApi = parseDDMMYYYYToApiDate(effectiveDate);
    if (!effectiveDateForApi) {
      toast.error("Enter effective date in dd/mm/yyyy format.");
      return;
    }

    setIsSaving(true);
    const response = await AddRefineryDayPrice({
      commodityMasterId: selectedCommodityId,
      price: parsed,
      effectiveDate: effectiveDateForApi,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsSaving(false);
      return;
    }

    toast.success(response.message);
    setNewPrice("");
    setIsSaving(false);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50 to-orange-100 grid place-items-center">
        <p className="text-slate-600 text-lg">Loading price data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50 to-orange-100 p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="md:col-span-2 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-orange-600">
              Refinery Dealer Master
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Last 7 Day Price Monitor
            </h1>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">
            Add Price
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px_180px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Commodity
              </label>
              <select
                value={selectedCommodityId || ""}
                onChange={(e) => setSelectedCommodityId(parseInt(e.target.value, 10))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300"
              >
                {commodityOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Price (INR / litre)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Effective Date
              </label>
              <input
                type="text"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300"
                placeholder="dd/mm/yyyy"
              />
            </div>

            <button
              type="button"
              onClick={handleAddPrice}
              disabled={isSaving}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {isSaving ? "Adding..." : "Add Price"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Category
                  </th>
                  {dayLabels.map((label) => (
                    <th
                      key={label}
                      className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => {
                  const trend = trendFromDayPrices(item.dayPrices);
                  const nonNull = item.dayPrices.filter(
                    (v): v is number => v !== null,
                  );
                  const deltaPositive =
                    nonNull.length >= 2
                      ? nonNull[nonNull.length - 1] -
                          nonNull[nonNull.length - 2] >=
                        0
                      : true;

                  return (
                    <tr
                      key={item.commodityMasterId}
                      className="odd:bg-white even:bg-slate-50/40"
                    >
                      <td className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.commodityName}
                        </p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </td>

                      {item.dayPrices.map((value, index) => (
                        <td
                          key={`${item.commodityMasterId}-${index}`}
                          className="border-b border-slate-100 px-3 py-3 text-center"
                        >
                          <span
                            className={`text-sm ${
                              index === item.dayPrices.length - 1
                                ? "font-semibold text-slate-900"
                                : "text-slate-600"
                            }`}
                          >
                            {formatPrice(value)}
                          </span>
                        </td>
                      ))}

                      <td className="border-b border-slate-100 px-3 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            trend === "N/A"
                              ? "bg-slate-100 text-slate-600"
                              : deltaPositive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {trend}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">
            Price Snapshot
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => {
              const nonNull = item.dayPrices.filter(
                (v): v is number => v !== null,
              );
              const latest = nonNull[nonNull.length - 1] ?? null;
              const min = nonNull.length ? Math.min(...nonNull) : 0;
              const max = nonNull.length ? Math.max(...nonNull) : 0;
              const range = max - min || 1;

              return (
                <div
                  key={item.commodityMasterId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {item.commodityName}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {latest !== null ? latest.toFixed(2) : "—"}
                  </p>
                  <div className="mt-3 flex h-12 items-end gap-1">
                    {item.dayPrices.map((value, index) => {
                      const heightPercent =
                        value !== null ? ((value - min) / range) * 100 : 0;
                      return (
                        <div
                          key={`${item.commodityMasterId}-bar-${index}`}
                          className={`w-full rounded-sm ${
                            value !== null ? "bg-orange-300" : "bg-slate-200"
                          }`}
                          style={{
                            height: `${Math.max(
                              value !== null ? 20 : 5,
                              heightPercent,
                            )}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
