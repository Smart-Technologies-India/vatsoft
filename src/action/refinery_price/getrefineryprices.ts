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

export type RefineryPriceDealerOption = {
  id: number;
  tinNumber: string;
  tradeName: string;
  dealerName: string;
};

export type GetRefineryPricesResult = {
  selectedDvatId: number;
  dealerOptions: RefineryPriceDealerOption[];
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

interface GetRefineryPricesPayload {
  dvatid?: number;
}

const GetRefineryPriceLast7Days = async (
  payload: GetRefineryPricesPayload = {},
): Promise<
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

    const mappedDealers = await prisma.refinery_dealer.findMany({
      where: {
        refineryId: refinery.id,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        dvat: {
          include: {
            tin_master: {
              select: {
                tin_number: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const dealerOptions: RefineryPriceDealerOption[] = mappedDealers
      .filter((item) => item.dvat.tin_master?.tin_number)
      .map((item) => ({
        id: item.dealerId,
        tinNumber: item.dvat.tin_master.tin_number,
        tradeName: item.dvat.tradename || "",
        dealerName: item.dvat.name || "",
      }));

    if (!dealerOptions.length) {
      return createResponse({
        message: "No refinery dealer mapping found. Please add dealer in dealer master.",
        functionname,
        data: {
          selectedDvatId: 0,
          dealerOptions: [],
          dayLabels: [],
          categories: [],
          commodityOptions: [],
        },
      });
    }

    const requestedDvatId = payload.dvatid;
    const selectedDvatId =
      requestedDvatId && dealerOptions.some((dealer) => dealer.id === requestedDvatId)
        ? requestedDvatId
        : dealerOptions[0].id;

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
    const windowStartKey = dateKeys[0];

    const windowEnd = new Date(last7Days[6]);
    windowEnd.setHours(23, 59, 59, 999);

    const entries = await prisma.refinery_price.findMany({
      where: {
        refineryId: refinery.id,
        dvatid: selectedDvatId,
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
    const latestPriceBeforeWindow = new Map<number, number>();
    for (const entry of entries) {
      const dk = formatDateKey(new Date(entry.effective_date));
      if (!priceMap.has(entry.commodity_masterId)) {
        priceMap.set(entry.commodity_masterId, new Map());
      }
      priceMap.get(entry.commodity_masterId)!.set(dk, parseFloat(entry.price));

      // Keep the most recent known price prior to the visible window start,
      // so the 7-day table can carry forward older rates correctly.
      if (dk < windowStartKey) {
        latestPriceBeforeWindow.set(
          entry.commodity_masterId,
          parseFloat(entry.price),
        );
      }
    }

    const categories: RefineryPriceDayData[] = commodityOptions.map((item) => {
      const commodityMap = priceMap.get(item.id);

      // Carry forward the most recent known price so the rate stays same
      // on subsequent days until a new price is explicitly added.
      let lastKnownPrice: number | null =
        latestPriceBeforeWindow.get(item.id) ?? null;
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
      data: {
        selectedDvatId,
        dealerOptions,
        dayLabels,
        categories,
        commodityOptions,
      },
    });
  } catch (e) {
    return createResponse({ message: errorToString(e), functionname });
  }
};

export default GetRefineryPriceLast7Days;
