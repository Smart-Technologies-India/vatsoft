"use server";

import { errorToString } from "@/utils/methods";
import {
  challan,
  dvat04,
  returns_01,
  SelectOffice,
  PaymentStatus,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
const successGatewayStatuses = ["Successful", "Success", "Shipped"];
const pendingGatewayStatuses = ["Awaited", "Initiated"];
const failedGatewayStatuses = [
  "Unsuccessful",
  "Invalid",
  "Fraud",
  "Timeout",
  "Chargeback",
  "Auto-Reversed",
  "Aborted",
  "Cancelled",
  "Auto-Cancelled",
  "Refunded",
  "Systemrefund",
];
const paymentStatuses: PaymentStatus[] = [
  "CREATED",
  "PENDING",
  "PAID",
  "FAILED",
];

interface SearchChallanPayload {
  dvatid?: number;
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
  dept?: SelectOffice;
  paymentstatus?: PaymentStatus;
  excludePaid?: boolean;
  excludeCreatedExpired?: boolean;
  searchText?: string;
  bucketFilter?: "pending" | "failed";
  skip: number;
  take: number;
}

export type SearchChallanWithRelations = challan & {
  dvat: dvat04;
  returns_01: returns_01 | null;
};

const buildWhere = (payload: SearchChallanPayload) => {
  const andConditions: object[] = [];

  if (payload.excludePaid) {
    andConditions.push({ paymentstatus: { not: "PAID" } });
    andConditions.push({
      OR: [
        { order_status: null },
        {
          NOT: {
            order_status: {
              in: successGatewayStatuses,
            },
          },
        },
      ],
    });
  }

  if (payload.excludeCreatedExpired) {
    andConditions.push({ paymentstatus: { not: "CREATED" } });
    andConditions.push({
      OR: [
        { order_status: null },
        { order_status: { notIn: ["Expired", "EXPIRED"] } },
      ],
    });
  }

  if (payload.bucketFilter === "failed") {
    andConditions.push({
      OR: [
        { order_status: { in: failedGatewayStatuses } },
        { paymentstatus: "FAILED" },
      ],
    });
  }

  if (payload.bucketFilter === "pending") {
    andConditions.push({ paymentstatus: { not: "FAILED" } });
    andConditions.push({
      OR: [
        { order_status: { in: pendingGatewayStatuses } },
        { order_status: null },
      ],
    });
  }

  if (payload.searchText) {
    const normalizedSearch = payload.searchText.trim();
    const matchedPaymentStatus = paymentStatuses.find(
      (status) => status === normalizedSearch.toUpperCase(),
    );

    andConditions.push({
      OR: [
        { cpin: { contains: normalizedSearch } },
        { order_id: { contains: normalizedSearch } },
        { track_id: { contains: normalizedSearch } },
        { dvat: { tinNumber: { contains: normalizedSearch } } },
        { dvat: { tradename: { contains: normalizedSearch } } },
        { order_status: { contains: normalizedSearch } },
        ...(matchedPaymentStatus
          ? [{ paymentstatus: matchedPaymentStatus }]
          : []),
        { failure_message: { contains: normalizedSearch } },
        { status_message: { contains: normalizedSearch } },
      ],
    });
  }

  return {
    deletedAt: null,
    deletedById: null,
    ...(payload.dept && { dvat: { selectOffice: payload.dept } }),
    ...(payload.dvatid && { dvatid: payload.dvatid }),
    ...(payload.cpin && { cpin: payload.cpin }),
    ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
    ...(payload.fromdate &&
      payload.todate && {
        createdAt: { gte: payload.fromdate, lte: payload.todate },
      }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };
};

const SearchChallan = async (
  payload: SearchChallanPayload,
): Promise<PaginationResponse<SearchChallanWithRelations[] | null>> => {
  const functionname: string = SearchChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "SearchChallan",
      } as any;
    }

    const where = buildWhere(payload);
  
    const [challan, totalCount] = await Promise.all([
      prisma.challan.findMany({
        where,
        include: {
          dvat: true,
          returns_01: true,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({ where }),
    ]);



    return createPaginationResponse({
      message: challan ? "Challan Get successfully" : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchChallan;
