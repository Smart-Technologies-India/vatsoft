"use client";

import { CreateUserProvider } from "@/components/forms/user/createuser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  }, [router]);
  return (
    <>
      <div className="min-h-screen w-full grid place-items-center bg-[#f5f6f8]">
        <div className="w-80 bg-white p-4 rounded-md">
          <div>
            <h1 className="text-2xl font-semibold border-b border-gray-300">
              Register
            </h1>
            <CreateUserProvider />
          </div>
        </div>
      </div>
    </>
  );
}
