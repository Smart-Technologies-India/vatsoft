import crypto from "crypto";
import axios from "axios";
import { encrypt, decrypt } from "./ccavutil.js";
import prisma from "../prisma/database.js";

const normalizeOrderStatus = (status) =>
  (status || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

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
  var encRequest = "";

  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(process.env.WORKING_KEY).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  const orderNo =
    request?.body?.order_no ||
    request?.body?.orderNo ||
    request?.query?.order_no ||
    request?.query?.orderNo;
  if (!orderNo) {
    return response.status(400).json({
      success: false,
      message: "order_no is required",
      data: null,
    });
  }

  try {
    encRequest = encrypt(`{order_no:'${orderNo}'}`, keyBase64, ivBase64);

    const result = await axios.post(
      `https://api.ccavenue.com/apis/servlet/DoWebTrans?access_code=${process.env.ACCESS_CODE}&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2&enc_request=${encRequest}`,
    );

    let enc_code = result.data.toString().split("=").pop();
    let ccavResponse = decrypt(enc_code, keyBase64, ivBase64);
    let obj = JSON.parse(ccavResponse);

    if (obj?.status !== "0") {
      return response.status(400).json({
        success: false,
        message: "Failed to fetch order status",
        data: null,
        error: obj?.status_message || "Unknown error",
      });
    } else {

      const status = obj.order_status || "Unknown";
      const statusGroup = classifyOrderStatus(status);

      const challan = await prisma.challan.findFirst({
        where: {
          order_id: orderNo.toString(),
        },
      });

      let retryChallanId = null;

      // Keep challan/payment state in sync when polling CCAvenue status.
      if (challan) {
        const commonUpdateFields = {
          order_status: status,
          failure_message:
            obj.failure_message || obj.status_message || challan.failure_message,
          status_code: obj.status_code || challan.status_code,
          status_message: obj.status_message || challan.status_message,
          response_code: obj.response_code || challan.response_code,
          track_id: obj.tracking_id || challan.track_id,
          order_id: obj.order_no || obj.order_id || challan.order_id,
          paymentmode: obj.payment_mode
            ? obj.payment_mode.toString().toUpperCase()
            : challan.paymentmode,
          bank_name: obj.bank_ref_no || challan.bank_name,
          card_name: obj.card_name || challan.card_name,
          bene_account: obj.bene_account || challan.bene_account,
          bene_name: obj.bene_name || challan.bene_name,
          bene_ifsc: obj.bene_ifsc || challan.bene_ifsc,
          bene_bank: obj.bene_bank || challan.bene_bank,
          bene_branch: obj.bene_branch || challan.bene_branch,
          trans_fee: obj.trans_fee || challan.trans_fee,
          transaction_date: new Date().toISOString(),
        };

        if (statusGroup === "success") {
          await prisma.challan.update({
            where: { id: challan.id },
            data: {
              ...commonUpdateFields,
              paymentstatus: "PAID",
            },
          });
        } else if (statusGroup === "pending") {
          await prisma.challan.update({
            where: { id: challan.id },
            data: {
              ...commonUpdateFields,
              paymentstatus: "PENDING",
            },
          });
        } else if (
          statusGroup === "failed" ||
          statusGroup === "cancelled" ||
          statusGroup === "refunded"
        ) {
          let createdRetryChallanId = null;

          // Prevent duplicate retry challan creation when endpoint is called multiple times.
          if (!challan.deletedAt) {
            const createdChallan = await prisma.challan.create({
              data: {
                dvatid: challan.dvatid,
                cpin: challan.cpin,
                returnid: challan.returnid,
                vat: challan.vat,
                latefees: challan.latefees,
                interest: challan.interest,
                others: challan.others,
                penalty: challan.penalty,
                createdById: challan.createdById,
                expire_date: challan.expire_date,
                total_tax_amount: challan.total_tax_amount,
                reason: challan.reason,
                paymentstatus: "CREATED",
                transaction_date: new Date().toISOString(),
                paymentmode: "ONLINE",
                bank_name: challan.bank_name,
                newregistration: challan.newregistration,
                security_deposit: challan.security_deposit,
              },
            });
            createdRetryChallanId = createdChallan.id;
          }

          await prisma.challan.update({
            where: { id: challan.id },
            data: {
              ...commonUpdateFields,
              paymentstatus: "FAILED",
              deletedAt: challan.deletedAt || new Date().toISOString(),
              deletedById: challan.deletedById || 1,
            },
          });

          retryChallanId = createdRetryChallanId;
        }
      }

      return response.json({
        success: true,
        message: "Order status fetched",
        data: {
          ...obj,
          normalized_order_status: normalizeOrderStatus(status),
          status_group: statusGroup,
          challan_found: Boolean(challan),
          retry_challan_id: retryChallanId,
        },
      });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Failed to fetch order status",
      data: null,
      error: error?.message || "Unknown error",
    });
  }
};
