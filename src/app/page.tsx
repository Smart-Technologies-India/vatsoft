"use client";

import { Button, Input, Modal } from "antd";
import Marquee from "react-fast-marquee";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { addMonths, format } from "date-fns";
import { FluentEye12Regular, FluentEyeOff16Regular } from "@/components/icons";
import DvatPasswordLogin from "@/action/user/dvatpasswordlogin";
import Image from "next/image";
import SendForgetPasswordOtp from "@/action/user/sendforgetpasswordotp";
import VerifyForgetPasswordOtp from "@/action/user/verifyforgetpasswordotp";
import ResetForgetPassword from "@/action/user/resetforgotpassword";

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

const faqs = [
  {
    question: "How can I register for VAT?",
    answer:
      "Use the Registration link and fill in the required details. The department verifies your submission and then shares login credentials on your registered contact details.",
  },
  {
    question: "How do I log in to the portal?",
    answer:
      "Use your TIN number and password in Dealer Login. On successful verification, you will be redirected to your dashboard.",
  },
  {
    question: "How do I file a VAT return?",
    answer:
      "After you maintain stock, purchase, and sale details, the portal prepares return-ready data and supports filing from your account.",
  },
  {
    question: "How is C-Form handled?",
    answer:
      "C-Form related processes are available under the return and statutory forms workflows based on your transaction records.",
  },
];

const features = [
  "Grant of certificate of registration to eligible dealers",
  "Amendment and cancellation of registration",
  "Issue of statutory forms such as C, F and H",
  "Refund processing and compliance workflow",
  "Recovery tracking for tax, interest and penalty",
  "Assessment, audit, inspection and appeal support",
];

const whatsNew = [
  "Simplified stock management module for compliance-ready records",
  "Auto-conversion support from purchase and sale data to return sections",
  "Reminder and notification improvements for filing and payment dates",
  "Enhanced dashboard summaries for dues and pending actions",
  "Dealer-side verification workflow for received stock entries",
];

const videos = [
  {
    src: "https://www.youtube.com/embed/SKFZGmgS52o",
    title: "How to Register on VAT-SMART",
    description:
      "Step-by-step walkthrough for dealer onboarding and account creation.",
  },
  {
    src: "https://www.youtube.com/embed/H941IkF71pM",
    title: "How to Add Local Purchases",
    description:
      "Guidance for recording local purchase invoices correctly in the portal.",
  },
  {
    src: "https://www.youtube.com/embed/K398HeqOv7k",
    title: "How to Convert Sales to Returns",
    description:
      "Learn how sale data maps to return sections for faster filing.",
  },
];

interface DateCardProps {
  title: string;
  paymentdate: string;
  returndate: string;
}

function DateCard({ title, paymentdate, returndate }: DateCardProps) {
  return (
    <div className="border border-[#cad6ea]">
      <div className="bg-[#dce8f8] border-b border-[#cad6ea] px-3 py-1.5">
        <h3 className="font-semibold text-sm text-[#102a56]">{title}</h3>
      </div>
      <div className="px-3 py-1.5 bg-white">
        <p className="text-sm text-gray-700">
          Payment: <span className="font-medium">{paymentdate}</span>
        </p>
        <p className="text-sm text-gray-700">
          Return Filing: <span className="font-medium">{returndate}</span>
        </p>
      </div>
    </div>
  );
}

const MonthlyCardSection = () => {
  const currentDate = new Date();
  const months = Array.from({ length: 3 }, (_, i) =>
    addMonths(currentDate, i - 1),
  ).map((date) => ({
    title: format(date, "MMM, yyyy"),
    paymentdate: format(
      new Date(date.getFullYear(), date.getMonth() + 1, 15),
      "MMM d, yyyy",
    ),
    returndate: format(
      new Date(date.getFullYear(), date.getMonth() + 1, 28),
      "MMM d, yyyy",
    ),
  }));

  return (
    <div className="mb-2">
      <div className="bg-[#16448b] px-3 py-1.5">
        <span className="text-white text-sm font-semibold uppercase">
          Monthly Returns
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-2 bg-[#f7f9fc] border border-t-0 border-[#bfd0e8]">
        {months.map((month, index) => (
          <DateCard
            key={index}
            title={`DVAT04 (${month.title})`}
            paymentdate={month.paymentdate}
            returndate={month.returndate}
          />
        ))}
      </div>
    </div>
  );
};

const QuarterCardSection = () => {
  const monthGroups = [
    ["Apr", "May", "Jun"],
    ["Jul", "Aug", "Sep"],
    ["Oct", "Nov", "Dec"],
    ["Jan", "Feb", "Mar"],
  ];

  const quarters = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString("default", {
      month: "long",
    });
    const currentQuarter =
      monthGroups.find((group) => group.includes(currentMonth)) ??
      monthGroups[0];

    return Array.from({ length: 3 }, (_, i) => {
      const quarterIndex = (monthGroups.indexOf(currentQuarter) + i) % 4;
      const quarter = monthGroups[quarterIndex];
      const lastMonth = quarter[quarter.length - 1];
      const year =
        quarterIndex === 3 && i > 0
          ? currentDate.getFullYear() + 1
          : currentDate.getFullYear();
      const monthIndex = new Date(`${lastMonth} 1, ${year}`).getMonth();

      return {
        title: `${quarter.join(", ")} (${year})`,
        paymentdate: format(new Date(year, monthIndex + 1, 15), "MMM d, yyyy"),
        returndate: format(new Date(year, monthIndex + 1, 28), "MMM d, yyyy"),
      };
    });
  }, []);

  return (
    <div>
      <div className="bg-[#16448b] px-3 py-1.5">
        <span className="text-white text-sm font-semibold uppercase">
          Quarterly Returns
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-2 bg-[#f7f9fc] border border-t-0 border-[#bfd0e8]">
        {quarters.map((quarter, index) => (
          <DateCard
            key={index}
            title={quarter.title}
            paymentdate={quarter.paymentdate}
            returndate={quarter.returndate}
          />
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e8edf5] text-gray-800 text-sm">
      {/* GOI top utility bar */}
      {/* <div className="bg-[#003366] text-white">
        <div className="max-w-300 mx-auto px-2 py-0.5 flex items-center justify-between">
          <span className="text-sm">Government of Dadra &amp; Nagar Haveli and Daman &amp; Diu</span>
          <div className="flex items-center gap-3 text-sm">
            <span>A- A A+</span>
            <span>|</span>
            <Link href="#main" className="hover:underline">Skip To Main Content</Link>
            <span>|</span>
            <Link href="/policy" className="hover:underline">Screen Reader Access</Link>
          </div>
        </div>
      </div> */}

      {/* Header with tricolor stripe */}
      <header className="bg-white border-b border-[#b7c6de]">
        {/* <div className="h-1.5 w-full" style={{background:"linear-gradient(to right, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)"}}></div> */}
        <div className="max-w-300 mx-auto px-4 py-3 flex items-center gap-3">
          {/* Emblem placeholder */}
          {/* <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-[#c8d4e8] bg-[#f0f4fb] rounded-full">
            <span className="text-[#0f2f67] text-[9px] font-bold text-center leading-tight uppercase">Govt<br/>Emblem</span>
          </div> */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <Image
              src="/favicon.png"
              alt="DVAT Emblem"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Union Territory of Dadra &amp; Nagar Haveli and Daman &amp; Diu
            </p>
            <h1 className="text-base font-bold text-[#0f2f67] leading-tight">
              Department of Value Added Tax/GST Administration
            </h1>
            <p className="text-sm text-gray-500">
              VAT-SMART Portal — Unified portal for Registration, Return Filing
              &amp; Challan Payment
            </p>
          </div>
          <div className="grow" />
          <div className="hidden md:flex flex-col items-end gap-1 text-sm text-gray-500">
            <span>Best viewed in Chrome 49+ / Firefox 45+ / Edge</span>
            <span>Resolution: 1024 x 768</span>
          </div>
        </div>

        {/* Nav bar */}
        <nav className="bg-[#16448b] border-t border-[#0f2f67]">
          <div className="max-w-300 mx-auto flex flex-wrap">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white text-sm font-medium inline-block py-2 px-3 hover:bg-[#0f2f67] border-r border-[#1e55a8] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Alerts ticker */}
      <div className="max-w-300 mx-auto">
        <div className="flex items-stretch bg-[#fff8dc] border-y border-[#dfc87a]">
          <span className="bg-[#b8860b] text-white text-sm font-bold px-3 shrink-0 flex items-center uppercase tracking-widest">
            ALERTS
          </span>
          <Marquee className="text-sm py-1 font-medium text-[#5a4000]">
            &nbsp;&nbsp;&bull;&nbsp;&nbsp;Official updates, notifications, and
            advisories will be published in this
            section.&nbsp;&nbsp;&bull;&nbsp;&nbsp;File your VAT returns on time
            to avoid penalty.&nbsp;&nbsp;&bull;&nbsp;&nbsp;For any queries
            contact helpline: 0260-2632000&nbsp;&nbsp;
          </Marquee>
        </div>
      </div>

      {/* ── Main body ── */}
      <main id="main" className="max-w-300 mx-auto py-3 px-0 flex-1 w-full">
        <div className="flex flex-col gap-3">
          {/* ── CENTER: Due Dates + Videos + FAQ (top) ── */}
          <div className="flex flex-col gap-2">
            <div className="grid gap-2 px-2 py-2 grid-cols-12">
              {/* Due Dates */}
              <div className="border border-[#c8d4e8] col-span-8">
                <div className="bg-[#0f2f67] px-2 py-2">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    Upcoming Due Dates
                  </h2>
                </div>
                <div className="bg-white p-2">
                  <MonthlyCardSection />
                  <QuarterCardSection />
                </div>
              </div>

              <div className="border border-[#c8d4e8] col-span-4 h-full flex flex-col">
                <div className="bg-[#b8860b] px-2 py-2 flex items-center gap-2">
                  <span className="text-white font-bold text-sm uppercase tracking-wide">
                    &#128274; Member Login
                  </span>
                </div>
                <div className="bg-white p-3 flex-1">
                  <p className="text-lg text-gray-500 mb-2">
                    Login Type:{" "}
                    <span className="font-semibold text-[#0f2f67]">Dealer</span>
                  </p>
                  <InlineLoginForm />
                </div>
              </div>
            </div>

            {/* Guidance Videos */}
            <div className="border border-[#c8d4e8]">
              <div className="bg-[#0f2f67] px-2 py-2">
                <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                  User Guidance Videos
                </h2>
              </div>
              <div className="bg-white p-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {videos.map((video) => (
                  <div key={video.title} className="border border-[#d4deee]">
                    <iframe
                      className="w-full aspect-video"
                      src={video.src}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    <div className="px-2 py-2 bg-[#f7f9fc] border-t border-[#d4deee]">
                      <h3 className="text-[#102a56] text-sm font-semibold mb-0.5">
                        {video.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-snug">
                        {video.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="border border-[#c8d4e8]">
              <div className="bg-[#0f2f67] px-2 py-2">
                <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="bg-white">
                <Accordion type="multiple">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.question}
                      value={`item-${index}`}
                      className="border-b border-[#edf1f8] last:border-b-0"
                    >
                      <AccordionTrigger className="px-4 py-3 text-[#102a56] text-sm font-semibold hover:text-[#1e3f79] hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="px-3 pb-2 pt-0 text-sm text-gray-600">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>

          {/* ── Lower row: left and right boxes ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {/* LEFT: Login + e-Services + Key Services */}
            <aside className="flex flex-col gap-2">
              {/* Inline Login panel (Gujarat style) */}

              {/* What's New */}
              <div className="border border-[#c8d4e8]">
                <div className="bg-[#0f2f67] px-2 py-2">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    What is New
                  </h2>
                </div>
                <ul className="bg-white divide-y divide-[#edf1f8]">
                  {whatsNew.map((item, index) => (
                    <li
                      key={item}
                      className="px-2 py-2 flex items-start gap-2 hover:bg-[#f0f4fb] cursor-default"
                    >
                      <span className="text-[#b8860b] font-bold shrink-0 text-sm leading-4">
                        {index + 1}.
                      </span>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links / e-Services (Gujarat style box) */}
              <div className="border border-[#c8d4e8]">
                <div className="bg-[#0f2f67] px-2 py-2">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    e-Services
                  </h2>
                </div>
                <ul className="bg-white divide-y divide-[#edf1f8]">
                  {[
                    {
                      label: "e-Registration",
                      href: "https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing",
                    },
                    { label: "Track Application Status", href: "/verify" },
                    { label: "Dealer Login", href: "/dashboard" },
                    { label: "Verify TIN", href: "/verify" },
                    { label: "Download Forms", href: "/news" },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 px-2 py-2 hover:bg-[#f0f4fb] text-[#0f2f67] hover:text-[#103090]"
                      >
                        <span className="text-[#b8860b] font-bold">
                          &#9658;
                        </span>
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Services */}
              <div className="border border-[#c8d4e8]">
                <div className="bg-[#0f2f67] px-2 py-2">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    Key Services
                  </h2>
                </div>
                <ul className="bg-white divide-y divide-[#edf1f8]">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="px-2 py-2 flex items-start gap-2 hover:bg-[#f0f4fb] cursor-default"
                    >
                      <span className="text-[#b8860b] font-bold shrink-0">
                        &#9658;
                      </span>
                      <span className="text-sm text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* RIGHT: What's New + Announcements + Important Links */}
            <aside className="flex flex-col gap-2">
              {/* Announcements – Contact Details (Gujarat style) */}
              <div className="border border-[#c8d4e8]">
                <div className="bg-[#b8860b] px-2 py-2 flex items-center gap-2">
                  <span className="text-white font-bold text-sm uppercase tracking-wide">
                    &#128276; Announcements
                  </span>
                </div>
                <div className="bg-white p-2.5 space-y-2.5 text-sm">
                  <div className="border-l-2 border-[#b8860b] pl-2">
                    <p className="font-bold text-[#0f2f67]">
                      Public Relations Officer
                    </p>
                    <p className="text-gray-600">Ph: 0260-2632000</p>
                  </div>
                  <div className="border-l-2 border-[#0f2f67] pl-2">
                    <p className="font-bold text-[#0f2f67]">
                      Helpline (e-Services)
                    </p>
                    <p className="text-gray-600">Ph: 0260-2632000</p>
                    <p className="text-gray-600">Email: vato1-ctd-dnh@nic.in</p>
                  </div>
                  <div className="border-l-2 border-[#0f2f67] pl-2">
                    <p className="font-bold text-[#0f2f67]">Helpline Email</p>
                    <p className="text-gray-600">Helpline-ctd-dnh@nic.in</p>
                  </div>
                  <hr className="border-[#e5ebf5]" />
                  <div className="border-l-2 border-[#138808] pl-2">
                    <p className="font-bold text-[#0f2f67]">Office Address</p>
                    <p className="text-gray-600 leading-relaxed">
                      VAT &amp; GST Department,
                      <br />
                      District Secretariat &quot;A&quot; Wing,
                      <br />
                      2nd Floor, D&amp;NH,
                      <br />
                      Silvassa – 396230
                    </p>
                  </div>
                  <div className="pt-1 text-center">
                    <Link
                      href="/contact"
                      className="text-[#0f2f67] underline underline-offset-2 hover:text-[#b8860b] text-sm"
                    >
                      &#8594; View Full Contact Details
                    </Link>
                  </div>
                </div>
              </div>

              {/* Important Links */}
              <div className="border border-[#c8d4e8]">
                <div className="bg-[#0f2f67] px-2 py-2">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    Important Links
                  </h2>
                </div>
                <ul className="bg-white divide-y divide-[#edf1f8]">
                  {[
                    { label: "GST Portal", href: "https://www.gst.gov.in" },
                    {
                      label: "Income Tax e-Filing",
                      href: "https://www.incometax.gov.in",
                    },
                    {
                      label: "Government of India",
                      href: "https://india.gov.in",
                    },
                    { label: "DigiLocker", href: "https://digilocker.gov.in" },
                    { label: "CBEC Portal", href: "https://cbic.gov.in" },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-2 py-2 hover:bg-[#f0f4fb] text-[#0f2f67] hover:text-[#b8860b]"
                      >
                        <span className="text-[#b8860b] font-bold">
                          &#9658;
                        </span>
                        <span className="text-sm">{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f2f67] text-white mt-2">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(to right, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)",
          }}
        ></div>
        {/* Footer links row */}
        <div className="max-w-300 mx-auto px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 text-sm border-b border-[#1e4a8f]">
          {[
            { label: "Home", href: "/" },
            // { label: "About Us", href: "/policy" },
            { label: "Contact Us", href: "/contact" },
            { label: "Disclaimer", href: "/policy" },
            { label: "Terms &amp; Conditions", href: "/policy" },
            // { label: "Sitemap", href: "/" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:underline"
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
        {/* Footer bottom */}
        <div className="max-w-300 mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm">
          <span>
            &#169; VAT Administration, Dadra &amp; Nagar Haveli and Daman &amp;
            Diu
          </span>
          <span>Site Last Updated: 24-01-2025</span>
          <span>Designed &amp; Developed by Smart Technologies</span>
          <Link href="/policy" className="underline hover:text-[#e3ecff]">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

const InlineLoginForm = () => {
  const router = useRouter();
  const [tin, setTin] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [isLogin, setIsLogin] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotTin, setForgotTin] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (resendInSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendInSeconds]);

  const handleNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setData: Dispatch<SetStateAction<string | undefined>>,
  ) => {
    const { value } = event.target;
    if (/^[0-9]*$/.test(value)) setData(value);
  };

  const submit = async () => {
    setIsLogin(true);
    if (!tin) {
      toast.error("Enter valid TIN number");
      setIsLogin(false);
      return;
    }
    if (!password) {
      toast.error("Enter password");
      setIsLogin(false);
      return;
    }
    const response = await DvatPasswordLogin({ tin_number: tin, password });
    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }
    toast.success(response.message);
    router.push("/dashboard");
    setTimeout(() => setIsLogin(false), 1000);
  };

  const resetForgotPasswordModal = () => {
    setForgotTin("");
    setForgotOtp("");
    setNewPassword("");
    setRePassword("");
    setMaskedMobile("");
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setResendInSeconds(0);
  };

  const sendOtp = async () => {
    setIsSendingOtp(true);

    if (!forgotTin.trim()) {
      toast.error("Enter valid TIN number");
      setIsSendingOtp(false);
      return;
    }

    const response = await SendForgetPasswordOtp({
      tin_number: forgotTin.trim(),
    });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsSendingOtp(false);
      return;
    }

    setMaskedMobile(response.data.maskedMobile);
    setResendInSeconds(response.data.resendInSeconds);

    if (response.data.otpSent) {
      setIsOtpSent(true);
      setIsOtpVerified(false);
      setForgotOtp("");
      toast.success(response.message);
    } else {
      toast.info(response.message);
    }

    setIsSendingOtp(false);
  };

  const verifyOtp = async () => {
    setIsVerifyingOtp(true);

    if (!forgotTin.trim()) {
      toast.error("Enter valid TIN number");
      setIsVerifyingOtp(false);
      return;
    }

    if (!forgotOtp.trim()) {
      toast.error("Enter OTP");
      setIsVerifyingOtp(false);
      return;
    }

    const response = await VerifyForgetPasswordOtp({
      tin_number: forgotTin.trim(),
      otp: forgotOtp.trim(),
    });

    if (!response.status || !response.data) {
      toast.error(response.message);
      setIsVerifyingOtp(false);
      return;
    }

    if (!response.data.verified) {
      toast.error(response.message);
      setIsVerifyingOtp(false);
      return;
    }

    setIsOtpVerified(true);
    toast.success(response.message);
    setIsVerifyingOtp(false);
  };

  const submitForgotPassword = async () => {
    setIsChangingPassword(true);

    if (!isOtpVerified) {
      toast.error("Verify OTP before changing password");
      setIsChangingPassword(false);
      return;
    }

    const changeResponse = await ResetForgetPassword({
      tin_number: forgotTin.trim(),
      password: newPassword,
      repassword: rePassword,
    });

    if (!changeResponse.status) {
      toast.error(changeResponse.message);
      setIsChangingPassword(false);
      return;
    }

    toast.success("Password updated successfully");
    setIsForgotOpen(false);
    resetForgotPasswordModal();
    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm text-gray-500 block mb-2">
          Login ID (TIN Number)
        </label>
        <Input
          size="small"
          maxLength={12}
          placeholder="Enter TIN Number"
          value={tin ?? ""}
          onChange={(e) => handleNumberChange(e, setTin)}
          className="text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-2">Password</label>
        <Input.Password
          size="small"
          placeholder="Enter Password"
          iconRender={(visible) =>
            visible ? <FluentEye12Regular /> : <FluentEyeOff16Regular />
          }
          value={password ?? ""}
          onChange={(e) => setPassword(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="text-right">
        <button
          type="button"
          onClick={() => setIsForgotOpen(true)}
          className="text-sm text-[#0f2f67] underline hover:text-[#16448b] cursor-pointer"
        >
          Forgot Password?
        </button>
      </div>
      <div className="h-2"></div>
      <Button
        onClick={submit}
        disabled={isLogin}
        className="w-full bg-[#0f2f67] text-white text-sm h-8 rounded-none border-none hover:white"
      >
        {isLogin ? "Verifying..." : "Login"}
      </Button>

      <Modal
        title="Forgot Password"
        open={isForgotOpen}
        onCancel={() => {
          setIsForgotOpen(false);
          resetForgotPasswordModal();
        }}
        footer={null}
        destroyOnClose
      >
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">TIN Number</label>
            <Input
              maxLength={12}
              placeholder="Enter TIN Number"
              value={forgotTin}
              disabled={isOtpSent}
              onChange={(e) => {
                const { value } = e.target;
                if (/^[0-9]*$/.test(value)) setForgotTin(value);
              }}
              className="text-sm"
            />
          </div>
          {!isOtpSent && (
            <Button
              onClick={sendOtp}
              disabled={isSendingOtp}
              className="w-full bg-[#0f2f67] text-white text-sm h-8 rounded-none border-none hover:bg-[#16448b]!"
            >
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          )}

          {isOtpSent && (
            <>
              <p className="text-sm text-gray-600">
                OTP sent to registered mobile ending with <b>{maskedMobile}</b>
              </p>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">OTP</label>
                <Input
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={forgotOtp}
                  disabled={isOtpVerified}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (/^[0-9]*$/.test(value)) setForgotOtp(value);
                  }}
                  className="text-sm"
                />
              </div>

              {!isOtpVerified && (
                <Button
                  onClick={verifyOtp}
                  disabled={isVerifyingOtp}
                  className="w-full bg-[#0f2f67] text-white text-sm h-8 rounded-none border-none hover:bg-[#16448b]!"
                >
                  {isVerifyingOtp ? "Verifying OTP..." : "Verify OTP"}
                </Button>
              )}

              <div className="text-right">
                {resendInSeconds > 0 ? (
                  <span className="text-sm text-gray-500">
                    Resend OTP in {resendInSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="text-sm text-[#0f2f67] underline hover:text-[#16448b] cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {isOtpVerified && (
            <>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">New Password</label>
            <Input.Password
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Re-Password</label>
            <Input.Password
              placeholder="Enter Re-Password"
              value={rePassword}
              onChange={(e) => setRePassword(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button
            onClick={submitForgotPassword}
            disabled={isChangingPassword}
            className="w-full bg-[#0f2f67] text-white text-sm h-8 rounded-none border-none hover:bg-[#16448b]!"
          >
            {isChangingPassword ? "Updating..." : "Change Password"}
          </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

