"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type AuthState } from "@/lib/actions/auth";

/** パスワード再設定メールの送信フォーム（#33） */
export function ForgotPasswordForm({ message }: { message?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>パスワードの再設定</CardTitle>
        <CardDescription>
          登録したメールアドレスに、パスワードを再設定するためのリンクを送ります
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && !state?.done && (
          <p role="alert" className="rounded-md bg-muted p-3 text-sm">
            {message}
          </p>
        )}
        {state?.done ? (
          <p role="status" className="rounded-md bg-muted p-3 text-sm">
            メールを送信しました。メール内のリンクを開いて、新しいパスワードを設定してください。
            届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "送信中…" : "再設定メールを送る"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          ログインに戻る
        </Link>
      </CardFooter>
    </Card>
  );
}
