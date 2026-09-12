"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createUserBookSchema,
  toPostgresDate,
  type CreateUserBookInput,
} from "@/lib/books/schema";
import { createClient } from "@/lib/supabase/server";

/** 失敗時のみ返る。成功時は redirect するため戻らない */
export type CreateUserBookError = {
  error: string;
  /** すでに登録済みだった場合の user_books.id（詳細へのリンク用） */
  existingUserBookId?: string;
};

/** JST の今日を YYYY-MM-DD で返す（date 列用） */
function todayJst(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * 蔵書を登録する。
 * 1. books を isbn13 で重複排除（あれば再利用、なければ insert。isbn13 が NULL なら常に insert）
 * 2. user_books を insert（unique (user_id, book_id) 違反は「すでに登録済み」）
 * 3. revalidatePath("/books") → /books/[id] へ遷移
 *
 * books には update ポリシーが無いため、既存行のメタデータ（書影など）は更新しない。
 */
export async function createUserBook(
  input: CreateUserBookInput,
): Promise<CreateUserBookError> {
  const parsed = createUserBookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
    };
  }
  const { metadata, status } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // --- 1. books ---------------------------------------------------------
  let bookId: string | null = null;

  if (metadata.isbn13) {
    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("isbn13", metadata.isbn13)
      .maybeSingle();
    bookId = existing?.id ?? null;
  }

  if (!bookId) {
    const { data: inserted, error } = await supabase
      .from("books")
      .insert({
        isbn13: metadata.isbn13,
        isbn10: metadata.isbn10,
        title: metadata.title,
        authors: metadata.authors,
        publisher: metadata.publisher,
        published_date: toPostgresDate(metadata.publishedDate),
        cover_url: metadata.coverUrl,
        description: metadata.description,
        categories: metadata.categories,
        source: metadata.source,
      })
      .select("id")
      .single();

    if (error?.code === "23505" && metadata.isbn13) {
      // 同時登録で先に入った場合は読み直す
      const { data: raced } = await supabase
        .from("books")
        .select("id")
        .eq("isbn13", metadata.isbn13)
        .maybeSingle();
      bookId = raced?.id ?? null;
    } else if (error) {
      return { error: `書籍の保存に失敗しました: ${error.message}` };
    } else {
      bookId = inserted.id;
    }
  }

  if (!bookId) return { error: "書籍の保存に失敗しました" };

  // --- 2. user_books ----------------------------------------------------
  const today = todayJst();
  const { data: userBook, error: ubError } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status,
      started_at: status === "reading" ? today : null,
      completed_at: status === "completed" ? today : null,
    })
    .select("id")
    .single();

  if (ubError) {
    if (ubError.code === "23505") {
      const { data: existing } = await supabase
        .from("user_books")
        .select("id")
        .eq("book_id", bookId)
        .maybeSingle();
      return {
        error: "この本はすでに登録されています",
        existingUserBookId: existing?.id,
      };
    }
    return { error: `登録に失敗しました: ${ubError.message}` };
  }

  // --- 3. revalidate + redirect ----------------------------------------
  // redirect は throw するので try/catch の外で呼ぶ（Next.js 16 docs: redirect）
  revalidatePath("/books");
  redirect(`/books/${userBook.id}`);
}
