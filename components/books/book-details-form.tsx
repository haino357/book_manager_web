"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBookDetails } from "@/lib/actions/books";
import { bookDetailsFormSchema, type BookDetailsFormValues } from "@/lib/books/schema";

type Props = {
  userBookId: string;
  pageCount: number | null;
  listPrice: number | null;
  pricePaid: number | null;
};

const str = (n: number | null) => (n == null ? "" : String(n));

/**
 * ページ数・定価・支払額（統計用）。
 * ページ数・定価は他のユーザーと共有する書籍マスターの値なので、空のときだけ入力できる。
 */
export function BookDetailsForm({ userBookId, pageCount, listPrice, pricePaid }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<BookDetailsFormValues>({
    resolver: zodResolver(bookDetailsFormSchema),
    values: { pageCount: str(pageCount), listPrice: str(listPrice), pricePaid: str(pricePaid) },
  });
  const { errors, isDirty } = form.formState;
  const error = errors.pageCount?.message ?? errors.listPrice?.message ?? errors.pricePaid?.message;

  function onSubmit(values: BookDetailsFormValues) {
    startTransition(async () => {
      const result = await updateBookDetails(userBookId, values);
      if (result.error) toast.error(result.error);
      else toast.success("保存しました");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="bd-pageCount">ページ数</Label>
        <Input
          id="bd-pageCount"
          inputMode="numeric"
          className="w-28"
          disabled={pageCount != null}
          aria-invalid={!!errors.pageCount}
          {...form.register("pageCount")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bd-listPrice">定価（税抜・円）</Label>
        <Input
          id="bd-listPrice"
          inputMode="numeric"
          className="w-32"
          disabled={listPrice != null}
          aria-invalid={!!errors.listPrice}
          {...form.register("listPrice")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bd-pricePaid">支払額（円）</Label>
        <Input
          id="bd-pricePaid"
          inputMode="numeric"
          className="w-32"
          placeholder={listPrice != null ? String(listPrice) : undefined}
          aria-invalid={!!errors.pricePaid}
          {...form.register("pricePaid")}
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending || !isDirty}>
        {pending ? "保存中…" : "保存"}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="w-full text-xs text-muted-foreground">
          支払額が空なら定価で集計します。ページ数・定価は空のときだけ入力できます（他のユーザーと共有する書籍情報のため）。
        </p>
      )}
    </form>
  );
}
