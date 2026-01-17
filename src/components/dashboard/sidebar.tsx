"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  Fa6RegularFileLines,
  FluentAlignBottom24Regular,
  FluentBuildingBank48Regular,
  FluentCalendar12Regular,
  FluentCalendarDataBar32Light,
  FluentDocumentSparkle28Regular,
  FluentMdl2ViewDashboard,
  FluentNotepadPerson16Regular,
  FluentWalletCreditCard20Regular,
  LucideUser,
  MaterialSymbolsCloseSmall,
  SolarBellBold,
  SolarLogout2Bold,
} from "../icons";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Role } from "@prisma/client";
import GetUserStatus from "@/action/user/userstatus";
import { logout } from "@/lib/auth";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import { toast } from "react-toastify";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean) => void;
  role: Role;
}

const Sidebar = (props: SidebarProps) => {
  const path = usePathname();
  const router = useRouter();

  const [userid, setUserid] = useState<number>(0);
  // const id: number = parseInt(getCookie("id") ?? "0");
  // const dvatid: number = parseInt(getCookie("dvat") ?? "0");
  // const [user, setUser] = useState<user>();
  const [isProfileCompletd, setIsProfileCompleted] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      // const userresponse = await GetUser({
      //   id: id,
      // });
      // if (userresponse.status && userresponse.data) {
      //   setUser(userresponse.data);
      // }
      const profile_response = await GetUserStatus({
        id: authResponse.data,
      });
      if (profile_response.status && profile_response.data) {
        setIsProfileCompleted(profile_response.data.registration);
      }
    };
    init();
  }, [userid]);

  return (
    <div
      className={`hidden-print fixed top-0 left-0 z-20 w-64 h-screen flex flex-col bg-white border-r border-gray-200 shadow-lg md:translate-x-0 ${
        props.isOpen ? "translate-x-0" : "-translate-x-64"
      } transition-transform duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">VATSMART</h1>
            <p className="text-xs text-gray-500">VAT Management Portal</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
            icon={<FluentMdl2ViewDashboard className="w-5 h-5" />}
            name="Dashboard"
            path={path}
            pathcheck={"/dashboard"}
          />
        )}

        <MenuTab
          click={() => props.setIsOpen(false)}
          icon={<FluentNotepadPerson16Regular className="w-5 h-5" />}
          name="Registration"
          path={path}
          pathcheck={"/dashboard/register"}
        />

        {!["USER"].includes(props.role) && (
          <>
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<Fa6RegularFileLines className="w-5 h-5" />}
              name="Returns"
              path={path}
              pathcheck={"/dashboard/returns"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentWalletCreditCard20Regular className="w-5 h-5" />}
              name="Payments"
              path={path}
              pathcheck={"/dashboard/payments"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<LucideUser className="w-5 h-5" />}
              name="Notice And Order"
              path={path}
              pathcheck={"/dashboard/user_service"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<LucideUser className="w-5 h-5" />}
              name="Dealer Compliance"
              path={path}
              pathcheck={"/dashboard/dealer_compliance"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentCalendarDataBar32Light className="w-5 h-5" />}
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
              icon={<Fa6RegularFileLines className="w-5 h-5" />}
              name="Returns"
              path={path}
              pathcheck={"/dashboard/returns"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentWalletCreditCard20Regular className="w-5 h-5" />}
              name="Payments"
              path={path}
              pathcheck={"/dashboard/payments"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<LucideUser className="w-5 h-5" />}
              name="User Services"
              path={path}
              pathcheck={"/dashboard/user_service"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<SolarBellBold className="w-5 h-5" />}
              name="Notifications"
              path={path}
              pathcheck={"/dashboard/notifications"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentCalendar12Regular className="w-5 h-5" />}
              name="Daily Sale"
              path={path}
              pathcheck={"/dashboard/stock/view_sale"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentBuildingBank48Regular className="w-5 h-5" />}
              name="Stock"
              path={path}
              pathcheck={"/dashboard/stock"}
            />
          </>
        )}

        {[
          "SYSTEM",
          "ADMIN",
          "VATOFFICER",
          "ASST_VAT_OFFICER",
          "DY_COMMISSIONER",
          "INSPECTOR",
        ].includes(props.role) && (
          <>
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentDocumentSparkle28Regular className="w-5 h-5" />}
              name="Registration Status"
              path={path}
              pathcheck={"/dashboard/registration_status"}
            />
            <MenuTab
              click={() => props.setIsOpen(false)}
              icon={<FluentAlignBottom24Regular className="w-5 h-5" />}
              name="Reports"
              path={path}
              pathcheck={"/dashboard/reports"}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <button
          className="md:hidden w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          onClick={() => props.setIsOpen(false)}
        >
          <MaterialSymbolsCloseSmall className="w-5 h-5" />
          <span>Close</span>
        </button>

        <Button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="w-full flex items-center justify-start gap-3 px-3 py-2.5 bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors text-sm font-medium"
        >
          <SolarLogout2Bold className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
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
  const isActive = props.path === props.pathcheck;

  return (
    <Link
      onClick={props.click}
      href={props.pathcheck}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={isActive ? "text-blue-600" : "text-gray-500"}>
        {props.icon}
      </span>
      <span className="text-sm">{props.name}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
      )}
    </Link>
  );
};
