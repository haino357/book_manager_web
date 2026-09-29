"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { updateYearlyGoal } from "@/lib/actions/profile";
import { toIntOrNull } from "@/lib/books/schema";
import { yearlyGoalSchema } from "@/lib/stats/schema";

/** 年間読了目標の設定ダイアログ（#14）。空にして保存すると未設定に戻る */
export function YearlyGoalDialog({ goal, year }: { goal: number | null; year: number }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(goal == null ? "" : String(goal));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = value.trim() === "" ? null : toIntOrNull(value);
    const parsed = yearlyGoalSchema.safeParse(value.trim() !== "" && n == null ? NaN : n);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力内容が正しくありません");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateYearlyGoal(parsed.data);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(parsed.data == null ? "目標を未設定にしました" : `目標を ${parsed.data} 冊にしました`);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(goal == null ? "" : String(goal));
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={goal == null ? "default" : "outline"} size="sm">
          {goal == null ? "目標を設定する" : "目標を変更"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{year} 年の読了目標</DialogTitle>
            <DialogDescription>今年読み終えたい冊数を入力してください。空にすると未設定に戻ります。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="yearly-goal">冊数</Label>
            <Input
              id="yearly-goal"
              inputMode="numeric"
              autoComplete="off"
              placeholder="50"
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
            <Button type="submit" disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
