"use client";
import {
  IcBaselineRefresh,
  MaterialSymbolsCloseSmall,
  SolarHamburgerMenuOutline,
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
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

interface NavbarProps {
  isOpen: boolean;
  setIsOpen: (arg: (val: boolean) => boolean) => void;
  name: string;
  role: string;
}

const Navbar = (props: NavbarProps) => {
  const router = useRouter();

  const logoutbtn = async () => {
    deleteCookie("id");
    return router.push("/");
  };

  return (
    <nav className="py-1 px-4 w-full bg-[#f0f1f5] flex items-center gap-2 shadow fixed top-0 left-0 z-10">
      <div className="md:hidden">
        {props.isOpen ? (
          <MaterialSymbolsCloseSmall
            className="text-xl"
            onClick={() => props.setIsOpen((val) => !val)}
          />
        ) : (
          <SolarHamburgerMenuOutline
            className="text-xl"
            onClick={() => props.setIsOpen((val) => !val)}
          />
        )}
      </div>

      <div className="grow"></div>
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
            <DropdownMenuItem onClick={logoutbtn} className="cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-full bg-[#172e57] shrink-0 h-8 w-8 grid place-items-center text-lg font-semibold text-white">
        {props.name[0].toUpperCase()}
      </div>
    </nav>
  );
};

export default Navbar;
