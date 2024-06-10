import { usePathname, useRouter } from "next/navigation";
import {
  Fa6RegularFileLines,
  FluentMdl2Home,
  FluentMdl2ViewDashboard,
  GgAlbum,
  IcBaselineAccountCircle,
  IcOutlineReceiptLong,
  LucideNewspaper,
  MaterialSymbolsCloseSmall,
  MaterialSymbolsPersonRounded,
  MdiReceiptTextClock,
  MdiStorefrontOutline,
  RiAuctionLine,
  RiMoneyRupeeCircleLine,
  SolarLogout2Bold,
} from "../icons";
import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Role } from "@prisma/client";
import { deleteCookie } from "cookies-next";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean) => void;
  role: Role;
}

const Sidebar = (props: SidebarProps) => {
  const path = usePathname();
  const router = useRouter();

  const logoutbtn = async () => {
    deleteCookie("id");
    return router.push("/");
  };

  return (
    <div
      className={`fixed gap-2 top-0 left-0 z-20 shrink-0 w-52 h-screen flex flex-col bg-gradient-to-t from-[#172e57] to-[#162f57] md:translate-x-0 py-6 ${
        props.isOpen ? "translate-x-0" : "-translate-x-52"
      }  transition-transform duration-300 ease-in-out`}
    >
      <p className="text-xl font-semibold text-white text-center">Vat Soft</p>
      <div className="h-4"></div>

      <MenuTab
        icco={<FluentMdl2ViewDashboard className="text-gray-300 w-6" />}
        name="Dashboard"
        path={path}
        pathcheck={"/dashboard"}
      />

      <MenuTab
        icco={<Fa6RegularFileLines className="text-gray-300  w-6" />}
        name="Register"
        path={path}
        pathcheck={"/dashboard/register"}
      />

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
            name="Rent"
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
        onClick={logoutbtn}
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
  name: string;
  path: string;
  pathcheck: string;
  icco: React.ReactNode;
}
const MenuTab = (props: MenuTabProps) => {
  return (
    <Link
      href={props.pathcheck}
      className={`flex gap-2 px-4 items-center py-2 ${
        props.path == props.pathcheck
          ? "border-l-2 border-green-500 bg-white bg-opacity-10"
          : ""
      }`}
    >
      {props.icco}
      <p
        className={` text-sm ${
          props.path == props.pathcheck
            ? "font-semibold text-white"
            : " font-normal text-gray-300"
        }`}
      >
        {props.name}
      </p>
    </Link>
  );
};
