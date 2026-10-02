import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth（Google）/ メール確認リンク / パスワード再設定リンクのコールバック。
 * Supabase ダッシュボードの Redirect URLs に `${NEXT_PUBLIC_SITE_URL}/auth/callback` を登録する。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // 同じサイト内のパスだけ許す（//example.com のような外部への移動を防ぐ）
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/books";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // パスワード再設定のリンクが期限切れ・使用済み（Supabase は ?error=access_denied&error_code=otp_expired を付けてくる）
  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
