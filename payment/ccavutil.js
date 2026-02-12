// var crypto = require("crypto");
import crypto from "crypto";

export const workingKey = "370F518A36775EFEA425EB27C8DC0CC6";
export const accessCode = "AVHK88LE92BW69KHWB";
export const merchant_id = 4417350;

function getAlgorithm(keyBase64) {
  var key = Buffer.from(keyBase64, "base64");
  switch (key.length) {
    case 16:
      return "aes-128-cbc";
    case 32:
      return "aes-256-cbc";
  }
  throw new Error("Invalid key length: " + key.length);
}

export function encrypt(plainText, keyBase64, ivBase64) {
  const key = Buffer.from(keyBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");

  const cipher = crypto.createCipheriv(getAlgorithm(keyBase64), key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decrypt(messagebase64, keyBase64, ivBase64) {
  const key = Buffer.from(keyBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");

  const decipher = crypto.createDecipheriv(getAlgorithm(keyBase64), key, iv);
  let decrypted = decipher.update(messagebase64, "hex");
  decrypted += decipher.final();
  return decrypted;
}

// function encrypt(input, key) {
//   const iv = key.slice(0, 16);
//   const cipher = crypto.createCipheriv("aes-128-cbc", key.slice(0, 16), iv);
//   let encrypted = cipher.update(input, "utf8", "base64");
//   encrypted += cipher.final("base64");
//   return encrypted;
// }

// function decrypt(cipherText, key) {
//   const iv = key.slice(0, 16);
//   const decipher = crypto.createDecipheriv("aes-128-cbc", key.slice(0, 16), iv);
//   let decryptedData = decipher.update(cipherText, "base64", "utf8");
//   decryptedData += decipher.final("utf8");
//   return decryptedData;
// }
