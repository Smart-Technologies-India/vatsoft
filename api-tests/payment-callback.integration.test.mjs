import test from "node:test";
import assert from "node:assert/strict";

import { validateIntentCallbackSecurity } from "../payment/payment-validation.js";

const buildIntent = (overrides = {}) => ({
  id: 10,
  status: "INITIATED",
  gateway_order_id: "ord_1234567890",
  expected_amount: "1500.00",
  completedAt: null,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  ...overrides,
});

const buildChallan = (overrides = {}) => ({
  id: 101,
  dvatid: 45,
  ...overrides,
});

test("callback validation fails when amount is tampered", () => {
  const validation = validateIntentCallbackSecurity({
    intent: buildIntent(),
    challan: buildChallan(),
    callbackOrderId: "ord_1234567890",
    callbackAmount: "1499.00",
    callbackChallanId: 101,
    callbackDvatId: 45,
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.reason, "AMOUNT_MISMATCH");
});

test("callback validation fails when order id does not match intent", () => {
  const validation = validateIntentCallbackSecurity({
    intent: buildIntent(),
    challan: buildChallan(),
    callbackOrderId: "ord_different",
    callbackAmount: "1500.00",
    callbackChallanId: 101,
    callbackDvatId: 45,
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.reason, "ORDER_ID_MISMATCH");
});
