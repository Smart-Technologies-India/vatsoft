
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const payamount = (request, response) => {
  const body = request.body || {};
  const amount = body.amount || body.xlmnx || "";
  const orderId = body.order_id || body.ynboy || "";
  const purpose = body.purpose || body.zgvfz || "";
  const name = body.name || "";
  const email = body.email || "";
  const mobile = body.mobile || "";

  const missing = !orderId || !amount;

  response.writeHead(200, { "Content-Type": "text/html" });
  response.write(
    `<html><head><style>@import url(https://fonts.googleapis.com/css2?family=Roboto:wght@500&display=swap);body{font-family:Roboto,sans-serif}</style></head><body><div style="width:100%;height:100vh;background-color:#eee;display:grid;place-items:center"><h1>${missing ? "Missing payment details." : "LOADING..."}</h1></div><form method="POST" name="customerData" action="/ccavRequestHandler"><table width="40%" height="100" align="center"><input type="hidden" name="merchant_id" id="merchant_id" value="${escapeHtml(process.env.MERCHANT_ID)}"> <input type="hidden" name="billing_country" value="India"> <input type="hidden" name="billing_state" value="DN"> <input type="hidden" name="cancel_url" value="https://dddnhvat.com/ccavResponseHandler"> <input type="hidden" name="redirect_url" value="https://dddnhvat.com/ccavResponseHandler"> <input type="hidden" name="language" id="language" value="EN"> <input type="hidden" name="billing_zip" value="396220"> <input type="hidden" name="order_id" value="${escapeHtml(orderId)}" id="order_id"> <input type="hidden" name="currency" value="INR"> <input type="hidden" name="amount" value="${escapeHtml(amount)}" id="amount"> <input type="hidden" name="merchant_param1" value="${escapeHtml(purpose)}" id="purpose"> <input type="hidden" name="billing_name" value="${escapeHtml(name)}" id="name"> <input type="hidden" name="billing_email" value="${escapeHtml(email)}" id="email"> <input type="hidden" name="billing_tel" value="${escapeHtml(mobile)}" id="mobile"> <input type="hidden" name="billing_address" value="Silvassa"> <input type="hidden" name="billing_city" value="Silvassa"><tr style="visibility:hidden"><td></td><td><input type="submit" value="Checkout" id="submit"></td></tr></table></form><script>const init = () => {var missing = ${missing ? "true" : "false"};if (missing) {return;}var form = document.forms.customerData;if (form) {form.submit();}};window.addEventListener("DOMContentLoaded", init);</script></body></html>`,
  );
  response.end();
};
