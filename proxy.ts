import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'zh-CN'] as const;
type Locale = (typeof locales)[number];

function isLocale(value: string | null): value is Locale {
  return value !== null && locales.some((locale) => locale === value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    const requestedLocale = request.nextUrl.searchParams.get('lang');
    const locale = isLocale(requestedLocale) ? requestedLocale : 'en';
    const destination = request.nextUrl.clone();
    destination.pathname = `/${locale}${pathname}`;
    destination.searchParams.delete('lang');
    return NextResponse.redirect(destination, 308);
  }

  const segments = pathname.split('/').filter(Boolean);
  const [locale, ...rest] = segments;
  if (!isLocale(locale ?? null) || rest[0] !== 'docs') return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = `/${rest.join('/')}`;
  destination.searchParams.set('lang', locale);
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ['/docs/:path*', '/:locale/docs/:path*'],
};
