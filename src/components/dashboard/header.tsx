"use client";
import {
  FluentArrowSyncCircle24Regular,
  IcBaselineArrowBack,
  MaterialSymbolsCloseSmall,
  SolarHamburgerMenuOutline,
  TablerHome,
} from "../icons";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { usePathname, useRouter } from "next/navigation";
import { logoutbtn } from "@/methods/user";
import ReturnFiling from "@/action/dashboard/return_filing";
import { toast } from "react-toastify";
import { Role } from "@prisma/client";
import { Tooltip } from "antd";

interface NavbarProps {
  isOpen: boolean;
  setIsOpen: (arg: (val: boolean) => boolean) => void;
  name: string;
  role: string;
  isbluck: boolean;
}

const Navbar = (props: NavbarProps) => {
  const router = useRouter();
  const path = usePathname();

  const returnTitle = (): string => {
    const searchPath = path.endsWith("/") ? path.slice(0, -1) : path;
    switch (searchPath) {
      case "/dashboard":
        return "Dashboard";
      case "/dashboard/register":
        return "Registration";
      case "/dashboard/returns":
        return "Returns";
      case "/dashboard/payments":
        return "Payments";
      case "/dashboard/help_tax":
        return "Help & Tax Payers Facility";
      case "/dashboard/user_service":
        return "User Services";
      case "/dashboard/returns/returns-dashboard/invoices":
        return "Invoices";
      case "/dashboard/returns/returns-dashboard/inward-supplies/add-record-30":
        return "Local Purchase Invoice [DVAT 30]";
      case "/dashboard/returns/returns-dashboard/inward-supplies/add-record-30A":
        return "Inter-State Purchase Invoice [DVAT 30A]";
      case "/dashboard/returns/returns-dashboard/outward-supplies/add-record-31":
        return "Local Sales Invoice [DVAT 31]";
      case "/dashboard/returns/returns-dashboard/outward-supplies/add-record-31A":
        return "Inter-State Sales Invoice [DVAT 31A]";
      default:
        return "";
    }
  };

  const canBack = (): boolean => {
    const searchPath = path.endsWith("/") ? path.slice(0, -1) : path;

    switch (searchPath) {
      case "/dashboard":
        return false;
      case "/dashboard/register":
        return false;
      case "/dashboard/returns":
        return false;
      case "/dashboard/payments":
        return false;
      case "/dashboard/user_service":
        return false;
      case "/dashboard/help_tax":
        return false;

      default:
        return true;
    }
  };

  return (
    <nav
      className={`py-1 px-4 w-full hidden-print  ${
        !props.isbluck ? "md:ml-52 md:w-[calc(100%-13rem)]" : ""
      } bg-white  flex items-center gap-2 shadow fixed top-0 left-0 z-10`}
    >
      <div className="md:hidden">
        {props.isOpen ? (
          <MaterialSymbolsCloseSmall
            className="text-xl cursor-pointer"
            onClick={() => props.setIsOpen((val) => !val)}
          />
        ) : (
          <SolarHamburgerMenuOutline
            className="text-xl cursor-pointer"
            onClick={() => props.setIsOpen((val) => !val)}
          />
        )}
      </div>
      {canBack() && (
        <>
          <Tooltip title="Go to previous page">
            <IcBaselineArrowBack
              className="hidden md:block cursor-pointer text-2xl"
              onClick={() => {
                router.back();
              }}
            />
          </Tooltip>
        </>
      )}

      <p className="text-lg font-medium text-gray-600">{returnTitle()}</p>
      <div className="grow"></div>
      {props.role != Role.USER && (
        <FluentArrowSyncCircle24Regular
          className="text-xl cursor-pointer text-gray-500"
          onClick={async () => {
            const response = await ReturnFiling();
            if (response.data && response.status) {
              toast.success("Data update successfully.");
            } 
          }}
        />
      )}

      <TablerHome
        className="text-xl cursor-pointer text-gray-500"
        onClick={() => {
          router.push("/dashboard");
        }}
      />
      <div className="w-[1px] h-8 bg-black"></div>
      {/* {["ADMIN", "MANAGER"].includes(props.role) && (
        <>
          <IcBaselineRefresh
            className="text-xl md:block hidden cursor-pointer"
            onClick={refreshrent}
          />
          <div className="w-[1px] h-6 bg-gray-500"></div>
        </>
      )} */}

      {/* <SolarCalendarMinimalisticBold className="text-xl md:block hidden" />
      <SolarBellBold className="text-2xl md:block hidden" />
      <SolarLightbulbMinimalisticBold className="text-xl md:block hidden" /> */}
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="px-1">
            <Button variant="ghost" className="gap-2 flex text-right">
              <div>
                <p className="font-medium text-sm">{props.name}</p>
                <p className="text-xs text-gray-500">{props.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/changepassword")}
                className="cursor-pointer"
              >
                Change Password
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
              Keyboard shortcuts
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Email</DropdownMenuItem>
                  <DropdownMenuItem>Message</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>More...</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              New Team
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem> */}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem
              onClick={() => logoutbtn(router)}
              className="cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-full bg-[#172e57] shrink-0 h-8 w-8 grid place-items-center text-lg font-semibold text-white">
        {(props.name[0] ?? "").toUpperCase()}
      </div>
    </nav>
  );
};

export default Navbar;
