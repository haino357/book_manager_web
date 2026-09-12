"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { StatusSelect } from "@/components/books/status-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createUserBook, type CreateUserBookError } from "@/lib/actions/books";
import {
  manualBookFormSchema,
  manualFormToInput,
  type ManualBookFormValues,
} from "@/lib/books/schema";

type Props = {
  /** ISBN 検索で見つからなかった ISBN を引き継ぐ */
  initialIsbn?: string;
};

/**
 * 手動入力フォーム（React Hook Form + Zod）。ISBN 無しの本も登録できる。
 * 送信時に manualFormToInput で BookMetadata に変換し、source = 'manual' で保存する。
 */
export function ManualBookForm({ initialIsbn = "" }: Props) {
  const [actionError, setActionError] = useState<CreateUserBookError | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ManualBookFormValues>({
    resolver: zodResolver(manualBookFormSchema),
    defaultValues: {
      title: "",
      authors: "",
      publisher: "",
      publishedDate: "",
      isbn: initialIsbn,
      coverUrl: "",
      description: "",
      status: "unread",
    },
  });
  const { errors } = form.formState;

  function onSubmit(values: ManualBookFormValues) {
    setActionError(null);
    startTransition(async () => {
      // 成功時は Server Action 内で /books/[id] へ redirect される
      const result = await createUserBook(manualFormToInput(values));
      if (result?.error) setActionError(result);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="タイトル" htmlFor="m-title" required error={errors.title?.message}>
        <Input id="m-title" autoComplete="off" {...form.register("title")} />
      </Field>

      <Field
        label="著者"
        htmlFor="m-authors"
        hint="複数いる場合はカンマ区切り"
        error={errors.authors?.message}
      >
        <Input id="m-authors" autoComplete="off" placeholder="山田 太郎, 鈴木 花子" {...form.register("authors")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="出版社" htmlFor="m-publisher" error={errors.publisher?.message}>
          <Input id="m-publisher" autoComplete="off" {...form.register("publisher")} />
        </Field>
        <Field
          label="出版日"
          htmlFor="m-publishedDate"
          hint="YYYY / YYYY-MM / YYYY-MM-DD"
          error={errors.publishedDate?.message}
        >
          <Input id="m-publishedDate" autoComplete="off" placeholder="2024-01-15" {...form.register("publishedDate")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="ISBN"
          htmlFor="m-isbn"
          hint="無い本は空欄のままで登録できます"
          error={errors.isbn?.message}
        >
          <Input id="m-isbn" inputMode="numeric" autoComplete="off" {...form.register("isbn")} />
        </Field>
        <Field label="書影 URL" htmlFor="m-coverUrl" error={errors.coverUrl?.message}>
          <Input id="m-coverUrl" type="url" autoComplete="off" placeholder="https://" {...form.register("coverUrl")} />
        </Field>
      </div>

      <Field label="説明" htmlFor="m-description" error={errors.description?.message}>
        <Textarea id="m-description" rows={4} {...form.register("description")} />
      </Field>

      <Field label="ステータス" htmlFor="m-status" error={errors.status?.message}>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <StatusSelect id="m-status" value={field.value} onChange={field.onChange} disabled={pending} />
          )}
        />
      </Field>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中…" : "この内容で登録する"}
        </Button>
        {actionError && (
          <p role="alert" className="text-sm text-destructive">
            {actionError.error}
            {actionError.existingUserBookId && (
              <>
                {" "}
                <Link href={`/books/${actionError.existingUserBookId}`} className="underline">
                  登録済みの本を見る
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
