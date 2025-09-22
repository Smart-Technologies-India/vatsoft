import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";
import crypto from "crypto";
import csrf from "csurf";
const csrfProtection = csrf();
import express from "express";

function encrypt(input, key) {
  const iv = key.slice(0, 16);
  const cipher = crypto.createCipheriv("aes-128-cbc", key.slice(0, 16), iv);
  let encrypted = cipher.update(input, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

function decrypt(cipherText, key) {
  const iv = key.slice(0, 16);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key.slice(0, 16), iv);
  let decryptedData = decipher.update(cipherText, "base64", "utf8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
}

const port = parseInt(process.env.PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

var MerchantId = "1000605";
var Array_key = "pWhMnIEMc4q6hKdi2Fx50Ii8CKAoSIqv9ScSpwuMHM4=";
var OperatingMode = "DOM";
var MerchantCountry = "IN";
var MerchantCurrency = "INR";
var TotalDueAmount = "10";
var OtherDetails = "NA";
// var SuccessURL = "https://test.sbiepay.sbi/secure/sucess3.jsp";
// var FailURL = "https://test.sbiepay.sbi/secure/fail3.jsp";
var SuccessURL = "https://dddnhvat.com/payment/success";
var FailURL = "https://dddnhvat.com/payment/fail";
var AggregatorId = "SBIEPAY";
var MerchantCustomerID = "5";
var Paymode = "NB";
var Accesmedium = "ONLINE";
var TransactionSource = "ONLINE";
// var MerchantOrderNo = "4573243384";
var MerchantOrderNo = new Date().getTime().toString();

const sbiepay = () => (req, res) => {
  try {
    const Single_Request =
      MerchantId +
      "|" +
      OperatingMode +
      "|" +
      MerchantCountry +
      "|" +
      MerchantCurrency +
      "|" +
      TotalDueAmount +
      "|" +
      OtherDetails +
      "|" +
      SuccessURL +
      "|" +
      FailURL +
      "|" +
      AggregatorId +
      "|" +
      MerchantOrderNo +
      "|" +
      MerchantCustomerID +
      "|" +
      Paymode +
      "|" +
      Accesmedium +
      "|" +
      TransactionSource;

    console.log("Request String:\n" + Single_Request);
    const value = encrypt(Single_Request, Array_key);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<html><body>
             <form name="form1" method="post" action="https://test.sbiepay.sbi/secure/AggregatorHostedListener">
             <p>${MerchantOrderNo}</p>
             <table>
                 <tr>
                   <th>Encrypted Transaction</th>
                   <td><textarea name="EncryptTrans" rows="4" cols="80" readonly>${value}</textarea></td>
                 </tr>
                 <tr>
                   <th>Merchant ID</th>
                   <td><input type="text" name="merchIdVal" value="${MerchantId}" /></td>
                 </tr>
                 <tr>
                   <td></td>
                   <td><input type="submit" value="Submit" /></td>
                 </tr>
               </table>
             </form>
           </body></html>`
    );
  } catch (error) {
    console.error("SBI Pay error:", error);
    res.writeHead(500).end("Server error");
  }
};

const sbiesuccess = () => (req, res) => {
  res.write("Transactions Fetched Successfully");
  res.write("<br>");
  res.write("<br>Encrypted data =  " + req.body.encData);

  // const encData = AESobj.decrypt(req.body.encData, key);
  res.write("<br>Decrypted data =  " + decrypt(req.body.encData, Array_key));
  res.end();
};
const sbiefail = () => (req, res) => {
  res.write("Transactions Failed");
  res.write("<br>");
  res.write("<br>Encrypted data =  " + req.body.encData);

  // const encData = AESobj.decrypt(req.body.encData, key);
  res.write("<br>Decrypted data =  " + decrypt(req.body.encData, Array_key));
  res.end();
};
app.prepare().then(() => {
  const server = express();

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  server.get("/sbiepay", (req, res) => {
    return sbiepay()(req, res);
  });

  server.post("/payment/success", (req, res) => {
    return sbiesuccess()(req, res);
  });

  server.post("/payment/fail", (req, res) => {
    return sbiefail()(req, res);
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`------------> Ready on http://localhost:${port}`);
  });

  // createServer((req, res) => {
  //   const parsedUrl = parse(req.url, true);
  //   if (parsedUrl.pathname === "/sbiepay") {
  //     // your SBI logic here

  //   } else if (parsedUrl.pathname === "/payment/success") {
  //     const transactionData = req.body;
  //     res.render("success_page", { data: transactionData });
  //   } else if (parsedUrl.pathname === "/payment/fail") {
  //     const transactionData = req.body;
  //     res.render("fail_page", { data: transactionData });
  //   } else {
  //     handle(req, res, parsedUrl);
  //   }
  //   // handle(req, res, parsedUrl);
  // }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});

// cron.schedule("* * * * * *", async () => {
//   try {
//     await checkpaymentstatus();
//     const response = await axios.post(
//       `${process.env.YOUR_BASE_URL}/api/services`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   } catch (error) {}
//   // Add your task logic here, e.g., database cleanup, sending emails, etc.
// });
