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
import { Separator } from "@/components/ui/separator";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "@/lib/actions/auth";

type Props = {
  mode: "login" | "signup";
  message?: string;
};

export function AuthForm({ mode, message }: Props) {
  const action = mode === "login" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  const isLogin = mode === "login";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? "ログイン" : "新規登録"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "メールアドレスとパスワードでログインします"
            : "メールアドレスとパスワードでアカウントを作成します"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className="rounded-md bg-muted p-3 text-sm">{message}</p>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">パスワード</Label>
              {isLogin && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  パスワードを忘れた方
                </Link>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {!isLogin && <ConsentNote />}
          <Button type="submit" className="w-full" disabled={pending}>
            {isLogin ? "ログイン" : "同意して登録する"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          または
          <Separator className="flex-1" />
        </div>

        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full">
            {isLogin ? "Google でログイン" : "同意して Google で登録"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            アカウントをお持ちでない方は
            <Link href="/signup" className="ml-1 underline">
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでにアカウントをお持ちの方は
            <Link href="/login" className="ml-1 underline">
              ログイン
            </Link>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

/** 登録時の同意の文言（#36）。メール登録・Google 登録の両方に掛かる */
function ConsentNote() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      登録すると、
      <Link href="/terms" target="_blank" className="underline underline-offset-2">
        利用規約
      </Link>
      と
      <Link href="/privacy" target="_blank" className="underline underline-offset-2">
        プライバシーポリシー
      </Link>
      に同意したものとみなします。
    </p>
  );
}
