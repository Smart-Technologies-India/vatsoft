import crypto from "crypto";
import CryptoJS from "crypto-js";
import { decrypt } from "./ccavutil.js";
import qs from "querystring";
import prisma from "../prisma/database.js";

const sendReturnFiledSmsByIds = async ({ dvatId, returnId }) => {
  const parsedDvatId = parseInt(dvatId?.toString() || "0", 10);
  const parsedReturnId = parseInt(returnId?.toString() || "0", 10);

  if (!parsedDvatId || !parsedReturnId) {
    return { sent: false, message: "Invalid dvatId or returnId." };
  }

  const dvatRecord = await prisma.dvat04.findFirst({
    where: {
      id: parsedDvatId,
      deletedAt: null,
    },
    select: {
      name: true,
      tradename: true,
      contact_one: true,
    },
  });

  const returnRecord = await prisma.returns_01.findFirst({
    where: {
      id: parsedReturnId,
      dvat04Id: parsedDvatId,
      deletedAt: null,
    },
    select: {
      rr_number: true,
      month: true,
      year: true,
      quarter: true,
    },
  });

  if (!dvatRecord || !returnRecord) {
    return { sent: false, message: "Return or dealer record not found." };
  }

  const contactDigits = (dvatRecord.contact_one ?? "").replace(/\D/g, "");
  const mobile =
    contactDigits.length > 10 ? contactDigits.slice(-10) : contactDigits;

  if (mobile.length !== 10) {
    return { sent: false, message: "Valid mobile not found for dealer." };
  }

  const dealerName = dvatRecord.tradename || "Dealer";
  const returnPeriod = returnRecord.month
    ? `${returnRecord.month} ${returnRecord.year}`
    : `${returnRecord.quarter} ${returnRecord.year}`;
  const ackNumber = returnRecord.rr_number || "NA";

  const smsMessage = encodeURIComponent(
    `Dear ${dealerName}, VAT return for ${returnPeriod} is successfully filed. Acknowledgment No: ${ackNumber}. Thank you! VAT DDD`,
  );

  await fetch(
    `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${mobile}&message=${smsMessage}&senderid=VATDNH&accusage=1&entityid=1701174159851422588&tempid=1707174989299822848`,
  );

  return { sent: true, message: "SMS sent successfully." };
};

export const sendReturnFiledSms = async (request, response) => {
  try {
    const { dvatId, returnId } = request.body || {};
    const smsResponse = await sendReturnFiledSmsByIds({ dvatId, returnId });
    response.status(200).json(smsResponse);
  } catch (error) {
    console.log(error);
    response.status(500).json({ sent: false, message: "Unable to send SMS." });
  }
};

export const postRes = (request, response) => {
  var ccavEncResponse = "",
    ccavResponse = "",
    ccavPOST = "";

  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(process.env.WORKING_KEY).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  request.on("data", function (data) {
    ccavEncResponse += data;
    ccavPOST = qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = decrypt(encryption, keyBase64, ivBase64);
  });

  request.on("end", async function () {
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
      "amount",
      "billing_name",
      "merchant_param1",
      "response_code",
      "bene_account",
      "bene_name",
      "bene_ifsc",
      "bene_bank",
      "bene_branch",
      "trans_fee",
    ];

    const pairs = ccavResponse.split("&");
    const result = {};
    pairs.forEach((pair) => {
      const [key, value] = pair.split("=");

      if (keysToKeep.includes(key)) {
        result[key] = value === "null" ? null : decodeURIComponent(value);
      }
    });

    const challanid = result.merchant_param1.toString().split("_")[0];
    const dvatid = result.merchant_param1.toString().split("_")[1];
    const return_id = result.merchant_param1.toString().split("_")[2];
    const type = result.merchant_param1.toString().split("_")[3];

    const secretKey = "knf92fg#G$%2Ij309pwkn4gf#WTF#WCc2@#$WTfwe4gFVD";
    const toBase64Url = (str) =>
      str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const encryptURLData = (data) => {
      const encryptedData = CryptoJS.AES.encrypt(data, secretKey).toString();
      return toBase64Url(encryptedData);
    };

    const renderReceiptHtml = ({
      statusTitle,
      statusTone,
      message,
      amount,
      showAmount = true,
      redirectId,
      enableReturnSmsButton = false,
    }) => {
      const toneMap = {
        success: {
          badgeBg: "#dcfce7",
          badgeText: "#166534",
          accent: "#16a34a",
          border: "#86efac",
        },
        aborted: {
          badgeBg: "#fef3c7",
          badgeText: "#92400e",
          accent: "#d97706",
          border: "#fcd34d",
        },
        failed: {
          badgeBg: "#fee2e2",
          badgeText: "#991b1b",
          accent: "#dc2626",
          border: "#fca5a5",
        },
      };

      const tone = toneMap[statusTone] || toneMap.failed;
      const formattedDate = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const receiptNo = result.order_id || result.tracking_id || "NA";
      const txnId = result.tracking_id || "NA";
      const paidFor = result.billing_name || "VAT Payment";
      const bankRef = result.bank_ref_no || "NA";
      const payMode = result.payment_mode || "NA";
      const statusMsg = result.status_message || result.failure_message || "NA";
      const numericRedirectId = parseInt(
        redirectId?.toString() || challanid?.toString() || "0",
        10,
      );
      const encryptedRedirectId = encryptURLData(numericRedirectId.toString());
      const redirectUrl = `/dashboard/payments/saved-challan/${encryptedRedirectId}`;
      const shouldAutoRedirect = !enableReturnSmsButton;

      return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${statusTitle} - Receipt</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Inter, Arial, sans-serif;
        background: #f3f4f6;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
      }
      .receipt {
        width: 100%;
        max-width: 460px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-top: 6px solid ${tone.accent};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 30px -20px rgba(0, 0, 0, 0.2);
      }
      .header { padding: 18px 20px 14px; border-bottom: 1px dashed #d1d5db; }
      .brand { font-size: 13px; color: #6b7280; letter-spacing: 0.8px; }
      .titleRow {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      .title { font-size: 24px; color: #111827; font-weight: 700; }
      .badge {
        background: ${tone.badgeBg};
        color: ${tone.badgeText};
        border: 1px solid ${tone.border};
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .subtitle { margin-top: 10px; color: #4b5563; font-size: 14px; }
      .meta { padding: 14px 20px; background: #f9fafb; border-bottom: 1px dashed #d1d5db; }
      .metaItem { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
      .metaItem .label { color: #6b7280; }
      .metaItem .value { color: #111827; font-weight: 600; text-align: right; margin-left: 10px; }
      .amountWrap { padding: 18px 20px; border-bottom: 1px dashed #d1d5db; }
      .amountBox {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 14px;
        text-align: center;
      }
      .amountLabel { font-size: 13px; color: #6b7280; }
      .amountValue { margin-top: 6px; font-size: 30px; font-weight: 800; color: #111827; }
      .details { padding: 14px 20px 8px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
      .row .label { color: #6b7280; font-size: 13px; }
      .row .value { color: #111827; font-size: 13px; font-weight: 600; text-align: right; }
      .footer {
        padding: 16px 20px 20px;
        text-align: center;
        color: #4b5563;
        font-size: 13px;
        border-top: 1px dashed #d1d5db;
      }
      .countdown {
        display: inline-block;
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 8px;
        background: #f3f4f6;
        color: #111827;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <section class="header">
        <p class="brand">VAT DDDNH • TRANSACTION RECEIPT</p>
        <div class="titleRow">
          <h1 class="title">${statusTitle}</h1>
          <span class="badge">${result.order_status || "NA"}</span>
        </div>
        <p class="subtitle">${message}</p>
      </section>

      <section class="meta">
        <div class="metaItem"><span class="label">Receipt No.</span><span class="value">${receiptNo}</span></div>
        <div class="metaItem"><span class="label">Generated On</span><span class="value">${formattedDate}</span></div>
      </section>

      ${showAmount ? `<section class="amountWrap"><div class="amountBox"><p class="amountLabel">Amount</p><p class="amountValue">₹ ${amount || result.amount || "0.00"}</p></div></section>` : ""}

      <section class="details">
        <div class="row"><span class="label">Transaction ID</span><span class="value">${txnId}</span></div>
        <div class="row"><span class="label">Order ID</span><span class="value">${result.order_id || "NA"}</span></div>
        <div class="row"><span class="label">Paid For</span><span class="value">${paidFor}</span></div>
        <div class="row"><span class="label">Bank Ref. No.</span><span class="value">${bankRef}</span></div>
        <div class="row"><span class="label">Payment Mode</span><span class="value">${payMode}</span></div>
        <div class="row"><span class="label">Status Message</span><span class="value">${statusMsg}</span></div>
      </section>

      <section class="footer">
        ${shouldAutoRedirect ? `<p>Redirecting to challan page in <span id="countdown" class="countdown">10</span> seconds...</p>` : `<button id="returnAndSendSmsBtn" class="countdown" style="cursor:pointer;border:1px solid #d1d5db;">Return to Challan Page</button>`}
      </section>
    </main>
    <script>
      (function () {
        var redirectUrl = "${redirectUrl}";
        var shouldAutoRedirect = ${shouldAutoRedirect ? "true" : "false"};
        var enableReturnSmsButton = ${enableReturnSmsButton ? "true" : "false"};
        var dvatId = "${dvatid}";
        var returnId = "${return_id}";

        if (shouldAutoRedirect) {
          var seconds = 10;
          var el = document.getElementById("countdown");
          var timer = setInterval(function () {
            seconds -= 1;
            if (el) el.textContent = String(seconds);
            if (seconds <= 0) {
              clearInterval(timer);
              window.location.href = redirectUrl;
            }
          }, 1000);
          return;
        }

        var btn = document.getElementById("returnAndSendSmsBtn");
        if (!btn) return;

        btn.addEventListener("click", async function () {
          btn.setAttribute("disabled", "disabled");
          btn.textContent = "Please wait...";

          try {
            if (enableReturnSmsButton) {
              await fetch("/sendReturnFiledSms", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  dvatId: dvatId,
                  returnId: returnId,
                }),
              });
            }
          } catch (e) {
            console.log(e);
          }

          window.location.href = redirectUrl;
        });
      })();
    </script>
  </body>
</html>`;
    };

    if (result.order_status == "Aborted") {
      // Get original challan
      const originalChallan = await prisma.challan.findFirst({
        where: {
          dvatid: dvatid ? parseInt(dvatid) : 0,
          id: challanid ? parseInt(challanid) : 0,
        },
      });

      // Create new challan with same data
      let redirectChallanId = challanid ? parseInt(challanid) : 0;
      if (originalChallan) {
        const createdChallan = await prisma.challan.create({
          data: {
            dvatid: originalChallan.dvatid,
            cpin: originalChallan.cpin,
            returnid: originalChallan.returnid,
            vat: originalChallan.vat,
            latefees: originalChallan.latefees,
            interest: originalChallan.interest,
            others: originalChallan.others,
            penalty: originalChallan.penalty,
            createdById: originalChallan.createdById,
            expire_date: originalChallan.expire_date,
            total_tax_amount: originalChallan.total_tax_amount,
            reason: "MONTHLYPAYMENT",
            paymentstatus: "CREATED",
            transaction_date: new Date().toISOString(),
            paymentmode: "ONLINE",
            bank_name: originalChallan.bank_name,
          },
        });
        redirectChallanId = createdChallan.id;
      }

      // Update original challan
      const update_response = await prisma.challan.update({
        where: {
          id: challanid ? parseInt(challanid) : 0,
        },
        data: {
          paymentstatus: "FAILED",
          order_status: result.order_status,
          deletedAt: new Date().toISOString(),
          deletedById: 1,
        },
      });

      const htmlcode = renderReceiptHtml({
        statusTitle: "Transaction Aborted",
        statusTone: "aborted",
        message: "Payment was cancelled by client before completion.",
        amount: result.amount,
        redirectId: redirectChallanId,
      });
      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    } else if (result.order_status == "Success") {
      if (type == "NEWREGISTRATION") {
        try {
          await prisma.challan.update({
            where: {
              id: parseInt(challanid),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_ref_no,
              order_status: result.order_status,
              failure_message: result.failure_message,
              card_name: result.card_name,
              status_code: result.status_code,
              status_message: result.status_message,
              response_code: result.response_code,
              bene_account: result.bene_account,
              bene_name: result.bene_name,
              bene_ifsc: result.bene_ifsc,
              bene_bank: result.bene_bank,
              bene_branch: result.bene_branch,
              trans_fee: result.trans_fee,
            },
          });
        } catch (e) {
          console.log(e);
        }

        // const NewBidSubmitted = `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=Thank%20you%20for%20submitting%20your%20bid.%20We%20have%20received%20it%20successfully.%20You%20will%20be%20notified%20of%20any%20updates%20or%20further%20actions.%20-%20PDA%2C%20DNH.&MobileNumbers=91${mobile_number}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`;

        // await axios.get(NewBidSubmitted);
      } else if (type == "RETURN") {
        try {
          const challan = await prisma.challan.update({
            where: {
              id: parseInt(challanid),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_ref_no,
              order_status: result.order_status,
              failure_message: result.failure_message,
              card_name: result.card_name,
              status_code: result.status_code,
              status_message: result.status_message,
              response_code: result.response_code,
              bene_account: result.bene_account,
              bene_name: result.bene_name,
              bene_ifsc: result.bene_ifsc,
              bene_bank: result.bene_bank,
              bene_branch: result.bene_branch,
              trans_fee: result.trans_fee,
            },
          });

          await prisma.returns_01.update({
            where: {
              id: challan.returnid,
            },
            data: {
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              track_id: result.tracking_id,
              bank_name: result.bank_ref_no,
              transaction_id: result.order_id,
              status: "PAID",
            },
          });

        } catch (e) {
          console.log(e);
        }

        // const RentIsPaid = `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=Confirmation%3A%20Your%20rent%20for%20${updatedata.shop.shop_category.name}%20at%20${updatedata.shop.property.name}%20has%20been%20paid.%20We%20appreciate%20your%20timely%20payment%20-DNH%20PDA.&MobileNumbers=91${updatedata.user.contactone}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`;

        // const message_response = await fetch(RentIsPaid, {
        //   method: "GET",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
      } else if (type == "DEMAND") {
        try {
          const challan = await prisma.challan.update({
            where: {
              id: parseInt(challanid),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_ref_no,
              order_status: result.order_status,
              failure_message: result.failure_message,
              card_name: result.card_name,
              status_code: result.status_code,
              status_message: result.status_message,
              response_code: result.response_code,
              bene_account: result.bene_account,
              bene_name: result.bene_name,
              bene_ifsc: result.bene_ifsc,
              bene_bank: result.bene_bank,
              bene_branch: result.bene_branch,
              trans_fee: result.trans_fee,
            },
          });

          const get_rr_number = () => {
            const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
            const today = new Date();
            const month = ("0" + (today.getMonth() + 1)).slice(-2);
            const day = ("0" + today.getDate()).slice(-2);
            const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

            return `${rr_no}${month}${day}${return_id}`;
          };

          await prisma.returns_01.update({
            where: {
              id: challan.returnid,
            },
            data: {
              rr_number: get_rr_number(),
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              track_id: result.tracking_id,
              bank_name: result.bank_ref_no,
              transaction_id: result.order_id,
              status: "PAID",
            },
          });

          const returnToUpdate = await prisma.returns_01.findMany({
            where: {
              id: challan.returnid,
            },
            include: {
              dvat04: true,
              challan: true,
            },
          });

          const getMonthGroup = (currentMonth) => {
            const monthGroups = [
              ["April", "May", "June"],
              ["July", "August", "September"],
              ["October", "November", "December"],
              ["January", "February", "March"],
            ];

            // Find the group that contains the current month
            for (const group of monthGroups) {
              if (group.includes(currentMonth)) {
                return group;
              }
            }

            return [];
          };

          if (returnToUpdate?.dvat04?.frequencyFilings === "QUARTERLY") {
            const groupedMonths = getMonthGroup(returnToUpdate.month ?? "");
            const monthsToUpdate =
              groupedMonths.length > 0 ? groupedMonths : [returnToUpdate.month ?? ""];
            const filingDate = new Date();

            const quarterlyReturns = await prisma.returns_01.findMany({
              where: {
                dvat04Id: returnToUpdate.dvat04Id,
                year: returnToUpdate.year,
                month: { in: monthsToUpdate },
              },
              include: {
                dvat04: true,
              },
            });

            await Promise.all(
              quarterlyReturns.map((quarterlyReturn) =>
                prisma.returns_01.update({
                  where: {
                    id: quarterlyReturn.id,
                  },
                  data: {
                    rr_number: get_rr_number(quarterlyReturn),
                    paymentmode: result.payment_mode.toString().toUpperCase(),
                    transaction_date: new Date().toISOString(),
                    track_id: result.tracking_id,
                    bank_name: result.bank_ref_no,
                    transaction_id: result.order_id,
                    status: "PAID",
                  },
                }),
              ),
            );

            // Get all records to update to check due dates
            const recordsToUpdate = await prisma.return_filing.findMany({
              where: {
                filing_status: false,
                dvatid: returnToUpdate.dvat04Id,
                filing_date: null,
                year: returnToUpdate.year,
                month: { in: monthsToUpdate },
              },
            });

            // Update each record with appropriate return_status
            await Promise.all(
              recordsToUpdate.map((record) =>
                prisma.return_filing.update({
                  where: { id: record.id },
                  data: {
                    filing_date: filingDate,
                    filing_status: true,
                    return_status:
                      record.due_date && record.due_date >= filingDate
                        ? "FILED"
                        : "LATEFILED",
                  },
                }),
              ),
            );
          } else {
            const filingDate = new Date();

            await prisma.returns_01.update({
              where: {
                id: challan.returnid,
              },
              data: {
                rr_number: get_rr_number(returnToUpdate),
                paymentmode: result.payment_mode.toString().toUpperCase(),
                transaction_date: new Date().toISOString(),
                track_id: result.tracking_id,
                bank_name: result.bank_ref_no,
                transaction_id: result.order_id,
                status: "PAID",
              },
            });

            // Get all records to update to check due dates
            const recordsToUpdate = await prisma.return_filing.findMany({
              where: {
                filing_status: false,
                dvatid: returnToUpdate.dvat04Id,
                filing_date: null,
                year: returnToUpdate.year,
                month: returnToUpdate.month ?? "",
              },
            });

            // Update each record with appropriate return_status
            await Promise.all(
              recordsToUpdate.map((record) =>
                prisma.return_filing.update({
                  where: { id: record.id },
                  data: {
                    filing_date: filingDate,
                    filing_status: true,
                    return_status:
                      record.due_date && record.due_date >= filingDate
                        ? "FILED"
                        : "LATEFILED",
                  },
                }),
              ),
            );
          }
        } catch (e) {
          console.log(e);
        }

        // const RentIsPaid = `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=Your%20booking%20at%20${updatedata.daily_shop.property.name}%20at%20${updatedata.daily_shop.name}%20is%20due.%20Please%20pay%20to%20confirm.%20Failing%20to%20pay%20would%20cancel%20booking.%20%E2%80%93DNHPDA.&MobileNumbers=91${updatedata.user.contactone}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`;

        // const message_response = await fetch(RentIsPaid, {
        //   method: "GET",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });

        // const RentIsPaid2 = `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=Your%20deposit%20for%20booking%20ID%20${
        //   "PDA-EVENT-" + updatedata.id
        // }%20on%20${
        //   updatedata.daily_shop.name
        // }%20is%20confirmed.%20Booking%20ID%3A%20${
        //   "PDA-EVENT-" + updatedata.id
        // }.%20%E2%80%93DNHPDA&MobileNumbers=91${
        //   updatedata.user.contactone
        // }&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`;

        // const message_response2 = await fetch(RentIsPaid2, {
        //   method: "GET",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
      }

      const htmlcode = renderReceiptHtml({
        statusTitle: "Transaction Successful",
        statusTone: "success",
        message: "Your payment has been received successfully.",
        amount: result.amount,
        redirectId: challanid ? parseInt(challanid) : 0,
        enableReturnSmsButton: type == "RETURN",
      });

      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    } else {
      // Get original challan
      const originalChallan = await prisma.challan.findFirst({
        where: {
          dvatid: dvatid ? parseInt(dvatid) : 0,
          id: challanid ? parseInt(challanid) : 0,
        },
      });

      // Create new challan with same data
      let redirectChallanId = challanid ? parseInt(challanid) : 0;
      if (originalChallan) {
        const createdChallan = await prisma.challan.create({
          data: {
            dvatid: originalChallan.dvatid,
            cpin: originalChallan.cpin,
            returnid: originalChallan.returnid,
            vat: originalChallan.vat,
            latefees: originalChallan.latefees,
            interest: originalChallan.interest,
            others: originalChallan.others,
            penalty: originalChallan.penalty,
            createdById: originalChallan.createdById,
            expire_date: originalChallan.expire_date,
            total_tax_amount: originalChallan.total_tax_amount,
            reason: "MONTHLYPAYMENT",
            paymentstatus: "CREATED",
            transaction_date: new Date().toISOString(),
            paymentmode: "ONLINE",
            bank_name: originalChallan.bank_name,
          },
        });
        redirectChallanId = createdChallan.id;
      }

      // Update original challan
      await prisma.challan.update({
        where: {
          id: challanid ? parseInt(challanid) : 0,
        },
        data: {
          paymentstatus: "FAILED",
          order_status: result.order_status,
          deletedAt: new Date().toISOString(),
          deletedById: 1,
        },
      });

      const htmlcode = renderReceiptHtml({
        statusTitle: "Transaction Failed",
        statusTone: "failed",
        message: "Payment could not be completed. Please try again.",
        amount: result.amount,
        redirectId: redirectChallanId,
      });
      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    }
  });
};
