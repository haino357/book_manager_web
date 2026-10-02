"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
  /** 「戻る」リンクの行き先 */
  homeHref?: string;
  homeLabel?: string;
};

/** error.tsx の中身。エラーを Sentry に送り、再読み込みと戻るリンクを出す */
export function ErrorView({ error, retry, homeHref = "/", homeLabel = "トップへ戻る" }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="text-sm text-muted-foreground">
        画面の表示中に問題が起きました。時間をおいて再読み込みしても直らない場合は、
        <Link href="/support" className="underline">
          サポート
        </Link>
        までご連絡ください。
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">エラー ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={() => retry()}>再読み込み</Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
