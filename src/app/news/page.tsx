"use client";

import GetAllNews from "@/action/news/getallnews";
import { formateDate } from "@/utils/methods";
import { news } from "@prisma/client";
import { Pagination } from "antd";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";

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

const Refund = () => {
  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [newsdata, setNews] = useState<news[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const newsResonse = await GetAllNews({
        take: 10,
        skip: 0,
      });

      if (newsResonse.status && newsResonse.data.result) {
        setNews(newsResonse.data.result);
        setPaginatin({
          skip: newsResonse.data.skip,
          take: newsResonse.data.take,
          total: newsResonse.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const newsResponse = await GetAllNews({
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (newsResponse.status && newsResponse.data.result) {
      setNews(newsResponse.data.result);
      setPaginatin({
        skip: newsResponse.data.skip,
        take: newsResponse.data.take,
        total: newsResponse.data.total,
      });
    }
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
              VAT-SMART Portal - News, Notifications &amp; Circulars
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

      <div className="max-w-300 mx-auto w-full">
        <div className="flex items-stretch bg-[#fff8dc] border-y border-[#dfc87a]">
          <span className="bg-[#b8860b] text-white text-[10px] font-bold px-3 shrink-0 flex items-center uppercase tracking-widest">
            ALERTS
          </span>
          <Marquee className="text-[11px] py-1 font-medium text-[#5a4000]">
            &nbsp;&nbsp;&bull;&nbsp;&nbsp;Official notifications and updates
            are published in this section.&nbsp;&nbsp;&bull;&nbsp;&nbsp;Refer to
            latest circulars before filing returns and statutory forms.
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
          <span className="text-[#b8860b] font-semibold">News &amp; Updates</span>
        </div>

        <section className="border border-[#c8d4e8] bg-white">
          <div className="bg-[#0f2f67] px-2 py-1.5">
            <h2 className="text-white font-bold text-[11px] uppercase tracking-wide">
              News and Updates
            </h2>
          </div>

          <div className="p-3">
            <h4 className="text-[11px] text-[#0f2f67] font-semibold mb-2">
              Latest Notifications
            </h4>

            <div className="space-y-2">
              {newsdata.map((val: news) => (
                <div
                  className="border border-[#d5dde9] rounded-none py-2 px-3 bg-white hover:bg-[#f7f9fc]"
                  key={val.id}
                >
                  <div className="flex gap-2 items-start">
                    <h3 className="text-[13px] font-semibold text-[#0f2f67]">
                      {val.title}
                    </h3>
                    <div className="grow" />
                  </div>

                  <p className="text-[11px] text-gray-700 mt-1">
                    {val.descrilption}
                  </p>

                  <div className="flex pt-2 items-center">
                    <p className="text-[10px] text-gray-600">
                      {formateDate(val.postdate)}
                    </p>
                    <div className="grow" />
                    <p className="px-2 py-0.5 text-[10px] bg-[#dce8f8] border border-[#c8d4e8] text-[#0f2f67] font-medium">
                      {val.topic}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 lg:hidden">
              <Pagination
                align="center"
                defaultCurrent={1}
                onChange={onChangePageCount}
                showSizeChanger
                total={pagination.total}
                showTotal={(total: number) => `Total ${total} items`}
              />
            </div>
            <div className="hidden lg:block mt-3">
              <Pagination
                showQuickJumper
                align="center"
                defaultCurrent={1}
                onChange={onChangePageCount}
                showSizeChanger
                pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                total={pagination.total}
                responsive={true}
                showTotal={(total: number, range: number[]) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </div>
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

export default Refund;