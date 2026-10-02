import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/** Next.js 16: 旧 middleware.ts。Supabase Auth のセッション更新を全リクエストで行う */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パス:
     * - _next/static, _next/image
     * - メタデータのファイル（icon / apple-icon / opengraph-image / robots.txt / sitemap.xml）
     * - 画像などの静的ファイル
     */
    "/((?!_next/static|_next/image|icon|apple-icon|opengraph-image|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
