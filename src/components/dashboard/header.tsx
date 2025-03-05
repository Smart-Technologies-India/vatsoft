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
import { Drawer, Tooltip } from "antd";
import { useRef, useState } from "react";
import { getCookie } from "cookies-next";
import ChangePassword from "@/action/user/changepassword";
import { safeParse } from "valibot";
import {
  ForgetPasswordForm,
  ForgetpasswordSchema,
} from "@/schema/forgetpassword";
import { FormProvider, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { TaxtInput } from "../forms/inputfields/textinput";
import { onFormError } from "@/utils/methods";

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

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
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
        <Drawer closeIcon={null} onClose={onClose} open={open}>
          <PasswordComponent onClose={onClose} />
        </Drawer>
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
            {props.role != Role.USER && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={showDrawer}
                    className="cursor-pointer"
                  >
                    Change Password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
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

interface PasswordComponentProps {
  onClose: () => void;
}
const PasswordComponent = (props: PasswordComponentProps) => {
  // const {
  //   reset,
  //   handleSubmit,
  //   formState: { errors, isSubmitting },
  // };

  const methods = useForm<ForgetPasswordForm>({
    resolver: valibotResolver(ForgetpasswordSchema),
  });

  const onSubmit = async (data: ForgetPasswordForm) => {
    const passwordrespone = await ChangePassword({
      id: parseInt(getCookie("id") ?? "0"),
      password: data.password,
    });

    if (passwordrespone.status) {
      toast.success(passwordrespone.message);
      props.onClose();
    } else {
      toast.error(passwordrespone.message);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2 border-b border-gray-300 pb-2">
        Change Password
      </h1>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit, onFormError)}>
          <div className="mt-2">
            <TaxtInput<ForgetPasswordForm>
              title="Password"
              required={true}
              name="password"
              placeholder="Enter Password"
            />
          </div>

          <div className="mt-2">
            <TaxtInput<ForgetPasswordForm>
              title="Re-Password"
              required={true}
              name="repassword"
              placeholder="Enter Re-Password"
            />
          </div>

          <button
            type="submit"
            disabled={methods.formState.isSubmitting}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          >
            {methods.formState.isSubmitting ? "Loading...." : "Update"}
          </button>
        </form>
      </FormProvider>
    </>
  );
};
