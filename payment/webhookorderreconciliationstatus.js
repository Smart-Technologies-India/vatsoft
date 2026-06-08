import crypto from "crypto";
import qs from "querystring";
import { decrypt } from "./ccavutil.js";
import prisma from "../prisma/database.js";
import { isAmountMatched } from "./payment-validation.js";

const normalizeOrderStatus = (status) =>
  (status || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

const classifyOrderStatus = (status) => {
  const normalizedStatus = normalizeOrderStatus(status);

  const successStatuses = new Set(["successful", "success", "shipped"]);
  const pendingStatuses = new Set(["awaited", "initiated"]);
  const cancelledStatuses = new Set([
    "aborted",
    "cancelled",
    "auto-cancelled",
    "auto cancelled",
  ]);
  const refundedStatuses = new Set([
    "refunded",
    "systemrefund",
    "system refund",
    "system-refund",
  ]);
  const failedStatuses = new Set([
    "unsuccessful",
    "invalid",
    "fraud",
    "timeout",
    "chargeback",
    "auto-reversed",
    "auto reversed",
  ]);

  if (successStatuses.has(normalizedStatus)) return "success";
  if (pendingStatuses.has(normalizedStatus)) return "pending";
  if (cancelledStatuses.has(normalizedStatus)) return "cancelled";
  if (refundedStatuses.has(normalizedStatus)) return "refunded";
  if (failedStatuses.has(normalizedStatus)) return "failed";

  return "unknown";
};

const parseMerchantParam = (merchantParam1) => {
  const raw = (merchantParam1 || "").toString();
  const [challanid, dvatid, returnid, type] = raw.split("_");

  return {
    challanId: parseInt(challanid?.toString() || "0", 10) || null,
    dvatId: parseInt(dvatid?.toString() || "0", 10) || null,
    returnId: parseInt(returnid?.toString() || "0", 10) || null,
    type: (type || "DEMAND").toString().toUpperCase(),
  };
};

const toUpperSafe = (value) => (value == null ? null : value.toString().toUpperCase());

const parseCcavEncryptedResponse = (encResp) => {
  const md5 = crypto.createHash("md5").update(process.env.WORKING_KEY).digest();
  const keyBase64 = Buffer.from(md5).toString("base64");
  const ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  const ccavResponse = decrypt(encResp, keyBase64, ivBase64);

  const keysToKeep = [
    "order_id",
    "tracking_id",
    "bank_ref_no",
    "order_status",
    "failure_message",
    "payment_mode",
    "card_name",
    "status_code",
    "status_message",
    "currency",
    "amount",
    "billing_name",
    "billing_address",
    "billing_city",
    "billing_state",
    "billing_zip",
    "billing_country",
    "billing_tel",
    "billing_email",
    "delivery_name",
    "delivery_address",
    "delivery_city",
    "delivery_state",
    "delivery_zip",
    "delivery_country",
    "delivery_tel",
    "merchant_param1",
    "merchant_param2",
    "merchant_param3",
    "merchant_param4",
    "merchant_param5",
    "response_code",
    "bene_account",
    "bene_name",
    "bene_ifsc",
    "bene_bank",
    "bene_branch",
    "trans_fee",
  ];

  const result = {};
  const pairs = ccavResponse.split("&");

  pairs.forEach((pair) => {
    const separatorIndex = pair.indexOf("=");
    const key = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
    const value = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : "";
    if (!keysToKeep.includes(key)) return;
    result[key] = value === "null" ? null : decodeURIComponent(value || "");
  });

  return result;
};

const getEncResp = (request) => {
  if (request.body?.encResp) return request.body.encResp;
  if (request.body?.enc_response) return request.body.enc_response;

  if (typeof request.body === "string") {
    const parsed = qs.parse(request.body);
    return parsed.encResp || parsed.enc_response;
  }

  return null;
};

export const webhookOrderReconciliationStatus = async (request, response) => {
  try {
    const encResp = getEncResp(request);

    if (!encResp || encResp.toString().trim() === "") {
      return response.status(400).json({
        success: false,
        message: "encResp is required",
      });
    }

    const result = parseCcavEncryptedResponse(encResp.toString());
    const statusGroup = classifyOrderStatus(result.order_status);
    const orderId = (result.order_id || "").toString();
    const merchantMeta = parseMerchantParam(result.merchant_param1);

    let intent = null;
    if (orderId) {
      intent = await prisma.payment_intent.findFirst({
        where: {
          gateway_order_id: orderId,
        },
        include: {
          challan: true,
        },
      });
    }

    let challan = intent?.challan || null;

    if (!challan && merchantMeta.challanId) {
      challan = await prisma.challan.findFirst({
        where: {
          id: merchantMeta.challanId,
          dvatid: merchantMeta.dvatId || undefined,
        },
      });
    }

    if (!challan && orderId) {
      challan = await prisma.challan.findFirst({
        where: {
          order_id: orderId,
          deletedAt: null,
        },
      });
    }

    if (!challan) {
      return response.status(404).json({
        success: false,
        message: "Unable to map webhook to challan/payment intent.",
        data: {
          order_id: orderId,
          order_status: result.order_status || null,
          status_group: statusGroup,
        },
      });
    }

    if (!intent) {
      intent = await prisma.payment_intent.findFirst({
        where: {
          challanId: challan.id,
        },
        orderBy: {
          id: "desc",
        },
      });
    }

    if (orderId && (!intent || intent.gateway_order_id !== orderId)) {
      return response.status(409).json({
        success: false,
        message: "Payment intent mapping mismatch for webhook order_id.",
        data: {
          challanId: challan.id,
          order_id: orderId,
          paymentIntentId: intent?.id || null,
          intent_order_id: intent?.gateway_order_id || null,
        },
      });
    }

    const challanUpdateBase = {
      track_id: result.tracking_id || challan.track_id || null,
      order_id: result.order_id || challan.order_id || null,
      paymentmode: toUpperSafe(result.payment_mode) || challan.paymentmode || null,
      transaction_date: new Date(),
      bank_name: result.bank_ref_no || challan.bank_name || null,
      order_status: result.order_status || null,
      failure_message: result.failure_message || null,
      card_name: result.card_name || null,
      status_code: result.status_code || null,
      status_message: result.status_message || null,
      response_code: result.response_code || null,
      bene_account: result.bene_account || null,
      bene_name: result.bene_name || null,
      bene_ifsc: result.bene_ifsc || null,
      bene_bank: result.bene_bank || null,
      bene_branch: result.bene_branch || null,
      trans_fee: result.trans_fee || null,
    };

    const canMarkSuccess =
      !!intent && isAmountMatched(intent.expected_amount, result.amount);

    if (statusGroup === "success" && canMarkSuccess) {
      if (intent && intent.status !== "SUCCESS") {
        await prisma.payment_intent.update({
          where: { id: intent.id },
          data: {
            status: "SUCCESS",
            completedAt: intent.completedAt || new Date(),
            failure_reason: null,
          },
        });
      }

      if (challan.paymentstatus !== "PAID") {
        await prisma.challan.update({
          where: { id: challan.id },
          data: {
            ...challanUpdateBase,
            paymentstatus: "PAID",
          },
        });
      }
    } else if (statusGroup === "pending") {
      if (intent && ["CREATED", "INITIATED", "EXPIRED"].includes(intent.status)) {
        await prisma.payment_intent.update({
          where: { id: intent.id },
          data: {
            status: "INITIATED",
            initiatedAt: intent.initiatedAt || new Date(),
            failure_reason: null,
          },
        });
      }

      if (challan.paymentstatus !== "PAID") {
        await prisma.challan.update({
          where: { id: challan.id },
          data: {
            ...challanUpdateBase,
            paymentstatus: "PENDING",
          },
        });
      }
    } else if (statusGroup === "cancelled" || statusGroup === "failed" || statusGroup === "refunded") {
      if (intent && intent.status !== "SUCCESS") {
        await prisma.payment_intent.update({
          where: { id: intent.id },
          data: {
            status: statusGroup === "cancelled" ? "CANCELED" : "FAILED",
            completedAt: new Date(),
            failure_reason:
              result.failure_message ||
              result.status_message ||
              `Gateway reconciliation marked ${statusGroup}`,
          },
        });
      }

      if (challan.paymentstatus !== "PAID") {
        await prisma.challan.update({
          where: { id: challan.id },
          data: {
            ...challanUpdateBase,
            paymentstatus: "FAILED",
            failure_message:
              result.failure_message ||
              result.status_message ||
              `Gateway reconciliation marked ${statusGroup}`,
          },
        });
      }
    } else {
      if (intent && intent.status !== "SUCCESS") {
        await prisma.payment_intent.update({
          where: { id: intent.id },
          data: {
            failure_reason:
              result.status_message ||
              result.failure_message ||
              `Unknown reconciliation order_status: ${result.order_status || "NA"}`,
          },
        });
      }

      if (challan.paymentstatus !== "PAID") {
        await prisma.challan.update({
          where: { id: challan.id },
          data: {
            ...challanUpdateBase,
            paymentstatus: "PENDING",
          },
        });
      }
    }

    if (
      statusGroup === "success" &&
      !canMarkSuccess &&
      intent &&
      intent.status !== "SUCCESS" &&
      challan.paymentstatus !== "PAID"
    ) {
      await prisma.payment_intent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          failure_reason: `AMOUNT_MISMATCH: expected ${intent.expected_amount}, paid ${result.amount || "0"}`,
        },
      });

      await prisma.challan.update({
        where: { id: challan.id },
        data: {
          ...challanUpdateBase,
          paymentstatus: "FAILED",
          order_status: result.order_status || "FAILED",
          failure_message: "Payment validation failed: AMOUNT_MISMATCH",
          status_message: result.status_message || "Amount mismatch in reconciliation callback.",
        },
      });
    }

    return response.status(200).json({
      success: true,
      message: "Order reconciliation webhook processed.",
      data: {
        challanId: challan.id,
        paymentIntentId: intent?.id || null,
        order_id: result.order_id || null,
        tracking_id: result.tracking_id || null,
        order_status: result.order_status || null,
        status_group: statusGroup,
      },
    });
  } catch (error) {
    console.error("Webhook reconciliation error:", error);
    return response.status(500).json({
      success: false,
      message: "Unable to process reconciliation webhook.",
      error: error?.message || "Unknown error",
    });
  }
};
