import crypto from "crypto";
import axios from "axios";
import qs from "querystring";
import { encrypt, decrypt } from "./ccavutil.js";

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

export const orderstatus = async (request, response) => {
  //Generate Md5 hash for the key and then convert in base64 string
  const md5 = crypto.createHash("md5").update(process.env.WORKING_KEY).digest();
  const keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  const ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  const orderNo =
    request?.body?.order_no ||
    request?.body?.orderNo ||
    request?.query?.order_no ||
    request?.query?.orderNo;
  const referenceNo =
    request?.body?.reference_no ||
    request?.body?.referenceNo ||
    request?.query?.reference_no ||
    request?.query?.referenceNo;

  if (!orderNo && !referenceNo) {
    return response.status(400).json({
      success: false,
      message: "order_no or reference_no is required",
      data: null,
    });
  }

  try {
    const requestPayload = {};

    if (orderNo) {
      requestPayload.order_no = orderNo.toString();
    }

    if (referenceNo) {
      requestPayload.reference_no = referenceNo.toString();
    }

    const encRequest = encrypt(
      JSON.stringify(requestPayload),
      keyBase64,
      ivBase64,
    );
    console.log("Encrypted Request:", encRequest);
    const result = await axios.post(
      `https://api.ccavenue.com/apis/servlet/DoWebTrans?access_code=${process.env.ACCESS_CODE}&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2&enc_request=${encRequest}`,
    );

    const isHexCipher = (value) =>
      typeof value === "string" &&
      value.length > 0 &&
      value.length % 2 === 0 &&
      /^[0-9a-fA-F]+$/.test(value);

    const toObjectEnvelope = (payload) => {
      if (!payload) return null;
      if (typeof payload === "object") return payload;

      const rawString = payload.toString().trim();
      if (!rawString) return null;

      try {
        return JSON.parse(rawString);
      } catch {
        const parsedForm = qs.parse(rawString);
        return parsedForm && Object.keys(parsedForm).length > 0
          ? parsedForm
          : null;
      }
    };

    const envelope = toObjectEnvelope(result?.data);
    if (!envelope) {
      throw new Error(
        "Unable to parse CCAvenue order status response. Expected encrypted form data or JSON.",
      );
    }

    const statusFromEnvelope = envelope.status?.toString();
    const encryptedResponse = envelope.enc_response || envelope.encResp;

    // As per CCAvenue docs, status=1 means API-level failure and enc_response is plain error text.
    if (statusFromEnvelope === "1") {
      return response.status(400).json({
        success: false,
        message: "Order status API call failed",
        data: null,
        error:
          (typeof encryptedResponse === "string" && encryptedResponse.trim()) ||
          envelope.error_desc ||
          "Unknown error",
      });
    }

    let parsedOrderStatus = null;

    if (
      typeof encryptedResponse === "string" &&
      isHexCipher(encryptedResponse)
    ) {
      const decryptedResponse = decrypt(encryptedResponse, keyBase64, ivBase64);

      try {
        parsedOrderStatus = JSON.parse(decryptedResponse);
      } catch {
        parsedOrderStatus = { raw_response: decryptedResponse };
      }
    } else if (statusFromEnvelope === "0") {
      parsedOrderStatus = envelope;
    }

    if (!parsedOrderStatus) {
      throw new Error("Unable to parse/decrypt order status response.");
    }

    const status = parsedOrderStatus.order_status || "Unknown";

    return response.json({
      success: true,
      message: "Order status fetched",
      data: {
        ...parsedOrderStatus,
        normalized_order_status: normalizeOrderStatus(status),
        status_group: classifyOrderStatus(status),
      },
      request: {
        order_no: orderNo || null,
        reference_no: referenceNo || null,
      },
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Failed to fetch order status",
      data: null,
      error: error?.message || "Unknown error",
    });
  }
};
