"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { StatusSelect } from "@/components/books/status-select";
import { updateStatus } from "@/lib/actions/books";
import { STATUS_LABELS } from "@/lib/books/schema";
import type { BookStatus } from "@/lib/types/enums";

type Props = {
  userBookId: string;
  status: BookStatus;
  size?: "sm" | "default";
  className?: string;
};

/**
 * 登録済みの本のステータスを変更して即保存する。
 * 日付の自動セットと reading_histories の追加は updateStatus 側で行う。
 */
export function UserBookStatusSelect({ userBookId, status, size, className }: Props) {
  // 保存が終わるまで選択値を先に反映し、失敗したら戻す
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  function handleChange(next: BookStatus) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const result = await updateStatus(userBookId, next);
      if (result.error) {
        setValue(prev);
        toast.error(result.error);
      } else {
        toast.success(`「${STATUS_LABELS[next]}」に変更しました`);
      }
    });
  }

  return (
    <StatusSelect
      value={value}
      onChange={handleChange}
      disabled={pending}
      size={size}
      className={className}
    />
  );
}
