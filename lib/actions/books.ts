"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createUserBookSchema,
  readingDatesFormSchema,
  toPostgresDate,
  updateRatingSchema,
  updateStatusSchema,
  bookDetailsFormSchema,
  toIntOrNull,
  type BookDetailsFormValues,
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
 *    2 と 3 は RPC add_user_book が一つのトランザクションで行う（#47）
 * 4. revalidatePath("/books") → /books/[id] へ遷移
 *
 * 画面遷移せずに登録したいとき（検索結果から登録）は addUserBook を使う。
 *
 * books には update ポリシーが無いため、既存行のメタデータ（書影など）は更新しない。
 * ページ数・定価だけは、既存行で空なら fill_book_details で埋める（統計用。#24 #25）。
 */
export async function createUserBook(
  input: CreateUserBookInput,
): Promise<CreateUserBookError> {
  const result = await insertUserBook(input);
  if ("error" in result) return result;

  // redirect は throw するので try/catch の外で呼ぶ（Next.js 16 docs: redirect）
  revalidatePath("/books");
  redirect(`/books/${result.userBookId}`);
}

/**
 * 蔵書を登録し、画面遷移せずに user_books.id を返す（検索結果の「登録する」）。
 * 処理は createUserBook と同じ。検索結果の「登録済み」表示を更新するため /books/search も再検証する。
 */
export async function addUserBook(
  input: CreateUserBookInput,
): Promise<CreateUserBookError | { userBookId: string }> {
  const result = await insertUserBook(input);
  if ("error" in result) return result;

  revalidatePath("/books");
  revalidatePath("/books/search");
  revalidatePath("/dashboard");
  return result;
}

/** createUserBook / addUserBook の 1〜3 */
async function insertUserBook(
  input: CreateUserBookInput,
): Promise<CreateUserBookError | { userBookId: string }> {
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
        page_count: metadata.pageCount,
        list_price: metadata.listPrice,
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

  // --- 2. user_books（completed なら reading_histories も同じトランザクションで足す）---
  const today = todayJst();
  // RPC の日付の引数は既定値が NULL。空の日付は undefined にして送らない（以下の RPC も同じ）
  const { data: userBookId, error: ubError } = await supabase.rpc("add_user_book", {
    p_book_id: bookId,
    p_status: status,
    p_started_at: status === "reading" ? today : undefined,
    p_completed_at: status === "completed" ? today : undefined,
  });

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
  if (!userBookId) return { error: "登録に失敗しました" };

  // 既存の books 行を再利用した場合、空のページ数・定価を今回の検索結果で埋める。
  // fill_book_details は自分の本棚にある本だけ更新するので、user_books の insert 後に呼ぶ
  if (metadata.pageCount != null || metadata.listPrice != null) {
    const { error: fillError } = await supabase.rpc("fill_book_details", {
      p_book_id: bookId,
      p_page_count: metadata.pageCount ?? undefined,
      p_list_price: metadata.listPrice ?? undefined,
    });
    if (fillError) console.error("fill_book_details failed", fillError);
  }

  return { userBookId };
}

/**
 * ステータスを変更し、日付を自動でセットする（ルールは statusTransitionPatch）。
 * → completed のときは reading_histories に 1 行追加する（started_at / completed_at を写す）。
 * 更新と履歴の追加は RPC change_user_book_status が一つのトランザクションで行うので、
 * 履歴だけ失敗してステータスが残ることはない（#47）。
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

  const next = { ...current, ...patch };

  const { data: applied, error } = await supabase.rpc("change_user_book_status", {
    p_user_book_id: userBookId,
    p_from_status: current.status,
    p_to_status: status,
    p_started_at: next.started_at ?? undefined,
    p_completed_at: next.completed_at ?? undefined,
  });
  if (error) return { error: `ステータスの更新に失敗しました: ${error.message}` };

  if (!applied) {
    // 読んでから保存するまでに、別の画面（別のタブなど）でステータスが変わった
    const { data: latest } = await supabase
      .from("user_books")
      .select("status")
      .eq("id", userBookId)
      .maybeSingle();
    revalidateUserBook(userBookId);
    // 同じステータスにする操作が先に済んでいたなら、成功として扱う（履歴は先の 1 件だけ）
    if (latest?.status === status) return {};
    return { error: "ほかの画面でステータスが変わりました。画面を読み込み直してください" };
  }

  revalidateUserBook(userBookId);
  return {};
}

/**
 * 開始日・読了日を手で直す。
 * 読了済みなら、最新の reading_histories（今回の読書）にも同じ日付を反映する。
 * 両方の更新は RPC update_reading_dates が一つのトランザクションで行う（#47）。
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
  const { data: updated, error } = await supabase.rpc("update_reading_dates", {
    p_user_book_id: userBookId,
    p_started_at: startedAt ?? undefined,
    p_completed_at: completedAt ?? undefined,
  });
  if (error) return { error: `日付の更新に失敗しました: ${error.message}` };
  if (!updated) return { error: "本が見つかりません" };

  revalidateUserBook(userBookId);
  return {};
}

/**
 * ページ数・定価・支払額を保存する。
 * 支払額は自分の user_books に、ページ数・定価は books（共有）の空欄だけを fill_book_details で埋める。
 */
export async function updateBookDetails(
  userBookId: string,
  values: BookDetailsFormValues,
): Promise<ActionResult> {
  const parsed = bookDetailsFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
  }
  const pageCount = toIntOrNull(parsed.data.pageCount);
  const listPrice = toIntOrNull(parsed.data.listPrice);
  const pricePaid = toIntOrNull(parsed.data.pricePaid);

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("user_books")
    .update({ price_paid: pricePaid })
    .eq("id", userBookId)
    .select("book_id")
    .maybeSingle();
  if (error) return { error: `保存に失敗しました: ${error.message}` };
  if (!updated) return { error: "本が見つかりません" };

  if (pageCount != null || listPrice != null) {
    const { error: fillError } = await supabase.rpc("fill_book_details", {
      p_book_id: updated.book_id,
      p_page_count: pageCount ?? undefined,
      p_list_price: listPrice ?? undefined,
    });
    if (fillError) {
      revalidateUserBook(userBookId);
      return { error: `支払額は保存しましたが、ページ数・定価の保存に失敗しました: ${fillError.message}` };
    }
  }

  revalidateUserBook(userBookId);
  return {};
}

/** ★評価を保存する（#11）。null で評価を外す */
export async function updateRating(
  userBookId: string,
  rating: number | null,
): Promise<ActionResult> {
  const parsed = updateRatingSchema.safeParse({ userBookId, rating });
  if (!parsed.success) return { error: "評価は 1〜5 で指定してください" };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("user_books")
    .update({ rating: parsed.data.rating })
    .eq("id", userBookId)
    .select("id")
    .maybeSingle();
  if (error) return { error: `評価の保存に失敗しました: ${error.message}` };
  if (!updated) return { error: "本が見つかりません" };

  revalidateUserBook(userBookId);
  return {};
}

function revalidateUserBook(userBookId: string) {
  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/dashboard");
}
