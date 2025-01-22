"use client";

import { Button, Collapse, Drawer, Modal, Radio, RadioChangeEvent } from "antd";
import Marquee from "react-fast-marquee";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import LoginOtp from "@/action/user/loginotp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { dvat04, news, user } from "@prisma/client";
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
import { addMonths, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TinSendOtp from "@/action/user/tinsendotp";
import TinLoginOtp from "@/action/user/tinloginotp";
import { setCookie } from "cookies-next";

const Home = () => {
  const faqs = [
    {
      question: "How can I register for VAT?",
      answer:
        "To register, simply fill out the Google Form available through the link on the website. The VAT department will create your account based on the provided details and share the login credentials via your registered email and mobile number.",
    },
    {
      question: "How do I log in to the portal?",
      answer:
        "You can log in using your TIN number or registered mobile number. After entering your details, you will receive an OTP for verification.",
    },
    {
      question: "How do I file a VAT return?",
      answer:
        "The system auto-generates the return when you update your stock and sales details on the web portal. This information is converted into the required return format.",
    },
    {
      question: "How is the C-Form generated?",
      answer:
        "The C-Form is automatically generated three months after interstate filing has been completed.",
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
        <header className="bg-[#05313c] w-full flex gap-2 items-center mx-auto md:w-3/5  px-6 md:px-0">
          {/* <h1 className="text-white font-medium text-xl">VATSMART</h1> */}
          {/* <div className="w-10"></div> */}
          <div className="mx-auto hidden md:block">
            <Link
              href="/"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Contact
            </Link>
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Registration
            </Link>
          </div>
          <div className="grow"></div>
          <Button
            onClick={showDrawer}
            className="text-[#0b1e59] bg-white rounded px-4 py-1 text-xs inline-block h-6 mr-2"
          >
            LOGIN
          </Button>
          <Drawer closeIcon={null} onClose={onClose} open={open}>
            <LoginComponent />
          </Drawer>
        </header>
        <div className="mx-auto md:hidden bg-[#05313c] flex justify-center md:w-3/5 py-4 px-6 md:px-0">
          <Link
            href="/"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Home
          </Link>
          {/* <a
              href="#"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              About
            </a> */}
          <Link
            href="/contact"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Contact
          </Link>
          {/* <a
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
            </a> */}
          <Link
            href="https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Registration
          </Link>
        </div>

        <div className="flex bg-[#478494] mx-auto md:w-3/5  p-1">
          <div className="relative w-8">
            <Image
              src={"/favicon.png"}
              alt="error"
              fill={true}
              className="object-contain object-center"
            />
          </div>
          <div>
            <p className="text-white text-sm">
              Welcome to Department Of Gujarat State Tax
            </p>
            <p className="text-white text-xs">
              Department Of Gujarat State Tax is the nodal agency for the
              administration and collection of various taxes in the State of
              Gujarat
            </p>
          </div>
        </div>

        <div className="relative w-full h-[12rem] mx-auto md:w-3/5 py-4 px-6 md:px-0">
          <Image
            src={"/banner.png"}
            alt="error"
            fill={true}
            className="object-cover object-center"
          />
        </div>

        <div className="relative w-full mx-auto md:w-3/5 md:px-0">
          <Marquee className="bg-yellow-500 bg-opacity-10 text-sm">
            This banner shall be used for official updates and notifications.
          </Marquee>
        </div>

        <div className="mx-auto md:w-3/5 py-4 px-6 md:px-0">
          <section className="mx-auto">
            <h1 className="text-center text-3xl font-semibold text-[#1096b7] mb-8">
              Upcoming Due Dates
            </h1>

            <CardComponent />
            <div className="h-2"></div>
            <CardQuarterComponent />
          </section>
        </div>

        <section className="mx-auto md:w-3/5 py-4 px-6 md:px-0">
          <div>
            <p className="text-lg font-medium">VAT Knowledge Base </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#751947] p-2 w-full">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/SKFZGmgS52o"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  Learn how to register on the VAT-SMART portal in this
                  step-by-step tutorial.
                </p>
              </div>
              <div className="bg-[#751947] p-2">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/H941IkF71pM"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  This tutorial explains how to accurately add local purchase
                  details on the VAT-SMART portal.
                </p>
              </div>
              <div className="bg-[#751947] p-2">
                <iframe
                  className="w-full rounded-md"
                  src="https://www.youtube.com/embed/K398HeqOv7k"
                  title=""
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <p className="mt-1 cursor-pointer text-xs text-white">
                  Discover how to use the VAT-SMART portal to convert sales data
                  into VAT returns by auto-filling the DVAT 31 and DVAT 31A
                  forms.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="grid grid-cols-9 gap-2 mx-auto md:w-3/5 py-4 px-6 md:px-0">
        <div className="border border-gray-500 col-span-4">
          <h1 className="text-lg bg-[#339966] p-2 text-white">Features</h1>
          <div className="p-4 h-60 overflow-y-scroll">
            <p className="text-sm">
              1. Grant of Certificate of registration to the dealers (u/s-19 of
              VAT Regulation-2005)
            </p>
            <p className="text-sm">
              2. Amendment of registration (u/s-21 of VAT Regulation-2005)
            </p>
            <p className="text-sm">
              3. Cancellation of Certificate of registration (u/s-22 of VAT
              Regulation-2005)
            </p>
            <p className="text-sm">4. Amendment to Registrations (CST).</p>
            <p className="text-sm">
              5. Issue of Statutory forms i.e. Declaration forms − C, E1, E11,
              F, H. etc.
            </p>
            <p className="text-sm">6. Assessments.</p>
            <p className="text-sm">7. Refunds.</p>
            <p className="text-sm">8. Recovery of Tax, interest & Penalty.</p>
            <p className="text-sm">9. Tax Audit and Inspection of records.</p>
            <p className="text-sm">10. Enforcement.</p>
            <p className="text-sm">11. Appeals.</p>
          </div>
        </div>

        <div className="border border-gray-500 col-span-5">
          <h1 className="text-lg bg-[#00478f] p-2 text-white">
            What&apos;s New
          </h1>
          <div className="p-4 h-60 overflow-y-scroll">
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
          </div>
        </div>
      </div>

      <section className="mx-auto md:w-3/5 py-4 px-6 md:px-0 ">
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

      <footer className="mx-auto md:w-3/5 py-4 px-6 md:px-0 text-center md:flex gap-2 items-center bg-[#05313c] justify-evenly">
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
    <div className="mt-1">
      <div className="flex items-center">
        <h1 className="text-sm">{props.title}</h1>
        <div className="grow"></div>
        <p className="text-xs text-gray-500 shrink-0">{props.date}</p>
      </div>
      {/* <p className="text-xs text-gray-500 leading-3 my-1">{props.descriptio}</p> 
      <div className="flex text-xs mt-3 gap-2">
        <p className="rounded text-xs px-2 bg-gray-100">{props.topic}</p>
        <div className="grow"></div>
         <a href={props.link} target="_blank" className="text-blue-500">
          Read More &gt;&gt;
        </a> 
      </div>*/}
    </div>
  );
};

const LoginComponent = () => {
  enum TimerStatus {
    COMPLETED,
    RUNNING,
  }

  enum SearchOption {
    MOBILE,
    TIN,
  }

  const [counter, setCounter] = useState<number>(60);
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.COMPLETED);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (status === TimerStatus.RUNNING) return;

    setStatus(TimerStatus.RUNNING);
    intervalRef.current = setInterval(() => {
      setCounter((prevCounter) => {
        if (prevCounter <= 0) {
          stopTimer();
          return 0;
        }
        return prevCounter - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus(TimerStatus.COMPLETED);
  };

  const resetTimer = () => {
    stopTimer();
    setCounter(60); // Reset to initial value
  };

  const router = useRouter();

  const [isLogin, setIsLogin] = useState<boolean>(false);

  // top section
  const firstname = useRef<HTMLInputElement>(null);
  const lastname = useRef<HTMLInputElement>(null);

  const [isOtpSent, setIsOtpSent] = useState(false);

  const [otpresponse, setOtpResponse] = useState<user>();

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.MOBILE
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const [selectTinBox, setSelectTinBox] = useState(false);

  const [mobile, setMobile] = useState<string | undefined>(undefined);

  const [dvatData, setDvatData] = useState<dvat04[]>([]);

  // mobile start here
  const [mobileOTP, setMobileOTP] = useState<string | undefined>(undefined);

  const sendOtp = async () => {
    setIsLogin(true);
    if (mobile == null || mobile == undefined || mobile == "") {
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
    if (response.data && response.status) {
      setOtpResponse(response.data);
    }
    setCounter(60);
    startTimer();
    toast.success(response.message);
    setIsOtpSent(true);
    setIsLogin(false);
  };

  const verifyOtp = async () => {
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
      return;
    }

    if (mobileOTP == null || mobileOTP == undefined) {
      toast.error("Please enter a valid otp");
      return;
    }

    if (
      firstnameValue == null ||
      firstnameValue == undefined ||
      firstnameValue == ""
    ) {
      toast.error("Please enter a valid first name");
      return;
    }

    if (
      lastnameValue == null ||
      lastnameValue == undefined ||
      lastnameValue == ""
    ) {
      toast.error("Please enter a valid last name");
      return;
    }

    const response = await LoginOtp({
      mobile: mobile,
      otp: mobileOTP,
      firstname: firstnameValue,
      lastname: lastnameValue,
    });

    setSelectTinBox(true);
    if (response.status && response.data) {
      setCookie("id", response.data.id.toString());
      setCookie("role", response.data.role.toString());

      if (response.data.data.length == 0) {
        setIsLogin(true);
        router.push("/dashboard");
        setTimeout(() => {
          setIsLogin(false);
        }, 5000);
      }
      setDvatData(response.data.data);
      return;
    }
    toast.error(response.message);
  };

  // mobile end here

  // tin login option start here
  const [tinNumber, setTinNumber] = useState<string | undefined>(undefined);
  const [tinOTP, setTinOTP] = useState<string | undefined>(undefined);

  const tinSendOtp = async () => {
    setIsLogin(true);

    if (tinNumber === undefined) {
      toast.error("Please enter a valid TIN number");
      return;
    }

    if (tinNumber.length !== 12) {
      toast.error("TIN number should be 12 digits long");
      return;
    }

    const response = await TinSendOtp({ tin_number: tinNumber });
    if (!response.status) {
      toast.error(response.message);
      setIsLogin(false);
      return;
    }
    if (response.data && response.status) {
      setMobile(response.data.mobileOne);
      setOtpResponse(response.data);
    }
    setCounter(60);
    startTimer();
    toast.success(response.message);
    setIsOtpSent(true);
    setIsLogin(false);
  };

  const tinVerifyOtp = async () => {
    setIsLogin(true);

    if (tinNumber == null || tinNumber == undefined || tinNumber == "") {
      toast.error("Please enter a valid mobile number");
      setIsLogin(false);
      return;
    }

    if (tinOTP == null || tinOTP == undefined || tinOTP == "") {
      toast.error("Please enter a valid otp");
      setIsLogin(false);

      return;
    }

    const response = await TinLoginOtp({
      tin_number: tinNumber,
      otp: tinOTP,
    });

    if (!response.status) {
      toast.error(response.message);
      setTimeout(() => {
        setIsLogin(false);
      }, 5000);
      return;
    }

    toast.success(response.message);
    router.push("/dashboard");
    setTimeout(() => {
      setIsLogin(false);
    }, 5000);
    return;
  };

  // tin login option end here

  const handleNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setData: Dispatch<SetStateAction<string | undefined>>
  ) => {
    const onlyNumbersRegex = /^[0-9]*$/;
    const { value } = event.target;

    if (onlyNumbersRegex.test(value)) {
      // Parse value and handle empty case
      // const adddata = value === "" ? undefined : parseInt(value, 10);
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
        <Radio.Group
          block
          onChange={onChange}
          value={searchOption}
          className="mt-2"
        >
          <Radio.Button value={SearchOption.MOBILE}>MOBILE NUMBER</Radio.Button>
          <Radio.Button value={SearchOption.TIN}>TIN NUMBER</Radio.Button>
        </Radio.Group>

        {(() => {
          switch (searchOption) {
            case SearchOption.MOBILE:
              return (
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
                            value={
                              mobile === undefined ? "" : mobile.toString()
                            }
                            disabled
                            maxLength={10}
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
                            Hello {otpresponse?.firstName}{" "}
                            {otpresponse?.lastName}
                          </h1>
                          <Label htmlFor="mobile" className="text-xs">
                            Mobile Number
                          </Label>
                          <div className="flex">
                            <Input
                              id="mobile"
                              type="text"
                              value={
                                mobile === undefined ? "" : mobile.toString()
                              }
                              maxLength={10}
                              disabled
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
                        maxLength={6}
                        value={
                          mobileOTP === undefined ? "" : mobileOTP.toString()
                        }
                        onChange={(e) => handleNumberChange(e, setMobileOTP)}
                      />
                      {isLogin ? (
                        <Button type="primary" className="mt-2" disabled>
                          Loading...
                        </Button>
                      ) : (
                        <Button
                          onClick={verifyOtp}
                          type="primary"
                          className="mt-2"
                          disabled={isLogin}
                        >
                          Verify OTP
                        </Button>
                      )}
                      {status == TimerStatus.COMPLETED ? (
                        <p className="text-center mt-2">
                          Didn&apos;t receive a OTP?
                          <button
                            onClick={sendOtp}
                            className="underline font-semibold px-2 text-blue-500"
                          >
                            Resend OTP
                          </button>
                        </p>
                      ) : (
                        <p className="text-center mt-2">
                          Resend OTP in 00:
                          {counter.toString().length == 1
                            ? `0${counter}`
                            : counter}
                        </p>
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
                        maxLength={10}
                        value={mobile === undefined ? "" : mobile.toString()}
                        onChange={(e) => handleNumberChange(e, setMobile)}
                      />
                      {isLogin ? (
                        <Button type="primary" className="mt-2" disabled>
                          Loading...
                        </Button>
                      ) : (
                        <Button
                          onClick={sendOtp}
                          type="primary"
                          className="mt-2"
                          disabled={isLogin}
                        >
                          Send OTP
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );
            case SearchOption.TIN:
              return (
                <div className="grid max-w-sm items-center gap-1.5 w-80 mt-4">
                  {isOtpSent ? (
                    <>
                      <>
                        <h1 className="text-center text-xl">
                          Hello {otpresponse?.firstName} {otpresponse?.lastName}
                        </h1>
                        <p className="text-center mb-4">
                          Mobile Number : {mobile}
                        </p>
                        <Label htmlFor="mobile" className="text-xs">
                          Tin Number
                        </Label>
                        <div className="flex">
                          <Input
                            id="mobile"
                            type="text"
                            value={tinNumber === undefined ? "" : tinNumber}
                            maxLength={10}
                            disabled
                          />
                        </div>
                      </>

                      <Label htmlFor="otp" className="text-xs">
                        OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        value={tinOTP === undefined ? "" : tinOTP.toString()}
                        onChange={(e) => handleNumberChange(e, setTinOTP)}
                      />
                      {isLogin ? (
                        <Button type="primary" className="mt-2" disabled>
                          Loading...
                        </Button>
                      ) : (
                        <Button
                          onClick={tinVerifyOtp}
                          type="primary"
                          className="mt-2"
                          disabled={isLogin}
                        >
                          Verify OTP
                        </Button>
                      )}
                      {status == TimerStatus.COMPLETED ? (
                        <p className="text-center mt-2">
                          Didn&apos;t receive a OTP?
                          <button
                            onClick={tinSendOtp}
                            className="underline font-semibold px-2 text-blue-500"
                          >
                            Resend OTP
                          </button>
                        </p>
                      ) : (
                        <p className="text-center mt-2">
                          Resend OTP in 00:
                          {counter.toString().length == 1
                            ? `0${counter}`
                            : counter}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Label htmlFor="mobile" className="text-xs">
                        TIN Number
                      </Label>
                      <Input
                        id="mobile"
                        type="text"
                        maxLength={12}
                        value={
                          tinNumber === undefined ? "" : tinNumber.toString()
                        } // Controlled input
                        onChange={(e) => handleNumberChange(e, setTinNumber)}
                      />
                      {isLogin ? (
                        <Button type="primary" className="mt-2" disabled>
                          Loading...
                        </Button>
                      ) : (
                        <Button
                          onClick={tinSendOtp}
                          type="primary"
                          className="mt-2"
                          disabled={isLogin}
                        >
                          Send OTP
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );

            default:
              return null;
          }
        })()}
      </div>
      <Modal
        title="Your all TIN Numbers"
        style={{ top: 20 }}
        open={selectTinBox}
        closeIcon={true}
        onCancel={() => setSelectTinBox(false)}
        footer={false}
      >
        {isLogin && (
          <>
            <p className="text-xl text-center font-semibold mt-6">Loading...</p>
          </>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Tin Number</TableCell>
              <TableCell>Trade Name</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dvatData.map((val: dvat04, index: number) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{val.tinNumber}</TableCell>
                <TableCell>{val.tradename}</TableCell>
                <TableCell>
                  <Button
                    disabled={isLogin}
                    onClick={() => {
                      setIsLogin(true);
                      setCookie("dvat", val.id.toString());
                      router.push("/dashboard");
                      setTimeout(() => {
                        setIsLogin(false);
                      }, 5000);
                    }}
                  >
                    Login
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Modal>
    </div>
  );
};
interface DateCardProps {
  title: string;
  paymentdate: string;
  returndate: string;
}

function DateCard({ title, paymentdate, returndate }: DateCardProps) {
  return (
    <Card className="bg-white border-[#1096b7]/20 hover:border-[#1096b7]/50 transition-colors">
      <CardContent className="p-4">
        <h3 className="font-medium text-sm truncate text-[#1096b7]">{title}</h3>
        <p className="text-xs text-[#1096b7]/70 mt-1">
          Payment Due Date: {paymentdate}
        </p>
        <p className="text-xs text-[#1096b7]/70 mt-1">
          Return Filing Due Date: {returndate}
        </p>
      </CardContent>
    </Card>
  );
}

const CardComponent = () => {
  // Get current date and calculate current month and next two months
  const currentDate = new Date();
  const months = Array.from({ length: 3 }, (_, i) =>
    addMonths(currentDate, i - 1)
  ).map((date) => ({
    title: format(date, "MMM, yyyy"), // Format as "Jun, 2024"
    paymentdate: format(
      new Date(date.getFullYear(), date.getMonth() + 1, 15),
      "MMM d, yyyy"
    ), // Format as "Jun 15, 2024"
    returndate: format(
      new Date(date.getFullYear(), date.getMonth() + 1, 28),
      "MMM d, yyyy"
    ), // Format as "Jun 28, 2024"
  }));

  return (
    <Card className="border-[#1096b7]/30">
      <CardHeader className="bg-[#1096b7]/10">
        <CardTitle>
          <Badge className="bg-[#1096b7] text-xl hover:bg-[#0d7a94]">
            Monthly
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {months.map((month, index) => (
          <DateCard
            key={index}
            title={`DVAT04 (${month.title})`}
            paymentdate={month.paymentdate}
            returndate={month.returndate}
          />
        ))}
      </CardContent>
    </Card>
  );
};

const CardQuarterComponent = () => {
  const monthGroups = [
    ["April", "May", "June"],
    ["July", "August", "September"],
    ["October", "November", "December"],
    ["January", "February", "March"],
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });

  // Find the current quarter group
  const currentQuarter = monthGroups.find((group) =>
    group.includes(currentMonth)
  );

  // Generate data for current and next two quarters
  const quarters = Array.from({ length: 3 }, (_, i) => {
    const quarterIndex = (monthGroups.indexOf(currentQuarter!) + i) % 4;
    const quarter = monthGroups[quarterIndex];
    const lastMonth = quarter[quarter.length - 1]; // Get last month of the quarter

    const year =
      quarterIndex === 3 && i > 0
        ? currentDate.getFullYear() + 1
        : currentDate.getFullYear();

    // Generate the date for the last month's 15th and 28th
    const monthIndex = new Date(`${lastMonth} 1, ${year}`).getMonth();
    return {
      title: `${quarter.join(", ")} (${year})`, // Example: "April, May, June (2024)"
      paymentdate: format(new Date(year, monthIndex + 1, 15), "MMM d, yyyy"), // 15th of last month
      returndate: format(new Date(year, monthIndex + 1, 28), "MMM d, yyyy"), // 28th of last month
    };
  });

  return (
    <Card className="border-[#1096b7]/30">
      <CardHeader className="bg-[#1096b7]/10">
        <CardTitle>
          <Badge className="bg-[#1096b7] text-xl hover:bg-[#0d7a94]">
            Quarterly
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {quarters.map((quarter, index) => (
          <DateCard
            key={index}
            title={`${quarter.title}`}
            paymentdate={quarter.paymentdate}
            returndate={quarter.returndate}
          />
        ))}
      </CardContent>
    </Card>
  );
};
