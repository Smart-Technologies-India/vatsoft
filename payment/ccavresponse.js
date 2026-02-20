import crypto from "crypto";
import { createRequire } from "module";
import { decrypt } from "./ccavutil.js";
import qs from "querystring";

const require = createRequire(import.meta.url);
const prisma = require("../prisma/database.js");

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
    console.log(result);

    const challanid = result.merchant_param1.toString().split("_")[0];
    const dvatid = result.merchant_param1.toString().split("_")[1];
    const return_id = result.merchant_param1.toString().split("_")[2];
    const type = result.merchant_param1.toString().split("_")[3];

    if (result.order_status == "Aborted") {
      const update_response = await prisma.challan.updateMany({
        where: {
          dvatid: dvatid ? parseInt(dvatid) : 0,
          id: challanid ? parseInt(challanid) : 0,
        },
        data: {
          paymentstatus: "FAILED",
          order_status: result.order_status,
          deletedAt: new Date().toISOString(),
          deletedById: 1,
        },
      });

      const htmlcode = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abort</title><script src="https://cdn.tailwindcss.com"></script></head><body><main class="h-screen w-full bg-[#eeeeee] grid place-items-center"><div class="w-96 bg-white rounded-lg p-6"><h1 class="text-rose-500 text-4xl text-center font-semibold">Abort</h1><div class="h-px bg-gray-400 w-full mt-2"></div><p class="text-xl text-slate-700 text-center font-medium mt-4">Payment declined by client.</p><div class="flex item-center gap-6 mt-4"><a href="https://dddnhvat.com/dashboard" class="grow py-1 text-center rounded-lg bg-blue-500 text-2xl text-white flex items-center gap-2 justify-center cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M4 21v-9.375L2.2 13L1 11.4L12 3l11 8.4l-1.2 1.575l-1.8-1.35V21zm4-6q-.425 0-.712-.288T7 14q0-.425.288-.712T8 13q.425 0 .713.288T9 14q0 .425-.288.713T8 15m4 0q-.425 0-.712-.288T11 14q0-.425.288-.712T12 13q.425 0 .713.288T13 14q0 .425-.288.713T12 15m4 0q-.425 0-.712-.288T15 14q0-.425.288-.712T16 13q.425 0 .713.288T17 14q0 .425-.288.713T16 15"/></svg><p>Home</p></a><a href="https://dddnhvat.com/contact" class="grow py-1 text-center rounded-lg bg-rose-500 text-2xl text-white flex items-center gap-2 justify-center cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M19 11.95q0-2.925-2.037-4.962T12 4.95v-2q1.875 0 3.513.713t2.85 1.925q1.212 1.212 1.925 2.85T21 11.95zm-4 0q0-1.25-.875-2.125T12 8.95v-2q2.075 0 3.538 1.463T17 11.95zM19.95 21q-3.125 0-6.175-1.362t-5.55-3.863q-2.5-2.5-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3"/></svg><p>Contact</p></a></div></div></main></body></html>`;
      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    } else if (result.order_status == "Success") {
      if (type == "NEWREGISTRATION") {
        try {
       
          await prisma.challan.updateMany({
            where: {
              id: parseInt(challanid),
              dvatid: parseInt(dvatid),
              return_id: parseInt(return_id),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_name,
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
          await prisma.challan.updateMany({
            where: {
              id: parseInt(challanid),
              dvatid: parseInt(dvatid),
              return_id: parseInt(return_id),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_name,
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

        // const RentIsPaid = `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=Confirmation%3A%20Your%20rent%20for%20${updatedata.shop.shop_category.name}%20at%20${updatedata.shop.property.name}%20has%20been%20paid.%20We%20appreciate%20your%20timely%20payment%20-DNH%20PDA.&MobileNumbers=91${updatedata.user.contactone}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`;

        // const message_response = await fetch(RentIsPaid, {
        //   method: "GET",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
      } else if (type == "DEMAND") {
        try {
          await prisma.challan.updateMany({
            where: {
              id: parseInt(challanid),
              dvatid: parseInt(dvatid),
            },
            data: {
              paymentstatus: "PAID",
              track_id: result.tracking_id,
              order_id: result.order_id,
              paymentmode: result.payment_mode.toString().toUpperCase(),
              transaction_date: new Date().toISOString(),
              bank_name: result.bank_name,
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

      const htmlcode = `<html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Success</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap");
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            min-height: 100vh;
            background-color: #eee;
            display: grid;
            place-items: center;
          }
          main {
            width: 400px;
            background-color: #fff;
            border-radius: 20px;
            padding: 20px;
          }
          .title {
            text-align: center;
            color: #22c55e;
            font-size: 30px;
            font-family: "Roboto", sans-serif;
          }
          .subtitle {
            text-align: center;
            color: #333;
            font-size: 18px;
            font-family: "Roboto", sans-serif;
            background: linear-gradient(to left, #bfdbfe, #fed7aa);
            border-radius: 5px;
            padding: 4px 0;
            margin-top: 20px;
            font-weight: 500;
          }
          #date {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            font-family: "Roboto", sans-serif;
            margin-top: 20px;
          }
          .header {
            font-family: "Roboto", sans-serif;
            background: linear-gradient(to left, #bfdbfe, #fed7aa);
            text-align: center;
            padding: 10px;
            border-top-right-radius: 10px;
            border-top-left-radius: 10px;
            margin-top: 20px;
          }
          .header .price {
            font-weight: 700;
            font-size: 24px;
          }
          .paymentdetails {
            border: 1px solid #eee;
            padding: 10px;
          }
          .paymentdetails .main {
            display: flex;
            justify-content: space-between;
            margin: 6px 0px;
          }
          .paymentdetails .main .prop {
            font-weight: 400;
            color: #9ca3af;
            font-size: 14px;
            font-family: "Roboto", sans-serif;
          }
          .paymentdetails .main .value {
            color: #333;
            font-size: 14px;
            font-family: "Roboto", sans-serif;
            font-weight: 400;
          }
          .btnbox {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .btnone {
            display: flex;
            align-items: center;
            padding: 4px 20px;
            background-color: #3b82f6;
            border-radius: 5px;
            color: #fff;
            text-decoration: none;
            font-size: 20px;
            font-family: "Roboto", sans-serif;
            font-weight: 500;
          }
          .btntwo {
            display: flex;
            align-items: center;
            padding: 4px 20px;
            background-color: #f43f5e;
            border-radius: 5px;
            color: #fff;
            text-decoration: none;
            font-size: 20px;
            font-family: "Roboto", sans-serif;
            font-weight: 500;
          }
          .btnone svg,
          .btntwo svg {
            margin-right: 10px;
            transform: scale(0.8);
          }
        </style>
      </head>
    
      <body>
        <main>
          <h1 class="title">Transaction Successful</h1>
    
          <p class="subtitle">Transaction ID : ${result.tracking_id}</p>
          <p id="date"></p>
          <div class="header">
            <p>Total Amount Transfered</p>
            <p class="price">₹ ${result.amount}</p>
          </div>
          <div class="paymentdetails">
            <div class="main">
              <div class="prop">Order ID</div>
              <div class="value">${result.order_id}</div>
            </div>
            <div class="main">
              <div class="prop">Paid For</div>
              <div class="value">${result.billing_name}</div>
            </div>
            <div class="main">
              <div class="prop">Bank Ref Number</div>
              <div class="value">${result.bank_ref_no}</div>
            </div>
            <div class="main">
              <div class="prop">Payee Name</div>
              <div class="value">${result.billing_name}</div>
            </div>
            <div class="main">
              <div class="prop">To</div>
              <div class="value">PDA, DNH</div>
            </div>
            <div class="main">
              <div class="prop">Payment Type</div>
              <div class="value">${result.payment_mode}</div>
            </div>
          </div>
    
          <div class="btnbox">
            <a href="https://dddnhvat.com/dashboard" class="btnone" target="_self">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M4 21v-9.375L2.2 13L1 11.4L12 3l11 8.4l-1.2 1.575l-1.8-1.35V21zm4-6q-.425 0-.712-.288T7 14q0-.425.288-.712T8 13q.425 0 .713.288T9 14q0 .425-.288.713T8 15m4 0q-.425 0-.712-.288T11 14q0-.425.288-.712T12 13q.425 0 .713.288T13 14q0 .425-.288.713T12 15m4 0q-.425 0-.712-.288T15 14q0-.425.288-.712T16 13q.425 0 .713.288T17 14q0 .425-.288.713T16 15"
                />
              </svg>
              <p>Home</p>
            </a>
            <a href="https://dddnhvat.com/contact" class="btntwo" target="_self">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M19 11.95q0-2.925-2.037-4.962T12 4.95v-2q1.875 0 3.513.713t2.85 1.925q1.212 1.212 1.925 2.85T21 11.95zm-4 0q0-1.25-.875-2.125T12 8.95v-2q2.075 0 3.538 1.463T17 11.95zM19.95 21q-3.125 0-6.175-1.362t-5.55-3.863q-2.5-2.5-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3"
                />
              </svg>
              <p>Contact</p>
            </a>
          </div>
        </main>
        <script>
          document.getElementById("date").innerHTML = new Date().toDateString();
        </script>
      </body>
    </html>
    `;

      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    } else {
      await prisma.challan.updateMany({
        where: {
          dvatid: dvatid ? parseInt(dvatid) : 0,
          id: challanid ? parseInt(challanid) : 0,
        },
        data: {
          paymentstatus: "FAILED",
          order_status: result.order_status,
          deletedAt: new Date().toISOString(),
          deletedById: 1,
        },
      });

      const htmlcode = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Failed</title><script src="https://cdn.tailwindcss.com"></script></head><body><main class="h-screen w-full bg-[#eeeeee] grid place-items-center"><div class="w-96 bg-white rounded-lg p-6"><h1 class="text-rose-500 text-4xl text-center font-semibold">Failed</h1><div class="h-px bg-gray-400 w-full mt-2"></div><p class="text-xl text-slate-700 text-center font-medium mt-4">Payment Failed.</p><div class="flex item-center gap-6 mt-4"><a href="https://dddnhvat.com/dashboard" class="grow py-1 text-center rounded-lg bg-blue-500 text-2xl text-white flex items-center gap-2 justify-center cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M4 21v-9.375L2.2 13L1 11.4L12 3l11 8.4l-1.2 1.575l-1.8-1.35V21zm4-6q-.425 0-.712-.288T7 14q0-.425.288-.712T8 13q.425 0 .713.288T9 14q0 .425-.288.713T8 15m4 0q-.425 0-.712-.288T11 14q0-.425.288-.712T12 13q.425 0 .713.288T13 14q0 .425-.288.713T12 15m4 0q-.425 0-.712-.288T15 14q0-.425.288-.712T16 13q.425 0 .713.288T17 14q0 .425-.288.713T16 15"/></svg><p>Home</p></a><a href="https://dddnhvat.com/contact" class="grow py-1 text-center rounded-lg bg-rose-500 text-2xl text-white flex items-center gap-2 justify-center cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M19 11.95q0-2.925-2.037-4.962T12 4.95v-2q1.875 0 3.513.713t2.85 1.925q1.212 1.212 1.925 2.85T21 11.95zm-4 0q0-1.25-.875-2.125T12 8.95v-2q2.075 0 3.538 1.463T17 11.95zM19.95 21q-3.125 0-6.175-1.362t-5.55-3.863q-2.5-2.5-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3"/></svg><p>Contact</p></a></div></div></main></body></html>`;
      response.writeHeader(200, { "Content-Type": "text/html" });
      response.write(htmlcode);
      response.end();
    }
  });
};
