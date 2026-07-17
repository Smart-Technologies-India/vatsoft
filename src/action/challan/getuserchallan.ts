"use server";

import { errorToString } from "@/utils/methods";
import {
  challan,
  Prisma,
  returns_01,
  SelectOffice,
  PaymentStatus,
} from "@prisma/client";
import prisma from "../../../prisma/database";
// import PaginationResponse from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

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

interface GetUserChallanPayload {
  dvatid: number;
  skip: number;
  take: number;
  // Optional search filters
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
  dept?: SelectOffice;
  paymentstatus?: PaymentStatus;
  searchText?: string;
  // Optional filter flags
  excludePaid?: boolean;
  excludeCreatedExpired?: boolean;
  bucketFilter?: "pending" | "failed";
}

export type UserChallanWithReturn = challan & {
  returns_01: returns_01 | null;
};

const buildWhere = (
  payload: GetUserChallanPayload,
): Prisma.challanWhereInput => {
  const andConditions: object[] = [];

  // Base filters
  const where: Prisma.challanWhereInput = {
    deletedAt: null,
    deletedById: null,
    dvatid: payload.dvatid,
    ...(payload.dept && { dvat: { selectOffice: payload.dept } }),
    ...(payload.cpin && { cpin: payload.cpin }),
    ...(payload.paymentstatus && { paymentstatus: payload.paymentstatus }),
    ...(payload.fromdate &&
      payload.todate && {
        createdAt: { gte: payload.fromdate, lte: payload.todate },
      }),
  };

  // Apply filter flags
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
    // Exclude CREATED challans that have expired (expire_date < now)
    // Keep: non-CREATED status OR (CREATED with expire_date >= now)
    const now = new Date();
    andConditions.push({
      OR: [
        { paymentstatus: { not: "CREATED" } },
        {
          AND: [
            { paymentstatus: "CREATED" },
            { expire_date: { gte: now } },
          ],
        },
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

  if (andConditions.length > 0) {
    where.AND = andConditions as Prisma.challanWhereInput[];
  }

  return where;
};

const GetUserChallan = async (
  payload: GetUserChallanPayload,
): Promise<PaginationResponse<UserChallanWithReturn[] | null>> => {
  const functionname: string = GetUserChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return createPaginationResponse({
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserChallan",
        skip: payload.skip,
        take: payload.take,
        total: 0,
      });
    }

    const where = buildWhere(payload);

    const [challanData, totalCount] = await Promise.all([
      prisma.challan.findMany({
        where,
        include: {
          returns_01: true,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({ where }),
    ]);

    return createPaginationResponse({
      message: challanData
        ? "Challan fetched successfully"
        : "Unable to get challan.",
      functionname: functionname,
      data: challanData ?? null,
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

export default GetUserChallan;
