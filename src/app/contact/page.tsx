"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";

import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";
import Marquee from "react-fast-marquee";
import Link from "next/link";
import { Input } from "antd";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", { name, email, phone, message });
    // Reset form fields after submission
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

  return (
    <>
      <header className="bg-[#05313c] w-full py-2 flex gap-2 px-4 items-center">
        <h1 className="text-white font-medium text-xl">VATSMART</h1>
        <div className="w-10"></div>
        <div className="mx-auto hidden md:block">
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
        <div className="grow"></div>
      </header>
      <div className="mx-auto md:hidden bg-[#05313c] flex justify-center">
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

      <div className="relative w-full h-[24rem]">
        <Image
          src={"/banner.jpg"}
          alt="error"
          fill={true}
          className="object-cover object-center"
        />
      </div>

      <Marquee className="bg-yellow-500 bg-opacity-10 text-sm">
        This banner shall be used for official updates and notifications.
      </Marquee>

      <div className="py-10 bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-8">
          <p className="text-2xl font-bold text-center">Contact Us</p>
          <p className="text-center">
            We&apos;re always happy to hear from you. Whether you have a
            question, comment, or suggestion, please don&apos;t hesitate to
            contact us. We&apos;ll do our best to get back to you as soon as
            possible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Visit us</h4>
                  <div className="flex items-start space-x-3 text-sm">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      VAT & GST Department <br />
                      District Secretariat “A” - Wing, 2nd Floor, <br />
                      D&NH-Silvassa- 396230.
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Call us</h4>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span>0260-2632000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Email us</h4>
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span>vato1-ctd-dnh@nic.in</span>
                    <span>Helpline-ctd-dnh@nic.in</span>
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="(123) 456-7890"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <Input.TextArea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Your message here..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </div>
        </div>
      </div>
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
}
