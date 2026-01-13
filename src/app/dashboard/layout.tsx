/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import GetUser from "@/action/user/getuser";
import Navbar from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { useEffect, useState } from "react";
import { dvat04, Role, user } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GetDvatById from "@/action/user/register/getdvatbyid";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";
import { getCurrentDvatId } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userdata, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
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
    const authResponse = await getAuthenticatedUserId();
    if (!authResponse.status || !authResponse.data) {
      toast.error(authResponse.message);
      return router.push("/");
    }
    const dvatResponse = await getCurrentDvatId();
    if (dvatResponse == null && dvatResponse == undefined) {
      return router.push("/");

    }


    const userrespone = await GetUser({ id: authResponse.data });
    if (userrespone.status) {
      setUser(userrespone.data!);
    }

    const dvatresponse = await GetDvatById({ id: dvatResponse });
    if (dvatresponse.status) {
      setDvat(dvatresponse.data!);
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
          !isbluck ? "md:pl-64" : ""
        }  min-h-screen flex flex-col`}
      >
        {!isbluck && (
          <Navbar
            role={userdata?.role as Role}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            name={
              dvat != null ? dvat.tradename ?? "" : userdata?.firstName ?? ""
            }
            isbluck={isbluck}
          ></Navbar>
        )}

        {!isbluck && <div className="h-16"></div>}
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
