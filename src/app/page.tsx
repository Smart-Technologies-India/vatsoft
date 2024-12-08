"use client";

import { Button, Collapse, Drawer } from "antd";
import Marquee from "react-fast-marquee";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { formateDate, handleNumberChange } from "@/utils/methods";
import { toast } from "react-toastify";
import LoginOtp from "@/action/user/loginotp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { news, user } from "@prisma/client";
import SendOtp from "@/action/user/sendotp";
import { useRouter } from "next/navigation";
import GetAllNews from "@/action/news/getallnews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LoadingPage from "./loading";

const Home = () => {
  const faqs = [
    {
      question: "What is Value Added Tax (VAT)?",
      answer:
        "VAT is a multi-point tax on value addition which is collected at different stages of sale with a provision for set-off for tax paid at the previous stage/tax paid on inputs.",
    },
    {
      question:
        "Whether it is possible to avail credit for taxes paid on input if goods are sold interstate or are exported?",
      answer:
        "Purchases intended for inter-State Sale as well as exports are eligible for tax credit.",
    },
    {
      question: "When can one claim input Tax Credit?",
      answer:
        "Input tax credit is the credit for tax paid on inputs. Dealer has to pay tax after deducting Input tax which he had paid from total tax collected by him.",
    },
    {
      question: "What proof is required to claim input tax credit?",
      answer:
        'Input tax credit can be claimed only on purchases from VAT Registered Dealers. The original "Tax Invoice" is the proof required to claim input tax credit.',
    },
  ];
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (value: string) => {
    setOpenItems((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  // const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
  //   panelStyle
  // ) => [
  //   {
  //     key: "1",
  //     label: "What is Value Added Tax (VAT)?",
  //     children: (
  //       <p>
  //         VAT!s a multi-point tax on value addition which is collected at
  //         different stages of sale with a provision for set-off for tax paid at
  //         the previous stage/tax paid on inputs.
  //       </p>
  //     ),
  //     style: panelStyle,
  //   },
  //   {
  //     key: "2",
  //     label:
  //       "Whether it is possible to avail credit for taxes paid on input if goods are sold interstate or are exported?",
  //     children: (
  //       <p>
  //         Purchases intended for inter-State Sale as well as exports are
  //         eligible for tax credit.
  //       </p>
  //     ),
  //     style: panelStyle,
  //   },
  //   {
  //     key: "3",
  //     label: "When can one claim input Tax Credit?",
  //     children: (
  //       <p>
  //         Input tax credit is the credit for tax paid on inputs. Dealer has to
  //         pay tax after deducting Input tax which he had paid from total tax
  //         collected by him.
  //       </p>
  //     ),
  //     style: panelStyle,
  //   },
  //   {
  //     key: "4",
  //     label: "What proof is required to claim input tax credit?",
  //     children: (
  //       <p>
  //         Input tax credit can be claimed only on purchases from VAT Registered
  //         Dealers. The original &quot;Tax Invoice&quot; is the proof required to
  //         claim input tax credit.
  //       </p>
  //     ),
  //     style: panelStyle,
  //   },
  // ];

  const panelStyle: React.CSSProperties = {
    marginBottom: 12,
    borderRadius: "10px",
    background: "#f4f4f4",
    border: "none",
  };

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const [newsdata, setNews] = useState<news[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const news_resonse = await GetAllNews({
        take: 5,
        skip: 0,
      });
      if (news_resonse.status && news_resonse.data.result) {
        setNews(news_resonse.data.result);
      }
      setLoading(false);
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <>
      <main className="bg-[#f8fafe] pb-8">
        <header className="bg-[#05313c] w-full py-2 flex gap-2 px-4 items-center">
          <h1 className="text-white font-medium text-xl">VATSMART</h1>
          <div className="w-10"></div>
          <div className="mx-auto hidden md:block">
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
          <Button
            onClick={showDrawer}
            className="text-[#0b1e59] bg-white rounded text-sm px-4 py-1"
          >
            LOGIN
          </Button>
          <Drawer closeIcon={true} onClose={onClose} open={open}>
            <LoginComponent />
          </Drawer>
        </header>
        <div className="mx-auto md:hidden bg-[#05313c] flex justify-center">
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

        <section className="mx-auto md:w-5/6 py-4 px-6 md:px-0">
          <div className="md:flex gap-2">
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

              {newsdata.map((val: news, index: number) => (
                <NewsCard
                  key={index}
                  title={val.title}
                  descriptio={val.descrilption}
                  topic={val.topic}
                  date={formateDate(val.postdate)}
                  link="https://ddvat.gov.in/docs/Notification/2024/Natural%20GAS%20Revised%20Rate%20of%20Tax%20-%20DNH%20DD.pdf"
                />
              ))}
              {/* <NewsCard
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
              /> */}
            </div>
            {/* box 1 end */}
            {/* box 2 start */}
            <div className="md:w-80">
              <p className="text-lg font-medium">VAT Knowledge Base </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
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
                <div className="bg-[#0f839e] p-2 rounded-md md:mt-2">
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
              </div>
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

      <div className="mx-auto md:w-5/6 py-4 px-6 md:px-0">
        <section className="mx-auto">
          <h1 className="text-center text-3xl font-semibold text-[#1096b7] mb-8">
            Upcoming Due Dates
          </h1>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-[#1096b7]/30">
              <CardHeader className="bg-[#1096b7]/10">
                <CardTitle>
                  <Badge className="bg-[#1096b7] text-xl hover:bg-[#0d7a94]">
                    Monthly
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
                <DateCard
                  title="DVAT04 (Jun, 2024)"
                  subtitle="Jul 20th, 2024"
                />
                <DateCard
                  title="DVAT04 (Jul, 2024)"
                  subtitle="Aug 20th, 2024"
                />
                <DateCard
                  title="DVAT04 (Aug, 2024)"
                  subtitle="Sept 20th, 2024"
                />
              </CardContent>
            </Card>

            <Card className="border-[#1096b7]/30">
              <CardHeader className="bg-[#1096b7]/10">
                <CardTitle>
                  <Badge className="bg-[#1096b7] text-xl hover:bg-[#0d7a94]">
                    Quarterly
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
                <DateCard
                  title="DVAT04 (Jun, 2024)"
                  subtitle="Jul 20th, 2024"
                />
                <DateCard
                  title="DVAT04 (Sept, 2024)"
                  subtitle="Oct 20th, 2024"
                />
                <DateCard
                  title="DVAT04 (Dec, 2024)"
                  subtitle="Jan 20th, 2025"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-[#1096b7]/30">
            <CardHeader className="bg-[#1096b7]/10">
              <CardTitle className="text-[#1096b7]">Other Due Dates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 p-4">
              <DateCard title="DVAT04 (Jun, 2024)" subtitle="Jul 20th, 2024" />
              <DateCard title="DVAT04 (Jul, 2024)" subtitle="Aug 20th, 2024" />
              <DateCard title="DVAT04 (Aug, 2024)" subtitle="Sept 20th, 2024" />
              <DateCard title="DVAT04 (Jun, 2024)" subtitle="Jul 20th, 2024" />
              <DateCard title="DVAT04 (Sept, 2024)" subtitle="Oct 20th, 2024" />
              <DateCard title="DVAT04 (Dec, 2024)" subtitle="Jan 20th, 2025" />
            </CardContent>
          </Card>
        </section>
      </div>
      <section className="mx-auto md:w-5/6 py-4 px-6 md:px-0 ">
        <h1 className="text-center text-3xl font-semibold text-[#1096b7] mb-8">
          Frequently Asked Questions
        </h1>
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-[#1096b7]/20 rounded-lg overflow-hidden transition-all duration-200 ease-in-out hover:border-[#1096b7]/50"
            >
              <AccordionTrigger
                onClick={() => toggleItem(`item-${index}`)}
                className="px-6 py-4 text-left text-[#1096b7] hover:text-[#0d7a94] transition-colors duration-200"
              >
                <span className="text-lg font-medium">{faq.question}</span>
                {/* <ChevronDown
                  className={`shrink-0 text-[#1096b7] transition-transform duration-200 ${
                    openItems.includes(`item-${index}`) ? "rotate-180" : ""
                  }`}
                /> */}
              </AccordionTrigger>
              <AnimatePresence>
                {openItems.includes(`item-${index}`) && (
                  <AccordionContent forceMount asChild>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <p className="px-6 py-4 text-[#1096b7]/80">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </AccordionContent>
                )}
              </AnimatePresence>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="text-center md:flex gap-2 items-center bg-[#05313c] justify-evenly py-2">
        <h1 className=" text-gray-300 text-sm">&copy; VAT-DNH</h1>
        <h1 className=" text-gray-300 text-sm">
          Site Last Updated on 28-06-2024
        </h1>
        <h1 className="text-gray-300 text-sm">
          Designed & Developed by Smart Technologies
        </h1>
      </footer>
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
        {/* <a href={props.link} target="_blank" className="text-blue-500">
          Read More &gt;&gt;
        </a> */}
      </div>
    </div>
  );
};

// interface DateCardProps {
//   title: string;
//   subtitle: string;
// }
// const DateCard = (props: DateCardProps) => {
//   return (
//     <div className="px-4 py-2 rounded bg-white">
//       <h1 className="text-xs">{props.title}</h1>
//       <p className="text-xs font-medium">{props.subtitle}</p>
//     </div>
//   );
// };

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
                maxLength={6}
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
interface DateCardProps {
  title: string;
  subtitle: string;
}

function DateCard({ title, subtitle }: DateCardProps) {
  return (
    <Card className="bg-white border-[#1096b7]/20 hover:border-[#1096b7]/50 transition-colors">
      <CardContent className="p-4">
        <h3 className="font-medium text-sm truncate text-[#1096b7]">{title}</h3>
        <p className="text-xs text-[#1096b7]/70 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
