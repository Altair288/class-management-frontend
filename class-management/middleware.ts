import { NextRequest, NextResponse } from 'next/server';

// 说明：
// - 保护 /admin 下的所有页面，未登录则重定向到 /login
// - 登录判定：存在名为 'cm_auth' 的 Cookie 即视为已登录（可按需修改）
// - 登录页未受此中间件影响（matcher 中只匹配 /admin）

export function middleware(req: NextRequest) {
  // 兼容多种后端会话/令牌 Cookie 名称
  const authCookieNames = ['cm_auth', 'JSESSIONID', 'SESSION', 'access_token'];
  const hasAuth = authCookieNames.some((name) => !!req.cookies.get(name)?.value);

  if (!hasAuth) {
    const loginUrl = new URL('/login', req.url);
    // 携带来源地址，登录后可跳回
    loginUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 仅匹配 /admin 下的路径
export const config = {
  matcher: ['/admin/:path*'],
};
