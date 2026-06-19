import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  const { pathname } = request.nextUrl;

  if (!token) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const role = token.role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/dashboard" : "/portal", request.url));
  }

  if (pathname.startsWith("/dashboard") && role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (pathname.startsWith("/portal") && role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login"]
};
