"use client";

import { useMemo, useState } from "react";

type CategoryPrice = {
  id: number;
  category: string;
  unit: string;
  history: number[];
};

const initialCategoryPrices: CategoryPrice[] = [
  {
    id: 1,
    category: "Petrol",
    unit: "INR / litre",
    history: [95.7, 95.8, 95.9, 96.0, 96.1, 96.2, 96.3],
  },
  {
    id: 2,
    category: "Diesel",
    unit: "INR / litre",
    history: [89.4, 89.5, 89.5, 89.6, 89.7, 89.8, 89.9],
  },
  {
    id: 3,
    category: "High Speed Petrol",
    unit: "INR / litre",
    history: [98.3, 98.5, 98.6, 98.8, 98.9, 99.1, 99.2],
  },
  {
    id: 4,
    category: "High Speed Diesel",
    unit: "INR / litre",
    history: [92.1, 92.2, 92.4, 92.5, 92.7, 92.8, 93.0],
  },
  {
    id: 5,
    category: "ATP",
    unit: "INR / litre",
    history: [84.8, 84.9, 85.0, 85.1, 85.3, 85.4, 85.6],
  },
];

const getLastSevenDayLabels = () => {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  });

  const today = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() - (6 - index));
    return formatter.format(current);
  });
};

const formatPrice = (value: number) => value.toFixed(2);

const trendText = (history: number[]) => {
  if (history.length < 2) return "0.00";
  const delta = history[history.length - 1] - history[history.length - 2];
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
};

export default function DealerMasterPricePage() {
  const dayLabels = useMemo(() => getLastSevenDayLabels(), []);
  const [categories, setCategories] = useState<CategoryPrice[]>(
    initialCategoryPrices,
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState("");

  const latestAverage = useMemo(() => {
    const total = categories.reduce(
      (sum, item) => sum + item.history[item.history.length - 1],
      0,
    );
    return categories.length ? total / categories.length : 0;
  }, [categories]);

  const handleStartEdit = (item: CategoryPrice) => {
    setEditingId(item.id);
    setDraftPrice(String(item.history[item.history.length - 1]));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftPrice("");
  };

  const handleSaveEdit = (id: number) => {
    const nextValue = Number.parseFloat(draftPrice);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }

    setCategories((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextHistory = [...item.history];
        nextHistory[nextHistory.length - 1] = Number(nextValue.toFixed(2));
        return {
          ...item,
          history: nextHistory,
        };
      }),
    );

    setEditingId(null);
    setDraftPrice("");
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50 to-orange-100 p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="md:col-span-2 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-orange-600">
              Refinery Dealer Master
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Last 7 Day Category Price Monitor
            </h1>
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
                  <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => {
                  const isEditing = editingId === item.id;
                  const latestPrice = item.history[item.history.length - 1];
                  const delta =
                    item.history[item.history.length - 1] -
                    item.history[item.history.length - 2];

                  return (
                    <tr
                      key={item.id}
                      className="odd:bg-white even:bg-slate-50/40"
                    >
                      <td className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.category}
                        </p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </td>

                      {item.history.map((value, index) => {
                        const isLatest = index === item.history.length - 1;
                        return (
                          <td
                            key={`${item.id}-${index}`}
                            className="border-b border-slate-100 px-3 py-3 text-center"
                          >
                            {isLatest && isEditing ? (
                              <input
                                autoFocus
                                type="number"
                                step="0.01"
                                value={draftPrice}
                                onChange={(event) =>
                                  setDraftPrice(event.target.value)
                                }
                                className="w-24 rounded-md border border-orange-300 px-2 py-1 text-center text-sm outline-none ring-orange-200 focus:ring"
                              />
                            ) : (
                              <span
                                className={`text-sm ${isLatest ? "font-semibold text-slate-900" : "text-slate-600"}`}
                              >
                                {formatPrice(value)}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="border-b border-slate-100 px-3 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            delta >= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {trendText(item.history)}
                        </span>
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3 text-center">
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                          >
                            Edit Price
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-orange-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((item) => {
              const latest = item.history[item.history.length - 1];
              const min = Math.min(...item.history);
              const max = Math.max(...item.history);
              const range = max - min || 1;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {item.category}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatPrice(latest)}
                  </p>
                  <div className="mt-3 flex h-12 items-end gap-1">
                    {item.history.map((value, index) => {
                      const heightPercent = ((value - min) / range) * 100;
                      return (
                        <div
                          key={`${item.id}-bar-${index}`}
                          className="w-full rounded-sm bg-orange-300"
                          style={{ height: `${Math.max(20, heightPercent)}%` }}
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
