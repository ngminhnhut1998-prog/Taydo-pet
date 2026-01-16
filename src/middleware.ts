import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('pb_auth');
  const { pathname } = request.nextUrl;

  // 1. Nếu đang ở trang Login, TUYỆT ĐỐI không làm gì cả, cho qua hết
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 2. Chỉ khi nào vào Dashboard mà không có vé mới đá ra
  if (pathname.startsWith('/dashboard') && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};