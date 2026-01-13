// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   async headers() {
//     return [
//       {
//         source: "/api/:path*",
//         headers: [
//           { key: "Access-Control-Allow-Credentials", value: "true" },
//           { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
//           {
//             key: "Access-Control-Allow-Methods",
//             value: "GET,DELETE,PATCH,POST,PUT",
//           },
//           {
//             key: "Access-Control-Allow-Headers",
//             value:
//               "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
//           },
//         ],
//       },
//     ];
//   },

//   reactStrictMode: false,
//   experimental: {
//     missingSuspenseWithCSRBailout: false,
//   },
//   env: {
//     DATABASE_KEY: process.env.DATABASE_KEY,
//     DATABASE_IV: process.env.DATABASE_IV,
//   },
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "http://localhost:3001",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  reactStrictMode: false,
  allowedDevOrigins: ["192.168.1.9"],
  env: {
    DATABASE_KEY: process.env.DATABASE_KEY,
    DATABASE_IV: process.env.DATABASE_IV,
  },
  transpilePackages: ["./generated/prisma"],
};

export default nextConfig;
