"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

export type RefineryPriceDayData = {
  commodityMasterId: number;
  commodityName: string;
  unit: string;
  dayPrices: (number | null)[];
};

export type RefineryPriceCommodityOption = {
  id: number;
  label: string;
  unit: string;
};

export type GetRefineryPricesResult = {
  dayLabels: string[];
  categories: RefineryPriceDayData[];
  commodityOptions: RefineryPriceCommodityOption[];
};

const UNIT_LABEL = "INR / litre";
const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

const getLast7Days = (): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
};

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatDisplayDateDDMMYYYY = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

const GetRefineryPriceLast7Days = async (): Promise<
  ApiResponseType<GetRefineryPricesResult | null>
> => {
  const functionname = GetRefineryPriceLast7Days.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const refinery = await prisma.refinery.findFirst({
      where: {
        deletedAt: null,
        createdById: currentUserId,
      },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    if (!refinery) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const commodityOptionsRaw = await prisma.commodity_master.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        id: {
          in: ALLOWED_COMMODITY_IDS,
        },
      },
      select: {
        id: true,
        product_name: true,
      },
      orderBy: {
        product_name: "asc",
      },
    });

    const commodityOptions: RefineryPriceCommodityOption[] =
      commodityOptionsRaw.map((item) => ({
        id: item.id,
        label: item.product_name,
        unit: UNIT_LABEL,
      }));

    const last7Days = getLast7Days();
    const dayLabels = last7Days.map((d) => formatDisplayDateDDMMYYYY(d));
    const dateKeys = last7Days.map(formatDateKey);

    const windowStart = last7Days[0];
    const windowEnd = new Date(last7Days[6]);
    windowEnd.setHours(23, 59, 59, 999);

    const entries = await prisma.refinery_price.findMany({
      where: {
        refineryId: refinery.id,
        deletedAt: null,
        status: "ACTIVE",
        effective_date: {
          lte: windowEnd,
        },
      },
      select: {
        commodity_masterId: true,
        price: true,
        effective_date: true,
      },
      orderBy: { effective_date: "asc" },
    });

    const priceMap = new Map<number, Map<string, number>>();
    for (const entry of entries) {
      const dk = formatDateKey(new Date(entry.effective_date));
      if (!priceMap.has(entry.commodity_masterId)) {
        priceMap.set(entry.commodity_masterId, new Map());
      }
      priceMap.get(entry.commodity_masterId)!.set(dk, parseFloat(entry.price));
    }

    const categories: RefineryPriceDayData[] = commodityOptions.map((item) => {
      const commodityMap = priceMap.get(item.id);

      // Carry forward the most recent known price so the rate stays same
      // on subsequent days until a new price is explicitly added.
      let lastKnownPrice: number | null = null;
      const dayPrices = dateKeys.map((dk) => {
        if (commodityMap?.has(dk)) {
          lastKnownPrice = commodityMap.get(dk) ?? null;
        }
        return lastKnownPrice;
      });

      return {
        commodityMasterId: item.id,
        commodityName: item.label,
        unit: item.unit,
        dayPrices,
      };
    });

    return createResponse({
      message: "Refinery prices fetched successfully.",
      functionname,
      data: { dayLabels, categories, commodityOptions },
    });
  } catch (e) {
    return createResponse({ message: errorToString(e), functionname });
  }
};

export default GetRefineryPriceLast7Days;
