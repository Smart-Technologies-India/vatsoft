import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";
import crypto from "crypto";
import csrf from "csurf";
const csrfProtection = csrf();

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

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

var MerchantId = "1000605";
var Array_key = "pWhMnIEMc4q6hKdi2Fx50Ii8CKAoSIqv9ScSpwuMHM4=";
var OperatingMode = "DOM";
var MerchantCountry = "IN";
var MerchantCurrency = "INR";
var TotalDueAmount = "10";
var OtherDetails = "NA";
var SuccessURL = "https://test.sbiepay.sbi/secure/sucess3.jsp";
var FailURL = "https://test.sbiepay.sbi/secure/fail3.jsp";
var AggregatorId = "SBIEPAY";
var MerchantCustomerID = "5";
var Paymode = "NB";
var Accesmedium = "ONLINE";
var TransactionSource = "ONLINE";
// var MerchantOrderNo = "4573243384";
var MerchantOrderNo = new Date().getTime().toString();

// app.get("/sbiepay", function (req, res) {
//   try {
//     var Single_Request =
//       MerchantId +
//       "|" +
//       OperatingMode +
//       "|" +
//       MerchantCountry +
//       "|" +
//       MerchantCurrency +
//       "|" +
//       TotalDueAmount +
//       "|" +
//       OtherDetails +
//       "|" +
//       SuccessURL +
//       "|" +
//       FailURL +
//       "|" +
//       AggregatorId +
//       "|" +
//       MerchantOrderNo +
//       "|" +
//       MerchantCustomerID +
//       "|" +
//       Paymode +
//       "|" +
//       Accesmedium +
//       "|" +
//       TransactionSource;
//     console.log("Request String:--------------\n" + Single_Request);
//     var value = encrypt(Single_Request, Array_key);
//     var Single_Paramresponce = value;
//     console.log("ENCRYPTED VALUE: \n" + Single_Paramresponce);

//     res.writeHead(200, { "Content-Type": "text/html" });
//     res.end(
//       '<html><head><body><form name="form1" method="post" action="https://test.sbiepay.sbi/secure/AggregatorHostedListener"><table><tr><th>Encrypted Transaction</th><td><textarea name="EncryptTrans" id="EncryptTrans" rows="4" cols="80" readonly style=" resize: none">' +
//         Single_Paramresponce +
//         '</textarea></td></tr><tr><th>Merchant ID </th><td><input type="text" name="merchIdVal" id="merchIdVal" value=' +
//         MerchantId +
//         '></td></tr><tr><td></td><td><input type="submit" style="background-color:lightblue;color:#7a6931;" value="Submit" /></td></tr></table></body></html>'
//     );
//   } catch (error) {
//     console.log(error, "error==========");
//     throw new Error(`callSbiEpay Failed.`, error);
//   }
// });

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (parsedUrl.pathname === "/sbiepay") {
      // your SBI logic here
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
    } else {
      handle(req, res, parsedUrl);
    }
    // handle(req, res, parsedUrl);
  }).listen(port);

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
