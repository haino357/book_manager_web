import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "新しいパスワード" };

/**
 * 再設定メールのリンク → /auth/callback でリカバリーのセッションができた後に来る（#33）。
 * セッションが無い状態で開いたら /forgot-password に戻す。
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=expired");

  return (
    <Card>
      <CardHeader>
        <CardTitle>新しいパスワード</CardTitle>
        <CardDescription>{user.email} の新しいパスワードを設定します</CardDescription>
      </CardHeader>
      <CardContent>
        <NewPasswordForm redirectTo="/books" submitLabel="保存してログイン" />
      </CardContent>
    </Card>
  );
}
