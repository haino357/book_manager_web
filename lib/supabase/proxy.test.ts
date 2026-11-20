import type { CookieOptions } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "./proxy";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** getUser の中で Supabase が setAll を呼ぶ（トークンの更新・削除）ときの値 */
const auth = vi.hoisted(() => ({
  user: null as { id: string } | null,
  cookies: [] as CookieToSet[],
  headers: {} as Record<string, string>,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    {
      cookies,
    }: {
      cookies: {
        setAll: (c: CookieToSet[], h: Record<string, string>) => void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => {
        if (auth.cookies.length > 0) cookies.setAll(auth.cookies, auth.headers);
        return { data: { user: auth.user } };
      },
    },
  }),
}));

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

const refreshed: CookieToSet[] = [
  {
    name: "sb-127-auth-token.0",
    value: "new-chunk-0",
    options: { path: "/", maxAge: 400 * 24 * 60 * 60, sameSite: "lax", secure: true, httpOnly: false },
  },
  {
    name: "sb-127-auth-token.1",
    value: "new-chunk-1",
    options: { path: "/", maxAge: 400 * 24 * 60 * 60, sameSite: "lax", secure: true, httpOnly: false },
  },
];

const removed: CookieToSet[] = [
  { name: "sb-127-auth-token", value: "", options: { path: "/", maxAge: 0 } },
];

function request(path: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: "sb-127-auth-token=old" },
  });
}

/** 応答の Set-Cookie を名前ごとに引けるようにする */
function setCookies(response: Response) {
  return new Map(
    response.headers.getSetCookie().map((line) => {
      const name = line.slice(0, line.indexOf("="));
      return [name, line] as const;
    }),
  );
}

beforeEach(() => {
  auth.user = null;
  auth.cookies = [];
  auth.headers = {};
});

describe("updateSession", () => {
  const cases = [
    { title: "ログイン済みで認証必須ページ（通常の応答）", user: { id: "u1" }, path: "/books", status: 200 },
    { title: "ログイン済みで /login（/books へリダイレクト）", user: { id: "u1" }, path: "/login", status: 307 },
    { title: "ログイン済みで /signup（/books へリダイレクト）", user: { id: "u1" }, path: "/signup", status: 307 },
    { title: "未ログインで認証必須ページ（/login へリダイレクト）", user: null, path: "/books", status: 307 },
    { title: "未ログインで API（401）", user: null, path: "/api/books/search", status: 401 },
  ];

  describe.each(cases)("$title", ({ user, path, status }) => {
    it("更新した Cookie をオプションごと付ける（複数チャンク）", async () => {
      auth.user = user;
      auth.cookies = refreshed;
      auth.headers = CACHE_HEADERS;

      const response = await updateSession(request(path));

      expect(response.status).toBe(status);
      const cookies = setCookies(response);
      expect(cookies.size).toBe(2);
      for (const { name, value } of refreshed) {
        const line = cookies.get(name);
        expect(line).toContain(`${name}=${value}`);
        expect(line).toContain("Path=/");
        expect(line).toContain("Max-Age=34560000");
        expect(line).toMatch(/SameSite=lax/i);
        expect(line).toContain("Secure");
      }
    });

    it("削除の Cookie（Max-Age=0）を付ける", async () => {
      auth.user = user;
      auth.cookies = removed;

      const response = await updateSession(request(path));

      const line = setCookies(response).get("sb-127-auth-token");
      expect(line).toContain("Max-Age=0");
      expect(line).toContain("Path=/");
    });

    it("Cookie を書いたときは CDN にキャッシュさせないヘッダーを付ける", async () => {
      auth.user = user;
      auth.cookies = refreshed;
      auth.headers = CACHE_HEADERS;

      const response = await updateSession(request(path));

      for (const [key, value] of Object.entries(CACHE_HEADERS)) {
        expect(response.headers.get(key)).toBe(value);
      }
    });

    it("Cookie を更新しなかったときは Set-Cookie を付けない", async () => {
      auth.user = user;

      const response = await updateSession(request(path));

      expect(response.status).toBe(status);
      expect(response.headers.getSetCookie()).toEqual([]);
    });
  });

  it("未ログインのリダイレクト先に元のパスを next として付ける", async () => {
    const response = await updateSession(request("/books/abc"));

    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(new URL(response.headers.get("location")!).searchParams.get("next")).toBe("/books/abc");
  });

  it("通常の応答では、更新した Cookie を後続の処理（Server Component）にも渡す", async () => {
    auth.user = { id: "u1" };
    auth.cookies = refreshed;

    const response = await updateSession(request("/books"));

    // NextResponse.next({ request }) は書き換えたリクエストの Cookie を x-middleware-request-cookie で渡す
    const forwarded = response.headers.get("x-middleware-request-cookie") ?? "";
    expect(forwarded).toContain("sb-127-auth-token.0=new-chunk-0");
    expect(forwarded).toContain("sb-127-auth-token.1=new-chunk-1");
  });

  it("公開ページは未ログインでもそのまま通す", async () => {
    const response = await updateSession(request("/privacy"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
