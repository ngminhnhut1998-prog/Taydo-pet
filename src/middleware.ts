import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy token từ cookie pb_auth
  const authCookie = request.cookies.get('pb_auth');
  const { pathname } = request.nextUrl;

  // 1. Định nghĩa các đường dẫn không cần bảo vệ (Public)
  const isAuthPage = pathname === '/login';
  const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next');

  // 2. Nếu đã đăng nhập (có cookie) mà vẫn cố vào trang /login
  if (isAuthPage && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Nếu CHƯA đăng nhập mà vào các trang nội bộ (không phải login/public)
  if (!authCookie && !isAuthPage && !isPublicFile && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    // Lưu lại trang đang định vào để sau khi login xong nó quay lại đúng trang đó
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Bảo vệ toàn bộ các trang trừ:
     * - api (các lệnh gọi dữ liệu)
     * - _next/static (file giao diện)
     * - _next/image (hình ảnh)
     * - favicon.ico (biểu tượng)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};