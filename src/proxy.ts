import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "./action/auth/getuserid";
import { getCurrentUserRole } from "./lib/auth";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authResponse = await getAuthenticatedUserId();

  const role = await getCurrentUserRole();
  if (authResponse.status && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("dashboard/", request.url));
  } else if (
    pathname.startsWith("/dashboard/returns/returns-dashboard/preview") ||
    pathname.startsWith("/dashboard/payments/saved-challan/") ||
    pathname.startsWith("/dashboard/register/pdfview/") ||
    pathname.startsWith("/dashboard/returns/dvat24") ||
    pathname.startsWith("/dashboard/returns/dvat24a") ||
    pathname.startsWith("/dashboard/returns/dvat10") ||
    pathname.startsWith("/dashboard/payments/refunds") ||
    pathname.startsWith("/dashboard/returns/returns-dashboard/preview/") ||
    pathname.startsWith("/dashboard/cform")
  ) {
    return NextResponse.next();
  } else if (!authResponse.status && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  } else if (
    pathname == "/dashboard" &&
    ![
      "SYSTEM",
      "ADMIN",
      "VATOFFICER",
      "COMMISSIONER",
      "DY_COMMISSIONER",
      "JOINT_COMMISSIONER",
      "USER",
    ].includes(role ?? "USER")
  ) {
    return NextResponse.redirect(new URL("/dashboard/register", request.url));
  }
  return NextResponse.next();
}
