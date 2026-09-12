import { BookOpenIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  title: string;
  className?: string;
};

/**
 * 書影。外部 API の URL をそのまま表示する（ホストが不定なので next/image は使わない）。
 * URL が無い場合はプレースホルダー。
 */
export function BookCover({ src, title, className }: Props) {
  return (
    <div
      className={cn(
        "flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- 書影のホストは Google Books / OpenBD / 手動入力で不定
        <img
          src={src}
          alt={`${title} の書影`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <BookOpenIcon className="size-8 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
