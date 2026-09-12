"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_STATUSES, STATUS_LABELS } from "@/lib/books/schema";
import type { BookStatus } from "@/lib/types/enums";

type Props = {
  value: BookStatus;
  onChange: (value: BookStatus) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
};

/** 4 ステータス（wishlist / unread / reading / completed）の選択 */
export function StatusSelect({ value, onChange, id, disabled, className }: Props) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as BookStatus)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className ?? "w-40"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOOK_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
