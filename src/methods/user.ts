import { deleteCookie } from "cookies-next";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const logoutbtn = (router: AppRouterInstance) => {
  deleteCookie("id");
  deleteCookie("role");
  return router.push("/");
};

export { logoutbtn };
