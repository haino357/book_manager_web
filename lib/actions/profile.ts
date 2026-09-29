"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/books";
import { yearlyGoalSchema } from "@/lib/stats/schema";
import { createClient } from "@/lib/supabase/server";

/** 年間読了目標（profiles.yearly_goal）を保存する。null で未設定に戻す */
export async function updateYearlyGoal(goal: number | null): Promise<ActionResult> {
  const parsed = yearlyGoalSchema.safeParse(goal);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // profiles は auth.users の insert トリガーで作られるが、無い場合に備えて upsert
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, yearly_goal: parsed.data }, { onConflict: "id" });
  if (error) return { error: `目標の保存に失敗しました: ${error.message}` };

  revalidatePath("/dashboard");
  return {};
}
