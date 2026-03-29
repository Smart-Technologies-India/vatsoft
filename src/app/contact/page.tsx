"use client";

import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { useState } from "react";

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

type OfficeKey = "head" | "regional" | "lab";

const officeDetails: Record<
  OfficeKey,
  {
    tabLabel: string;
    title: string;
    address: string[];
    phone: string;
    fax: string;
  }
> = {
  head: {
    tabLabel: "Head Office (DAMAN)",
    title: "Head Office (DAMAN)",
    address: [
      "Pollution Control Committee",
      "U.T. Administration of Dadra & Nagar Haveli and Daman & Diu",
      "Daman - 396210",
    ],
    phone: "(079)2323 2152",
    fax: "(079)2323 2152",
  },
  regional: {
    tabLabel: "Regional Office (DNH)",
    title: "Regional Office (DNH)",
    address: [
      "Regional Pollution Control Office",
      "Silvassa, Dadra & Nagar Haveli",
      "DNH - 396230",
    ],
    phone: "(0260)2644 123",
    fax: "(0260)2644 124",
  },
  lab: {
    tabLabel: "Laboratory (DAMAN)",
    title: "Laboratory (DAMAN)",
    address: [
      "PCC Environmental Laboratory",
      "Fort Area, Daman",
      "Daman - 396210",
    ],
    phone: "(0260)2230 901",
    fax: "(0260)2230 902",
  },
};

const chairmanEmails = [
  "gpcbchairman[at]gmail[dot]com",
  "chairman[hyphen]gpcb[at]gujarat[dot]gov[dot]in",
];

const memberSecretaryEmails = [
  "membersecretarygpcb[at]gmail[dot]com",
  "ms[hyphen]gpcb[at]gujarat[dot]gov[dot]in",
];

export default function ContactUsPage() {
  const [activeOffice, setActiveOffice] = useState<OfficeKey>("head");
  const office = officeDetails[activeOffice];

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
              VAT-SMART Portal - Contact Details &amp; Support
            </p>
          </div>
          <div className="grow" />
          <div className="hidden md:flex flex-col items-end gap-1 text-[10px] text-gray-500">
            <span>Best viewed in Chrome 49+ / Firefox 45+ / Edge</span>
            <span>Resolution: 1024 x 768</span>
          </div>
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

      <div className="max-w-300 mx-auto">
        <div className="flex items-stretch bg-[#fff8dc] border-y border-[#dfc87a]">
          <span className="bg-[#b8860b] text-white text-[10px] font-bold px-3 shrink-0 flex items-center uppercase tracking-widest">
            ALERTS
          </span>
          <Marquee className="text-[11px] py-1 font-medium text-[#5a4000]">
            &nbsp;&nbsp;&bull;&nbsp;&nbsp;For assistance with registration,
            return filing, and payment services, please contact the helpdesk
            below.&nbsp;&nbsp;&bull;&nbsp;&nbsp;Office timings: Mon-Fri, 10:00
            AM to 5:30 PM.&nbsp;&nbsp;
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
          <span className="text-[#b8860b] font-semibold">Contact Details</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="border border-[#c8d4e8] bg-white">
            <div className="bg-[#0f2f67] px-2 py-1.5">
              <h2 className="text-white font-bold text-[11px] uppercase tracking-wide">
                Contact Offices
              </h2>
            </div>

            <div className="p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(officeDetails) as OfficeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveOffice(key)}
                    className={`border px-2 py-2 text-left text-[11px] font-semibold leading-tight whitespace-normal wrap-break-word transition-colors ${
                      activeOffice === key
                        ? "bg-[#16448b] text-white border-[#16448b]"
                        : "bg-[#f0f4fb] text-[#0f2f67] border-[#d3deef] hover:bg-[#dce8f8]"
                    }`}
                  >
                    {officeDetails[key].tabLabel}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="min-w-0 border border-[#d3deef] bg-[#f7f9fc] p-3">
                  <p className="text-[11px] font-semibold text-[#0f2f67]">
                    Address
                  </p>
                  <p className="mt-1 text-[11px] text-gray-700 wrap-break-word">
                    {office.title}
                  </p>
                  <div className="mt-1 space-y-1 text-[11px] text-gray-700 wrap-break-word">
                    {office.address.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 border border-[#d3deef] bg-[#f7f9fc] p-3">
                  <p className="text-[11px] font-semibold text-[#0f2f67]">
                    Contact
                  </p>
                  <p className="mt-1 text-[11px] text-gray-700 wrap-break-word">
                    <span className="font-semibold text-[#0f2f67]">Phone:</span>{" "}
                    {office.phone}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-700 wrap-break-word">
                    <span className="font-semibold text-[#0f2f67]">Fax:</span>{" "}
                    {office.fax}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="min-w-0 border border-[#d3deef] bg-[#f7f9fc] p-3">
                  <p className="text-[11px] font-semibold text-[#0f2f67]">
                    Emails: Chairman
                  </p>
                  <div className="mt-1 space-y-1 text-[11px] text-[#0f2f67] underline break-all">
                    {chairmanEmails.map((email) => (
                      <p key={email}>{email}</p>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 border border-[#d3deef] bg-[#f7f9fc] p-3">
                  <p className="text-[11px] font-semibold text-[#0f2f67]">
                    Emails: Member Secretary
                  </p>
                  <div className="mt-1 space-y-1 text-[11px] text-[#0f2f67] underline break-all">
                    {memberSecretaryEmails.map((email) => (
                      <p key={email}>{email}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden border border-[#c8d4e8] bg-white">
            <div className="bg-[#0f2f67] px-2 py-1.5">
              <h2 className="text-white font-bold text-[11px] uppercase tracking-wide">
                Office Location
              </h2>
            </div>
            <iframe
              title="Head Office Location"
              src="https://www.google.com/maps?q=20.4251386,72.8580178&z=15&output=embed"
              className="h-130 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>
        </div>
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
}