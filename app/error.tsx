"use client";

import { ErrorView } from "@/components/errors/error-view";

/** 公開ページ・認証ページのエラー */
export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col px-4">
      <ErrorView {...props} />
    </main>
  );
}
