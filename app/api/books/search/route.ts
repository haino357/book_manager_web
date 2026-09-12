import { NextResponse, type NextRequest } from "next/server";

import { searchBookByIsbn } from "@/lib/books/search";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/books/search?isbn=9784873119694
 * Google Books / OpenBD のプロキシ（API キーをクライアントに出さない）。認証必須。
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isbn = request.nextUrl.searchParams.get("isbn")?.trim();
  if (!isbn) {
    return NextResponse.json({ error: "isbn is required" }, { status: 400 });
  }

  const book = await searchBookByIsbn(isbn);
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}
