"use client";
import {
  FluentArrowSyncCircle24Regular,
  IcBaselineArrowBack,
  MaterialSymbolsCloseSmall,
  SolarHamburgerMenuOutline,
  TablerHome,
} from "../icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { usePathname, useRouter } from "next/navigation";
import ReturnFiling from "@/action/dashboard/return_filing";
import { toast } from "react-toastify";
import { Role } from "@prisma/client";
import { Drawer, Tooltip } from "antd";
import { useState } from "react";
import {
  ForgetPasswordForm,
  ForgetpasswordSchema,
} from "@/schema/forgetpassword";
import { FormProvider, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { TaxtInput } from "../forms/inputfields/textinput";
import { onFormError } from "@/utils/methods";
import { getCurrentDvatId, logout } from "@/lib/auth";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import DvatChangePassword from "@/action/user/dvatchangepassword";

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
      className={`h-16 px-6 w-full hidden-print ${
        !props.isbluck ? "md:ml-64 md:w-[calc(100%-16rem)]" : ""
      } bg-white border-b border-gray-200 flex items-center gap-4 fixed top-0 left-0 z-10`}
    >
      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        onClick={() => props.setIsOpen((val) => !val)}
      >
        {props.isOpen ? (
          <MaterialSymbolsCloseSmall className="text-2xl text-gray-700" />
        ) : (
          <SolarHamburgerMenuOutline className="text-xl text-gray-700" />
        )}
      </button>

      {/* Back Button */}
      {canBack() && (
        <Tooltip title="Go to previous page">
          <button
            className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => router.back()}
          >
            <IcBaselineArrowBack className="text-xl text-gray-700" />
          </button>
        </Tooltip>
      )}

      {/* Page Title */}
      <h1 className="text-base font-semibold text-gray-900">{returnTitle()}</h1>

      <div className="grow"></div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {props.role != Role.USER && (
          <Tooltip title="Sync data">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={async () => {
                const response = await ReturnFiling();
                if (response.data && response.status) {
                  toast.success("Data update successfully.");
                }
              }}
            >
              <FluentArrowSyncCircle24Regular className="text-xl text-gray-600" />
            </button>
          </Tooltip>
        )}

        <Tooltip title="Go to home">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <TablerHome className="text-xl text-gray-600" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* User Profile Dropdown */}
        <Drawer closeIcon={null} onClose={onClose} open={open}>
          <PasswordComponent onClose={onClose} />
        </Drawer>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {props.name}
                </p>
                <p className="text-xs text-gray-500">{props.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {(props.name[0] ?? "").toUpperCase()}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={showDrawer} className="cursor-pointer">
                <span className="text-sm">Change Password</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuItem
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="cursor-pointer text-red-600"
            >
              <span className="text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;

interface PasswordComponentProps {
  onClose: () => void;
}
const PasswordComponent = (props: PasswordComponentProps) => {
  const router = useRouter();
  // const {
  //   reset,
  //   handleSubmit,
  //   formState: { errors, isSubmitting },
  // };

  const methods = useForm<ForgetPasswordForm>({
    resolver: valibotResolver(ForgetpasswordSchema),
  });

  const onSubmit = async (data: ForgetPasswordForm) => {
    const authResponse = await getAuthenticatedUserId();
    if (!authResponse.status || !authResponse.data) {
      toast.error(authResponse.message);
      return router.push("/");
    }

    const dvatid = await getCurrentDvatId();

    if (dvatid == null || dvatid == undefined) {
      toast.error("Dvat not found. Please try again.");
      return router.push("/");
    }

    const passwordrespone = await DvatChangePassword({
      id: dvatid,
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
