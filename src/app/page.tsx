"use client";

import { GravityUiChevronDown } from "@/components/icons";
import { Collapse } from "antd";
import Marquee from "react-fast-marquee";
import { useEffect, type CSSProperties } from "react";
import type { CollapseProps } from "antd";
import Image from "next/image";
import Link from "next/link";
import { validateAadharCard, validatePanCard } from "@/utils/methods";

const Home = () => {
  const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;
  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle
  ) => [
    {
      key: "1",
      label: "This is panel header 1",
      children: <p>{text}</p>,
      style: panelStyle,
    },
    {
      key: "2",
      label: "This is panel header 2",
      children: <p>{text}</p>,
      style: panelStyle,
    },
    {
      key: "3",
      label: "This is panel header 3",
      children: <p>{text}</p>,
      style: panelStyle,
    },
  ];

  const panelStyle: React.CSSProperties = {
    marginBottom: 12,
    borderRadius: "10px",
    background: "#f4f4f4",
    border: "none",
  };

  useEffect(() => {
    const aadharnumber = ["241140014857", "243140064857"];
    const pannumber = ["241140014857", "243140064857"];

    console.log("------------------- aadhar card");
    aadharnumber.map((val: string) => {
      console.table([val, validateAadharCard(val)]);
    });
    console.log("------------------- pan card");
    pannumber.map((val: string) => {
      console.table([val, validatePanCard(val)]);
    });
  }, []);

  return (
    <>
      <main className="bg-[#f8fafe] pb-8">
        <header className="bg-[#0b1e59] w-full py-2 flex gap-2 px-4 items-center">
          <h1 className="text-white font-medium text-xl">VATSOFT</h1>
          <div className="w-10"></div>
          <div className="mx-auto">
            <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Home
            </a>
            <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              About
            </a>
            <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Support
            </a>
            <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Help
            </a>
          </div>
          <div className="grow"></div>

          <Link
            href={"/login"}
            className="text-[#0b1e59] bg-white rounded px-4 py-1"
          >
            LOGIN
          </Link>
        </header>
        {/* <nav className="flex gap-4 bg-[#2c4e86]">
          <div className="mx-auto w-5/6">
            <a
              href="/home"
              className="text-white inline-block py-2 px-4 hover:bg-[#17c4bb] hover:text-[#0b1e59]"
            >
              Home
            </a>
            <a
              href="/home"
              className="text-white inline-block py-2 px-4 hover:bg-[#17c4bb] hover:text-[#0b1e59]"
            >
              About
            </a>
            <a
              href="/home"
              className="text-white inline-block py-2 px-4 hover:bg-[#17c4bb] hover:text-[#0b1e59]"
            >
              Contact
            </a>
            <a
              href="/home"
              className="text-white inline-block py-2 px-4 hover:bg-[#17c4bb] hover:text-[#0b1e59]"
            >
              Support
            </a>
            <a
              href="/home"
              className="text-white inline-block py-2 px-4 hover:bg-[#17c4bb] hover:text-[#0b1e59]"
            >
              Help
            </a>
          </div>
        </nav> */}

        <div className="flex items-end relative">
          <div className="relative h-80 bg-[#030303] w-96">
            <Image
              src={"/banner.jpg"}
              alt="error"
              fill={true}
              className="object-cover object-center"
            />
          </div>
          <div className="relative h-80 bg-[#030303] flex-1">
            <Image
              src={"/vat.jpg"}
              alt="error"
              fill={true}
              className="object-cover object-center"
            />
          </div>
          <div className="bg-white w-full text-xl absolute top-20 text-center">
            This banner shall be customized as per the choice.
          </div>
        </div>
        <Marquee className="bg-yellow-500 bg-opacity-10 text-sm">
          This is a banner shall be used for official updates and notifications.
        </Marquee>

        <section className="mx-auto w-5/6 py-4">
          <div className="flex gap-10">
            {/* box 1 start */}
            <div className="flex-1 bg-white rounded-md border border-[#0b1e59] p-2">
              <div className="flex">
                <p className="text-lg font-medium">News and Updates</p>
                <div className="grow"></div>
                <Link
                  href={"/news"}
                  className="font-medium text-[#0b1e59] text-sm"
                >
                  View All
                </Link>
              </div>
              <NewsCard />
              <div className="w-full border border-black"></div>
              <NewsCard />
              <div className="w-full border border-black"></div>
              <NewsCard />
              <div className="w-full border border-black"></div>
              <NewsCard />
            </div>
            {/* box 1 end */}
            {/* box 2 start */}
            <div className="w-80">
              <div className="flex">
                <p className="text-lg font-medium">VAT Knowledge Base </p>
                <div className="grow"></div>
              </div>
              <div className="rounded-md h-40 w-full bg-blue-500"></div>
              <p className="mt-1 cursor-pointer text-xs">
                Know more about Map-based Geocoding in the Registration process.
                Watch the video.
              </p>
              <div className="rounded-md h-40 w-full bg-blue-500 mt-4"></div>
              <p className="mt-1 cursor-pointer text-xs">
                How to validate Digital Signature affixed to the downloaded
                document from the GST Portal?
              </p>
            </div>
            {/* box 2 end */}
          </div>

          {/* <div className="flex gap-10 mt-6">
            <div className="flex-1">
              <div className="flex">
                <p className="text-lg font-medium">Upcoming Due Dates</p>
                <div className="grow"></div>
                <p className="text-lg font-medium text-[#0b1e59]">
                  DOWNLOAD PDF
                </p>
              </div>
              <div className="rounded-md border border-[#0b1e59] h-80"></div>
            </div>
            <div className="w-80">
              <div className="flex">
                <p className="text-lg font-medium">GST Media</p>
                <div className="grow"></div>
                <p className="text-lg font-medium text-[#0b1e59]">VIEW ALL</p>
              </div>
              <div className="rounded-md border border-[#0b1e59] h-80"></div>
            </div>
          </div> */}
        </section>
      </main>

      <div className="py-8">
        <section className="mx-auto w-5/6">
          <h1 className="text-center text-xl text-gray-600">
            Upcoming Due Dates
          </h1>

          <div className="grid mt-4 gap-2 items-end grid-cols-2">
            <div className="border hover:border-[#0b1e59] border-gray-400 rounded-md p-2 bg-gray-100">
              <p className="text-left text-lg text-gray-600">Monthly</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <DateCard
                  title={"DVAT04 (Jun, 2024)"}
                  subtitle={"Jul 20th, 2024 "}
                />
                <DateCard
                  title={"DVAT04 (Jul, 2024)"}
                  subtitle={"Aug 20th, 2024 "}
                />
                <DateCard
                  title={"DVAT04 (Aug, 2024)"}
                  subtitle={"Sept 20th, 2024 "}
                />
              </div>
            </div>
            <div className="border hover:border-[#0b1e59] border-gray-400 rounded-md p-2 bg-gray-100">
              <p className="text-left text-lg text-gray-600">Quarterly</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <DateCard
                  title={"DVAT04 (Jun, 2024)"}
                  subtitle={"Jul 20th, 2024 "}
                />
                <DateCard
                  title={"DVAT04 (Sept, 2024)"}
                  subtitle={"Oct 20th, 2024 "}
                />
                <DateCard
                  title={"DVAT04 (Dec, 2024)"}
                  subtitle={"Jan 20th, 2026 "}
                />
              </div>
            </div>
          </div>

          <div className="border hover:border-[#0b1e59] border-gray-400 rounded-md p-2 bg-gray-100 mt-2">
            <p className="text-left text-lg text-gray-600 mb-1">
              Other Due Dates
            </p>
            <div className="grid grid-cols-6 gap-2 mt-2">
              <DateCard
                title={"DVAT04 (Jun, 2024)"}
                subtitle={"Jul 20th, 2024 "}
              />
              <DateCard
                title={"DVAT04 (Jul, 2024)"}
                subtitle={"Aug 20th, 2024 "}
              />
              <DateCard
                title={"DVAT04 (Aug, 2024)"}
                subtitle={"Sept 20th, 2024 "}
              />
              <DateCard
                title={"DVAT04 (Jun, 2024)"}
                subtitle={"Jul 20th, 2024 "}
              />
              <DateCard
                title={"DVAT04 (Sept, 2024)"}
                subtitle={"Oct 20th, 2024 "}
              />
              <DateCard
                title={"DVAT04 (Dec, 2024)"}
                subtitle={"Jan 20th, 2026 "}
              />
            </div>
          </div>
        </section>
      </div>

      <main className="bg-[#f8fafe]">
        <section className="mx-auto w-5/6 py-4">
          <h1 className="mt-4 text-center text-2xl my-2 text-gray-600">
            Frequently Asked Questions
          </h1>
          <Collapse
            bordered={false}
            expandIcon={({ isActive }) => (
              <GravityUiChevronDown rotate={isActive ? 90 : 0} />
            )}
            style={{ background: "#f8fafe" }}
            items={getItems(panelStyle)}
          />
        </section>
        <footer className="flex gap-2 items-center bg-[#14315d] justify-evenly py-2">
          <h1 className=" text-gray-300 text-sm">&copy; VAT-DNH</h1>
          <h1 className=" text-gray-300 text-sm">
            Site Last Updated on 28-06-2024
          </h1>
          <h1 className="text-gray-300 text-sm">
            Designed & Developed by Smart Technologies
          </h1>
        </footer>
      </main>
    </>
  );
};
export default Home;

const NewsCard = () => {
  return (
    <div className=" p-1 px-2 mt-2 pb-2">
      <div className="flex items-center">
        <h1 className="text-sm">
          Integrated services from NIC-IRP e-invoice-1 and e-invoice-2
        </h1>
        <div className="grow"></div>
        <p className="text-xs text-gray-500">Jul 16th, 2024</p>
      </div>
      <p className="text-xs text-gray-500 leading-3 my-1">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe quidem
        mollitia nisi iste veniam eligendi. Amet dignissimos, adipisci veniam
        quis, dicta, aliquam cumque expedita necessitatibus libero perspiciatis
      </p>
      <div className="flex text-xs mt-3 gap-2">
        <p className="rounded text-xs px-2 bg-gray-100">Topic</p>
        <div className="grow"></div>
        <p className="text-blue-500">Read More &gt;&gt;</p>
      </div>
    </div>
  );
};

interface DateCardProps {
  title: string;
  subtitle: string;
}
const DateCard = (props: DateCardProps) => {
  return (
    <div className="px-4 py-2 rounded bg-white">
      <h1 className="text-xs">{props.title}</h1>
      <p className="text-xs font-medium">{props.subtitle}</p>
    </div>
  );
};
