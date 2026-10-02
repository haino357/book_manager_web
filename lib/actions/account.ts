"use server";

import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/actions/books";
import { createClient } from "@/lib/supabase/server";

/** 確認ダイアログで入力してもらう文字列 */
const CONFIRM_WORD = "削除";

/**
 * アカウントを削除する（退会, #34）。
 * RPC delete_my_account が auth.users の自分の行を消し、profiles / user_books / reading_histories / book_memos は
 * on delete cascade で消える。books（共有マスター）は残る。
 * 削除後はセッションの cookie を消して / に移動する。
 */
export async function deleteMyAccount(confirm: string): Promise<ActionResult> {
  if (confirm.trim() !== CONFIRM_WORD) {
    return { error: `確認のため「${CONFIRM_WORD}」と入力してください` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: `アカウントの削除に失敗しました: ${error.message}` };

  // ユーザーはもう無いので、サーバー側のセッション無効化は失敗してよい。cookie だけ消す
  await supabase.auth.signOut({ scope: "local" });

  redirect("/?deleted=1");
}
