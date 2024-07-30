"use client";

import GetUser from "@/action/user/getuser";
import {
  Fa6RegularFileLines,
  FluentChannelSubtract48Regular,
  FluentNotePin20Regular,
  FluentWalletCreditCard20Regular,
  LucideArrowRight,
} from "@/components/icons";
import { decrypt } from "@/utils/methods";

enum FileStatus {
  FILED,
  NOTFILED,
}
import { user } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { useEffect, useState } from "react";

const Page = () => {
  const id: number = parseInt(getCookie("id") ?? "0");
  const [user, setUser] = useState<user>();

  useEffect(() => {
    const init = async () => {
      const userresponse = await GetUser({ id: id });
      if (userresponse.status) setUser(userresponse.data!);
    };

    init();
  }, []);

  return (
    <>
      <main className="relative min-h-[calc(100vh-2.5rem)] ">
        <div className="pb-10 relative">
          {/* <div className="bg-black bg-opacity-10 w-full h-full absolute top-0 left-0 z-40 mt-2 bg-clip-padding backdrop-filter backdrop-blur-sm grid place-items-center">
            <div className="rounded border bg-white mb-2 w-80 p-2">
              <h1 className="text-lg font-medium text-black">Warning</h1>
              <div className="bg-rose-500 w-full h-[1px] bg-opacity-30 my-1"></div>
              <p className="text-gray-500 text-xs">
                Your Registration seems incomplete. Kindly complete the
                registration.
              </p>
              <button className="w-full text-white text-sm bg-rose-500 text-center rounded mt-2 py-1">
                Complete profile
              </button>
            </div>
          </div> */}
          <div className="mx-auto px-4  w-4/6 py-6 relative">
            <div className="bg-white p-4 rounded-xl">
              <h1 className="text-sm font-semibold font-nunito leading-3">
                Welcome {decrypt(user?.firstName ?? "")}{" "}
                {decrypt(user?.lastName ?? "")} To VATSOFT Portal
              </h1>
              <h1 className="text-xs leading-3 text-gray-500 mt-1">
                Returns Calender (Last 6 return periods)
              </h1>
            </div>

            {/* second section start from here */}
            <div className="w-full mt-2">
              <div className="flex w-full gap-2">
                <div className="flex-1 rounded-xl">
                  <div className="flex items-center px-4">
                    <div className="text-sm font-semibold font-nunito leading-3 py-1 w-full text-gray-500  rounded-xl">
                      VAT
                    </div>
                    <div className="glow"></div>
                    <LucideArrowRight className="text-xl text-blue-500" />
                  </div>
                  <RentCard
                    title="JAN-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="FEB-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="MAR-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="APR-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="MAY-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="JUN-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.NOTFILED}
                  />
                </div>

                {/* <div className="flex-1 bg-white p-2 rounded-xl">
                  <div className="flex items-center px-4">
                    <div className="text-sm font-semibold font-nunito leading-3 py-1 w-full text-gray-500  rounded-xl">
                      VAT
                    </div>
                    <div className="glow"></div>
                    <LucideArrowRight className="text-xl text-blue-500" />
                  </div>
                  <RentCard
                    title="JAN-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="FEB-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="MAR-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="APR-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="MAY-2024"
                    date="19/12/2003"
                    status="Filed"
                    statusdate="Filed On"
                    filestatus={FileStatus.FILED}
                  />
                  <RentCard
                    title="JUN-2024"
                    date="19/12/2003"
                    status="To be Filed"
                    statusdate="To be Filed"
                    filestatus={FileStatus.NOTFILED}
                  />
                </div> */}
              </div>
            </div>

            <div className="grid grid-cols-4 mt-2 gap-2">
              <ButtonCard
                title="Return Dashboard"
                icon={<Fa6RegularFileLines className="text-blue-500 text-lg" />}
                link="/dashboard/returns/returns-dashboard"
              />
              <ButtonCard
                title="Payment And Refunds"
                icon={
                  <FluentWalletCreditCard20Regular className="text-blue-500 text-lg" />
                }
                link="/dashboard/payments"
              />
              <ButtonCard
                title="Notice(s) and Order(s)"
                icon={
                  <FluentNotePin20Regular className="text-blue-500 text-lg" />
                }
                link="/dashboard/notice-and-order"
              />
              <ButtonCard
                title="Annual Return"
                icon={
                  <FluentChannelSubtract48Regular className="text-blue-500 text-lg" />
                }
                link="/dashboard/annual-return"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default Page;

interface RentCardProps {
  title: string;
  date: string;
  status: string;
  statusdate: string;
  filestatus: FileStatus;
}

const RentCard = (props: RentCardProps) => {
  return (
    <div className="flex w-full my-2 px-3 py-1 rounded-md items-center gap-2 bg-white justify-between ">
      <div className="flex gap-2 items-center">
        <div
          className={`h-10 w-1 rounded-sm ${
            props.filestatus == FileStatus.FILED ? "bg-teal-500" : "bg-rose-500"
          }`}
        ></div>

        {props.filestatus == FileStatus.FILED ? (
          <>
            <div className="leading-3 w-8 h-8 rounded-full bg-teal-500 bg-opacity-30 text-teal-500 grid place-items-center text-[0.7rem] font-medium tracking-wider">
              03
              <br />
              24
            </div>
          </>
        ) : (
          <>
            <div className="leading-3 w-8 h-8 rounded-full bg-rose-500 bg-opacity-30 text-rose-500 grid place-items-center text-[0.7rem] font-medium tracking-wider">
              03
              <br />
              24
            </div>
          </>
        )}
        <h1 className="text-xs font-semibold font-nunito leading-3">
          {props.title}
        </h1>
      </div>

      <p className="text-xs font-normal text-gray-600 font-nunito leading-3 mt-1">
        {props.status}
      </p>
      <div className="">
        <h1 className="text-xs font-semibold font-nunito leading-3">
          {props.statusdate}
        </h1>
        <p className="text-xs font-normal text-gray-600 font-nunito leading-3 mt-1">
          {props.date}
        </p>
      </div>
      <Link
        href={"/dashboard/returns/returns-dashboard"}
        className="text-xs rounded px-4 py-1 border border-blue-500 text-blue-500 font-nunito"
      >
        View
      </Link>
    </div>
  );
};

interface ButtonCardProps {
  title: string;
  icon: React.ReactNode;
  link: string;
}

const ButtonCard = (props: ButtonCardProps) => {
  return (
    <div className="bg-white p-2  rounded-xl">
      <div className="flex  items-center gap-2">
        <div className="shrink-0 h-6 w-6 bg-blue-500 bg-opacity-30 rounded-full grid place-items-center text-white">
          {props.icon}
        </div>
        <h1 className="text-xs leading-3 text-gray-500">{props.title}</h1>
      </div>

      <Link
        href={props.link}
        className="text-xs inline-block text-center text-white bg-blue-500 rounded-md w-full py-1 font-nunito mt-2"
      >
        View
      </Link>
    </div>
  );
};
