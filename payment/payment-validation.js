export const getNumericAmount = (value) => {
  const parsedValue = parseFloat((value || "0").toString().replace(/,/g, ""));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const isAmountMatched = (expected, paid) =>
  Math.abs(getNumericAmount(expected) - getNumericAmount(paid)) < 0.01;

export const validateIntentCallbackSecurity = ({
  intent,
  challan,
  callbackOrderId,
  callbackAmount,
  callbackChallanId,
  callbackDvatId,
}) => {
  if (!intent) {
    return {
      ok: false,
      reason: "PAYMENT_INTENT_NOT_FOUND",
    };
  }

  if (!challan) {
    return {
      ok: false,
      reason: "CHALLAN_NOT_FOUND",
    };
  }

  if (intent.status !== "INITIATED") {
    return {
      ok: false,
      reason: "INTENT_NOT_INITIATED",
    };
  }

  if (intent.completedAt) {
    return {
      ok: false,
      reason: "INTENT_ALREADY_COMPLETED",
    };
  }

  if (intent.expiresAt && new Date(intent.expiresAt) <= new Date()) {
    return {
      ok: false,
      reason: "INTENT_EXPIRED",
    };
  }

  if (intent.gateway_order_id?.toString() !== (callbackOrderId || "").toString()) {
    return {
      ok: false,
      reason: "ORDER_ID_MISMATCH",
    };
  }

  if (!isAmountMatched(intent.expected_amount, callbackAmount)) {
    return {
      ok: false,
      reason: "AMOUNT_MISMATCH",
    };
  }

  if (parseInt(challan.id?.toString() || "0", 10) !== parseInt(callbackChallanId?.toString() || "0", 10)) {
    return {
      ok: false,
      reason: "CHALLAN_ID_MISMATCH",
    };
  }

  if (parseInt(challan.dvatid?.toString() || "0", 10) !== parseInt(callbackDvatId?.toString() || "0", 10)) {
    return {
      ok: false,
      reason: "DVAT_ID_MISMATCH",
    };
  }

  return {
    ok: true,
    reason: "OK",
  };
};
