import next from "next";
import express from "express";

import { postReq } from "./payment/ccavrequest.js";
import { postRes } from "./payment/ccavresponse.js";
import { orderstatus } from "./payment/orderstatus.js";
import { payamount } from "./payment/payamount.js";

const port = parseInt(process.env.PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  server.get("/orderstatus", async function (request, response) {
    await orderstatus(request, response);
  });

  server.get("/payamount", async function (request, response) {
    // payamount(request, response);
    response.sendFile('data.html', { root: './public' });
  });

  server.post("/ccavRequestHandler", function (request, response) {
    postReq(request, response);
  });

  server.post("/ccavResponseHandler", function (request, response) {
    postRes(request, response);
  });

  server.all("/{*splat}", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) {
      console.error("Failed to start server:", err);
      throw err;
    }
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
    }`,
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
