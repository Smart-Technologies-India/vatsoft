"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  Fa6RegularFileLines,
  FluentBuildingBank48Regular,
  FluentCalendar12Regular,
  FluentCalendarDataBar32Light,
  FluentMdl2ViewDashboard,
  FluentNotepadPerson16Regular,
  FluentPersonSupport20Regular,
  FluentWalletCreditCard20Regular,
  LucideUser,
  MaterialSymbolsCloseSmall,
  SolarLogout2Bold,
} from "../icons";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Role, user } from "@prisma/client";
import { logoutbtn } from "@/methods/user";
import { getCookie } from "cookies-next";
import GetUser from "@/action/user/getuser";
import GetUserStatus from "@/action/user/userstatus";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean) => void;
  role: Role;
}

const Sidebar = (props: SidebarProps) => {
  const path = usePathname();
  const router = useRouter();

  const id: number = parseInt(getCookie("id") ?? "0");
  const [user, setUser] = useState<user>();
  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const userresponse = await GetUser({
        id: id,
      });
      if (userresponse.status && userresponse.data) {
        setUser(userresponse.data);
      }
      const profile_response = await GetUserStatus({
        id: id,
      });
      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }
    };
    init();
  }, [id]);

  return (
    <div
      className={`hidden-print fixed gap-1 top-0 left-0 z-20 shrink-0 w-52 h-screen flex flex-col bg-gradient-to-t from-[#0c0c32] to-[#0c0c32] md:translate-x-0 py-6 ${
        props.isOpen ? "translate-x-0" : "-translate-x-52"
      }  transition-transform duration-300 ease-in-out`}
    >
      <p className="text-xl font-semibold text-white text-center">VATSMART</p>
      <div className="h-4"></div>

      {[
        "SYSTEM",
        "ADMIN",
        "VATOFFICER",
        "COMMISSIONER",
        "DY_COMMISSIONER",
        "JOINT_COMMISSIONER",
        "USER",
      ].includes(props.role) && (
        <MenuTab
          click={() => props.setIsOpen(false)}
          icon={<FluentMdl2ViewDashboard className="text-gray-300 w-6" />}
          name="Dashboard"
          path={path}
          pathcheck={"/dashboard"}
        />
      )}

      <MenuTab
        click={() => props.setIsOpen(false)}
        icon={
          <FluentNotepadPerson16Regular className="text-gray-300  w-6 text-xl" />
        }
        name="Registration"
        path={path}
        pathcheck={"/dashboard/register"}
      />
      {!["USER"].includes(props.role) && (
        <>
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<Fa6RegularFileLines className="text-gray-300  w-6" />}
            name="Returns"
            path={path}
            pathcheck={"/dashboard/returns"}
          />
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={
              <FluentWalletCreditCard20Regular className="text-gray-300 text-xl  w-6" />
            }
            name="Payments"
            path={path}
            pathcheck={"/dashboard/payments"}
          />

          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<LucideUser className="text-gray-300  w-6" />}
            name="Notice And Order"
            path={path}
            pathcheck={"/dashboard/user_service"}
          />
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<LucideUser className="text-gray-300  w-6" />}
            name="Dealer Compliance"
            path={path}
            pathcheck={"/dashboard/dealer_compliance"}
          />

          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={
              <FluentCalendarDataBar32Light className="text-gray-300  w-6" />
            }
            name="Commodity"
            path={path}
            pathcheck={"/dashboard/commodity_master"}
          />
        </>
      )}
      {isProfileCompletd && ["USER"].includes(props.role) && (
        <>
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<Fa6RegularFileLines className="text-gray-300  w-6" />}
            name="Returns"
            path={path}
            pathcheck={"/dashboard/returns"}
          />
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={
              <FluentWalletCreditCard20Regular className="text-gray-300 text-xl  w-6" />
            }
            name="Payments"
            path={path}
            pathcheck={"/dashboard/payments"}
          />

          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<LucideUser className="text-gray-300  w-6" />}
            name="User Services"
            path={path}
            pathcheck={"/dashboard/user_service"}
          />
        </>
      )}
{/* 
      <MenuTab
        click={() => props.setIsOpen(false)}
        icon={<FluentPersonSupport20Regular className="text-gray-300  w-6" />}
        name="Tax Payers Facility"
        path={path}
        pathcheck={"/dashboard/help_tax"}
      /> */}

      {isProfileCompletd && ["USER"].includes(props.role) && (
        <>
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={<FluentCalendar12Regular className="text-gray-300  w-6" />}
            name="Daily Sale"
            path={path}
            pathcheck={"/dashboard/stock/view_sale"}
          />
          <MenuTab
            click={() => props.setIsOpen(false)}
            icon={
              <FluentBuildingBank48Regular className="text-gray-300 text-xl  w-6" />
            }
            name="Stock"
            path={path}
            pathcheck={"/dashboard/stock"}
          />
        </>
      )}
      {/* <MenuTab
        icco={<Fa6RegularFileLines className="text-gray-300  w-6" />}
        name="Downloads"
        path={path}
        pathcheck={"/dashboard/register"}
      />
      <MenuTab
        icco={<Fa6RegularFileLines className="text-gray-300  w-6" />}
        name="My Profile"
        path={path}
        pathcheck={"/dashboard/register"}
      /> */}

      {/* {["USER"].includes(props.role) && (
        <>
          <MenuTab
            icco={<FluentMdl2Home className="text-gray-300  w-6" />}
            name="My Properties"
            path={path}
            pathcheck={"/dashboard/userproperties"}
          />

          <MenuTab
            icco={<RiAuctionLine className="text-gray-300  w-6" />}
            name="Live Bids"
            path={path}
            pathcheck={"/dashboard/userbids"}
          />
          <MenuTab
            icco={<MdiReceiptTextClock className="text-gray-300  w-6" />}
            name="Bid History"
            path={path}
            pathcheck={"/dashboard/userbidhistory"}
          />
          <MenuTab
            icco={<MdiStorefrontOutline className="text-gray-300  w-6" />}
            name="Tax"
            path={path}
            pathcheck={"/dashboard/userrent"}
          />
        </>
      )}

      {["ADMIN", "ACCOUNTANT", "MANAGER", "DYCOLLECTOR"].includes(
        props.role
      ) && (
        <>
          <MenuTab
            icco={<FluentMdl2ViewDashboard className="text-gray-300 w-6" />}
            name="Dashboard"
            path={path}
            pathcheck={"/dashboard"}
          />
          <MenuTab
            icco={<FluentMdl2Home className="text-gray-300  w-6" />}
            name="Properties"
            path={path}
            pathcheck={"/dashboard/properties"}
          />

          <MenuTab
            icco={<Fa6RegularFileLines className="text-gray-300  w-6" />}
            name="Reports"
            path={path}
            pathcheck={"/dashboard/reports"}
          />

          <MenuTab
            icco={<RiAuctionLine className="text-gray-300  w-6" />}
            name="Bids"
            path={path}
            pathcheck={"/dashboard/bids"}
          />
          <MenuTab
            icco={<RiMoneyRupeeCircleLine className="text-gray-300  w-6" />}
            name="Rents"
            path={path}
            pathcheck={"/dashboard/rents"}
          />
          <MenuTab
            icco={
              <MaterialSymbolsPersonRounded className="text-gray-300  w-6" />
            }
            name="Users"
            path={path}
            pathcheck={"/dashboard/users"}
          />
          <MenuTab
            icco={<GgAlbum className="text-gray-300  w-6" />}
            name="Category"
            path={path}
            pathcheck={"/dashboard/category"}
          />
        </>
      )}

      {["ACCOUNTANT", "ADMIN"].includes(props.role) && (
        <>
          <MenuTab
            icco={<LucideNewspaper className="text-gray-300  w-6" />}
            name="Misc Receipt"
            path={path}
            pathcheck={"/dashboard/miscreceipt"}
          />
          <MenuTab
            icco={<IcOutlineReceiptLong className="text-gray-300  w-6" />}
            name="Misc Invoice"
            path={path}
            pathcheck={"/dashboard/miscinvoice"}
          />
        </>
      )} */}

      {/* <MenuTab
        icco={<AntDesignShopOutlined className="text-gray-300  w-6" />}
        name="Shops"
        path={path}
        pathcheck={"/dashboard/shops"}
      /> */}

      <div className="grow"></div>

      {/* {["USER"].includes(props.role) && (
        <>
          <MenuTab
            icco={<IcBaselineAccountCircle className="text-gray-300  w-6" />}
            name="My Profile"
            path={path}
            pathcheck={"/dashboard/userprofile"}
          />
        </>
      )} */}
      <button
        className="text-white md:hidden text-left items-center flex justify-start gap-4 rounded-none px-4 py-2 hover:bg-rose-500 hover:border-l-2 hover:border-rose-500 bg-transparent hover:bg-opacity-20"
        onClick={() => props.setIsOpen(false)}
      >
        <MaterialSymbolsCloseSmall className="text-2xl" />
        <p>Close</p>
      </button>

      <Button
        onClick={() => logoutbtn(router)}
        className={`flex justify-start gap-4 rounded-none px-4 py-2 hover:bg-rose-500 hover:border-l-2 hover:border-rose-500 bg-transparent hover:bg-opacity-20 `}
      >
        <SolarLogout2Bold className="text-gray-300  w-6" />
        <p className="text-gray-300 text-sm">Logout</p>
      </Button>
    </div>
  );
};

export default Sidebar;

interface MenuTabProps {
  click: () => void;
  name: string;
  path: string;
  pathcheck: string;
  icon: React.ReactNode;
}
const MenuTab = (props: MenuTabProps) => {
  return (
    <Link
      onClick={props.click}
      href={props.pathcheck}
      className={`flex gap-1 px-1 items-center py-2 ${
        props.path == props.pathcheck
          ? "border-l-2 border-blue-500 bg-white bg-opacity-10"
          : ""
      }`}
    >
      {props.icon}
      <p
        className={` text-sm ${
          props.path == props.pathcheck
            ? "font-medium text-white"
            : " font-normal text-gray-400"
        }`}
      >
        {props.name}
      </p>
    </Link>
  );
};
