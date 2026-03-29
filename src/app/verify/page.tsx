"use client";

import { Button, Drawer, Input } from "antd";
import Marquee from "react-fast-marquee";
import { Dispatch, SetStateAction, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { cform, dvat04 } from "@prisma/client";
import { useRouter } from "next/navigation";

import { FluentEye12Regular, FluentEyeOff16Regular } from "@/components/icons";
import PasswordLogin from "@/action/user/passwordlogin";
import VerifyCForm from "@/action/verify/verify";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact Us" },
  {
    href: "https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing",
    label: "Registration",
  },
  { href: "/verify", label: "Verify" },
  { href: "/news", label: "Notifications" },
  { href: "/policy", label: "Disclaimer" },
];

const Home = () => {
  const [open, setOpen] = useState(false);
  const [ctsno, setCtsno] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);
  const [cformData, setCformData] = useState<
    (cform & { dvat04: dvat04 }) | null
  >(null);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const verify = async () => {
    setLoading(true);
    if (ctsno === "") {
      toast.error("Please enter a valid CST Form No");
      setLoading(false);
      return;
    }

    const response = await VerifyCForm({ search: ctsno });

    if (!response.status) {
      toast.error(response.message);
      setLoading(false);
      return;
    }

    setCformData(response.data);
    toast.success("CST Form verified successfully");
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8edf5] text-gray-800 text-xs">
      <header className="bg-white border-b border-[#b7c6de]">
        <div className="max-w-300 mx-auto px-3 py-2 flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <Image
              src="/favicon.png"
              alt="DVAT Emblem"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Union Territory of Dadra &amp; Nagar Haveli and Daman &amp; Diu
            </p>
            <h1 className="text-base font-bold text-[#0f2f67] leading-tight">
              Department of Value Added Tax/GST Administration
            </h1>
            <p className="text-[10px] text-gray-500">
              VAT-SMART Portal - CST Form Verification
            </p>
          </div>
          <div className="grow" />
          <Button
            onClick={showDrawer}
            className="text-[#0f2f67] bg-white rounded-none border border-[#c8d4e8] px-3 py-1 text-[11px] inline-block h-7"
          >
            MEMBER LOGIN
          </Button>
          <Drawer closeIcon={null} onClose={onClose} open={open}>
            <PasswordLoginComponent />
          </Drawer>
        </div>

        <nav className="bg-[#16448b] border-t border-[#0f2f67]">
          <div className="max-w-300 mx-auto flex flex-wrap">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white text-[11px] font-medium inline-block py-2 px-3 hover:bg-[#0f2f67] border-r border-[#1e55a8] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="max-w-300 mx-auto w-full">
        <div className="flex items-stretch bg-[#fff8dc] border-y border-[#dfc87a]">
          <span className="bg-[#b8860b] text-white text-[10px] font-bold px-3 shrink-0 flex items-center uppercase tracking-widest">
            ALERTS
          </span>
          <Marquee className="text-[11px] py-1 font-medium text-[#5a4000]">
            &nbsp;&nbsp;&bull;&nbsp;&nbsp;Use this page to verify CST Form
            details issued by the VAT administration.&nbsp;&nbsp;&bull;&nbsp;&nbsp;
            Enter a valid CST Form No to fetch the official record.
            &nbsp;&nbsp;
          </Marquee>
        </div>
      </div>

      <main className="max-w-300 mx-auto py-3 px-2 flex-1 w-full">
        <div className="mb-2 text-[10px] text-gray-500 border border-[#d5dde9] bg-white px-2 py-1">
          <span>You are here: </span>
          <Link href="/" className="text-[#0f2f67] hover:underline">
            Home
          </Link>
          <span className="mx-1">&gt;</span>
          <span className="text-[#b8860b] font-semibold">Verify CST Form</span>
        </div>

        <section className="border border-[#c8d4e8] bg-white">
          <div className="bg-[#0f2f67] px-2 py-1.5">
            <h2 className="text-white font-bold text-[11px] uppercase tracking-wide">
              CST Form Verification System
            </h2>
          </div>

          <div className="p-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <p className="shrink-0 text-[11px] font-medium text-[#0f2f67]">
                Enter the CST Form No:
              </p>
              <Input
                className="w-full md:w-60"
                placeholder="Enter CST Form No"
                value={ctsno}
                onChange={(e) => setCtsno(e.target.value)}
                disabled={isLoading || cformData !== null}
              />
              <button
                className="text-white bg-[#16448b] hover:bg-[#0f2f67] rounded-none px-4 h-8 w-full md:w-40 text-[11px] font-semibold"
                onClick={
                  cformData
                    ? () => {
                        setCformData(null);
                        setCtsno("");
                        setLoading(false);
                      }
                    : verify
                }
                disabled={isLoading}
                style={
                  {
                    cursor: isLoading ? "not-allowed" : "pointer",
                  } as CSSProperties
                }
              >
                {cformData ? "Reset" : "Verify"}
              </button>
            </div>

            {cformData && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full border-collapse border border-[#c8d4e8] text-[11px]">
                  <tbody>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67] w-1/3">
                        CST FORM NO
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        {cformData.sr_no}
                      </td>
                    </tr>

                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Date of Issue
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        {formateDate(cformData.date_of_issue)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Name of the Issuing Office
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        Dept. of Vat -{" "}
                        {cformData.office_of_issue === "Dadra_Nagar_Haveli"
                          ? "Dadra Nagar Haveli"
                          : cformData.office_of_issue === "DAMAN"
                          ? "Daman"
                          : "Diu"}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Issued to the Dealer
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        TIN: {cformData.dvat04.tinNumber} - {cformData.dvat04.tradename} -{" "}
                        {cformData.dvat04.address}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Seller Name
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        TIN: {cformData.seller_tin_no} - {cformData.seller_name}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Total Amount involved
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        {parseFloat(cformData.amount).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f9fc]">
                      <td className="border border-[#d5dde9] px-3 py-2 font-semibold text-[#0f2f67]">
                        Purpose
                      </td>
                      <td className="border border-[#d5dde9] px-3 py-2">
                        For use in sale/resale
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#0f2f67] text-white mt-2">
        <div className="max-w-300 mx-auto px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] border-b border-[#1e4a8f]">
          {[
            { label: "Home", href: "/" },
            { label: "Contact Us", href: "/contact" },
            { label: "Disclaimer", href: "/policy" },
            { label: "Privacy Policy", href: "/policy" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="max-w-300 mx-auto px-3 py-2 flex flex-wrap justify-between items-center gap-2 text-[10px]">
          <span>
            &copy; VAT Administration, Dadra &amp; Nagar Haveli and Daman &amp;
            Diu
          </span>
          <span>Site Last Updated: 29-03-2026</span>
          <span>Designed &amp; Developed by Smart Technologies</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;

const PasswordLoginComponent = () => {
  const router = useRouter();

  const [tin, setTin] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [isLogin, setIsLogin] = useState<boolean>(false);

  const submit = async () => {
    setIsLogin(true);

    if (tin == null || tin === "") {
      toast.error("Enter valid TIN number");
      setIsLogin(false);
      return;
    }

    if (password == null || password === "") {
      toast.error("Enter password");
      setIsLogin(false);
      return;
    }

    const response = await PasswordLogin({
      tin_number: tin,
      password: password,
    });

    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    toast.success(response.message);
    router.push("/dashboard");
    setTimeout(() => {
      setIsLogin(false);
    }, 10000);
  };

  const handleNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setData: Dispatch<SetStateAction<string | undefined>>,
  ) => {
    const onlyNumbersRegex = /^[0-9]*$/;
    const { value } = event.target;

    if (onlyNumbersRegex.test(value)) {
      setData(value);
    }
  };

  return (
    <div className="flex-1 grid place-items-center bg-white rounded-r-md">
      <div>
        <h1 className="text-lg font-semibold mt-6 text-center">
          Welcome to VAT-SMART
        </h1>
        <h1 className="text-sm font-normal pb-2 text-center">
          Login to access your Account
        </h1>

        <Label htmlFor="tin" className="text-xs">
          TIN Number
        </Label>
        <Input
          id="tin"
          type="text"
          maxLength={12}
          value={tin === undefined ? "" : tin.toString()}
          onChange={(e) => handleNumberChange(e, setTin)}
        />
        <Label htmlFor="password" className="text-xs">
          Password
        </Label>

        <Input.Password
          id="password"
          type="password"
          iconRender={(visible) =>
            visible ? <FluentEye12Regular /> : <FluentEyeOff16Regular />
          }
          value={password === undefined ? "" : password.toString()}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isLogin ? (
          <Button type="primary" className="mt-2 w-full" disabled>
            Loading...
          </Button>
        ) : (
          <Button
            onClick={submit}
            type="primary"
            className="mt-2 w-full"
            disabled={isLogin}
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );
};