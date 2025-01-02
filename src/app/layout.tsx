import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { nunito, roboto } from "../utils/fonts";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "VAT DD DNH",
  description: "VAT-DD-DNH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${nunito} ${roboto} `}
    >
      <body>
        <NextTopLoader showSpinner={false} />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
