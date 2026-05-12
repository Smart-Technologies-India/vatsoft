import prisma from "../prisma/database.js";

const escapeHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const payamount = async (request, response) => {
  const paymentIntentToken =
    request?.query?.pi || request?.query?.payment_intent || request?.query?.session;

  if (!paymentIntentToken || paymentIntentToken.toString().trim().length < 16) {
    return response.status(400).send("Invalid payment session.");
  }

  const activeIntent = await prisma.payment_intent.findFirst({
    where: {
      token: paymentIntentToken.toString(),
      status: {
        in: ["CREATED", "INITIATED"],
      },
      completedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      challan: {
        include: {
          dvat: {
            select: {
              tradename: true,
              email: true,
              contact_one: true,
            },
          },
        },
      },
    },
  });

  console.log("Active Payment Intent:", activeIntent);

  if (!activeIntent || !activeIntent.challan) {
    return response.status(404).send("Payment session not found or expired.");
  }

  if (activeIntent.status === "CREATED") {
    const consumeResult = await prisma.payment_intent.updateMany({
      where: {
        id: activeIntent.id,
        status: "CREATED",
        consumedAt: null,
      },
      data: {
        status: "INITIATED",
        consumedAt: new Date(),
        initiatedAt: new Date(),
      },
    });

    console.log("Consume Result:", consumeResult);

    if (consumeResult.count === 0) {
      return response.status(409).send("Payment session already used.");
    }
  }

  const challan = activeIntent.challan;
  const paymentType = activeIntent.type || "DEMAND";

  const purpose = `${challan.id}_${challan.dvatid}_${challan.returnid ?? 0}_${paymentType}`;
  const billingName = challan.dvat?.tradename || "VAT Dealer";
  const billingEmail = challan.dvat?.email || "support@dddnhvat.com";
  const billingMobile = (challan.dvat?.contact_one || "").replace(/\D/g, "").slice(-10) || "0000000000";

  response.writeHead(200, { "Content-Type": "text/html" });
  response.write(
    `<html><head><style>@import url(https://fonts.googleapis.com/css2?family=Roboto:wght@500&display=swap);body{font-family:Roboto,sans-serif}</style></head><body><div style="width:100%;height:100vh;background-color:#eee;display:grid;place-items:center"><h1>LOADING...</h1></div><form method="POST" name="customerData" action="/ccavRequestHandler"><table width="40%" height="100" align="center"><input type="hidden" name="merchant_id" id="merchant_id" value="${escapeHtml(process.env.MERCHANT_ID)}"> <input type="hidden" name="billing_country" value="India"> <input type="hidden" name="billing_state" value="DN"> <input type="hidden" name="cancel_url" value="https://dddnhvat.com/ccavResponseHandler"> <input type="hidden" name="redirect_url" value="https://dddnhvat.com/ccavResponseHandler"> <input type="hidden" name="language" id="language" value="EN"> <input type="hidden" name="billing_zip" value="396220"> <input type="hidden" name="order_id" value="${escapeHtml(activeIntent.gateway_order_id || "")}" id="order_id"> <input type="hidden" name="currency" value="INR"> <input type="hidden" name="amount" value="${escapeHtml(activeIntent.expected_amount || "0")}" id="amount"> <input type="hidden" name="merchant_param1" value="${escapeHtml(purpose)}" id="purpose"> <input type="hidden" name="billing_name" value="${escapeHtml(billingName)}" id="name"> <input type="hidden" name="billing_email" value="${escapeHtml(billingEmail)}" id="email"> <input type="hidden" name="billing_tel" value="${escapeHtml(billingMobile)}" id="mobile"> <input type="hidden" name="billing_address" value="Silvassa"> <input type="hidden" name="billing_city" value="Silvassa"><tr style="visibility:hidden"><td></td><td><input type="submit" value="Checkout" id="submit"></td></tr></table></form><script>window.addEventListener("load", function(){setTimeout(function(){document.getElementById("submit").click();}, 500);});</script></body></html>`,
  );
  response.end();
};
