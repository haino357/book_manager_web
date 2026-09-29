"use client";

import { StarIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateRating } from "@/lib/actions/books";
import { cn } from "@/lib/utils";

type Props = {
  userBookId: string;
  /** 1〜5。未評価は null */
  rating: number | null;
};

/**
 * ★評価の入力（#11）。クリックで即保存、同じ星をもう一度クリックで評価を外す（NULL）。
 * 保存が終わるまで値を先に反映し、失敗したら戻す。
 */
export function RatingStars({ userBookId, rating }: Props) {
  const [value, setValue] = useState(rating);
  const [hover, setHover] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = hover ?? value ?? 0;

  function handleClick(n: number) {
    const prev = value;
    const next = n === value ? null : n;
    setValue(next);
    startTransition(async () => {
      const result = await updateRating(userBookId, next);
      if (result.error) {
        setValue(prev);
        toast.error(result.error);
      } else {
        toast.success(next ? `★${next} で保存しました` : "評価を外しました");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="評価"
        className="flex items-center"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`★${n}${value === n ? "（もう一度押すと評価を外します）" : ""}`}
            disabled={pending}
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <StarIcon
              aria-hidden
              className={cn(
                "size-6 transition-colors",
                n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {value ? `${value} / 5` : "未評価"}
      </span>
    </div>
  );
}
