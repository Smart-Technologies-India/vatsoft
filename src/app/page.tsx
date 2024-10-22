"use client";

import { GravityUiChevronDown } from "@/components/icons";
import { Button, Collapse, Drawer } from "antd";
import Marquee from "react-fast-marquee";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CollapseProps } from "antd";
import Image from "next/image";
import Link from "next/link";
import {
  handleNumberChange,
  validateAadharCard,
  validatePanCard,
} from "@/utils/methods";
import { toast } from "react-toastify";
import LoginOtp from "@/action/user/loginotp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { user } from "@prisma/client";
import SendOtp from "@/action/user/sendotp";
import { useRouter } from "next/navigation";

const Home = () => {
  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle
  ) => [
    {
      key: "1",
      label: "What is Value Added Tax (VAT)?",
      children: (
        <p>
          VAT!s a multi-point tax on value addition which is collected at
          different stages of sale with a provision for set-off for tax paid at
          the previous stage/tax paid on inputs.
        </p>
      ),
      style: panelStyle,
    },
    {
      key: "2",
      label:
        "Whether it is possible to avail credit for taxes paid on input if goods are sold interstate or are exported?",
      children: (
        <p>
          Purchases intended for inter-State Sale as well as exports are
          eligible for tax credit.
        </p>
      ),
      style: panelStyle,
    },
    {
      key: "3",
      label: "When can one claim input Tax Credit?",
      children: (
        <p>
          Input tax credit is the credit for tax paid on inputs. Dealer has to
          pay tax after deducting Input tax which he had paid from total tax
          collected by him.
        </p>
      ),
      style: panelStyle,
    },
    {
      key: "4",
      label: "What proof is required to claim input tax credit?",
      children: (
        <p>
          Input tax credit can be claimed only on purchases from VAT Registered
          Dealers. The original &quot;Tax Invoice&quot; is the proof required to
          claim input tax credit.
        </p>
      ),
      style: panelStyle,
    },
  ];

  const panelStyle: React.CSSProperties = {
    marginBottom: 12,
    borderRadius: "10px",
    background: "#f4f4f4",
    border: "none",
  };

  // useEffect(() => {
  //   const aadharnumber = ["241140014857", "243140064857"];
  //   const pannumber = ["241140014857", "243140064857"];

  //   aadharnumber.map((val: string) => {
  //     console.table([val, validateAadharCard(val)]);
  //   });
  //   pannumber.map((val: string) => {
  //     console.table([val, validatePanCard(val)]);
  //   });
  // }, []);

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <main className="bg-[#f8fafe] pb-8">
        <header className="bg-[#05313c] w-full py-2 flex gap-2 px-4 items-center">
          <h1 className="text-white font-medium text-xl">VATSMART</h1>
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

          {/* <Link
            href={"/login"}
            className="text-[#0b1e59] bg-white rounded px-4 py-1"
          >
            LOGIN
          </Link> */}

          <Button
            onClick={showDrawer}
            className="text-[#0b1e59] bg-white rounded text-sm px-4 py-1"
          >
            LOGIN
          </Button>
          <Drawer closeIcon={null} onClose={onClose} open={open}>
            <LoginComponent />
          </Drawer>
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
        <div className="relative w-full h-[24rem]">
          <Image
            src={"/banner.jpg"}
            alt="error"
            fill={true}
            className="object-cover object-center"
          />
        </div>

        {/* <div className="flex items-end relative">
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
        </div> */}
        <Marquee className="bg-yellow-500 bg-opacity-10 text-sm">
          This is a banner shall be used for official updates and notifications.
        </Marquee>

        <section className="mx-auto w-5/6 py-4">
          <div className="flex gap-2">
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
              <NewsCard
                title="Natural GAS Revised Rate of Tax - DNH DD."
                descriptio="Natural GAS Revised Rate of Tax - DNH DD."
                topic="Notificaton"
                date="Jul 16th, 2024"
                link="https://ddvat.gov.in/docs/Notification/2024/Natural%20GAS%20Revised%20Rate%20of%20Tax%20-%20DNH%20DD.pdf"
              />
              <div className="w-full border border-black"></div>
              <NewsCard
                title="Revised the rate of tax in respect of ATF under forth schedule."
                descriptio="Revised the rate of tax in respect of ATF under forth schedule."
                topic="Notificaton"
                date="Jul 16th, 2024"
                link="https://ddvat.gov.in/docs/Notification/2022/Revised%20tax%20of%20rate%20respext%20of%20ATF.pdf"
              />
              <div className="w-full border border-black"></div>
              <NewsCard
                title="Revised the rate of tax in respect of petrol and diesel under forth schedule."
                descriptio="Revised the rate of tax in respect of petrol and diesel under forth schedule."
                topic="Notificaton"
                date="Jul 16th, 2024"
                link="https://ddvat.gov.in/docs/Notification/2021/Revised%20tax%20of%20rate%20respext%20of%20petrol%20diesel.pdf"
              />
              <div className="w-full border border-black"></div>
              <NewsCard
                title="Notification Regarding appoints Shri Gaurav singh Rajawat as a Commissioner for the UT of Dadra Nagar Haveli and Daman and Diu."
                descriptio="Notification Regarding appoints Shri Gaurav singh Rajawat as a Commissioner for the UT of Dadra Nagar Haveli and Daman and Diu."
                topic="Notificaton"
                date="Jul 16th, 2024"
                link="https://ddvat.gov.in/docs/Notification/2021/Notification%20VAT.pdf"
              />
            </div>
            {/* box 1 end */}
            {/* box 2 start */}
            <div className="w-80">
              <div className="flex">
                <p className="text-lg font-medium">VAT Knowledge Base </p>
                <div className="grow"></div>
              </div>
              <div className="bg-[#0f839e] p-2 rounded-md">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/XEzRZ35urlk"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  Know more about Map-based Geocoding in the Registration
                  process. Watch the video.
                </p>
              </div>
              <div className="bg-[#0f839e] p-2 rounded-md mt-2">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/npFE7NIy574"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  Know more about Map-based Geocoding in the Registration
                  process. Watch the video.
                </p>
              </div>
              {/* <div className="bg-[#0f839e] p-2 rounded-md mt-2">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/XEzRZ35urlk"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  How to validate Digital Signature affixed to the downloaded
                  document from the GST Portal?
                </p>
              </div> */}
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
            <div className="rounded-md p-2 bg-[#1096b7]">
              <p className="text-left text-lg text-white">Monthly</p>
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
            <div className="rounded-md p-2 bg-[#1096b7]">
              <p className="text-left text-lg text-white">Quarterly</p>
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

          <div className=" rounded-md p-2 bg-[#1096b7] mt-2">
            <p className="text-left text-lg mb-1 text-white">Other Due Dates</p>
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
        <footer className="flex gap-2 items-center bg-[#05313c] justify-evenly py-2">
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

interface NewsCardProps {
  title: string;
  descriptio: string;
  topic: string;
  date: string;
  link: string;
}

const NewsCard = (props: NewsCardProps) => {
  return (
    <div className=" p-1 px-2 mt-2 pb-2">
      <div className="flex items-center">
        <h1 className="text-sm">{props.title}</h1>
        <div className="grow"></div>
        <p className="text-xs text-gray-500 shrink-0">{props.date}</p>
      </div>
      <p className="text-xs text-gray-500 leading-3 my-1">{props.descriptio}</p>
      <div className="flex text-xs mt-3 gap-2">
        <p className="rounded text-xs px-2 bg-gray-100">{props.topic}</p>
        <div className="grow"></div>
        <a href={props.link} target="_blank" className="text-blue-500">
          Read More &gt;&gt;
        </a>
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

const LoginComponent = () => {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState<boolean>(false);

  // top section
  const firstname = useRef<HTMLInputElement>(null);
  const lastname = useRef<HTMLInputElement>(null);

  const [isOtpSent, setIsOtpSent] = useState(false);

  const [otpresponse, setOtpResponse] = useState<user>();

  const mobileNumber = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const sendOtp = async () => {
    setIsLogin(true);
    const mobile = mobileNumber.current?.value;
    if (!mobile) {
      toast.error("Please enter a valid mobile number");
      setIsLogin(false);
      return;
    }

    if (mobile.length !== 10) {
      toast.error("Mobile number should be 10 digits long");
      setIsLogin(false);
      return;
    }
    const response = await SendOtp({ mobile: mobile });
    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }

    toast.success(response.message);
    setIsOtpSent(true);
    setOtpResponse(response.data!);
    setIsLogin(false);
  };

  const verifyOtp = async () => {
    setIsLogin(true);
    const mobile = mobileNumber.current?.value!;
    const otp = otpRef.current?.value;

    const firstnameValue: string =
      otpresponse &&
      otpresponse.firstName &&
      otpresponse.firstName !== "undefined"
        ? otpresponse.firstName
        : firstname.current?.value!;
    const lastnameValue =
      otpresponse &&
      otpresponse.lastName &&
      otpresponse.lastName !== "undefined"
        ? otpresponse.lastName
        : lastname.current?.value!;

    if (mobile == null || mobile == undefined || mobile == "") {
      toast.error("Please enter a valid mobile number");
      setIsLogin(false);
      return;
    }

    if (otp == null || otp == undefined || otp == "") {
      toast.error("Please enter a valid otp");
      setIsLogin(false);
      return;
    }

    if (
      firstnameValue == null ||
      firstnameValue == undefined ||
      firstnameValue == ""
    ) {
      toast.error("Please enter a valid first name");
      return setIsLogin(false);
    }

    if (
      lastnameValue == null ||
      lastnameValue == undefined ||
      lastnameValue == ""
    ) {
      toast.error("Please enter a valid last name");
      return setIsLogin(false);
    }

    const response = await LoginOtp({
      mobile: mobile,
      otp: otp,
      firstname: firstnameValue,
      lastname: lastnameValue,
    });

    if (!response.status) {
      toast.error(response.message);
      return setIsLogin(false);
    }

    toast.success(response.message);
    router.push("/dashboard");
    setIsLogin(false);
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
        <div className="grid max-w-sm items-center gap-1.5 w-80 mt-4">
          {isOtpSent ? (
            <>
              {otpresponse?.firstName == null ||
              otpresponse?.firstName == "" ||
              otpresponse?.lastName == null ||
              otpresponse?.lastName == "" ? (
                <>
                  <Label htmlFor="mobile" className="text-xs">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="text"
                    value={otpresponse?.mobileOne!}
                    ref={mobileNumber}
                    disabled
                    maxLength={10}
                    onChange={handleNumberChange}
                  />
                  <Label htmlFor="firstname" className="text-xs">
                    First Name
                  </Label>
                  <Input id="firstname" type="text" ref={firstname} />

                  <Label htmlFor="lastname" className="text-xs">
                    Last Name
                  </Label>
                  <Input id="lastname" type="text" ref={lastname} />
                </>
              ) : (
                <>
                  <h1 className="text-left text-xl mb-6">
                    Hello {otpresponse?.firstName} {otpresponse?.lastName}
                  </h1>
                  <Label htmlFor="mobile" className="text-xs">
                    Mobile Number
                  </Label>
                  <div className="flex">
                    <Input
                      id="mobile"
                      type="text"
                      ref={mobileNumber}
                      value={otpresponse?.mobileOne!}
                      maxLength={10}
                      disabled
                      onChange={handleNumberChange}
                    />
                  </div>
                </>
              )}

              <Label htmlFor="otp" className="text-xs">
                OTP
              </Label>
              <Input
                id="otp"
                type="text"
                ref={otpRef}
                maxLength={4}
                onChange={handleNumberChange}
              />
              {isLogin ? (
                <Button type="primary" className="mt-2">
                  Loading...
                </Button>
              ) : (
                <Button onClick={verifyOtp} type="primary" className="mt-2">
                  Verify OTP
                </Button>
              )}
            </>
          ) : (
            <>
              <Label htmlFor="mobile" className="text-xs">
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="text"
                ref={mobileNumber}
                maxLength={10}
                onChange={handleNumberChange}
              />
              {isLogin ? (
                <Button disabled type="primary" className="mt-2">
                  Loading...
                </Button>
              ) : (
                <Button onClick={sendOtp} type="primary" className="mt-2">
                  Send OTP
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
