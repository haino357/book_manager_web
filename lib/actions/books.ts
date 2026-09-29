"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createUserBookSchema,
  readingDatesFormSchema,
  toPostgresDate,
  updateStatusSchema,
  type CreateUserBookInput,
  type ReadingDatesFormValues,
} from "@/lib/books/schema";
import { statusTransitionPatch } from "@/lib/books/status";
import { todayJst } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/types/enums";

/** 失敗時のみ返る。成功時は redirect するため戻らない */
export type CreateUserBookError = {
  error: string;
  /** すでに登録済みだった場合の user_books.id（詳細へのリンク用） */
  existingUserBookId?: string;
};

/** 更新系アクションの戻り値。失敗時のみ error が入る */
export type ActionResult = { error?: string };

/**
 * 蔵書を登録する。
 * 1. books を isbn13 で重複排除（あれば再利用、なければ insert。isbn13 が NULL なら常に insert）
 * 2. user_books を insert（unique (user_id, book_id) 違反は「すでに登録済み」）
 * 3. completed で登録したら reading_histories にも 1 行追加（月別読了数の集計対象にする）
 * 4. revalidatePath("/books") → /books/[id] へ遷移
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

  // --- 3. reading_histories -------------------------------------------
  if (status === "completed") {
    const { error: historyError } = await supabase
      .from("reading_histories")
      .insert({ user_book_id: userBook.id, started_at: null, completed_at: today });
    // 登録自体は成功しているので、履歴の失敗では止めずに詳細へ進む
    if (historyError) console.error("reading_histories insert failed", historyError);
  }

  // --- 4. revalidate + redirect ----------------------------------------
  // redirect は throw するので try/catch の外で呼ぶ（Next.js 16 docs: redirect）
  revalidatePath("/books");
  redirect(`/books/${userBook.id}`);
}

/**
 * ステータスを変更し、日付を自動でセットする（ルールは statusTransitionPatch）。
 * → completed のときは reading_histories に 1 行追加する（started_at / completed_at を写す）。
 */
export async function updateStatus(
  userBookId: string,
  status: BookStatus,
): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse({ userBookId, status });
  if (!parsed.success) return { error: "入力内容が正しくありません" };

  const supabase = await createClient();
  // RLS で自分の行しか見えないので、他人の id なら null になる
  const { data: current } = await supabase
    .from("user_books")
    .select("status, started_at, completed_at")
    .eq("id", userBookId)
    .maybeSingle();
  if (!current) return { error: "本が見つかりません" };
  if (current.status === status) return {};

  const today = todayJst();
  const patch = statusTransitionPatch(
    { ...current, status: current.status as BookStatus },
    status,
    today,
  );

  const { error } = await supabase
    .from("user_books")
    .update({ status, ...patch })
    .eq("id", userBookId);
  if (error) return { error: `ステータスの更新に失敗しました: ${error.message}` };

  if (status === "completed") {
    const { error: historyError } = await supabase.from("reading_histories").insert({
      user_book_id: userBookId,
      started_at: current.started_at,
      completed_at: today,
    });
    if (historyError) {
      revalidateUserBook(userBookId);
      return { error: `ステータスは更新しましたが、読書履歴の追加に失敗しました: ${historyError.message}` };
    }
  }

  revalidateUserBook(userBookId);
  return {};
}

/**
 * 開始日・読了日を手で直す。
 * 読了済みなら、最新の reading_histories（今回の読書）にも同じ日付を反映する。
 */
export async function updateReadingDates(
  userBookId: string,
  values: ReadingDatesFormValues,
): Promise<ActionResult> {
  const parsed = readingDatesFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
  }
  const startedAt = parsed.data.startedAt || null;
  const completedAt = parsed.data.completedAt || null;

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("user_books")
    .update({ started_at: startedAt, completed_at: completedAt })
    .eq("id", userBookId)
    .select("status")
    .maybeSingle();
  if (error) return { error: `日付の更新に失敗しました: ${error.message}` };
  if (!updated) return { error: "本が見つかりません" };

  if (updated.status === "completed") {
    const { data: latest } = await supabase
      .from("reading_histories")
      .select("id")
      .eq("user_book_id", userBookId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) {
      const { error: historyError } = await supabase
        .from("reading_histories")
        .update({ started_at: startedAt, completed_at: completedAt })
        .eq("id", latest.id);
      if (historyError) {
        revalidateUserBook(userBookId);
        return { error: `日付は更新しましたが、読書履歴への反映に失敗しました: ${historyError.message}` };
      }
    }
  }

  revalidateUserBook(userBookId);
  return {};
}

function revalidateUserBook(userBookId: string) {
  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
}
