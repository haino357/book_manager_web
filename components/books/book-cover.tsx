"use client";

import { BookOpenIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  title: string;
  className?: string;
};

/**
 * 書影。外部 API の URL をそのまま表示する（ホストが不定なので next/image は使わない）。
 * URL が無い・読み込めない場合はプレースホルダー。表紙全体が見えるよう縦横比を保つ。
 */
export function BookCover({ src, title, className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && src !== failedSrc;
  return (
    <div
      className={cn(
        "flex aspect-[2/3] w-24 shrink-0 self-start items-center justify-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 書影のホストは Google Books / OpenBD / 手動入力で不定
        <img
          src={src}
          alt={`${title} の書影`}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span role="img" aria-label={`${title} の書影なし`}>
          <BookOpenIcon className="size-8 text-muted-foreground" aria-hidden />
        </span>
      )}
    </div>
  );
}
