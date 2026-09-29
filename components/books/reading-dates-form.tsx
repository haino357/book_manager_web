"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateReadingDates } from "@/lib/actions/books";
import { readingDatesFormSchema, type ReadingDatesFormValues } from "@/lib/books/schema";

type Props = {
  userBookId: string;
  startedAt: string | null;
  completedAt: string | null;
};

/** 開始日・読了日の手入力（React Hook Form + Zod） */
export function ReadingDatesForm({ userBookId, startedAt, completedAt }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ReadingDatesFormValues>({
    resolver: zodResolver(readingDatesFormSchema),
    values: { startedAt: startedAt ?? "", completedAt: completedAt ?? "" },
  });
  const { errors, isDirty } = form.formState;

  function onSubmit(values: ReadingDatesFormValues) {
    startTransition(async () => {
      const result = await updateReadingDates(userBookId, values);
      if (result.error) toast.error(result.error);
      else toast.success("日付を保存しました");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="rd-startedAt">開始日</Label>
        <Input id="rd-startedAt" type="date" className="w-40" {...form.register("startedAt")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rd-completedAt">読了日</Label>
        <Input
          id="rd-completedAt"
          type="date"
          className="w-40"
          aria-invalid={!!errors.completedAt}
          {...form.register("completedAt")}
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending || !isDirty}>
        {pending ? "保存中…" : "日付を保存"}
      </Button>
      {(errors.startedAt || errors.completedAt) && (
        <p role="alert" className="w-full text-sm text-destructive">
          {errors.startedAt?.message ?? errors.completedAt?.message}
        </p>
      )}
    </form>
  );
}
