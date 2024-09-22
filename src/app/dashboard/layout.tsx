/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import GetUser from "@/action/user/getuser";
import Navbar from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { Role, user } from "@prisma/client";
import { usePathname, useSearchParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userdata, setUpser] = useState<user>();
  const [isLoading, setLoading] = useState<boolean>(true);

  const [isbluck, setBluck] = useState<boolean>(
    searchParams.get("sidebar") == "no" ? true : false
  );
  const path = usePathname();
  const init = async () => {
    setLoading(true);
    // const searchPath = path.endsWith("/") ? path.slice(0, -1) : path;
    // if (
    //   searchPath ==
    //     "/dashboard/returns/returns-dashboard/invoices/bluckupload" ||
    //   searchPath.includes("/dashboard/returns/returns-dashboard/preview/")
    // ) {
    //   setBluck(true);
    // }
    const id: number = parseInt(getCookie("id") ?? "0");

    const userrespone = await GetUser({ id: id });
    if (userrespone.status) {
      setUpser(userrespone.data!);
    }
    setLoading(false);
  };
  useEffect(() => {
    init();
    // Handle back button (popstate) event
    const handlePopState = () => {
      init(); // Re-run init when the user navigates back to the page
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [path]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] relative">
      {!isbluck && (
        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          role={userdata?.role as Role}
        />
      )}

      <div
        className={`relative p-0 ${
          !isbluck ? "md:pl-52" : ""
        }  min-h-screen flex flex-col`}
      >
        <Navbar
          role={userdata?.role as Role}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          name={userdata?.firstName ?? ""}
          isbluck={isbluck}
        ></Navbar>
        <div className="h-10"></div>
        {children}

        {isOpen && (
          <div
            role="button"
            onClick={() => setIsOpen(false)}
            className="block md:hidden fixed top-0 left-0 bg-black bg-opacity-25 h-screen w-full z-10"
          ></div>
        )}
      </div>
    </div>
  );
}
