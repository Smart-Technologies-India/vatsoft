import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
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
