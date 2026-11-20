import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** 未ログインでもアクセスできるパス */
const PUBLIC_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/support",
  "/login",
  "/signup",
  "/forgot-password",
  // リカバリーのセッションが無いときはページ側で /forgot-password に戻す
  "/reset-password",
  "/auth",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}

/**
 * Auth セッションを更新し、認証必須ページで未ログインなら /login にリダイレクトする。
 * Next.js 16 の proxy.ts（旧 middleware.ts）から呼び出す。
 *
 * Supabase が更新・削除したセッション Cookie と、それを CDN にキャッシュさせないヘッダーは、
 * リダイレクトや 401 を含むすべての応答に付ける（#63）。付けないとブラウザに古い Cookie が残る。
 */
export async function updateSession(request: NextRequest) {
  // setAll で受け取った Cookie（名前ごとに最後の値）とヘッダー
  const sessionCookies = new Map<string, CookieToSet>();
  const sessionHeaders: Record<string, string> = {};

  const withSession = <T extends NextResponse>(response: T): T => {
    sessionCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    Object.entries(sessionHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // 後続の Server Component が新しいセッションを読めるよう、リクエスト側にも反映する
          cookiesToSet.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value);
            sessionCookies.set(cookie.name, cookie);
          });
          Object.assign(sessionHeaders, headers);
        },
      },
    },
  );

  // createServerClient と getUser の間にロジックを挟まない（セッションが切れるバグの原因になる）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // API はリダイレクトせず 401 を返す（fetch 側で扱いやすくする）
    if (pathname.startsWith("/api/")) {
      return withSession(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withSession(NextResponse.redirect(url));
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/books";
    url.search = "";
    return withSession(NextResponse.redirect(url));
  }

  // request.cookies を書き換えた後に作り、後続の処理へ新しい Cookie を渡す
  return withSession(NextResponse.next({ request }));
}
