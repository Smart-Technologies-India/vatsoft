import { Nunito_Sans, Roboto } from "next/font/google";

const nunito_init = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const roboto_init = Roboto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const nunito = nunito_init.variable;
export const roboto = roboto_init.variable;
