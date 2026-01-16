"use client";

import { Button, Drawer, Input } from "antd";
import Marquee from "react-fast-marquee";
import { Dispatch, SetStateAction, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { formateDate } from "@/utils/methods";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { cform, dvat04, news, user } from "@prisma/client";
import { useRouter } from "next/navigation";

import { FluentEye12Regular, FluentEyeOff16Regular } from "@/components/icons";
import PasswordLogin from "@/action/user/passwordlogin";
import VerifyCForm from "@/action/verify/verify";

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

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const [ctsno, setCtsno] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);

  const [cformData, setCformData] = useState<
    (cform & { dvat04: dvat04 }) | null
  >(null);

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
    <>
      <div className="relative min-h-screen">
        <main className="bg-[#f8fafe] pb-14">
          <header className="bg-[#05313c] w-full flex gap-2 items-center mx-auto md:w-3/5  px-6 md:px-0">
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
              <Link
                href="/verify"
                className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
              >
                Verify
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
              {/* <LoginComponent /> */}
              <PasswordLoginComponent />
            </Drawer>
          </header>
          <div className="mx-auto md:hidden bg-[#05313c] flex justify-center md:w-3/5 py-4 px-6 md:px-0">
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
            <Link
              href="/verify"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Verify
            </Link>
          </div>

          <div className="relative w-full h-[12rem] mx-auto md:w-3/5 py-4 px-6 md:px-0">
            <Image
              src={"/banner.png"}
              alt="error"
              fill={true}
              className="object-contain object-center bg-[#0a5b6f]"
            />
          </div>

          <div className="relative w-full mx-auto md:w-3/5 md:px-0">
            <Marquee className="bg-yellow-500/10 text-sm">
              This banner shall be used for official updates and notifications.
            </Marquee>
          </div>

          <section className="mx-auto md:w-3/5 py-4 px-4  bg-white mt-4 rounded shadow">
            <div>
              <p className="text-lg font-medium">
                CST FORM Verification System
              </p>
              <div className="flex gap-2 items-center mt-4">
                <p className="shrink-0">Enter the CST Form No :- </p>
                <Input
                  className="w-60"
                  placeholder="Enter CST Form No"
                  value={ctsno}
                  onChange={(e) => setCtsno(e.target.value)}
                  disabled={isLoading || cformData !== null}
                />
                <button
                  className="text-white bg-blue-500 rounded px-4 h-8 w-40"
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
            </div>

            {cformData && (
              <div className="overflow-x-auto">
                <table className="w-full mt-2 border-collapse border border-gray-200">
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        CST FORM NO
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        {cformData.sr_no}
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Date of Issue
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        {formateDate(cformData.date_of_issue)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Name of the Issuing Office
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Dept. of Vat -{" "}
                        {cformData.office_of_issue == "Dadra_Nagar_Haveli"
                          ? "Dadra Nagar Haveli"
                          : cformData.office_of_issue == "DAMAN"
                          ? "Daman"
                          : "Diu"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Issued to the Dealer
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        TIN :- {cformData.dvat04.tinNumber} -
                        {cformData.dvat04.tradename} -{" "}
                        {cformData.dvat04.address}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Seller Name
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        TIN: {cformData.seller_tin_no} - {cformData.seller_name}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Total Amount involved
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        {parseFloat(cformData.amount).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        Purpose
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-normal text-sm">
                        For use in sale/resale
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <div className="absolute bottom-0 h-14 w-full">
          <footer className="mx-auto md:w-3/5 py-4 px-6 md:px-0 text-center md:flex gap-2 items-center bg-[#05313c] justify-evenly h-14">
            <h1 className=" text-gray-300 text-sm">&copy; VAT-DD-DNH</h1>
            <h1 className=" text-gray-300 text-sm">
              Site Last Updated on 24-01-2025
            </h1>
            <h1 className="text-gray-300 text-sm">
              Designed & Developed by Smart Technologies
            </h1>
          </footer>
        </div>
      </div>
    </>
  );
};
export default Home;

const PasswordLoginComponent = () => {
  const router = useRouter();

  const [tin, setTin] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  // const [isPassword, setIsPassword] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(false);

  const submit = async () => {
    setIsLogin(true);

    if (tin == null || tin == undefined || tin == "") {
      toast.error("Enter valid TIN number");
      setIsLogin(false);
      return;
    }

    if (password == null || password == undefined || password == "") {
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
    return;
  };

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

        <Label htmlFor="tin" className="text-xs">
          TIN Number
        </Label>
        <Input
          id="tin"
          type="text"
          maxLength={12}
          value={tin === undefined ? "" : tin.toString()} // Controlled input
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
