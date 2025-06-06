import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const idCookie = request.cookies.get("id");
  const id = idCookie?.value.toString();

  const userrole = request.cookies.get("role");
  const role = userrole?.value.toString();
  if (id && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("dashboard/", request.url));
  } else if (
    request.nextUrl.pathname.startsWith(
      "/dashboard/returns/returns-dashboard/preview"
    ) ||
    request.nextUrl.pathname.startsWith("/dashboard/payments/saved-challan/") ||
    request.nextUrl.pathname.startsWith("/dashboard/register/pdfview/") ||
    request.nextUrl.pathname.startsWith("/dashboard/returns/dvat24") ||
    request.nextUrl.pathname.startsWith("/dashboard/returns/dvat24a") ||
    request.nextUrl.pathname.startsWith("/dashboard/returns/dvat10") ||
    request.nextUrl.pathname.startsWith("/dashboard/payments/refunds") ||
    request.nextUrl.pathname.startsWith("/dashboard/returns/returns-dashboard/preview/") ||
    request.nextUrl.pathname.startsWith("/dashboard/cform")
  ) {
    NextResponse.next();
  } else if (!id && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  } else if (
    request.nextUrl.pathname == "/dashboard" &&
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
}
