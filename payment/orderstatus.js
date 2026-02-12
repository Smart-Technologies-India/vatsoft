import crypto from "crypto";
import axios from "axios";
import { encrypt, decrypt, workingKey, accessCode } from "./ccavutil.js";

export const orderstatus = async (request, response) => {
  var encRequest = "";

  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(workingKey).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  const orderNo = request?.body?.order_no || request?.body?.orderNo;
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
      `https://api.ccavenue.com/apis/servlet/DoWebTrans?access_code=${accessCode}&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2&enc_request=${encRequest}`,
    );

    let enc_code = result.data.toString().split("=").pop();
    let ccavResponse = decrypt(enc_code, keyBase64, ivBase64);
    let obj = JSON.parse(ccavResponse);

    return response.json({
      success: true,
      message: "Order status fetched",
      data: obj,
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
