import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "パスワードの再設定" };

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const { error } = await searchParams;
  const message =
    error === "expired"
      ? "リンクの有効期限が切れているか、すでに使われています。もう一度、再設定メールを送ってください。"
      : undefined;

  return <ForgotPasswordForm message={message} />;
}
