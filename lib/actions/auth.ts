"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthState = { error?: string; done?: boolean } | undefined;

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "メールアドレスまたはパスワードの形式が正しくありません" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/books");
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "パスワードは 8 文字以上にしてください" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  redirect("/login?message=confirm");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

/**
 * パスワード再設定メールを送る（#33）。
 * 登録の有無が分からないよう、メールアドレスの形式が正しければ結果は常に「送りました」にする。
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "メールアドレスの形式が正しくありません" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  // 送信数の上限だけは伝える（登録の有無は漏れない）
  if (error?.status === 429) {
    return { error: "短時間に何度も送信されました。しばらく待ってからお試しください。" };
  }
  if (error) console.error("resetPasswordForEmail failed", error);

  return { done: true };
}

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "パスワードは 8 文字以上にしてください"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "確認用のパスワードが一致しません",
    path: ["confirm"],
  });

/**
 * 新しいパスワードを保存する。再設定メールのリンクから来たリカバリーのセッションと、
 * ログイン中の設定画面の両方で使う。`redirectTo` があれば保存後にそこへ移動する。
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "リンクの有効期限が切れています。もう一度、再設定メールを送ってください。" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "今と同じパスワードは使えません" };
    }
    if (error.code === "weak_password") {
      return { error: "パスワードが弱すぎます。別のパスワードにしてください" };
    }
    return { error: `パスワードの変更に失敗しました: ${error.message}` };
  }

  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    redirect(redirectTo);
  }
  return { done: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
