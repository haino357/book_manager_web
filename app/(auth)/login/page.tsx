import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "ログイン" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const message =
    params.message === "confirm"
      ? "確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。"
      : params.error
        ? "ログインに失敗しました。もう一度お試しください。"
        : undefined;

  return <AuthForm mode="login" message={message} />;
}
