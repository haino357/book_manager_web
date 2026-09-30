"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthState } from "@/lib/actions/auth";

type Props = {
  /** 保存後に移動する先。無ければその場で完了のトーストを出す（設定画面） */
  redirectTo?: string;
  submitLabel?: string;
};

/** 新しいパスワードを 2 回入力するフォーム。/reset-password と設定画面で使う（#33） */
export function NewPasswordForm({ redirectTo, submitLabel = "パスワードを変更する" }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.done) {
      toast.success("パスワードを変更しました");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div className="space-y-2">
        <Label htmlFor="new-password">新しいパスワード</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">8 文字以上</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
        <Input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}
