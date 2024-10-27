import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const idCookie = request.cookies.get("id");
  const id = idCookie?.value.toString();

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
    request.nextUrl.pathname.startsWith("/dashboard/payments/refunds")
  ) {
    NextResponse.next();
  } else if (!id && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
