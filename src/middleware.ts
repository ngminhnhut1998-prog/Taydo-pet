import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('pb_auth');
  const { pathname } = request.nextUrl;

  // 1. Nếu đã có vé (Cookie) mà cố vào trang Login -> Cho vào Dashboard luôn
  if (pathname === '/login' && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. CHỈ bảo vệ các trang Dashboard. 
  // Nếu chưa có vé mà vào Dashboard -> Đá về Login
  if (pathname.startsWith('/dashboard') && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Các trường hợp khác (Trang chủ, ảnh, file hệ thống...) cho qua hết
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};