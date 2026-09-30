"use client";

import { ErrorView } from "@/components/errors/error-view";

/** ログイン後の画面のエラー。ヘッダー（layout）は残したまま中身だけ差し替わる */
export default function DashboardError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorView {...props} homeHref="/books" homeLabel="蔵書一覧へ" />;
}
