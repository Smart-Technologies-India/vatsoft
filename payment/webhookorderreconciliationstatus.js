import crypto from "crypto";
import qs from "querystring";
import { decrypt } from "./ccavutil.js";
import prisma from "../prisma/database.js";
import { isAmountMatched } from "./payment-validation.js";
import axios from "axios";

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

const toUpperSafe = (value) =>
  value == null ? null : value.toString().toUpperCase();

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
          deletedAt: null,
          deletedById: null,
          id: merchantMeta.challanId,
          dvatid: merchantMeta.dvatId || undefined,
        },
      });
    }

    if (!challan && orderId) {
      challan = await prisma.challan.findFirst({
        where: {
          deletedById: null,
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
          deletedAt: null,
          deletedById: null,
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
      paymentmode:
        toUpperSafe(result.payment_mode) || challan.paymentmode || null,
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
        const paidchallan = await prisma.challan.update({
          where: { id: challan.id },
          data: {
            ...challanUpdateBase,
            paymentstatus: "PAID",
            deletedAt: null,
            deletedById: null,
          },
          include: {
            dvat: true,
            returns_01: true,
          },
        });

        // Create interest_working record if returns_01 exists
        if (paidchallan.dvat && paidchallan.returns_01) {
          const isquar = paidchallan.dvat.frequencyFilings === "QUARTERLY";

          // Quarter to months mapping
          const quarterMonthsMap = {
            QUARTER1: ["April", "May", "June"],
            QUARTER2: ["July", "August", "September"],
            QUARTER3: ["October", "November", "December"],
            QUARTER4: ["January", "February", "March"],
          };

          // Calculate due date based on quarterly or monthly filing
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          const paymentDate = new Date(paidchallan.transaction_date ?? "");
          const returnMonth = paidchallan.returns_01?.month;
          const returnYear = paidchallan.returns_01?.year;

          // Get month index from month name
          const monthIndex = monthNames.indexOf(returnMonth ?? "");

          let dueDateYear = parseInt(
            returnYear ?? new Date().getFullYear().toString(),
          );
          let dueDateMonth;

          if (isquar) {
            // Get current month name

            const currentMonthName = monthNames[paymentDate.getMonth()];

            // Find which quarter the payment month belongs to and get first month of next quarter
            let nextQuarterFirstMonth = "April"; // Default
            for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
              if (months.includes(currentMonthName)) {
                // Get first month of next quarter
                if (quarter === "QUARTER1") {
                  nextQuarterFirstMonth = "July";
                } else if (quarter === "QUARTER2") {
                  nextQuarterFirstMonth = "October";
                } else if (quarter === "QUARTER3") {
                  nextQuarterFirstMonth = "January";
                } else if (quarter === "QUARTER4") {
                  nextQuarterFirstMonth = "April";
                }
                break;
              }
            }

            dueDateMonth = monthNames.indexOf(nextQuarterFirstMonth);

            // If next quarter month is earlier in the year, it's next year
            if (dueDateMonth < monthIndex) {
              dueDateYear++;
            }
          } else {
            // For monthly filing: 15th of next month
            dueDateMonth = monthIndex + 1; // Next month

            if (dueDateMonth > 11) {
              // If it goes beyond December (11)
              dueDateMonth = 0; // January
              dueDateYear++;
            }
          }

          const dueDate = new Date(dueDateYear, dueDateMonth, 15);

          // Calculate days late based on payment date vs due date
          const daysLate = Math.max(
            0,
            Math.floor(
              (paymentDate.getTime() - dueDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );

          if (
            !(
              paidchallan.total_tax_amount == "0" ||
              paidchallan.total_tax_amount == null
            )
          ) {
            const isexist = await prisma.interest_working.findFirst({
              where: {
                dvatId: paidchallan.dvat.id,
                returnId: paidchallan.returns_01.id,
                challanId: paidchallan.id,
              },
            });
            if (!isexist) {
              await prisma.interest_working.create({
                data: {
                  dvatId: paidchallan.dvat.id,
                  returnId: paidchallan.returns_01.id,
                  challanId: paidchallan.id,
                  month: paidchallan.returns_01.month,
                  outstanding_before: 0,
                  interest: 0,
                  payment_date: paymentDate,
                  amount: paidchallan.total_tax_amount,
                  due_date: dueDate,
                  days_late: daysLate,
                  status: "ACTIVE",
                },
              });
            }
          }
        }

        const encodedMessage = encodeURIComponent(
          `Payment of ₹ ${paidchallan.total_tax_amount} has been successfully received. Transaction ID: ${paidchallan.track_id}. -VAT DDD.`,
        );

        await axios.get(
          `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${paidchallan.dvat.contact_one}&message=${encodedMessage}&senderid=VATDDD&accusage=1&entityid=1701174159851422588&tempid=1777178635621857685`,
        );

        await prisma.challan.updateMany({
          where: {
            cpin: paidchallan.cpin,
            paymentstatus: { not: "PAID" },
            deletedAt: null,
            deletedById: null,
          },
          data: {
            deletedAt: new Date().toISOString(),
            deletedById: 1,
          },
        });

        // Handle refinery_sale status update for refinery VAT payments
        const refineryMarker = (challan.remark || "").toString();
        const isRefineryVatPayment =
          refineryMarker.startsWith("REFINERY_SALE_VAT#");
        const isSaleVatPayment = refineryMarker.startsWith("SALE#");
        const isLiquorSaleVatPayment =
          refineryMarker.startsWith("LIQUOR_SALE#");

        if (isRefineryVatPayment) {
          const markerParts = refineryMarker.split("#");
          const markerInvoiceNo = markerParts[1] || "";
          const markerRefineryId = parseInt(markerParts[2] || "0", 10);
          const markerSellerTinId = parseInt(markerParts[3] || "0", 10);
          const markerSaleId = parseInt(markerParts[4] || "0", 10);

          if (
            markerInvoiceNo &&
            markerRefineryId > 0 &&
            markerSellerTinId > 0
          ) {
            // Update refinery sale status to VATPAID
            await prisma.refinery_sale.updateMany({
              where: {
                invoice_number: markerInvoiceNo,
                refineryId: markerRefineryId,
                seller_tin_numberId: markerSellerTinId,
                refinery_status: "SALE",
                deletedAt: null,
                deletedById: null,
                status: "ACTIVE",
              },
              data: {
                refinery_status: "VATPAID",
                challanId: challan.id,
                updatedById: challan.createdById,
              },
            });

            // Handle wallet update only on successful payment
            // Extract total VAT and payable amount from challan remark
            const totalVatMatch = refineryMarker.match(/TOTAL_VAT:([^#]+)/);
            const payableAmountMatch = refineryMarker.match(/PAYABLE:([^#]+)/);

            const totalVatAmount = totalVatMatch
              ? parseFloat(totalVatMatch[1])
              : 0;
            const payableAmount = payableAmountMatch
              ? parseFloat(payableAmountMatch[1])
              : 0;

            const dvatRecord = await prisma.dvat04.findUnique({
              where: { id: parseInt(dvatid) },
              select: { wallet: true },
            });

            if (dvatRecord && Number.parseFloat(dvatRecord.wallet || "0") > 0) {
              if (totalVatAmount > 0) {
                try {
                  const oldWallet = Number.parseFloat(dvatRecord.wallet || "0");

                  // Calculate wallet contribution (how much wallet can contribute to VAT payment)
                  const walletContribution = Math.min(
                    oldWallet,
                    totalVatAmount,
                  );

                  // New wallet after using wallet balance
                  const newWallet = oldWallet - walletContribution;

                  // Update wallet in dvat04
                  await prisma.dvat04.update({
                    where: { id: parseInt(dvatid) },
                    data: {
                      wallet: newWallet.toFixed(2),
                      updatedById: challan.createdById,
                    },
                  });

                  // Create wallet history entry
                  await prisma.wallet_history.create({
                    data: {
                      dvatId: parseInt(dvatid),
                      refineryId: markerRefineryId,
                      type: "DEBIT",
                      status: "ACTIVE",
                      difference_amount: walletContribution.toFixed(2),
                      old_wallet: oldWallet.toFixed(2),
                      new_wallet: newWallet.toFixed(2),
                      old_quantity: "0",
                      new_quantity: "0",
                      old_amount: oldWallet.toFixed(2),
                      new_amount: walletContribution.toFixed(2),
                      invoice_number: markerInvoiceNo,
                    },
                  });
                } catch (walletError) {
                  console.log(
                    "Error updating wallet for refinery VAT payment:",
                    walletError,
                  );
                  // Don't fail the payment if wallet update fails
                }
              }
            }
          }
        } else if (isSaleVatPayment) {
          // Handle liquor sale VAT payment (SALE# format)
          const markerParts = refineryMarker.split("#");
          const markerInvoiceNo = markerParts[1] || "";
          const markerDvatId = parseInt(markerParts[2] || "0", 10);

          // Update challan status to PAID
          await prisma.challan.updateMany({
            where: {
              dvatid: markerDvatId,
              remark: {
                startsWith: `SALE#${markerInvoiceNo}#`,
              },
              deletedAt: null,
              deletedById: null,
            },
            data: {
              paymentstatus: "PAID",
              paymentmode: "ONLINE",
              transaction_date: new Date(),
              bank_name: "CCAVENUE",
              order_id: order_id,
            },
          });

          // Update transport_permit table
          await prisma.transport_permit.updateMany({
            where: {
              invoiceNumber: markerInvoiceNo,
              deleted_at: null,
            },
            data: {
              is_paid: true,
              is_wallet: false,
              paid_date: new Date(),
            },
          });
          await prisma.daily_sale.updateMany({
            where: {
              invoice_number: markerInvoiceNo,
              dvat04Id: markerDvatId,
              seller_tin_numberId: markerSellerTinId,
              deletedAt: null,
              deletedById: null,
            },
            data: {
              is_paid: true,
            },
          });
          const urn_respone = await prisma.daily_sale.findMany({
            where: {
              dvat04Id: markerDvatId,
              invoice_number: markerInvoiceNo,
              seller_tin_numberId: markerSellerTinId,
              deletedAt: null,
              deletedById: null,
            },
            select: {
              urn_number: true,
            },
          });

          const urnNumbers = urn_respone
            .map((sale) => sale.urn_number)
            .filter((val) => val !== null && val !== undefined && val !== "");
          await prisma.daily_purchase.updateMany({
            where: {
              urn_number: {
                in: urnNumbers,
              },
              deletedAt: null,
              deletedBy: null,
            },
            data: {
              is_paid: true,
            },
          });
        } else if (isLiquorSaleVatPayment) {
          const markerParts = refineryMarker.split("#");
          const markerInvoiceNo = markerParts[1] || "";
          const markerSellerTinId = parseInt(markerParts[2] || "0", 10);
          const markerDvatId = parseInt(markerParts[3] || "0", 10);

          const dvat = await prisma.dvat04.findUnique({
            where: { id: markerDvatId, deletedAt: null, deletedById: null },
          });

          const stock = await prisma.daily_purchase.findMany({
            where: {
              dvat04Id: markerDvatId,
              invoice_number: markerInvoiceNo,
              seller_tin_numberId: markerSellerTinId,
              deletedAt: null,
              deletedById: null,
              status: "ACTIVE",
              is_accept: false,
            },
          });

          const isres = dvat.commodity == "RESTAURANT";

          // update or create each stock
          for (const row of stock) {
            const isstock = await prisma.stock.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                status: "ACTIVE",
                dvat04Id: markerDvatId,
                commodity_masterId: row.commodity_masterId,
              },
            });

            const quantity = isres
              ? row.quantity * isstock.pack_size
              : row.quantity;
            const stock_response = await prisma.stock.upsert({
              where: {
                id: isstock ? isstock.id : 0,
              },
              update: {
                quantity: quantity + (isstock ? isstock.quantity : 0),
                updatedById: challan.createdById,
              },
              create: {
                quantity: quantity,
                commodity_masterId: row.commodity_masterId,
                dvat04Id: markerDvatId,
                createdById: challan.createdById,
                status: "ACTIVE",
              },
            });

            if (!stock_response) {
              throw new Error("Unable to update or create stock.");
            }

            const purchases_update = await prisma.daily_purchase.update({
              where: {
                id: row.id,
                status: "ACTIVE",
                deletedAt: null,
                deletedById: null,
              },
              data: {
                is_accept: true,
              },
            });

            const sales_update = await prisma.daily_sale.updateMany({
              where: {
                urn_number: row.urn_number,
                status: "ACTIVE",
                deletedAt: null,
                deletedById: null,
              },
              data: {
                is_accept: true,
              },
            });

            if (!sales_update) {
              throw new Error("Unable to update sale records");
            }
          }
          await prisma.transport_permit.updateMany({
            where: {
              invoiceNumber: markerInvoiceNo,
              deleted_at: null,
            },
            data: {
              is_paid: true,
              is_wallet: false,
              paid_date: new Date(),
            },
          });
        } else if (refineryMarker.startsWith("LIQUOR_WALLET_TOPUP#")) {
          // Handle liquor wallet top-up payments
          const amountMatch = refineryMarker.match(/AMOUNT:([^#]+)/);
          const topupAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

          if (topupAmount > 0) {
            try {
              // Get current wallet amount
              const dvatRecord = await prisma.dvat04.findUnique({
                where: { id: parseInt(challan.dvatid) },
                select: { wallet: true },
              });

              if (dvatRecord) {
                const oldWallet = Number.parseFloat(dvatRecord.wallet || "0");
                const newWallet = oldWallet + topupAmount;

                // Update wallet in dvat04
                await prisma.dvat04.update({
                  where: { id: parseInt(challan.dvatid) },
                  data: {
                    wallet: newWallet.toFixed(2),
                    updatedById: challan.createdById,
                  },
                });

                // Create liquor wallet history entry
                await prisma.liquor_wallet_history.create({
                  data: {
                    dvatId: parseInt(challan.dvatid),
                    sellerId: 1, // Using 1 as placeholder for wallet top-up
                    type: "CREDIT",
                    status: "ACTIVE",
                    old_wallet: oldWallet.toFixed(2),
                    new_wallet: newWallet.toFixed(2),
                    invoice_number: `LIQUOR_TOPUP_${challan.cpin}`,
                  },
                });
              }
            } catch (walletError) {
              console.log(
                "Error updating wallet for liquor wallet top-up payment:",
                walletError,
              );
              // Don't fail the payment if wallet update fails
            }
          }
        }
      }
    } else if (statusGroup === "pending") {
      if (
        intent &&
        ["CREATED", "INITIATED", "EXPIRED"].includes(intent.status)
      ) {
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
            deletedAt: null,
            deletedById: null,
          },
        });
      }
    } else if (
      statusGroup === "cancelled" ||
      statusGroup === "failed" ||
      statusGroup === "refunded"
    ) {
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
            deletedAt: new Date().toISOString(),
            deletedById: 1,
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
          deletedAt: new Date().toISOString(),
          deletedById: 1,
          order_status: result.order_status || "FAILED",
          failure_message: "Payment validation failed: AMOUNT_MISMATCH",
          status_message:
            result.status_message ||
            "Amount mismatch in reconciliation callback.",
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
