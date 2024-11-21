"use clinet";
import { MdiEmail, MdiMapMarker, MdiPhone } from "@/components/icons";
import Image from "next/image";

const ContactUs = () => {
  return (
    <main className="px-6  flex flex-col lg:flex-row bg-white m-4 rounded-lg xl:w-5/6 xl:mx-auto">
      <div className=" py-16 order-2 lg:order-1">
        <p className="text-emerald-500 text-sm font-semibold">
          How can we help you?
        </p>
        <h1 className="text-4xl my-3 font-semibold">Contact Us</h1>
        <p className="text-lg leading-5">
          We&apos;re here to help and answer any question you
        </p>
        <p className="text-lg leading-5">
          might have. We look forward to hearing from you!
        </p>
        <p className="mt-4 font-semibold flex gap-6 items-center text-gray-500 w-[28rem]">
          <MdiMapMarker className="shrink-0" />
          <span>
            Value Added Tax / Goods and Service Tax Deptt (UTGST), &quot;A&quot;
            Wing, Second Floor, District Collectorate, Silvassa, U.T of DD & DNH
            - 396230
          </span>
        </p>
        <p className="mt-2 font-semibold flex gap-6 items-center text-gray-500">
          <MdiPhone />
          <span>0260-2632000</span>
        </p>
        <p className="mt-2 font-semibold flex gap-6 items-center text-gray-500">
          <MdiEmail />
          <span>mail@vat.com</span>
        </p>
      </div>
      <div className="grow"></div>
      <div className="shrink-0 relative w-80 h-80 order-1 lg:order-2 gird place-items-center">
        <Image fill={true} alt="error" src={"/contact.png"} />
      </div>
    </main>
  );
};

export default ContactUs;
