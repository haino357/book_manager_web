"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyAccount } from "@/lib/actions/account";

/** アカウント削除の確認ダイアログ（#34）。「削除」と入力して確定する */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // 成功すると redirect するので戻らない
      const result = await deleteMyAccount(value);
      if (result.error) setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) {
          setValue("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">アカウントを削除</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>アカウントを削除しますか？</DialogTitle>
            <DialogDescription>
              登録した本・評価・メモ・読書履歴・年間目標がすべて削除され、元に戻せません。
              モバイルアプリも同じアカウントを使っている場合は、そちらのデータも消えます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">確認のため「削除」と入力してください</Label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!!error}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" variant="destructive" disabled={pending || value.trim() !== "削除"}>
              {pending ? "削除中…" : "削除する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
