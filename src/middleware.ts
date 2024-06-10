import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const idCookie = request.cookies.get("id");
  const id = idCookie?.value.toString();
  // console.log("Request URL: ", request.nextUrl.pathname);

  // if (request.nextUrl.pathname.startsWith("/login")) {
  //   console.log("--------------------------");
  //   console.log("Request is for login page");
  //   console.log("--------------------------");
  //   return NextResponse.next();
  // }
  // if (request.nextUrl.pathname.startsWith("/register")) {
  //   console.log("--------------------------");
  //   console.log("Request is for login page");
  //   console.log("--------------------------");
  //   return NextResponse.next();
  // }
  // if (request.nextUrl.pathname == "/") {
  //   console.log("--------------------------");
  //   console.log("Request is for home page");
  //   console.log("--------------------------");
  //   return NextResponse.next();
  // }
  return NextResponse.next();

  // if (request.nextUrl.pathname.startsWith("/login")) {
  //   // if (id) {
  //   //   return NextResponse.redirect(new URL("/dashboard", request.url));
  //   // } else {
  //   return NextResponse.next();
  //   // }
  // } else {
  //   if (!id) {
  //     return NextResponse.redirect(new URL("/login", request.url));
  //   } else {
  //     return NextResponse.next();
  //   }
  // }
}
