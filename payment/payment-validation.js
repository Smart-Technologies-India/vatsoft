export const getNumericAmount = (value) => {
  const parsedValue = parseFloat((value || "0").toString().replace(/,/g, ""));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const isAmountMatched = (expected, paid) => {
  // return Math.abs(getNumericAmount(expected) - getNumericAmount(paid)) < 0.01;
  return getNumericAmount(expected) <= getNumericAmount(paid);
};

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

  // Check if intent has already been completed (prevents duplicate processing)
  if (intent.completedAt) {
    return {
      ok: false,
      reason: "INTENT_ALREADY_COMPLETED",
    };
  }

  // Allow processing if status is CREATED, INITIATED, or PENDING (not yet completed)
  const validStatuses = ["CREATED", "INITIATED", "PENDING"];
  const normalizedStatus = (intent.status || "").toUpperCase();
  
  if (!validStatuses.includes(normalizedStatus)) {
    return {
      ok: false,
      reason: `INVALID_INTENT_STATUS_${normalizedStatus}`,
    };
  }

  if (intent.expiresAt && new Date(intent.expiresAt) <= new Date()) {
    return {
      ok: false,
      reason: "INTENT_EXPIRED",
    };
  }

  if (
    intent.gateway_order_id?.toString() !== (callbackOrderId || "").toString()
  ) {
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

  if (
    parseInt(challan.id?.toString() || "0", 10) !==
    parseInt(callbackChallanId?.toString() || "0", 10)
  ) {
    return {
      ok: false,
      reason: "CHALLAN_ID_MISMATCH",
    };
  }

  if (
    parseInt(challan.dvatid?.toString() || "0", 10) !==
    parseInt(callbackDvatId?.toString() || "0", 10)
  ) {
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
